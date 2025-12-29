import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight, Sparkles, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { loginUser, registerUser, User as FirebaseUser } from '../services/firebase';

interface LoginPageProps {
  onLogin: (user: FirebaseUser, isAdmin: boolean) => void;
  onGuest: () => void;
  connectionStatus: 'connected' | 'error' | 'idle';
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onGuest, connectionStatus }) => {
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let user: FirebaseUser;
      
      if (role === 'user' && isRegistering) {
        if (!name.trim()) throw new Error("Name is required");
        user = await registerUser(email, password, name);
      } else {
        user = await loginUser(email, password);
      }

      // Success
      const isAdmin = role === 'admin';
      onLogin(user, isAdmin);

    } catch (err: any) {
      console.error(err);
      let msg = "Authentication failed.";
      if (err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already registered.";
      if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500';
  const statusText = connectionStatus === 'connected' ? 'Firebase Connected' : connectionStatus === 'error' ? 'Connection Error' : 'Mock Mode';

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative z-10 animate-in fade-in zoom-in duration-300">
        
        {/* Left Side: Brand & Visuals */}
        <div className="md:w-5/12 bg-gray-950 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-800 relative">
           <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent pointer-events-none"></div>
           
           <div>
             <div className="flex items-center gap-2 mb-6">
                <Sparkles className="text-blue-500" size={24} />
                <h1 className="text-2xl font-bold text-white tracking-tight">Aarya <span className="text-blue-500">AI</span></h1>
             </div>
             
             <p className="text-gray-400 text-sm leading-relaxed mb-6">
               Your intelligent assistant for seamless conversations. Train your own knowledge base and interact with a smart local AI.
             </p>

             <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-900/50 p-2 rounded-lg border border-gray-800 w-fit">
                <span className={`w-2 h-2 rounded-full ${statusColor} shadow-[0_0_8px_rgba(34,197,94,0.4)]`}></span>
                {statusText}
             </div>
           </div>

           <div className="mt-8 text-xs text-gray-600">
             &copy; 2024 Aarya AI Project
           </div>
        </div>

        {/* Right Side: Login Forms */}
        <div className="md:w-7/12 p-8 md:p-12 bg-gray-900 flex flex-col justify-center">
            
            {/* Role Toggles */}
            <div className="flex bg-gray-800 p-1 rounded-xl mb-8 self-center">
               <button 
                 onClick={() => { setRole('user'); setIsRegistering(false); setError(null); }}
                 className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${role === 'user' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
               >
                 <User size={16} />
                 User
               </button>
               <button 
                 onClick={() => { setRole('admin'); setIsRegistering(false); setError(null); }}
                 className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${role === 'admin' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
               >
                 <Lock size={16} />
                 Admin
               </button>
            </div>

            <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-white mb-1">
                    {role === 'user' ? (isRegistering ? "Create an Account" : "Welcome Back") : "Admin Access"}
                </h2>
                <p className="text-sm text-gray-500">
                    {role === 'user' 
                        ? (isRegistering ? "Join to save your chat history" : "Login to continue chatting") 
                        : "Login to manage knowledge base"}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-start gap-2 text-xs">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    {error}
                    </div>
                )}

                {role === 'user' && isRegistering && (
                   <div className="space-y-1 animate-in slide-in-from-top-2">
                       <label className="text-xs font-medium text-gray-400 uppercase ml-1">Display Name</label>
                       <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                          <input 
                            type="text" 
                            required 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-xl py-3 pl-10 pr-4 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Your Name"
                          />
                       </div>
                   </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-400 uppercase ml-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                        type="email" 
                        required 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-xl py-3 pl-10 pr-4 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        placeholder="you@example.com"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-400 uppercase ml-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                        type="password" 
                        required 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-xl py-3 pl-10 pr-4 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        placeholder="••••••••"
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-xl font-medium text-white shadow-lg transition-all flex items-center justify-center gap-2 mt-4 ${role === 'admin' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20'}`}
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
                            {isRegistering ? "Sign Up" : "Login"}
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 space-y-4 max-w-sm mx-auto w-full text-center">
                {role === 'user' && (
                    <div className="text-xs text-gray-500">
                        {isRegistering ? "Already have an account?" : "Don't have an account?"}
                        <button 
                          onClick={() => setIsRegistering(!isRegistering)}
                          className="text-blue-400 hover:text-blue-300 ml-1 hover:underline font-medium"
                        >
                            {isRegistering ? "Login" : "Sign Up"}
                        </button>
                    </div>
                )}
                
                {role === 'user' && (
                    <>
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-800"></span></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-gray-900 px-2 text-gray-600">Or continue without account</span></div>
                        </div>
                        <button 
                            onClick={onGuest}
                            className="w-full py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-all text-sm font-medium flex items-center justify-center gap-2"
                        >
                            Continue as Guest <ArrowRight size={16} />
                        </button>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
