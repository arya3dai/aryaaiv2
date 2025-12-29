import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, setDoc,
  query, orderBy, Firestore 
} from 'firebase/firestore';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, onAuthStateChanged, 
  Auth, User as FirebaseAuthUser 
} from 'firebase/auth';
import { FirebaseConfig, KnowledgeEntry } from '../types';

// --- Types ---
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// --- State ---
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let useMock = true;

// --- Mock Data Constants ---
const STORAGE_KEY_DB = 'firebot_db_v1';
const STORAGE_KEY_USER = 'firebot_user_v1';
const DEFAULT_KNOWLEDGE: KnowledgeEntry[] = [
    { id: '1', topic: 'Welcome', keywords: ['hello', 'hi', 'hey', 'greetings'], response: 'Hello! I am Aarya AI. How can I help you today?' },
    { id: '2', topic: 'Capabilities', keywords: ['help', 'do', 'features', 'what can you do'], response: 'I can answer questions based on my local database. If I don\'t know the answer, I\'ll check with Gemini!' },
];

// --- Helpers for Mock Mode ---
const getMockDB = (): KnowledgeEntry[] => {
    try {
        const str = localStorage.getItem(STORAGE_KEY_DB);
        if (!str) {
            localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(DEFAULT_KNOWLEDGE));
            return DEFAULT_KNOWLEDGE;
        }
        return JSON.parse(str);
    } catch (e) { return []; }
};

const saveMockDB = (data: KnowledgeEntry[]) => {
    localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(data));
    if (mockDbListener) mockDbListener(data);
};

let mockDbListener: ((data: KnowledgeEntry[]) => void) | null = null;
let mockAuthListener: ((user: User | null) => void) | null = null;

// --- Initialization ---

export const initFirebase = (config: FirebaseConfig): boolean => {
  // Check if we should run in Real or Mock mode
  // We assume 'real' if we have a project ID and the API key isn't our explicit 'mock' flag
  if (config.apiKey && config.apiKey !== 'mock' && config.projectId) {
    try {
      if (getApps().length === 0) {
        app = initializeApp(config);
      } else {
        app = getApp();
      }
      db = getFirestore(app);
      auth = getAuth(app);
      useMock = false;
      console.log('Firebase Service: Real Connection Initialized');
      return true;
    } catch (error) {
      console.error('Firebase Initialization Error:', error);
      return false;
    }
  } else {
    console.log('Firebase Service: Running in Mock Mode (Local Storage)');
    useMock = true;
    // Ensure default data exists
    getMockDB(); 
    return true;
  }
};

// --- Database Services ---

export const subscribeToKnowledgeBase = (
  onData: (data: KnowledgeEntry[]) => void,
  onError: (error: Error) => void
) => {
  if (useMock) {
    mockDbListener = onData;
    // Initial fetch
    const data = getMockDB().sort((a, b) => a.topic.localeCompare(b.topic));
    onData(data);
    return () => { mockDbListener = null; };
  } else {
    if (!db) {
        onError(new Error("Database not initialized"));
        return () => {};
    }
    
    const q = query(collection(db, 'knowledge'), orderBy('topic'));
    
    return onSnapshot(q, 
      (snapshot) => {
        const entries: KnowledgeEntry[] = [];
        snapshot.forEach((doc) => {
          entries.push({ id: doc.id, ...doc.data() } as KnowledgeEntry);
        });
        onData(entries);
      },
      (error) => {
        console.error("Firestore Read Error:", error);
        onError(error);
      }
    );
  }
};

export const addKnowledgeEntry = async (entry: Omit<KnowledgeEntry, 'id'>) => {
  if (useMock) {
    const entries = getMockDB();
    const newEntry = { ...entry, id: 'mock_' + Date.now() };
    entries.push(newEntry);
    entries.sort((a, b) => a.topic.localeCompare(b.topic));
    saveMockDB(entries);
  } else {
    if (!db) throw new Error("Database not initialized");
    await addDoc(collection(db, 'knowledge'), entry);
  }
};

export const deleteKnowledgeEntry = async (id: string) => {
  if (useMock) {
    let entries = getMockDB();
    entries = entries.filter(e => e.id !== id);
    saveMockDB(entries);
  } else {
    if (!db) throw new Error("Database not initialized");
    await deleteDoc(doc(db, 'knowledge', id));
  }
};

// --- Auth Services ---

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  if (useMock) {
    mockAuthListener = callback;
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    if (stored) {
        try { callback(JSON.parse(stored)); } catch { callback(null); }
    } else {
        callback(null);
    }
    return () => { mockAuthListener = null; };
  } else {
    if (!auth) {
        callback(null);
        return () => {};
    }
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
      } else {
        callback(null);
      }
    });
  }
};

export const loginUser = async (email: string, pass: string): Promise<User> => {
  if (useMock) {
    // Mock Login Logic
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    if (!email.includes('@')) throw new Error("Invalid email");
    
    const user: User = {
        uid: 'mock_' + Date.now(),
        email,
        displayName: email.split('@')[0]
    };
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    if (mockAuthListener) mockAuthListener(user);
    return user;
  } else {
    if (!auth) throw new Error("Auth not initialized");
    const credential = await signInWithEmailAndPassword(auth, email, pass);
    return {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName
    };
  }
};

export const registerUser = async (email: string, pass: string, name: string): Promise<User> => {
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const user: User = { uid: 'mock_' + Date.now(), email, displayName: name };
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    if (mockAuthListener) mockAuthListener(user);
    return user;
  } else {
    if (!auth || !db) throw new Error("Auth/DB not initialized");
    
    // 1. Create Auth User
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    
    // 2. Update Profile
    await updateProfile(credential.user, { displayName: name });

    // 3. Save to Firestore 'users' collection
    try {
        await setDoc(doc(db, "users", credential.user.uid), {
            uid: credential.user.uid,
            email: email,
            displayName: name,
            createdAt: new Date().toISOString(),
            role: 'user'
        });
    } catch (e) {
        console.error("Error creating user document:", e);
        // Continue even if DB write fails, as Auth succeeded
    }

    return {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: name
    };
  }
};

export const logoutAdmin = async () => {
  if (useMock) {
    localStorage.removeItem(STORAGE_KEY_USER);
    if (mockAuthListener) mockAuthListener(null);
  } else {
    if (!auth) return;
    await signOut(auth);
  }
};