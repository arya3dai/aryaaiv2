import React, { useState, useEffect } from 'react';
import { Settings, Database, MessageCircle, LayoutGrid, LogOut, Lock, Sparkles } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import TrainingPanel from './components/TrainingPanel';
import SettingsModal from './components/SettingsModal';
import LoginPage from './components/LoginPage';
import { Message, FirebaseConfig, KnowledgeEntry, UserProfile, EmotionState } from './types';
import { initFirebase, subscribeToKnowledgeBase, subscribeToAuth, logoutAdmin, User } from './services/firebase';
import { findBestResponse, getRandomDefaultResponse } from './services/botBrain';
import { getGeminiResponse, detectEmotion } from './services/gemini';

const LOCAL_STORAGE_PROFILE_KEY = 'firebot_profile';
const LOCAL_STORAGE_ROLE_KEY = 'firebot_role';

const App: React.FC = () => {
  // View State
  const [activeTab, setActiveTab] = useState<'chat' | 'train'>('chat');
  const [showSettings, setShowSettings] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    displayName: 'Guest User',
    themeColor: 'purple',
    language: 'en',
    autoSpeak: true
  });
  // Note: Avatar state removed as requested

  // Knowledge Base State
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeEntry[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Initialization
  useEffect(() => {
    // 1. Initialize Configuration from Environment Variables
    // Cast import.meta to any to avoid TypeScript errors with 'env' property
    const env = (import.meta as any).env || {};
    
    const envFirebaseConfig: FirebaseConfig = {
        apiKey: env.VITE_FIREBASE_API_KEY || 'mock',
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
        projectId: env.VITE_FIREBASE_PROJECT_ID || '',
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: env.VITE_FIREBASE_APP_ID || ''
    };
    
    // 2. Initialize Services
    handleFirebaseConnection(envFirebaseConfig);
    // Gemini client is initialized automatically in its service using process.env.API_KEY

    // 3. Load Saved User Profile
    const savedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    if (savedProfile) {
        try {
            setUserProfile(JSON.parse(savedProfile));
        } catch(e) {}
    }

    // 4. Load Role Persistence
    const savedRole = localStorage.getItem(LOCAL_STORAGE_ROLE_KEY);
    if (savedRole === 'admin') setIsAdmin(true);
  }, []);

  const handleFirebaseConnection = (config: FirebaseConfig) => {
    setConnectionStatus('idle');
    setConnectionError(null);
    const success = initFirebase(config);
    
    if (success) {
      const unsubscribeDB = subscribeToKnowledgeBase(
        (data) => {
          setKnowledgeBase(data);
          setConnectionStatus('connected');
          setConnectionError(null);
        },
        (err) => {
          console.error("Subscription error:", err);
          setConnectionStatus('error');
          setConnectionError(err.message);
        }
      );

      const unsubscribeAuth = subscribeToAuth((currentUser) => {
        setUser(currentUser);
        // If user logs out (null) but was admin, reset specific admin states
        if (!currentUser) {
            setIsAdmin(false);
            localStorage.removeItem(LOCAL_STORAGE_ROLE_KEY);
        } else {
            // Update profile display name if available from auth
            if (currentUser.displayName) {
                setUserProfile(prev => ({...prev, displayName: currentUser.displayName!}));
            }
        }
      });

      return () => {
        unsubscribeDB();
        unsubscribeAuth();
      }; 
    } else {
      // Only show error if we aren't explicitly in mock mode
      if (config.apiKey !== 'mock') {
        setConnectionStatus('error');
        setConnectionError("Failed to initialize Firebase. Check environment variables.");
      }
    }
  };

  const handleLoginSuccess = (authUser: User, adminRole: boolean) => {
      setUser(authUser);
      setIsAdmin(adminRole);
      setIsGuest(false);
      localStorage.setItem(LOCAL_STORAGE_ROLE_KEY, adminRole ? 'admin' : 'user');
      
      // If admin, go to train, else chat
      if (adminRole) setActiveTab('train');
      else setActiveTab('chat');
  };

  const handleGuestAccess = () => {
      setIsGuest(true);
      setUser(null);
      setIsAdmin(false);
      setActiveTab('chat');
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setIsGuest(false);
    setIsAdmin(false);
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_ROLE_KEY);
  };

  const saveProfile = (profile: UserProfile, avatarFile: File | null) => {
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));
    setUserProfile(profile);
  };

  const processEmotionAndText = (fullText: string): string => {
      let cleanText = fullText;
      // We process emotion tags but only return text as Avatar is gone
      if (fullText.includes('[HAPPY]')) cleanText = cleanText.replace('[HAPPY]', '');
      else if (fullText.includes('[SAD]')) cleanText = cleanText.replace('[SAD]', '');
      else if (fullText.includes('[ANGRY]')) cleanText = cleanText.replace('[ANGRY]', '');
      else if (fullText.includes('[SURPRISED]')) cleanText = cleanText.replace('[SURPRISED]', '');
      else if (fullText.includes('[THINKING]')) cleanText = cleanText.replace('[THINKING]', '');
      else if (fullText.includes('[NEUTRAL]')) cleanText = cleanText.replace('[NEUTRAL]', '');

      return cleanText.trim();
  }

  const handleUserMessage = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    const localMatch = findBestResponse(text, knowledgeBase);

    if (localMatch) {
      setTimeout(() => {
        const botMsg: Message = { id: (Date.now() + 1).toString(), text: localMatch, sender: 'bot', timestamp: Date.now() };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
      }, 600);
    } else {
      try {
        const rawResponse = await getGeminiResponse(text);
        const cleanText = processEmotionAndText(rawResponse);
        const botMsg: Message = { id: (Date.now() + 1).toString(), text: cleanText, sender: 'bot', timestamp: Date.now() };
        setMessages(prev => [...prev, botMsg]);
      } catch (error) {
        const botMsg: Message = { id: (Date.now() + 1).toString(), text: getRandomDefaultResponse(), sender: 'bot', timestamp: Date.now() };
        setMessages(prev => [...prev, botMsg]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleEmotionAnalysis = async (imageBase64: string) => {
    const userMsg: Message = { id: Date.now().toString(), text: "📷 [Scanning my facial expression...]", sender: 'user', timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const rawResponse = await detectEmotion(imageBase64);
      const cleanText = processEmotionAndText(rawResponse);
      const botMsg: Message = { id: (Date.now() + 1).toString(), text: cleanText, sender: 'bot', timestamp: Date.now() };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const botMsg: Message = { id: (Date.now() + 1).toString(), text: "I'm sorry, I couldn't process the image correctly.", sender: 'bot', timestamp: Date.now() };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- RENDER ---

  // 1. Login View
  if (!user && !isGuest) {
      return (
          <LoginPage 
            onLogin={handleLoginSuccess}
            onGuest={handleGuestAccess}
            connectionStatus={connectionStatus}
          />
      );
  }

  // 2. Main App View
  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-20 bg-gray-950 border-r border-gray-800 flex flex-col items-center py-6 gap-6 z-20">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/30 mb-4">
          <LayoutGrid size={20} className="text-white" />
        </div>

        <nav className="flex flex-col gap-4 w-full px-2">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 group ${
              activeTab === 'chat' ? 'bg-gray-800 text-blue-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <MessageCircle size={24} />
            <span className="text-[10px] font-medium">Chat</span>
          </button>

          {isAdmin && (
            <button 
              onClick={() => setActiveTab('train')}
              className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 group ${
                activeTab === 'train' ? 'bg-gray-800 text-blue-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <Database size={24} />
              <span className="text-[10px] font-medium">Train</span>
            </button>
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-4 w-full px-2">
          <button 
            onClick={handleLogout}
            className="p-3 rounded-xl transition-all duration-300 text-gray-500 hover:text-red-400 hover:bg-red-900/10 flex flex-col items-center gap-1"
            title="Logout"
          >
            <LogOut size={20} />
          </button>

          <button 
            onClick={() => setShowSettings(true)}
            className="p-3 rounded-xl transition-all duration-300 text-gray-500 hover:text-gray-100 hover:bg-gray-800/50 flex flex-col items-center gap-1"
            title="Settings"
          >
            <Settings size={24} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-gray-900/95 backdrop-blur border-b border-gray-800 flex items-center px-6 justify-between z-10">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Aarya <span className="text-blue-500">AI</span>
              <Sparkles size={14} className="text-yellow-500 animate-pulse" />
            </h1>
            <div className="flex items-center gap-2">
               <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
               <span className="text-xs text-gray-400">
                 {connectionStatus === 'connected' ? 'Database Online' : connectionStatus === 'error' ? 'Connection Failed' : 'Using Mock Data'}
               </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {isAdmin ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-blue-400">Admin Console</span>
                </div>
             ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
                   <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                   <span className="text-xs font-medium text-purple-400">
                     {user ? user.displayName || user.email : "Guest Session"}
                   </span>
                </div>
             )}
          </div>
        </header>

        {/* Dynamic View */}
        <div className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
            {activeTab === 'chat' ? (
                <ChatInterface 
                    messages={messages} 
                    onSendMessage={handleUserMessage} 
                    onAnalyzeEmotion={handleEmotionAnalysis}
                    isTyping={isTyping}
                    userProfile={userProfile}
                />
            ) : (
                <TrainingPanel 
                    entries={knowledgeBase} 
                    isConnected={connectionStatus === 'connected'}
                />
            )}
        </div>
      </main>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        onSaveProfile={saveProfile}
        userProfile={userProfile}
      />

    </div>
  );
};

export default App;