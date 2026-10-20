import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Key, ShieldCheck, FolderGit2, HardDrive, Cloud, Check, 
  AlertCircle, X, LogIn, UserPlus, LogOut, RefreshCw, Zap,
  ExternalLink, Eye, EyeOff
} from 'lucide-react';
import { 
  UserAccountProfile, 
  GitHubIntegrationConfig, 
  GoogleIntegrationConfig,
  CloudinaryIntegrationConfig,
  getUserAccountProfile, 
  saveUserAccountProfile, 
  signOutUser,
  getGitHubIntegrationConfig, 
  saveGitHubIntegrationConfig, 
  disconnectGitHubIntegration,
  getGoogleIntegrationConfig, 
  saveGoogleIntegrationConfig, 
  disconnectGoogleIntegration,
  getCloudinaryConfig,
  saveCloudinaryConfig
} from '../services/accountConfigService';
import { soundManager } from '../services/soundEffects';
import { logActivity } from '../services/activityLogger';

interface AccountConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'auth' | 'github' | 'google' | 'cloud';
}

export const AccountConfigModal: React.FC<AccountConfigModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'auth'
}) => {
  const [activeTab, setActiveTab] = useState<'auth' | 'github' | 'google' | 'cloud'>(defaultTab);

  // User Profile Form State
  const [profile, setProfile] = useState<UserAccountProfile>(getUserAccountProfile());
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [roleInput, setRoleInput] = useState<string>('Master Operator / Boss');

  // GitHub Config Form State
  const [ghConfig, setGhConfig] = useState<GitHubIntegrationConfig>(getGitHubIntegrationConfig());
  const [ghOwner, setGhOwner] = useState<string>('');
  const [ghRepo, setGhRepo] = useState<string>('');
  const [ghBranch, setGhBranch] = useState<string>('main');
  const [ghToken, setGhToken] = useState<string>('');
  const [showToken, setShowToken] = useState<boolean>(false);
  const [isTestingGitHub, setIsTestingGitHub] = useState<boolean>(false);
  const [ghTestMessage, setGhTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Google Config Form State
  const [googleConfig, setGoogleConfig] = useState<GoogleIntegrationConfig>(getGoogleIntegrationConfig());
  const [googleTokenInput, setGoogleTokenInput] = useState<string>('');
  const [googleEmailInput, setGoogleEmailInput] = useState<string>('');

  // Cloudinary Config Form State
  const [cloudConfig, setCloudConfig] = useState<CloudinaryIntegrationConfig>(getCloudinaryConfig());
  const [cloudNameInput, setCloudNameInput] = useState<string>('');
  const [uploadPresetInput, setUploadPresetInput] = useState<string>('');
  const [folderInput, setFolderInput] = useState<string>('');

  // Status feedback
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const p = getUserAccountProfile();
      setProfile(p);
      setNameInput(p.name);
      setEmailInput(p.email);
      setRoleInput(p.role || 'Master Operator / Boss');

      const gh = getGitHubIntegrationConfig();
      setGhConfig(gh);
      setGhOwner(gh.owner);
      setGhRepo(gh.repo);
      setGhBranch(gh.branch || 'main');
      setGhToken(gh.personalAccessToken);

      const g = getGoogleIntegrationConfig();
      setGoogleConfig(g);
      setGoogleTokenInput(g.accessToken);
      setGoogleEmailInput(g.userEmail);

      const c = getCloudinaryConfig();
      setCloudConfig(c);
      setCloudNameInput(c.cloudName);
      setUploadPresetInput(c.uploadPreset);
      setFolderInput(c.folder);

      setFeedback('');
      setGhTestMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Sign In / Sign Up handler
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playAccessGrantedSound();

    const updated = saveUserAccountProfile({
      name: nameInput.trim() || 'Boss Jonathan Raj',
      email: emailInput.trim() || 'raj@rajexpodigitals.com',
      role: roleInput.trim() || 'Master Operator / Boss',
      clearanceLevel: 'Level 5 Supreme'
    });

    setProfile(updated);
    setFeedback(`Successfully ${isSignUpMode ? 'created account' : 'signed in'} as ${updated.name}!`);
    setTimeout(() => setFeedback(''), 3500);
  };

  const handleSignOut = () => {
    soundManager.playClickSound();
    signOutUser();
    setProfile(getUserAccountProfile());
    setNameInput('');
    setEmailInput('');
    setFeedback('Signed out. Operating in newly unconfigured guest mode.');
    setTimeout(() => setFeedback(''), 3500);
  };

  // 2. Save GitHub Config handler
  const handleSaveGitHub = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClickSound();

    const updated = saveGitHubIntegrationConfig({
      owner: ghOwner.trim(),
      repo: ghRepo.trim(),
      branch: ghBranch.trim() || 'main',
      personalAccessToken: ghToken.trim()
    });

    setGhConfig(updated);
    setFeedback('GitHub configuration updated successfully.');
    setTimeout(() => setFeedback(''), 3500);
  };

  const handleTestGitHub = async () => {
    if (!ghToken.trim() || !ghOwner.trim() || !ghRepo.trim()) {
      setGhTestMessage({ type: 'error', text: 'Please fill in Owner, Repo name, and Personal Access Token.' });
      return;
    }

    setIsTestingGitHub(true);
    setGhTestMessage(null);

    try {
      const res = await fetch(`https://api.github.com/repos/${ghOwner.trim()}/${ghRepo.trim()}`, {
        headers: {
          'Authorization': `Bearer ${ghToken.trim()}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (res.ok) {
        const repoData = await res.json();
        soundManager.playAccessGrantedSound();
        setGhTestMessage({
          type: 'success',
          text: `Verified! Connected to ${repoData.full_name} (${repoData.private ? 'Private' : 'Public'}).`
        });
        saveGitHubIntegrationConfig({
          owner: ghOwner.trim(),
          repo: ghRepo.trim(),
          branch: ghBranch.trim() || 'main',
          personalAccessToken: ghToken.trim()
        });
      } else {
        const errJson = await res.json().catch(() => ({}));
        setGhTestMessage({
          type: 'error',
          text: `GitHub API error (${res.status}): ${errJson.message || 'Check your token & repo permissions'}`
        });
      }
    } catch (err: any) {
      setGhTestMessage({
        type: 'error',
        text: `Connection failed: ${err.message || 'Network error'}`
      });
    } finally {
      setIsTestingGitHub(false);
    }
  };

  const handleDisconnectGitHub = () => {
    soundManager.playClickSound();
    disconnectGitHubIntegration();
    setGhConfig(getGitHubIntegrationConfig());
    setGhToken('');
    setGhTestMessage(null);
    setFeedback('GitHub disconnected. Set as newly sign in.');
    setTimeout(() => setFeedback(''), 3500);
  };

  // 3. Save Google Workspace Config handler
  const handleSaveGoogle = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClickSound();

    const updated = saveGoogleIntegrationConfig({
      accessToken: googleTokenInput.trim(),
      userEmail: googleEmailInput.trim()
    });

    setGoogleConfig(updated);
    setFeedback('Google Workspace credentials saved.');
    setTimeout(() => setFeedback(''), 3500);
  };

  const handleDisconnectGoogle = () => {
    soundManager.playClickSound();
    disconnectGoogleIntegration();
    setGoogleConfig(getGoogleIntegrationConfig());
    setGoogleTokenInput('');
    setGoogleEmailInput('');
    setFeedback('Google integration disconnected.');
    setTimeout(() => setFeedback(''), 3500);
  };

  // 4. Save Cloudinary Config handler
  const handleSaveCloudinary = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClickSound();

    const updated = saveCloudinaryConfig({
      cloudName: cloudNameInput.trim(),
      uploadPreset: uploadPresetInput.trim(),
      folder: folderInput.trim()
    });

    setCloudConfig(updated);
    setFeedback('Cloudinary cloud storage settings updated.');
    setTimeout(() => setFeedback(''), 3500);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl select-none font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-950 border-2 border-cyan-400/80 rounded-3xl shadow-[0_0_60px_rgba(34,211,238,0.4)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-purple-950/60 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Account & Mentions Configurations
              </h2>
              <p className="text-[10px] text-cyan-400">
                Newly Sign In / Sign Up • GitHub Dual-Sync • Google Workspace • Cloudinary
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClickSound();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('auth')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === 'auth'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Operator Identity</span>
            {profile.isAuthenticated && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === 'github'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>GitHub Database</span>
            {ghConfig.isConfigured && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('google')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === 'google'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-400/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Google Workspace</span>
            {googleConfig.isConfigured && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === 'cloud'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloudinary</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="mx-5 mt-3 px-3 py-2 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto jarvis-scrollbar flex-1 space-y-4">
          
          {/* TAB 1: OPERATOR IDENTITY (SIGN IN / SIGN UP) */}
          {activeTab === 'auth' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-white uppercase block">
                    {profile.isAuthenticated ? `Active Operator: ${profile.name}` : 'Unconfigured Guest Mode'}
                  </span>
                  <span className="text-[10px] text-cyan-400">
                    {profile.isAuthenticated 
                      ? `${profile.role} • ${profile.email}` 
                      : 'Sign in or create an account to authenticate this digital server session.'}
                  </span>
                </div>
                {profile.isAuthenticated ? (
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    NEW SESSION
                  </span>
                )}
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-black text-cyan-300 uppercase">
                    {isSignUpMode ? 'Operator Sign Up Registration' : 'Operator Sign In'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUpMode(!isSignUpMode);
                      soundManager.playClickSound();
                    }}
                    className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    {isSignUpMode ? 'Already have credentials? Sign In' : 'New operator? Sign Up'}
                  </button>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Operator Full Name
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Jonathan Raj"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="raj@rajexpodigitals.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Security Passcode
                  </label>
                  <input
                    type="password"
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {isSignUpMode && (
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Designated Role / Title
                    </label>
                    <input
                      type="text"
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      placeholder="Master Operator / Boss"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  {isSignUpMode ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  {isSignUpMode ? 'Register Operator Account' : 'Authenticate Session'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: GITHUB DATABASE CONFIGURATION */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-white uppercase block">
                    GitHub Central Database Storage
                  </span>
                  <span className="text-[10px] text-amber-300">
                    Dual-sync repository for all 34 canonical categories and settings.
                  </span>
                </div>
                {ghConfig.isConfigured ? (
                  <button
                    onClick={handleDisconnectGitHub}
                    className="px-2.5 py-1 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase cursor-pointer"
                  >
                    Disconnect
                  </button>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">
                    NOT CONFIGURED
                  </span>
                )}
              </div>

              {ghTestMessage && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  ghTestMessage.type === 'success' 
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' 
                    : 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                }`}>
                  {ghTestMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{ghTestMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveGitHub} className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      GitHub Username / Owner
                    </label>
                    <input
                      type="text"
                      value={ghOwner}
                      onChange={(e) => setGhOwner(e.target.value)}
                      placeholder="iamraj-ux"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Repository Name
                    </label>
                    <input
                      type="text"
                      value={ghRepo}
                      onChange={(e) => setGhRepo(e.target.value)}
                      placeholder="raj-expo-database"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Branch
                    </label>
                    <input
                      type="text"
                      value={ghBranch}
                      onChange={(e) => setGhBranch(e.target.value)}
                      placeholder="main"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Database File Path
                    </label>
                    <input
                      type="text"
                      disabled
                      value="database/raj_expo_central_database.json"
                      className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">
                      GitHub Personal Access Token (PAT)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showToken ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={ghToken}
                    onChange={(e) => setGhToken(e.target.value)}
                    placeholder="ghp_••••••••••••••••••••••••••••••••"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <p className="text-[9px] text-slate-500 mt-1">
                    Requires repo scope to read and write database payloads to your repository.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestGitHub}
                    disabled={isTestingGitHub}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingGitHub ? 'animate-spin' : ''}`} />
                    {isTestingGitHub ? 'Testing Connection...' : 'Test Connection'}
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase transition-all shadow-md cursor-pointer"
                  >
                    Save GitHub Config
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: GOOGLE WORKSPACE CONFIGURATION */}
          {activeTab === 'google' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-white uppercase block">
                    Google Workspace & Drive Integration
                  </span>
                  <span className="text-[10px] text-blue-300">
                    Standalone direct access token connection (No invalid Firebase dependency).
                  </span>
                </div>
                {googleConfig.isConfigured ? (
                  <button
                    onClick={handleDisconnectGoogle}
                    className="px-2.5 py-1 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase cursor-pointer"
                  >
                    Disconnect
                  </button>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">
                    NOT CONFIGURED
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveGoogle} className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Google Account Email
                  </label>
                  <input
                    type="email"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    placeholder="raj@rajexpodigitals.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Google OAuth Bearer Access Token
                  </label>
                  <input
                    type="password"
                    value={googleTokenInput}
                    onChange={(e) => setGoogleTokenInput(e.target.value)}
                    placeholder="ya29.••••••••••••••••••••••••••••••••"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400 font-mono"
                  />
                  <p className="text-[9px] text-slate-500 mt-1">
                    Paste your valid Google OAuth access token for Drive v3, Picker, and Sheets access.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs uppercase transition-all shadow-md cursor-pointer"
                >
                  Save Google Credentials
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: CLOUDINARY CLOUD STORAGE */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-white uppercase block">
                    Cloudinary Media & Document Storage
                  </span>
                  <span className="text-[10px] text-purple-300">
                    Unsigned browser media storage and device wallpaper asset uploads.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>

              <form onSubmit={handleSaveCloudinary} className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Cloud Name
                  </label>
                  <input
                    type="text"
                    value={cloudNameInput}
                    onChange={(e) => setCloudNameInput(e.target.value)}
                    placeholder="uhysx6is"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Upload Preset
                  </label>
                  <input
                    type="text"
                    value={uploadPresetInput}
                    onChange={(e) => setUploadPresetInput(e.target.value)}
                    placeholder="raj_expo_upload"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Target Folder
                  </label>
                  <input
                    type="text"
                    value={folderInput}
                    onChange={(e) => setFolderInput(e.target.value)}
                    placeholder="raj_expo"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs uppercase transition-all shadow-md cursor-pointer"
                >
                  Save Cloudinary Settings
                </button>
              </form>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};
