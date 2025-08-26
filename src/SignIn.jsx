import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from './firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { PenTool } from 'lucide-react';

// Move InputField component outside of SignIn to prevent re-renders
const InputField = ({ 
  name, 
  type, 
  value, 
  onChange, 
  placeholder, 
  error, 
  disabled, 
  icon 
}) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    whileFocus={{ scale: 1.02 }}
    className="relative mb-4"
  >
    <div className={`flex items-center rounded-lg border bg-gray-750 px-3 py-2.5 transition-all duration-300 
      ${error 
        ? 'border-red-500 shadow-lg shadow-red-500/20' 
        : 'border-gray-600 focus-within:border-blue-500 focus-within:shadow-lg focus-within:shadow-blue-500/20'
      }`}
    >
      {icon && (
        <div className="mr-3 text-gray-400">
          {icon}
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none"
        placeholder={placeholder}
      />
    </div>
    {error && (
      <motion.p 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-red-400 text-xs mt-1.5 flex items-center"
      >
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </motion.p>
    )}
  </motion.div>
);

// Icons for input fields (moved outside component)
const EmailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const SignIn = () => {
  const navigate = useNavigate();

  // State for form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // State for validation errors and messages
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState('');

  // Handles input changes and clears errors
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear the specific error when the user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear Firebase errors when user types
    if (firebaseError) {
      setFirebaseError('');
    }
  };

  // Validates the form fields
  const validateForm = () => {
    const newErrors = {};
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'A valid email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  // Handles email/password sign-in
  const handleSignIn = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    setFirebaseError('');
    
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      setSuccessMessage('Welcome back to PixelCraft!');
      
      setTimeout(() => {
        navigate('/algo');
      }, 1500);
    } catch (err) {
      setFirebaseError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handles Google sign-in
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setFirebaseError('');
    
    try {
      await signInWithPopup(auth, googleProvider);
      setSuccessMessage('Successfully signed in with Google!');
      
      setTimeout(() => {
        navigate('/algo');
      }, 1500);
    } catch (err) {
      setFirebaseError(err.message || 'Could not sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 120, damping: 10 }
    }
  };

  const FloatingElement = ({ children, delay = 0 }) => (
    <motion.div
      animate={{
        y: [0, -8, 0],
        rotate: [0, 0.5, -0.5, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );

  return (
    <div className="min-h-screen font-sans flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row rounded-xl overflow-hidden shadow-2xl bg-gray-800 border border-gray-700">

        {/* Left side - Design tool showcase */}
        <div className="w-full lg:w-2/5 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-6 flex flex-col justify-center items-center relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <FloatingElement delay={0}>
              <div className="absolute top-12 left-12 w-16 h-16 bg-white rounded-full"></div>
            </FloatingElement>
            <FloatingElement delay={2}>
              <div className="absolute bottom-16 right-8 w-12 h-12 bg-white rounded-lg rotate-45"></div>
            </FloatingElement>
            <FloatingElement delay={4}>
              <div className="absolute top-1/3 right-16 w-10 h-20 bg-white rounded-full"></div>
            </FloatingElement>
          </div>

          <motion.div
            initial={{ y: -15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6 relative z-10"
          >
            <div className="flex items-center justify-center mb-3">
              <motion.div 
                className="flex items-center justify-center mr-2"
                whileHover={{ rotate: 10, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <PenTool className="w-6 h-6 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white">PixelCraft</h1>
            </div>
            <p className="text-purple-200 text-sm">Design. Prototype. Collaborate.</p>
          </motion.div>

          <div className="relative h-56 w-full flex items-center justify-center mb-6">
            {/* Design tools visualization */}
            <div className="relative">
              {/* Canvas/artboard */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                className="w-40 h-28 bg-white bg-opacity-10 rounded-lg shadow-lg relative overflow-hidden backdrop-blur-sm border border-white border-opacity-10"
              >
                <div className="absolute inset-2 border-2 border-dashed border-white border-opacity-20 rounded"></div>
                
                {/* Design elements inside canvas */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="absolute top-3 left-3 w-14 h-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded-md"
                ></motion.div>
                
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="absolute top-3 right-3 w-6 h-6 bg-pink-400 rounded-full"
                ></motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="absolute bottom-3 left-3 w-16 h-3 bg-gray-400 rounded-full"
                ></motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="absolute bottom-3 right-3 w-10 h-5 bg-green-400 rounded"
                ></motion.div>
              </motion.div>

              {/* Tool palette */}
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -left-10 top-1/2 -translate-y-1/2 w-7 h-20 bg-white bg-opacity-10 rounded-lg shadow-lg flex flex-col items-center justify-center space-y-1 backdrop-blur-sm border border-white border-opacity-10"
              >
                <div className="w-3 h-3 bg-gray-400 rounded"></div>
                <div className="w-3 h-3 bg-blue-400 rounded"></div>
                <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded"></div>
              </motion.div>

              {/* Properties panel */}
              <motion.div
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -right-12 top-2 w-10 h-28 bg-white bg-opacity-10 rounded-lg shadow-lg flex flex-col p-1.5 space-y-1 backdrop-blur-sm border border-white border-opacity-10"
              >
                <div className="w-full h-1.5 bg-gray-400 bg-opacity-40 rounded"></div>
                <div className="w-3/4 h-1.5 bg-gray-400 bg-opacity-40 rounded"></div>
                <div className="w-full h-1.5 bg-gray-400 bg-opacity-40 rounded"></div>
                <div className="w-1/2 h-1.5 bg-blue-400 rounded"></div>
              </motion.div>
            </div>
          </div>

          <motion.div 
            initial={{ y: 15, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 1 }} 
            className="text-center relative z-10"
          >
            <h2 className="text-lg font-bold text-white mb-3">Welcome Back!</h2>
            <p className="text-purple-200 text-xs">Sign in to access your projects and continue creating.</p>
          </motion.div>
        </div>

        {/* Right side - Sign in form */}
        <div className="w-full lg:w-3/5 bg-gray-800 p-6 lg:p-8 flex flex-col justify-center relative">
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                className="absolute top-4 right-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg flex items-center z-10"
              >
                <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md mx-auto">
            <motion.div variants={itemVariants} className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-1.5">Sign In</h2>
              <p className="text-gray-400 text-sm">Welcome back to your creative workspace</p>
            </motion.div>

            <motion.div variants={itemVariants} className="mb-5">
              <motion.button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-600 rounded-lg bg-gray-750 hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 text-gray-200 font-medium text-sm"
                whileHover={{ y: -2, transition: { type: 'spring', stiffness: 300 } }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Signing in...' : 'Continue with Google'}
              </motion.button>
            </motion.div>

            <motion.div variants={itemVariants} className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-gray-800 text-gray-500">or</span>
              </div>
            </motion.div>

            <motion.form onSubmit={handleSignIn} className="space-y-1" noValidate>
              <motion.div variants={itemVariants}>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email address</label>
                <InputField
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  error={errors.email}
                  disabled={loading}
                  icon={<EmailIcon />}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
                <InputField
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  error={errors.password}
                  disabled={loading}
                  icon={<LockIcon />}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center justify-between pt-2 text-xs">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    name="rememberMe" 
                    checked={formData.rememberMe} 
                    onChange={handleInputChange} 
                    id="remember" 
                    className="h-3.5 w-3.5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700" 
                    disabled={loading}
                  />
                  <label htmlFor="remember" className="ml-2 text-gray-400">Remember me</label>
                </div>
                <Link to="/forgot-password" className="text-blue-400 hover:underline">Forgot password?</Link>
              </motion.div>

              {firebaseError && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-900 bg-opacity-30 border border-red-800 rounded-md text-red-300 text-xs mt-3"
                >
                  {firebaseError}
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="pt-4">
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-4 rounded-md font-medium text-sm hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50"
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 极速赛车开奖结果 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing In...
                    </span>
                  ) : 'Sign In'}
                </motion.button>
              </motion.div>
            </motion.form>

            <motion.div variants={itemVariants} className="mt-5 text-center">
              <p className="text-xs text-gray-500">
                Don't have an account? <Link to="/" className="text-blue-400 hover:underline font-medium">Sign up</Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;