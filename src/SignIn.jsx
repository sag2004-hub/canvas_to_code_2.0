import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from './firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

const SignIn = () => {
  const navigate = useNavigate();

  // State for form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // State for validation errors
  const [errors, setErrors] = useState({});
  // State for successful submission message
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState('');

  /**
   * Handles changes in form inputs and updates the state.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   */
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

  /**
   * Validates the form data and returns an object of errors.
   * @returns {Object} An object containing any validation errors.
   */
  const validateForm = () => {
    const newErrors = {};
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    return newErrors;
  };

  /**
   * Handles the main email/password sign-in submission with Firebase.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
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
      setSuccessMessage('Welcome back to ALGO_Mania!');
      
      // Navigate to /algo page after showing success message briefly
      setTimeout(() => {
        setSuccessMessage('');
        setFormData({
          email: '', 
          password: '', 
          rememberMe: false
        });
        navigate('/algo');
      }, 1500);
    } catch (err) {
      setFirebaseError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles Google sign-in with Firebase.
   */
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setFirebaseError('');
    
    try {
      await signInWithPopup(auth, googleProvider);
      setSuccessMessage('Welcome back to ALGO_Mania!');
      
      // Navigate to /algo page after showing success message briefly
      setTimeout(() => {
        setSuccessMessage('');
        navigate('/algo');
      }, 1500);
    } catch (err) {
      setFirebaseError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.07 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 120 }
    }
  };
  
  const nodeVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (delay = 0) => ({
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, delay: 0.5 + delay }
    })
  };

  return (
    <div className="min-h-screen font-sans flex items-center justify-center p-4 bg-slate-900" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
    }}>
      <div className="w-full max-w-5xl flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-2xl bg-slate-800/50">
        
        {/* Left side - Algorithm visualization */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 p-6 flex flex-col justify-center items-center">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl font-bold text-white mb-1">ALGO_Mania</h1>
            <p className="text-indigo-200 text-sm">Visualize, Analyze, Optimize</p>
          </motion.div>
          
          <div className="relative h-52 w-full flex items-center justify-center mb-6">
            {/* Binary tree structure visualization */}
            <div className="absolute inset-0">
              <svg className="w-full h-full" viewBox="0 0 100 80">
                {/* Lines connecting the nodes */}
                <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 1.0 }} x1="50" y1="12" x2="30" y2="38" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 1.1 }} x1="50" y1="12" x2="70" y2="38" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 1.2 }} x1="30" y1="38" x2="15" y2="63" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 1.3 }} x1="70" y1="38" x2="85" y2="63" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              </svg>
            </div>
            {/* Animated nodes */}
            <motion.div variants={nodeVariants} initial="hidden" animate="visible" custom={0.0} className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 text-xs rounded-full bg-emerald-400 flex items-center justify-center z-10 shadow-lg"><span className="font-bold text-slate-900">Start</span></motion.div>
            <motion.div variants={nodeVariants} initial="hidden" animate="visible" custom={0.2} className="absolute top-1/3 left-1/4 -translate-x-1/2 w-12 h-12 text-xs rounded-full bg-sky-400 flex items-center justify-center z-10 shadow-lg"><span className="font-bold text-slate-900">O(n)</span></motion.div>
            <motion.div variants={nodeVariants} initial="hidden" animate="visible" custom={0.3} className="absolute top-1/3 left-3/4 -translate-x-1/2 w-12 h-12 text-xs rounded-full bg-sky-400 flex items-center justify-center z-10 shadow-lg"><span className="font-bold text-slate-900">O(1)</span></motion.div>
            <motion.div variants={nodeVariants} initial="hidden" animate="visible" custom={0.4} className="absolute top-2/3 left-[10%] -translate-x-1/2 w-12 h-12 text-xs rounded-full bg-violet-400 flex items-center justify-center z-10 shadow-lg"><span className="font-bold text-slate-900">O(n²)</span></motion.div>
            <motion.div variants={nodeVariants} initial="hidden" animate="visible" custom={0.5} className="absolute top-2/3 left-[90%] -translate-x-1/2 w-12 h-12 text-xs rounded-full bg-violet-400 flex items-center justify-center z-10 shadow-lg"><span className="font-bold text-slate-900">O(log n)</span></motion.div>
          </div>
          
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.5 }} className="text-center text-sm">
            <h2 className="text-xl font-bold text-white mb-3">Welcome Back!</h2>
            <ul className="text-indigo-200 space-y-2">
              <li className="flex items-center justify-center"><svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Continue your algorithm journey</li>
              <li className="flex items-center justify-center"><svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Track your progress</li>
              <li className="flex items-center justify-center"><svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Access exclusive content</li>
            </ul>
          </motion.div>
        </div>
        
        {/* Right side - Sign in form */}
        <div className="w-full md:w-3/5 bg-slate-900/80 backdrop-blur-sm p-6 sm:p-8 flex flex-col justify-center relative">
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 right-4 bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg"
              >
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md mx-auto">
            <motion.div variants={itemVariants} className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Welcome Back</h2>
              <p className="text-slate-400 text-sm">Sign in to continue your algorithm journey.</p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 mb-4">
              <motion.button 
                onClick={handleGoogleSignIn} 
                disabled={loading}
                className="w-full flex items-center justify-center px-3 py-2.5 border border-slate-700 rounded-lg bg-white hover:bg-slate-50 transition-colors duration-200 disabled:opacity-50"
                whileHover={{ y: -2, transition: { type: 'spring', stiffness: 300 } }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span className="text-slate-700 text-sm font-medium">
                  {loading ? 'Signing in...' : 'Sign in with Google'}
                </span>
              </motion.button>
            </motion.div>

            <motion.div variants={itemVariants} className="relative mb-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
              <div className="relative flex justify-center text-xs"><span className="px-2 bg-slate-900 text-slate-500">Or with email</span></div>
            </motion.div>

            <motion.form onSubmit={handleSignIn} className="space-y-4" noValidate>
              <motion.div variants={itemVariants} whileHover={{ y: -2, transition: { type: 'spring', stiffness: 300 } }}>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  required 
                  className={`w-full px-3 py-2.5 bg-slate-800 border rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200 ${errors.email ? 'border-red-500 ring-red-500/50' : 'border-slate-700 focus:ring-emerald-500'}`} 
                  placeholder="Email address" 
                  disabled={loading}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </motion.div>
              
              <motion.div variants={itemVariants} whileHover={{ y: -2, transition: { type: 'spring', stiffness: 300 } }}>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  required 
                  className={`w-full px-3 py-2.5 bg-slate-800 border rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200 ${errors.password ? 'border-red-500 ring-red-500/50' : 'border-slate-700 focus:ring-emerald-500'}`} 
                  placeholder="Password" 
                  disabled={loading}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </motion.div>
              
              <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    name="rememberMe" 
                    checked={formData.rememberMe} 
                    onChange={handleInputChange} 
                    id="remember" 
                    className="h-4 w-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 bg-slate-800" 
                    disabled={loading}
                  />
                  <label htmlFor="remember" className="ml-2 text-xs text-slate-400">Remember me</label>
                </div>
                <a href="#" className="text-xs text-emerald-400 hover:underline">Forgot password?</a>
              </motion.div>

              {firebaseError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm"
                >
                  {firebaseError}
                </motion.div>
              )}

              <motion.div variants={itemVariants}>
                <motion.button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-sky-500 text-white py-3 px-4 rounded-lg text-sm font-semibold hover:from-emerald-600 hover:to-sky-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 disabled:opacity-50"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </motion.button>
              </motion.div>
            </motion.form>

            <motion.div variants={itemVariants} className="mt-4 text-center">
              <p className="text-xs text-slate-400">
                Don't have an account? <Link to="/" className="text-emerald-400 hover:underline font-medium">Sign up</Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;