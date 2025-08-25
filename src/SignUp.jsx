import React, { useState, useEffect } from 'react';
// Import useNavigate from react-router-dom
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

// You would typically wrap your App in a Router in your main index.js or App.js
// For example:
// <Router>
//   <App />
// </Router>
export default function App() {
    return <SignUp />;
}

const SignUp = () => {
    // State for form data
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false
    });

    // State for validation errors
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [firebaseError, setFirebaseError] = useState('');
    const [debugInfo, setDebugInfo] = useState('Checking Firebase connection...');
    
    // Initialize the navigate function
    const navigate = useNavigate();

    const editContent = {
        appName: "PixelCraft",
        tagline: "Design and prototype your ideas with the power of collaborative creativity",
        features: [
            { icon: "🎨", title: "Design", desc: "Create beautiful interfaces" },
            { icon: "🔗", title: "Prototype", desc: "Build interactive mockups" },
            { icon: "🤝", title: "Collaborate", desc: "Work together in real-time" }
        ]
    };

    // Debug Firebase connection on component mount
    useEffect(() => {
        const checkFirebaseConnection = async () => {
            try {
                if (auth && db) {
                    setDebugInfo('Firebase connection established successfully');
                } else {
                    setDebugInfo('Firebase not properly initialized');
                }
            } catch (error) {
                console.error('Firebase initialization error:', error);
                setDebugInfo(`Firebase init error: ${error.message}`);
            }
        };

        checkFirebaseConnection();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        if (firebaseError) {
            setFirebaseError('');
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms';

        return newErrors;
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        const newErrors = validateForm();

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setFirebaseError('');
        setDebugInfo('Starting sign-up process...');

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            await updateProfile(userCredential.user, {
                displayName: `${formData.firstName} ${formData.lastName}`
            });

            await setDoc(doc(db, 'users', userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                displayName: `${formData.firstName} ${formData.lastName}`,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp()
            });

            setDebugInfo('User created successfully');
            setSuccessMessage('Account created successfully! Redirecting...');

            // Redirect after a short delay to show the success message
            setTimeout(() => {
                navigate('/algo');
            }, 1500);

        } catch (err) {
            console.error('Signup error:', err);
            setFirebaseError(err.message || 'Failed to create account. Please try again.');
            setDebugInfo(`Signup error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setLoading(true);
        setFirebaseError('');
        setDebugInfo('Starting Google sign-in...');

        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);

            await setDoc(doc(db, 'users', userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: userCredential.user.displayName,
                photoURL: userCredential.user.photoURL,
                lastLoginAt: serverTimestamp()
            }, { merge: true });

            setDebugInfo('Google sign-in successful');
            setSuccessMessage('Signed in with Google! Redirecting...');

            // Redirect after a short delay
            setTimeout(() => {
                navigate('/algo');
            }, 1500);

        } catch (err) {
            console.error('Google sign-in error:', err);
            setFirebaseError(err.message || 'Google sign-in failed. Please try again.');
            setDebugInfo(`Google sign-in error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Animation variants (rest of your component remains the same)
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100, damping: 12 }
        }
    };

    const FloatingElement = ({ children, delay = 0 }) => (
        <motion.div
            animate={{
                y: [0, -10, 0],
                rotate: [0, 1, -1, 0],
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
        <div className="h-screen font-inter flex items-center justify-center p-4 overflow-hidden" style={{
            background: 'linear-gradient(135deg, #0d1117 0%, #161b22 25%, #21262d 50%, #30363d 75%, #161b22 100%)'
        }}>
            <div className="w-full max-w-6xl h-auto max-h-[95vh] flex flex-col lg:flex-row rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm border border-gray-800/30"
                style={{ background: 'rgba(22, 27, 34, 0.95)' }}>

                {/* Left side - Figma-inspired design showcase */}
                <div className="w-full lg:w-3/5 relative overflow-hidden p-8 flex flex-col justify-center items-center">
                    {/* Animated background elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        <FloatingElement delay={0}>
                            <div className="absolute top-20 left-20 w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-xl"></div>
                        </FloatingElement>
                        <FloatingElement delay={2}>
                            <div className="absolute bottom-32 right-16 w-20 h-20 rounded-full bg-gradient-to-br from-green-400/20 to-blue-400/20 blur-lg"></div>
                        </FloatingElement>
                        <FloatingElement delay={4}>
                            <div className="absolute top-1/2 left-16 w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400/20 to-red-400/20 blur-md"></div>
                        </FloatingElement>
                    </div>

                    <div className="relative z-10 text-center max-w-md">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="mb-6"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
                                <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v4h-2zm0 6h2v2h-2z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight">
                                {editContent.appName}
                            </h1>
                            <p className="text-gray-400 text-base mb-6 leading-relaxed">
                                {editContent.tagline}
                            </p>
                        </motion.div>

                        {/* Feature highlights */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
                        >
                            {editContent.features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    variants={itemVariants}
                                    className="text-center p-3 rounded-xl bg-gray-800/30 border border-gray-700/30"
                                >
                                    <div className="text-xl mb-1">{feature.icon}</div>
                                    <h3 className="text-white font-semibold text-sm mb-1">{feature.title}</h3>
                                    <p className="text-gray-400 text-xs">{feature.desc}</p>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Debug Information Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="w-full bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30"
                        >
                            <div className="flex items-center mb-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                                <h3 className="text-white font-semibold text-sm">System Status</h3>
                            </div>
                            <p className="text-green-300 text-xs mb-3">{debugInfo}</p>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center p-1 rounded-md bg-gray-700/30">
                                    <div className="text-green-400">✓</div>
                                    <p className="text-gray-300 text-[10px]">Auth</p>
                                </div>
                                <div className="text-center p-1 rounded-md bg-gray-700/30">
                                    <div className="text-green-400">✓</div>
                                    <p className="text-gray-300 text-[10px]">Database</p>
                                </div>
                                <div className="text-center p-1 rounded-md bg-gray-700/30">
                                    <div className="text-green-400">✓</div>
                                    <p className="text-gray-300 text-[10px]">OAuth</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Right side - Sign up form */}
                <div className="w-full lg:w-2/5 bg-gray-900/60 backdrop-blur-md p-6 lg:p-8 flex flex-col justify-center relative border-l border-gray-800/30 overflow-y-auto">
                    <AnimatePresence>
                        {successMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                                className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium px-4 py-2 rounded-xl shadow-lg z-50 flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {successMessage}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-sm mx-auto">
                        <motion.div variants={itemVariants} className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-1">Get Started</h2>
                            <p className="text-gray-400 text-sm">Create your account to begin</p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="mb-4">
                            <button
                                onClick={handleGoogleSignUp}
                                disabled={loading}
                                className="w-full flex items-center justify-center px-4 py-3 bg-white hover:bg-gray-50 rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-gray-200"
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="text-gray-700 text-sm font-medium">
                                    {loading ? 'Connecting...' : 'Continue with Google'}
                                </span>
                            </button>
                        </motion.div>

                        <div className="relative mb-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-700"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-2 bg-gray-900/60 text-gray-400">or</span>
                            </div>
                        </div>

                        <motion.form variants={itemVariants} onSubmit={handleSignUp} className="space-y-3" noValidate>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        required
                                        className={`w-full px-3 py-2 text-sm bg-gray-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${errors.firstName ? 'border-red-500 ring-red-500/50' : 'border-gray-700 focus:ring-blue-500 hover:border-gray-600'}`}
                                        placeholder="First Name"
                                        disabled={loading}
                                    />
                                    {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        required
                                        className={`w-full px-3 py-2 text-sm bg-gray-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${errors.lastName ? 'border-red-500 ring-red-500/50' : 'border-gray-700 focus:ring-blue-500 hover:border-gray-600'}`}
                                        placeholder="Last Name"
                                        disabled={loading}
                                    />
                                    {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
                                </div>
                            </div>

                            <div className="relative">
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className={`w-full px-3 py-2 text-sm bg-gray-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${errors.email ? 'border-red-500 ring-red-500/50' : 'border-gray-700 focus:ring-blue-500 hover:border-gray-600'}`}
                                    placeholder="your@email.com"
                                    disabled={loading}
                                />
                                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div className="relative">
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    className={`w-full px-3 py-2 text-sm bg-gray-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${errors.password ? 'border-red-500 ring-red-500/50' : 'border-gray-700 focus:ring-blue-500 hover:border-gray-600'}`}
                                    placeholder="Password"
                                    disabled={loading}
                                />
                                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                            </div>

                            <div className="relative">
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    required
                                    className={`w-full px-3 py-2 text-sm bg-gray-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${errors.confirmPassword ? 'border-red-500 ring-red-500/50' : 'border-gray-700 focus:ring-blue-500 hover:border-gray-600'}`}
                                    placeholder="Confirm Password"
                                    disabled={loading}
                                />
                                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                            </div>

                            <div className="flex items-start space-x-2">
                                <input
                                    type="checkbox"
                                    name="agreeToTerms"
                                    checked={formData.agreeToTerms}
                                    onChange={handleInputChange}
                                    required
                                    id="terms"
                                    className="h-4 w-4 mt-0.5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-800/50"
                                    disabled={loading}
                                />
                                <label htmlFor="terms" className="text-xs text-gray-300">
                                    I agree to the <span className="text-blue-400 hover:underline cursor-pointer">Terms</span> and <span className="text-blue-400 hover:underline cursor-pointer">Privacy Policy</span>
                                </label>
                            </div>
                            {errors.agreeToTerms && <p className="text-red-400 text-xs">{errors.agreeToTerms}</p>}

                            {firebaseError && (
                                <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-xs">
                                    <strong>Error:</strong> {firebaseError}
                                </div>
                            )}

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: loading ? 1 : 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 shadow-lg"
                            >
                                {loading ? 'Creating...' : 'Create Account'}
                            </motion.button>
                        </motion.form>

                        <motion.div variants={itemVariants} className="mt-4 text-center">
                            <p className="text-xs text-gray-400">
                                Already have an account?{' '}
                                <button className="text-blue-400 hover:underline font-medium">
                                    Sign in
                                </button>
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};