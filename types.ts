export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

export interface KnowledgeEntry {
  id?: string;
  keywords: string[];
  response: string;
  topic: string;
  matchCount?: number; // Local metric for popularity
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface UserProfile {
  displayName: string;
  themeColor: string; // e.g., 'blue', 'purple', 'green', 'orange'
  language: 'en' | 'hi'; // English or Hindi
}

export interface BotState {
  isReady: boolean;
  isTraining: boolean;
  configValid: boolean;
}

export type EmotionState = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'thinking';