// ============================================================
// SSC — useAuth.js  (Firebase Authentication)
// Gestion des utilisateurs : connexion, déconnexion, rôles
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const ROLES = {
  ADMIN:    'admin',    // Accès total
  STOCK:    'stock',    // Entrées/sorties + consultation
  LECTURE:  'lecture',  // Consultation uniquement
};

export const DEFAULT_PERMS = {
  canViewPUMP: false,      // Voir les prix d'achat
  canDelete: false,        // Supprimer des éléments
  canExport: false,        // Exporter les données
};

export default function useAuth() {
  const [user,     setUser]     = useState(null);   // Firebase User
  const [profile,  setProfile]  = useState(null);   // Profil Firestore (rôle, nom...)
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // Écoute l'état de connexion Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Charger le profil depuis Firestore
        const profileUnsub = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              // Polyfill permissions if missing
              if (!data.permissions) data.permissions = { ...DEFAULT_PERMS };
              if (data.role === ROLES.ADMIN) {
                 data.permissions = { canViewPUMP: true, canDelete: true, canExport: true };
              }
              setProfile(data);
            } else {
              // Profil par défaut si inexistant
              const defaultProfile = { 
                role: ROLES.ADMIN, 
                nom: firebaseUser.displayName || firebaseUser.email, 
                email: firebaseUser.email,
                permissions: { canViewPUMP: true, canDelete: true, canExport: true }
              };
              setProfile(defaultProfile);
              setDoc(doc(db, 'users', firebaseUser.uid), defaultProfile);
            }
          }
        );
        setLoading(false);
        return () => profileUnsub();
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Connexion
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err) {
      const msgs = {
        'auth/user-not-found':   'Aucun compte avec cet email.',
        'auth/wrong-password':   'Mot de passe incorrect.',
        'auth/invalid-email':    'Email invalide.',
        'auth/too-many-requests':'Trop de tentatives. Réessayez dans quelques minutes.',
        'auth/invalid-credential': 'Email ou mot de passe incorrect.',
      };
      const msg = msgs[err.code] || `Erreur: ${err.message}`;
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // Déconnexion
  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  // Créer un utilisateur (admin seulement)
  const createUser = useCallback(async ({ email, password, nom, role, permissions = DEFAULT_PERMS }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: nom });
      await setDoc(doc(db, 'users', cred.user.uid), { 
        nom, email, role, 
        permissions: role === ROLES.ADMIN ? { canViewPUMP: true, canDelete: true, canExport: true } : permissions,
        createdAt: new Date().toISOString() 
      });
      return { success: true };
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'Cet email est déjà utilisé.',
        'auth/weak-password': 'Mot de passe trop faible (min 6 caractères).',
      };
      return { success: false, error: msgs[err.code] || err.message };
    }
  }, []);

  // Réinitialiser le mot de passe
  const resetPassword = useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const isAdmin  = profile?.role === ROLES.ADMIN;
  const canWrite = profile?.role === ROLES.ADMIN || profile?.role === ROLES.STOCK;
  const hasPerm  = (p) => isAdmin || (profile?.permissions && profile.permissions[p]);

  return { user, profile, loading, error, isAdmin, canWrite, hasPerm, login, logout, createUser, resetPassword };
}
