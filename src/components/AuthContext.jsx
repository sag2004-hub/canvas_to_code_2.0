import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, serverTs } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Upsert user profile in Firestore (optional but useful)
async function upsertUserDoc(user) {
  if (!user) return;
  try {
    const { uid, email, displayName, photoURL, providerData } = user;
    const providerId = providerData?.[0]?.providerId ?? 'password';

    await setDoc(
      doc(db, 'users', uid),
      {
        uid,
        email: email ?? '',
        displayName: displayName ?? '',
        photoURL: photoURL ?? '',
        providerId,
        lastLoginAt: serverTs(),
      },
      { merge: true }
    );
  } catch (err) {
    // If you were offline, this will sync later thanks to offline cache
    console.warn('upsertUserDoc failed (will sync later if offline):', err);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() =>
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) upsertUserDoc(u);
      setLoading(false);
    }),
  []);

  const value = {
    user,
    loading,
    signOutUser: () => signOut(auth),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
