import type { User as FirebaseUser } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { get, onValue, ref, set } from 'firebase/database';
import type { VolunteerAccessRecord, VolunteerUser, UserRole } from '../types/index.ts';
import { auth, db } from './firebase.ts';

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const parseEmails = (raw: string) =>
  raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

const DEFAULT_SUPER_ADMINS = ['founder@sheltersync.app', 'ops@sheltersync.app'];
const envSuperAdmins = parseEmails(import.meta.env.VITE_SUPER_ADMIN_EMAILS ?? '');
const SUPER_ADMIN_EMAILS = envSuperAdmins.length > 0 ? envSuperAdmins : DEFAULT_SUPER_ADMINS;

const sanitizeEmailKey = (email: string) => email.trim().toLowerCase().replace(/[.#$[\]]/g, '_');

const extractShelterIds = (record: any): string[] => {
  if (!record || typeof record !== 'object') return [];
  return Object.keys(record.shelters ?? {}).filter(Boolean);
};

const mapToVolunteerUser = (firebaseUser: FirebaseUser, role: UserRole, allowedShelterIds: string[]): VolunteerUser => ({
  uid: firebaseUser.uid,
  displayName: firebaseUser.displayName || firebaseUser.email || 'Volunteer',
  email: firebaseUser.email || '',
  isAuthenticated: true,
  role,
  allowedShelterIds,
});

const fetchAllowedSheltersForEmail = async (email: string | null | undefined): Promise<string[]> => {
  if (!email) return [];
  const snapshot = await get(ref(db, `volunteerAccess/${sanitizeEmailKey(email)}`));
  if (!snapshot.exists()) return [];
  return extractShelterIds(snapshot.val());
};

const signInWithGooglePopup = async () => {
  const credential = await signInWithPopup(auth, provider);
  return credential.user;
};

export const isSuperAdminEmail = (email?: string | null) =>
  email ? SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase()) : false;

export const buildUserFromFirebaseUser = async (firebaseUser: FirebaseUser, forcedRole?: UserRole) => {
  const resolvedRole: UserRole = forcedRole ?? (isSuperAdminEmail(firebaseUser.email) ? 'superAdmin' : 'volunteer');
  const allowedShelterIds = resolvedRole === 'superAdmin' ? [] : await fetchAllowedSheltersForEmail(firebaseUser.email);
  return mapToVolunteerUser(firebaseUser, resolvedRole, allowedShelterIds);
};

export const signInVolunteer = async (): Promise<VolunteerUser> => {
  try {
    const firebaseUser = await signInWithGooglePopup();
    return buildUserFromFirebaseUser(firebaseUser);
  } catch (error) {
    console.error('Unable to sign in volunteer', error);
    throw error;
  }
};

export const signInSuperAdmin = async (): Promise<VolunteerUser> => {
  const firebaseUser = await signInWithGooglePopup();
  if (!isSuperAdminEmail(firebaseUser.email)) {
    await signOut(auth);
    throw new Error('This Google account is not authorized as an Admin.');
  }
  return buildUserFromFirebaseUser(firebaseUser, 'superAdmin');
};

export const signOutVolunteer = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Unable to sign out volunteer', error);
    throw error;
  }
};

export const subscribeToVolunteerAccess = (email: string, callback: (shelterIds: string[]) => void) => {
  if (!email) return () => undefined;
  const accessRef = ref(db, `volunteerAccess/${sanitizeEmailKey(email)}`);
  const unsubscribe = onValue(accessRef, (snapshot) => {
    callback(extractShelterIds(snapshot.val()));
  });
  return unsubscribe;
};

export const fetchVolunteerAccessDirectory = async (): Promise<VolunteerAccessRecord[]> => {
  const snapshot = await get(ref(db, 'volunteerAccess'));
  if (!snapshot.exists()) return [];
  const data = snapshot.val() as Record<
    string,
    {
      email: string;
      shelters?: Record<string, boolean>;
      updatedAt?: string;
      updatedBy?: string | null;
    }
  >;

  return Object.values(data)
    .map((entry) => ({
      email: entry.email,
      shelterIds: extractShelterIds(entry),
      updatedAt: entry.updatedAt,
      updatedBy: entry.updatedBy ?? null,
    }))
    // Hide entries that no longer have any shelter access
    .filter((record) => record.shelterIds.length > 0);
};

export const saveVolunteerAccess = async (email: string, shelterIds: string[], updatedBy?: string | null) => {
  if (!email) throw new Error('Email is required to grant volunteer access.');
  const normalizedEmail = email.trim().toLowerCase();
  const payload = {
    email: normalizedEmail,
    shelters: shelterIds.reduce<Record<string, boolean>>((acc, shelterId) => {
      if (shelterId) acc[shelterId] = true;
      return acc;
    }, {}),
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy ?? null,
  };
  await set(ref(db, `volunteerAccess/${sanitizeEmailKey(normalizedEmail)}`), payload);
  return payload;
};
