import React, { useState, useEffect } from 'react';
import { X, Save, User, Palette, Box, Globe, Volume2 } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (profile: UserProfile, avatarFile: File | null) => void;
  userProfile: UserProfile;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSaveProfile, 
  userProfile
}) => {
  
  // Profile Form State
  const [profileData, setProfileData] = useState<UserProfile>(userProfile);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (userProfile) setProfileData(userProfile);
  }, [userProfile, isOpen]);

  // --- Logic for Profile Tab ---
  
  const colors = ['purple', 'blue', 'green', 'orange', 'pink', 'cyan'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleSaveProfile = () => {
    onSaveProfile(profileData, avatarFile);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gray-800/50 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Settings
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
             <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                 <div>
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                        <User size={18} className="text-blue-400"/>
                        User Identity
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 font-medium uppercase ml-1">Display Name</label>
                            <input
                                type="text"
                                value={profileData.displayName}
                                onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-4 py-3 mt-1 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                                placeholder="Enter your name..."
                            />
                        </div>
                    </div>
                 </div>

                 <div className="border-t border-gray-800 pt-6">
                     <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                         <Globe size={18} className="text-green-400"/>
                         Language & Voice
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                             <label className="text-xs text-gray-500 font-medium uppercase ml-1 block mb-2">Primary Language</label>
                             <div className="flex gap-2">
                                 <button 
                                    onClick={() => setProfileData({...profileData, language: 'en'})}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-all ${profileData.language === 'en' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                                 >
                                     English (EN)
                                 </button>
                                 <button 
                                    onClick={() => setProfileData({...profileData, language: 'hi'})}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-all ${profileData.language === 'hi' ? 'bg-orange-600/20 border-orange-500 text-orange-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                                 >
                                     Hindi (हिंदी)
                                 </button>
                             </div>
                         </div>
                         <div>
                             <label className="text-xs text-gray-500 font-medium uppercase ml-1 block mb-2">Accessibility</label>
                             <div 
                                onClick={() => setProfileData({...profileData, autoSpeak: !profileData.autoSpeak})}
                                className={`cursor-pointer flex items-center justify-between p-3 rounded-lg border transition-all ${profileData.autoSpeak ? 'bg-purple-600/20 border-purple-500' : 'bg-gray-800 border-gray-700'}`}
                             >
                                 <div className="flex items-center gap-2 text-sm text-gray-300">
                                     <Volume2 size={16} />
                                     <span>Auto-Read Responses</span>
                                 </div>
                                 <div className={`w-8 h-4 rounded-full relative transition-colors ${profileData.autoSpeak ? 'bg-purple-500' : 'bg-gray-600'}`}>
                                     <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${profileData.autoSpeak ? 'left-4.5' : 'left-0.5'}`} style={{ left: profileData.autoSpeak ? '18px' : '2px'}}></div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* Note: 3D Avatar upload is kept here but might not be fully functional as the avatar view is removed from chat, kept for profile completeness if needed later */}
                 <div className="border-t border-gray-800 pt-6">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                        <Box size={18} className="text-yellow-400"/>
                        3D Avatar
                    </h3>
                    <div>
                        <label className="text-xs text-gray-500 font-medium uppercase ml-1 block mb-2">Upload Custom Avatar Model (.glb / .gltf)</label>
                        <div className="flex items-center gap-3">
                           <input 
                              type="file" 
                              accept=".glb,.gltf"
                              onChange={handleFileChange}
                              className="block w-full text-sm text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-xs file:font-semibold
                                file:bg-blue-600 file:text-white
                                hover:file:bg-blue-500
                                cursor-pointer bg-gray-800 rounded-lg border border-gray-700
                              "
                           />
                        </div>
                    </div>
                 </div>

                 <div className="border-t border-gray-800 pt-6">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                        <Palette size={18} className="text-purple-400"/>
                        Theme
                    </h3>
                    <div>
                        <label className="text-xs text-gray-500 font-medium uppercase ml-1 mb-3 block">Chat Bubble Color</label>
                        <div className="flex gap-3">
                            {colors.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setProfileData({...profileData, themeColor: c})}
                                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                                        profileData.themeColor === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: `var(--color-${c}-600, ${c})` }}
                                >
                                    <div className={`w-full h-full rounded-full ${
                                        c === 'purple' ? 'bg-purple-600' :
                                        c === 'blue' ? 'bg-blue-600' :
                                        c === 'green' ? 'bg-green-600' :
                                        c === 'orange' ? 'bg-orange-600' :
                                        c === 'pink' ? 'bg-pink-600' :
                                        'bg-cyan-600'
                                    }`}></div>
                                </button>
                            ))}
                        </div>
                    </div>
                 </div>
             </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all text-sm font-medium"
          >
            Cancel
          </button>
          
           <button 
             onClick={handleSaveProfile}
             className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 transform active:scale-95"
           >
             <Save size={18} />
             Save Profile
           </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;