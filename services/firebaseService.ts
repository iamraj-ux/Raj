import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { type DocFileData } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

// Error Handler Operation Type Enums
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

/**
 * Standard security rule logging & error wrapper
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate Connection to Firestore on App startup
 */
export async function testConnection() {
  try {
    if (!db) return;
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    // Graceful offline / standalone mode fallback without noise
  }
}

/**
 * Save user preset configuration
 */
export async function savePreset(userId: string, presets: {
  singleSidedCost: number;
  doubleSidedCost: number;
  separateOrientations: boolean;
  pagesPerSide: number;
}) {
  const path = `users/${userId}/presets/default`;
  try {
    await setDoc(doc(db, path), {
      userId,
      singleSidedCost: presets.singleSidedCost,
      doubleSidedCost: presets.doubleSidedCost,
      separateOrientations: presets.separateOrientations,
      pagesPerSide: presets.pagesPerSide,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Load user preset configuration
 */
export async function loadPreset(userId: string) {
  const path = `users/${userId}/presets/default`;
  try {
    const docSnap = await getDoc(doc(db, path));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

export interface SavedCalculation {
  id: string;
  name: string;
  createdAt: any;
  totalCount: number;
  totalSheets: number;
  totalSingleSidedPrice: number;
  totalDoubleSidedPrice: number;
  files: Omit<DocFileData, 'file'>[];
  userId: string;
}

/**
 * Save full calculations batch session
 */
export async function saveCalculation(userId: string, name: string, data: {
  totalCount: number;
  totalSheets: number;
  totalSingleSidedPrice: number;
  totalDoubleSidedPrice: number;
  files: DocFileData[];
}) {
  const calcId = `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const path = `users/${userId}/calculations/${calcId}`;
  
  // Strip raw file objects as Firestore cannot serialize File instances
  const serializedFiles = data.files.map(f => {
    const { file, ...rest } = f;
    return rest;
  });

  try {
    await setDoc(doc(db, path), {
      id: calcId,
      name: name || `Batch Calculation @ ${new Date().toLocaleTimeString()}`,
      createdAt: serverTimestamp(),
      totalCount: data.totalCount,
      totalSheets: data.totalSheets,
      totalSingleSidedPrice: data.totalSingleSidedPrice,
      totalDoubleSidedPrice: data.totalDoubleSidedPrice,
      files: serializedFiles,
      userId
    });
    return calcId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    return null;
  }
}

/**
 * Get Calculations History
 */
export async function getCalculationsHistory(userId: string): Promise<SavedCalculation[]> {
  const path = `users/${userId}/calculations`;
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const querySnap = await getDocs(q);
    const results: SavedCalculation[] = [];
    querySnap.forEach((doc) => {
      const d = doc.data();
      results.push({
        id: d.id,
        name: d.name,
        createdAt: d.createdAt,
        totalCount: d.totalCount,
        totalSheets: d.totalSheets,
        totalSingleSidedPrice: d.totalSingleSidedPrice,
        totalDoubleSidedPrice: d.totalDoubleSidedPrice,
        files: d.files,
        userId: d.userId
      });
    });
    return results;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

/**
 * Delete a saved calculation
 */
export async function deleteSavedCalculation(userId: string, calcId: string) {
  const path = `users/${userId}/calculations/${calcId}`;
  try {
    await deleteDoc(doc(db, path));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}
