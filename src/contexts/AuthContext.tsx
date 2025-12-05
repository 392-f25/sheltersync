import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { VolunteerUser } from '../types/index.ts';
import {
  buildUserFromFirebaseUser,
  signInSuperAdmin as authSignInSuperAdmin,
  signInVolunteer as authSignInVolunteer,
  signOutVolunteer as authSignOut,
  subscribeToVolunteerAccess,
} from '../utilities/authService.ts';
import { auth } from '../utilities/firebase.ts';

type AuthContextValue = {
  user: VolunteerUser | null;
  isAuthLoading: boolean;
  authError: string | null;
  signInVolunteer: () => Promise<void>;
  signInSuperAdmin: () => Promise<void>;
  signOut: () => Promise<void>;
  canManageShelter: (shelterId: string | undefined) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<VolunteerUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const accessUnsubscribe = useRef<(() => void) | null>(null);

  const attachAccessSubscription = useCallback((email: string, uid: string) => {
    if (accessUnsubscribe.current) {
      accessUnsubscribe.current();
      accessUnsubscribe.current = null;
    }
    accessUnsubscribe.current = subscribeToVolunteerAccess(email, (shelterIds) => {
      setUser((current) => {
        if (!current || current.uid !== uid) return current;
        return { ...current, allowedShelterIds: shelterIds };
      });
    });
  }, []);

  const detachAccessSubscription = useCallback(() => {
    if (accessUnsubscribe.current) {
      accessUnsubscribe.current();
      accessUnsubscribe.current = null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setAuthError(null);
        detachAccessSubscription();
        setIsAuthLoading(false);
        return;
      }

      try {
        const mappedUser = await buildUserFromFirebaseUser(firebaseUser);
        setUser(mappedUser);
        if (mappedUser.role === 'volunteer' && mappedUser.email) {
          attachAccessSubscription(mappedUser.email, mappedUser.uid);
        } else {
          detachAccessSubscription();
        }
      } catch (error: any) {
        console.error('Failed to resolve auth state', error);
        setAuthError(error?.message || 'Unable to resolve authentication state.');
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    });

    return () => {
      unsubscribe();
      detachAccessSubscription();
    };
  }, [attachAccessSubscription, detachAccessSubscription]);

  const signInVolunteer = useCallback(async () => {
    setAuthError(null);
    try {
      const signedIn = await authSignInVolunteer();
      setUser(signedIn);
      if (signedIn.role === 'volunteer' && signedIn.email) {
        attachAccessSubscription(signedIn.email, signedIn.uid);
      } else {
        detachAccessSubscription();
      }
    } catch (error: any) {
      setAuthError(error?.message || 'Unable to sign in.');
      throw error;
    }
  }, [attachAccessSubscription, detachAccessSubscription]);

  const signInSuperAdmin = useCallback(async () => {
    setAuthError(null);
    try {
      const signedIn = await authSignInSuperAdmin();
      setUser(signedIn);
      detachAccessSubscription();
    } catch (error: any) {
      setAuthError(error?.message || 'Unable to sign in as Admin.');
      throw error;
    }
  }, [detachAccessSubscription]);

  const signOut = useCallback(async () => {
    setAuthError(null);
    try {
      await authSignOut();
      setUser(null);
      detachAccessSubscription();
    } catch (error: any) {
      setAuthError(error?.message || 'Unable to sign out.');
      throw error;
    }
  }, [detachAccessSubscription]);

  const canManageShelter = useCallback(
    (shelterId: string | undefined) => {
      if (!shelterId) return false;
      if (!user) return false;
      if (user.role === 'superAdmin') return true;
      return user.allowedShelterIds.includes(String(shelterId));
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthLoading,
      authError,
      signInVolunteer,
      signInSuperAdmin,
      signOut,
      canManageShelter,
    }),
    [user, isAuthLoading, authError, signInVolunteer, signInSuperAdmin, signOut, canManageShelter],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
