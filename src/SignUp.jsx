import React, {useState} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { PenTool } from 'lucide-react'
import { auth, db, googleProvider } from './firebase'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

// --- Reusable Animated Input Component with New Design ---
const AnimatedInput = ({
  id,
  name,
  type = 'text',
  value,
  onChange,
  error,
  disabled,
  icon,
  label
}) => {
  const hasValue = value && value.length > 0

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 120, damping: 10 }
    }
  }

  return (
    <motion.div variants={itemVariants}>
      <div
        className={`
          relative group p-[2px] rounded-lg transition-all duration-300
          bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700
          focus-within:from-blue-500 focus-within:to-purple-500
          ${error ? '!from-red-500 !to-red-600' : ''}
        `}
      >
        <div className='relative flex items-center bg-gray-800 rounded-[6px]'>
          <span
            className={`
              absolute left-3 text-gray-400 transition-colors duration-300 
              group-focus-within:text-blue-400
            `}
          >
            {icon}
          </span>
          <input
            type={type}
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder=' ' // Crucial for floating label
            className={`
              peer w-full pl-10 pr-3 py-2.5 text-sm bg-transparent rounded-lg
              text-gray-200 placeholder-transparent 
              border-none focus:outline-none focus:ring-0
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
          <label
            htmlFor={id}
            className={`
              absolute left-9 text-gray-400 text-sm 
              transition-all duration-300 cursor-text
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2
              peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-400
              ${hasValue ? '-top-2 text-xs text-blue-400' : ''}
              bg-gray-800 px-1
            `}
          >
            {label}
          </label>
        </div>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className='text-red-400 text-xs mt-1.5 ml-1'
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function App () {
  return <SignUp />
}

const SignUp = () => {
  const navigate = useNavigate()

  // State for form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })

  // State for validation errors
  const [errors, setErrors] = useState({})
  // State for successful submission message
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [firebaseError, setFirebaseError] = useState('')

  // Handles changes in form inputs and updates the state.
  const handleInputChange = e => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Clear the specific error when the user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }

    // Clear Firebase errors when user types
    if (firebaseError) {
      setFirebaseError('')
    }
  }

  // Validates the form data and returns an object of errors.
  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim())
      newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
    if (formData.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match'
    if (!formData.agreeToTerms)
      newErrors.agreeToTerms = 'You must agree to the terms'

    return newErrors
  }

  // Handles the main email/password sign-up submission with Firebase.
  const handleSignUp = async e => {
    e.preventDefault()
    const newErrors = validateForm()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setFirebaseError('')

    try {
      // Create user with email and password
      const cred = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      // Update profile with combined first and last name
      await updateProfile(cred.user, {
        displayName: `${formData.firstName} ${formData.lastName}`
      })

      // Create user document in Firestore
      await setDoc(
        doc(db, 'users', cred.user.uid),
        {
          uid: cred.user.uid,
          email: formData.email,
          displayName: `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          photoURL: cred.user.photoURL ?? '',
          providerId: 'password',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        },
        { merge: true }
      )

      setSuccessMessage('Welcome to PixelCraft! Your account has been created.')

      // Navigate to /algo page after showing the success message briefly
      setTimeout(() => {
        setSuccessMessage('')
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          agreeToTerms: false
        })
        navigate('/algo')
      }, 1500)
    } catch (err) {
      setFirebaseError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handles Google sign-up with Firebase.
  const handleGoogleSignUp = async () => {
    setLoading(true)
    setFirebaseError('')

    try {
      await signInWithPopup(auth, googleProvider)
      setSuccessMessage('Welcome to PixelCraft! Your account has been created.')

      // Navigate to /algo page after showing the success message briefly
      setTimeout(() => {
        setSuccessMessage('')
        navigate('/algo')
      }, 1500)
    } catch (err) {
      setFirebaseError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 120, damping: 10 }
    }
  }

  const FloatingElement = ({ children, delay = 0 }) => (
    <motion.div
      animate={{
        y: [0, -8, 0],
        rotate: [0, 0.5, -0.5, 0]
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        delay: delay,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  )

  return (
    <div className='min-h-screen font-sans flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'>
      <div className='w-full max-w-5xl flex flex-col lg:flex-row rounded-xl overflow-hidden shadow-2xl bg-gray-800 border border-gray-700'>
        {/* Left side - Design tool showcase */}
        <div className='w-full lg:w-2/5 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-6 flex flex-col justify-center items-center relative overflow-hidden'>
          {/* Background pattern */}
          <div className='absolute inset-0 opacity-10'>
            {/* Removed floating white elements */}
          </div>

          <motion.div
            initial={{ y: -15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className='text-center mb-6 relative z-10'
          >
            <div className='flex items-center justify-center mb-3'>
              <motion.div
                className='flex items-center justify-center mr-2'
                whileHover={{ rotate: 10, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <PenTool className='w-6 h-6 text-white' />
              </motion.div>
              <h1 className='text-2xl font-bold text-white'>PixelCraft</h1>
            </div>
            <p className='text-purple-200 text-sm'>
              Design. Prototype. Collaborate.
            </p>
          </motion.div>

          <div className='relative h-56 w-full flex items-center justify-center mb-6'>
            {/* Design tools visualization */}
            <div className='relative'>
              {/* Canvas/artboard */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
                className='w-40 h-28 bg-white bg-opacity-10 rounded-lg shadow-lg relative overflow-hidden backdrop-blur-sm border border-white border-opacity-10'
              >
                <div className='absolute inset-2 border-2 border-dashed border-white border-opacity-20 rounded'></div>

                {/* Design elements inside canvas */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className='absolute top-3 left-3 w-14 h-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded-md'
                ></motion.div>

                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className='absolute top-3 right-3 w-6 h-6 bg-pink-400 rounded-full'
                ></motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className='absolute bottom-3 left-3 w-16 h-3 bg-gray-400 rounded-full'
                ></motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className='absolute bottom-3 right-3 w-10 h-5 bg-green-400 rounded'
                ></motion.div>
              </motion.div>

              {/* Tool palette */}
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className='absolute -left-10 top-1/2 -translate-y-1/2 w-7 h-20 bg-white bg-opacity-10 rounded-lg shadow-lg flex flex-col items-center justify-center space-y-1 backdrop-blur-sm border border-white border-opacity-10'
              >
                <div className='w-3 h-3 bg-gray-400 rounded'></div>
                <div className='w-3 h-3 bg-blue-400 rounded'></div>
                <div className='w-3 h-3 bg-pink-400 rounded-full'></div>
                <div className='w-3 h-3 bg-green-400 rounded'></div>
              </motion.div>

              {/* Properties panel */}
              <motion.div
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className='absolute -right-12 top-2 w-10 h-28 bg-white bg-opacity-10 rounded-lg shadow-lg flex flex-col p-1.5 space-y-1 backdrop-blur-sm border border-white border-opacity-10'
              >
                <div className='w-full h-1.5 bg-gray-400 bg-opacity-40 rounded'></div>
                <div className='w-3/4 h-1.5 bg-gray-400 bg-opacity-40 rounded'></div>
                <div className='w-full h-1.5 bg-gray-400 bg-opacity-40 rounded'></div>
                <div className='w-1/2 h-1.5 bg-blue-400 rounded'></div>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className='text-center relative z-10'
          >
            <h2 className='text-lg font-bold text-white mb-3'>
              Why Choose PixelCraft?
            </h2>
            <ul className='text-purple-200 space-y-2 text-xs'>
              <motion.li
                className='flex items-center justify-center'
                whileHover={{ x: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <svg
                  className='w-3 h-3 mr-1.5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M5 13l4 4L19 7'
                  ></path>
                </svg>
                Real-time collaboration
              </motion.li>
              <motion.li
                className='flex items-center justify-center'
                whileHover={{ x: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <svg
                  className='w-3 h-3 mr-1.5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M5 13l4 4L19 7'
                  ></path>
                </svg>
                Vector-based design tools
              </motion.li>
              <motion.li
                className='flex items-center justify-center'
                whileHover={{ x: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <svg
                  className='w-3 h-3 mr-1.5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M5 13l4 4L19 7'
                  ></path>
                </svg>
                Prototype & handoff
              </motion.li>
            </ul>
          </motion.div>
        </div>

        {/* Right side - Sign up form */}
        <div className='w-full lg:w-3/5 bg-gray-800 p-6 lg:p-8 flex flex-col justify-center relative'>
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                className='absolute top-4 right-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg flex items-center z-10'
              >
                <svg
                  className='w-3 h-3 mr-1.5'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            className='w-full max-w-sm mx-auto'
          >
            <motion.div variants={itemVariants} className='text-center mb-6'>
              <h2 className='text-2xl font-bold text-white mb-1.5'>
                Get started for free
              </h2>
              <p className='text-gray-400 text-sm'>
                Create your account and start designing
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className='mb-5'>
              <motion.button
                onClick={handleGoogleSignUp}
                disabled={loading}
                className='w-full flex items-center justify-center px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 text-gray-200 font-medium text-sm'
                whileHover={{ y: -2, transition: { type: 'spring', stiffness: 300 } }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className='w-4 h-4 mr-2' viewBox='0 0 24 24'>
                  <path
                    fill='#4285F4'
                    d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                  />
                  <path
                    fill='#34A853'
                    d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                  />
                  <path
                    fill='#FBBC05'
                    d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                  />
                  <path
                    fill='#EA4335'
                    d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                  />
                </svg>
                {loading ? 'Signing up...' : 'Continue with Google'}
              </motion.button>
            </motion.div>

            <motion.div variants={itemVariants} className='relative mb-5'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-700'></div>
              </div>
              <div className='relative flex justify-center text-xs'>
                <span className='px-2 bg-gray-800 text-gray-500'>or</span>
              </div>
            </motion.div>

            <motion.form
              onSubmit={handleSignUp}
              className='space-y-4'
              noValidate
            >
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <AnimatedInput
                  id='firstName'
                  name='firstName'
                  value={formData.firstName}
                  onChange={handleInputChange}
                  error={errors.firstName}
                  disabled={loading}
                  label='First Name'
                  icon={
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-4 w-4'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                      />
                    </svg>
                  }
                />
                <AnimatedInput
                  id='lastName'
                  name='lastName'
                  value={formData.lastName}
                  onChange={handleInputChange}
                  error={errors.lastName}
                  disabled={loading}
                  label='Last Name'
                  icon={
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-4 w-4'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                      />
                    </svg>
                  }
                />
              </div>

              <AnimatedInput
                id='email'
                name='email'
                type='email'
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                disabled={loading}
                label='Email Address'
                icon={
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                    />
                  </svg>
                }
              />
              <AnimatedInput
                id='password'
                name='password'
                type='password'
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                disabled={loading}
                label='Password'
                icon={
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                    />
                  </svg>
                }
              />
              <AnimatedInput
                id='confirmPassword'
                name='confirmPassword'
                type='password'
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={errors.confirmPassword}
                disabled={loading}
                label='Confirm Password'
                icon={
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                }
              />

              <motion.div
                variants={itemVariants}
                className='flex items-start pt-2'
              >
                <input
                  type='checkbox'
                  name='agreeToTerms'
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  required
                  id='terms'
                  className='appearance-none mt-0.5 h-4 w-4 rounded-sm border-2 border-gray-500 text-blue-500 focus:ring-blue-500 bg-gray-700 checked:bg-blue-500 checked:border-transparent'
                  disabled={loading}
                />
                <label
                  htmlFor='terms'
                  className='ml-2.5 text-xs text-gray-400 leading-4'
                >
                  I agree to the{' '}
                  <a
                    href='#'
                    className='text-blue-400 hover:underline font-medium'
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href='#'
                    className='text-blue-400 hover:underline font-medium'
                  >
                    Privacy Policy
                  </a>
                </label>
              </motion.div>
              <AnimatePresence>
                {errors.agreeToTerms && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className='text-red-400 text-xs mt-1.5 ml-1'
                  >
                    {errors.agreeToTerms}
                  </motion.p>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {firebaseError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='p-3 bg-red-900/30 border border-red-800 rounded-md text-red-300 text-xs'
                  >
                    {firebaseError}
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div variants={itemVariants} className='pt-2'>
                <motion.button
                  type='submit'
                  disabled={loading}
                  className='w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-4 rounded-md font-medium text-sm hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50'
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {loading ? (
                    <span className='flex items-center justify-center'>
                      <svg
                        className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        ></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </motion.button>
              </motion.div>
            </motion.form>

            <motion.div variants={itemVariants} className='mt-5 text-center'>
              <p className='text-xs text-gray-500'>
                Already have an account?{' '}
                <Link
                  to='/signin'
                  className='text-blue-400 hover:underline font-medium'
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}