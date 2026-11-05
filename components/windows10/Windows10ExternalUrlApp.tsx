import React, { useState } from 'react';
import { 
  ExternalLink, ShieldCheck, CheckCircle2, Server, Globe, Database, 
  RefreshCw, ArrowLeft, ArrowRight, Lock, Key, Users, HardDrive, 
  FileCode, Terminal, Sparkles, Layers, Maximize2 
} from 'lucide-react';
import { soundManager } from '../../services/soundEffects';

interface ExternalUrlAppProps {
  type: 'firebase' | 'google-cloud';
}

export const Windows10ExternalUrlApp: React.FC<ExternalUrlAppProps> = ({ type }) => {
  const isFirebase = type === 'firebase';
  const [activeTab, setActiveTab] = useState<'overview' | 'data_viewer' | 'web_view'>('overview');
  const [selectedCollection, setSelectedCollection] = useState<'users' | 'documents' | 'system_logs' | 'settings'>('documents');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const config = isFirebase ? {
    title: 'Firebase Console',
    url: 'https://console.firebase.google.com',
    projectUrl: 'https://console.firebase.google.com/project/raj-expo-digitals-server-916',
    projectId: 'raj-expo-digitals-server-916',
    projectName: 'Raj Expo Digitals Server 916',
    subtitle: 'Google Firebase Backend, Firestore & Real-Time Sync',
    accentColor: 'from-amber-600 to-orange-500',
    services: [
      { name: 'Cloud Firestore', status: 'Active (Production)', desc: 'Document store & offline database cache', metric: '4 Collections • 142 Documents' },
      { name: 'Firebase Authentication', status: 'Operational', desc: 'Secure OAuth & email authentication provider', metric: '1 Admin User • Ready' },
      { name: 'Cloud Storage', status: 'Online', desc: 'Raj Expo media & digital assets bucket', metric: 'Bucket: raj-expo-digitals-916.appspot.com' },
      { name: 'Security Rules', status: 'Enforced', desc: 'Strict multi-role authorization policy', metric: 'firestore.rules deployed' },
    ]
  } : {
    title: 'Google Cloud Console',
    url: 'https://console.cloud.google.com',
    projectUrl: 'https://console.cloud.google.com/welcome?project=raj-expo-digitals-production',
    projectId: 'raj-expo-digitals-production',
    projectName: 'Raj Expo Digitals Enterprise',
    subtitle: 'Google Cloud Platform Enterprise Infrastructure & APIs',
    accentColor: 'from-blue-600 to-cyan-500',
    services: [
      { name: 'Gemini AI API', status: 'Connected', desc: 'Multimodal generative reasoning engine', metric: 'Model: gemini-2.5-flash • Active' },
      { name: 'Cloud Run Container', status: 'Running', desc: 'Raj Expo Digitals container runtime', metric: 'Port 3000 • 100% Health' },
      { name: 'Cloud Shell & SDK', status: 'Enabled', desc: 'Terminal management & command line tools', metric: 'bash • gcloud SDK ready' },
      { name: 'Cloud DNS & Networking', status: 'Healthy', desc: 'Global high-speed edge distribution', metric: 'asia-east1 • Latency: 24ms' },
    ]
  };

  const handleOpenExternal = () => {
    soundManager.playAccessGrantedSound();
    window.open(config.projectUrl || config.url, '_blank', 'noopener,noreferrer');
  };

  const handleRefresh = () => {
    soundManager.playClickSound();
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Sample live documents in Firestore
  const sampleFirestoreDocs = {
    users: [
      { id: 'usr_raj_admin_01', email: 'drvicvondom@gmail.com', role: 'Super Admin / Boss', created: '2026-10-01', status: 'Active' },
      { id: 'usr_natasha_ai_02', email: 'natasha.ai@rajexpo.lk', role: 'Virtual Assistant / AI Copilot', created: '2026-10-01', status: 'System' }
    ],
    documents: [
      { id: 'doc_raj_expo_catalog_01', title: 'Raj Expo Services Catalog 2026.pdf', pages: 24, sheets: 12, cost: 240, status: 'Archived' },
      { id: 'doc_invoice_march_02', title: 'Client Invoices March.xlsx', sheets: 6, cost: 60, status: 'Processed' },
      { id: 'doc_colombo_print_03', title: 'Colombo Print Order Specification.docx', pages: 8, sheets: 4, cost: 80, status: 'Completed' }
    ],
    system_logs: [
      { timestamp: '11/04/2026 10:24 AM', type: 'INFO', message: 'Windows 10 Desktop shell initialized' },
      { timestamp: '11/04/2026 10:20 AM', type: 'SYNC', message: 'Central Database snapshot hydrated' },
      { timestamp: '11/04/2026 10:15 AM', type: 'AUTH', message: 'Operator drvicvondom authenticated' }
    ],
    settings: [
      { key: 'singleSidedCost', value: '10 LKR' },
      { key: 'doubleSidedCost', value: '10 LKR' },
      { key: 'wallpaper', value: 'Windows 10 Official Hero' },
      { key: 'timeZone', value: 'Asia/Colombo (UTC+05:30)' }
    ]
  };

  return (
    <div className="flex flex-col h-full bg-[#181818] text-slate-100 font-sans select-none overflow-hidden">
      {/* 1. BROWSER ADDRESS BAR & CONTROLS */}
      <div className="h-10 bg-[#252526] border-b border-[#333333] flex items-center px-3 gap-2 text-xs shrink-0">
        <div className="flex items-center gap-1 text-slate-400">
          <button className="p-1 hover:text-white hover:bg-white/10 rounded cursor-pointer"><ArrowLeft className="w-3.5 h-3.5" /></button>
          <button className="p-1 hover:text-white hover:bg-white/10 rounded cursor-pointer"><ArrowRight className="w-3.5 h-3.5" /></button>
          <button onClick={handleRefresh} className="p-1 hover:text-white hover:bg-white/10 rounded cursor-pointer" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {/* URL Input Bar */}
        <div className="flex-1 h-7 bg-[#1c1c1c] border border-[#3b3b3b] rounded-full px-3 flex items-center gap-2 text-slate-300 text-[11px] shadow-inner">
          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="font-mono text-cyan-300 truncate">{config.projectUrl || config.url}</span>
        </div>

        {/* Action Buttons */}
        <button
          onClick={handleOpenExternal}
          className="h-7 px-3 bg-[#0078d7] hover:bg-[#1084e3] text-white font-medium rounded text-[11px] flex items-center gap-1.5 transition cursor-pointer shrink-0"
          title="Open in new browser tab"
        >
          <span>Open Live</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="h-8 bg-[#202020] border-b border-[#333333] flex items-center px-4 gap-6 text-xs shrink-0">
        <button
          onClick={() => setActiveTab('overview')}
          className={`h-full border-b-2 font-medium px-1 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'overview' ? 'border-[#0078d7] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span>Overview & Status</span>
        </button>

        <button
          onClick={() => setActiveTab('data_viewer')}
          className={`h-full border-b-2 font-medium px-1 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'data_viewer' ? 'border-[#0078d7] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>{isFirebase ? 'Firestore & Auth Viewer' : 'Cloud Resources & APIs'}</span>
        </button>

        <button
          onClick={() => setActiveTab('web_view')}
          className={`h-full border-b-2 font-medium px-1 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'web_view' ? 'border-[#0078d7] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>Web View & Link</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 jarvis-scrollbar">
        {activeTab === 'overview' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Header Hero Card */}
            <div className="p-6 rounded-2xl bg-[#222222] border border-[#383838] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="space-y-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border mb-2 uppercase tracking-wider bg-white/5 border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Personal Server Connection</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">{config.title}</h2>
                <p className="text-xs text-slate-400">{config.subtitle}</p>
                <p className="text-xs font-mono text-cyan-400 font-semibold pt-1">
                  Project ID: <span className="text-white">{config.projectId}</span>
                </p>
              </div>

              <button
                onClick={handleOpenExternal}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#0078d7] to-[#0098ff] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2.5 transition transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              >
                <span>Launch Console In New Tab</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* Services Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Cloud Services & Architecture
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {config.services.map((svc, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#222222] border border-[#383838] flex flex-col justify-between gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{svc.name}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{svc.status}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{svc.desc}</p>
                    <div className="text-[11px] font-mono text-cyan-300 pt-1 border-t border-[#333333]">
                      {svc.metric}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-4 rounded-xl bg-[#1a2332] border border-blue-500/30 text-xs text-slate-300 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <p className="font-bold text-white">Direct Authenticated Workspace</p>
                <p className="text-[11px] text-slate-400">
                  Configured with project ID <span className="text-cyan-300 font-mono">{config.projectId}</span>. Operator account: <span className="text-white font-mono">drvicvondom@gmail.com</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data_viewer' && (
          <div className="max-w-4xl mx-auto space-y-4">
            {isFirebase ? (
              <div className="space-y-4">
                {/* Collection selector */}
                <div className="flex items-center gap-2 border-b border-[#333333] pb-3 overflow-x-auto">
                  {(['documents', 'users', 'system_logs', 'settings'] as const).map(col => (
                    <button
                      key={col}
                      onClick={() => {
                        soundManager.playClickSound();
                        setSelectedCollection(col);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                        selectedCollection === col
                          ? 'bg-[#0078d7] text-white shadow'
                          : 'bg-[#252526] text-slate-400 hover:text-white'
                      }`}
                    >
                      {col.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {/* Live documents view */}
                <div className="bg-[#202020] border border-[#383838] rounded-xl p-4 overflow-x-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-[#333333] text-xs font-mono text-cyan-300">
                    <span>Collection: {selectedCollection}</span>
                    <span className="text-slate-400">{sampleFirestoreDocs[selectedCollection].length} records cached</span>
                  </div>
                  <pre className="text-xs font-mono text-slate-300 pt-3 leading-relaxed">
                    {JSON.stringify(sampleFirestoreDocs[selectedCollection], null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#202020] border border-[#383838] space-y-2">
                  <h4 className="text-sm font-bold text-white">Google Cloud Enterprise Resources</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-[#181818] border border-[#333333]">
                      <div className="text-[10px] text-slate-400 uppercase">Cloud Run Containers</div>
                      <div className="text-lg font-bold text-emerald-400">1 Active</div>
                      <div className="text-[10px] text-slate-500 font-mono">Port 3000 • Healthy</div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#181818] border border-[#333333]">
                      <div className="text-[10px] text-slate-400 uppercase">Gemini Models</div>
                      <div className="text-lg font-bold text-cyan-400">Gemini 2.5</div>
                      <div className="text-[10px] text-slate-500 font-mono">Multimodal Reasoning</div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#181818] border border-[#333333]">
                      <div className="text-[10px] text-slate-400 uppercase">Cloud Shell Terminal</div>
                      <div className="text-lg font-bold text-purple-400">Online</div>
                      <div className="text-[10px] text-slate-500 font-mono">bash 5.2 • gcloud CLI</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'web_view' && (
          <div className="max-w-2xl mx-auto text-center py-12 space-y-6">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,211,238,0.2)]">
              <Globe className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Direct Web Console Viewer</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Click below to launch the authentic Google console with your active credentials in a new full-screen window.
              </p>
              <p className="text-xs font-mono text-cyan-300">
                {config.projectUrl || config.url}
              </p>
            </div>

            <button
              onClick={handleOpenExternal}
              className="px-6 py-3.5 bg-gradient-to-r from-[#0078d7] to-[#0284c7] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl inline-flex items-center gap-2 cursor-pointer transition transform hover:scale-105 active:scale-95"
            >
              <span>Launch Live in New Tab</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
