import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Camera, X, Aperture, Mic, MicOff } from 'lucide-react';
import { Message, UserProfile } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onAnalyzeEmotion: (imageBase64: string) => void;
  isTyping: boolean;
  userProfile: UserProfile;
}

// Web Speech API Types
declare global {
    interface Window {
      webkitSpeechRecognition: any;
      SpeechRecognition: any;
    }
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  onAnalyzeEmotion,
  isTyping, 
  userProfile
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // --- Speech Recognition Setup ---
  useEffect(() => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = false; // Stop after one sentence to prevent infinite listening
          recognition.interimResults = false;
          // Set language based on profile
          recognition.lang = userProfile.language === 'hi' ? 'hi-IN' : 'en-US';
          
          recognition.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript;
              // Dictation mode: Append to input instead of sending immediately
              setInputValue(prev => {
                  const trimmed = prev.trim();
                  return trimmed ? `${trimmed} ${transcript}` : transcript;
              });
          };

          recognition.onend = () => setIsListening(false);
          recognition.onerror = (event: any) => {
              console.error("Speech recognition error", event.error);
              setIsListening(false);
          };
          
          recognitionRef.current = recognition;
      }
  }, [userProfile.language]);

  const toggleListening = () => {
      if (isListening) {
          recognitionRef.current?.stop();
      } else {
          recognitionRef.current?.start();
          setIsListening(true);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  // --- Camera Handling ---
  const startCamera = async () => {
    setCameraError(null);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraError("Could not access camera. Please allow permissions.");
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        stopCamera();
        onAnalyzeEmotion(base64);
    }
  };

  const getThemeColor = (color: string) => {
      switch(color) {
          case 'blue': return 'bg-blue-600';
          case 'green': return 'bg-green-600';
          case 'orange': return 'bg-orange-600';
          case 'pink': return 'bg-pink-600';
          case 'cyan': return 'bg-cyan-600';
          case 'purple': default: return 'bg-purple-600';
      }
  };
  
  const themeClass = getThemeColor(userProfile.themeColor);

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-900 relative">
      
      {/* Camera Modal */}
      {showCamera && (
          <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="relative w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
                  <div className="absolute top-4 right-4 z-10">
                      <button onClick={stopCamera} className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur transition-all">
                          <X size={20} />
                      </button>
                  </div>
                  
                  {cameraError ? (
                      <div className="h-64 flex items-center justify-center text-red-400 p-8 text-center">
                          {cameraError}
                      </div>
                  ) : (
                      <div className="relative">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-64 object-cover transform scale-x-[-1]" 
                        />
                        <div className="absolute inset-0 border-2 border-blue-500/30 m-4 rounded-lg pointer-events-none">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
                        </div>
                      </div>
                  )}

                  <div className="p-4 bg-gray-800 flex justify-center">
                      <button 
                        onClick={capturePhoto}
                        disabled={!!cameraError}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-all shadow-lg shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <Aperture size={20} />
                          Scan Emotion
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center space-y-3 max-w-sm mx-auto px-6 animate-[fadeIn_1s_ease-out] mt-4">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Aarya AI
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                I'm listening. Speak, type, or show me something.
                <br/>
                <span className="text-xs opacity-50 mt-1 block">(Supports English & Hindi)</span>
              </p>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-end gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.sender === 'user' ? themeClass : 'bg-gray-800'
            }`}>
              {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} className="text-blue-400" />}
            </div>

            <div className={`group relative max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
              msg.sender === 'user' 
                ? `${themeClass} text-white rounded-br-none` 
                : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-none'
            }`}>
              {msg.sender === 'user' && (
                  <span className="text-[10px] font-bold opacity-70 block mb-1">{userProfile.displayName}</span>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              
              <span className="text-[10px] opacity-50 mt-1 block text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-end gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-700">
               <Bot size={16} className="text-blue-400" />
            </div>
            <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
          <div className="relative flex items-center gap-2">
             <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isListening ? "Listening..." : `Message in ${userProfile.language === 'hi' ? 'Hindi' : 'English'}...`}
                className={`w-full bg-gray-800 border border-gray-700 text-white rounded-full py-3 pl-6 pr-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg placeholder-gray-500 transition-all ${isListening ? 'ring-2 ring-red-500/50 bg-red-900/10' : ''}`}
             />
             
             <div className="absolute right-2 flex items-center gap-1">
                 <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-blue-400 hover:bg-gray-700/50'}`}
                    title="Toggle Voice Input"
                 >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                 </button>

                 <button
                    type="button"
                    onClick={startCamera}
                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700/50 rounded-full transition-all"
                    title="Detect Emotion"
                 >
                    <Camera size={20} />
                 </button>
                 <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-md"
                 >
                    <Send size={18} />
                 </button>
             </div>
          </div>
        </form>
        <p className="text-center text-xs text-gray-600 mt-2">
          Local AI Bot • Voice, Vision & Emotion Aware • {userProfile.language === 'hi' ? 'हिंदी मोड' : 'English Mode'}
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;