// src/App.jsx
import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import SignUp from './SignUp';
import SignIn from './SignIn';
import Algo from './algo';
import { AuthProvider, useAuth } from './components/AuthContext'; // we'll create this

// ProtectedRoute wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center p-10">Loading...</div>;
  return user ? children : <Navigate to="/signin" replace />;
}

export default function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <div className="bg-[#0C0F15] min-h-screen text-white overflow-hidden">
        <Routes location={location} key={location.pathname}>
          {/* Auth pages */}
          <Route path="/" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />

          {/* Protected main algo page */}
          <Route
            path="/algo"
            element={
              <ProtectedRoute>
                <Algo />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  );
}