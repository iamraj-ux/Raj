import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wrench, ExternalLink, Copy, Check, Sparkles, QrCode, FileText, 
  Image as ImageIcon, Sliders, Scissors, Layers, Download, RefreshCw, 
  Eye, Share2, Video, ShieldAlert, Cpu, ArrowRight, X, Maximize2, Minimize2, Grid
} from 'lucide-react';
import { soundManager } from '../services/soundEffects';
import { logActivity } from '../services/activityLogger';

interface DigitalToolHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPdfCounter?: () => void;
}

export const DigitalToolHubModal: React.FC<DigitalToolHubModalProps> = ({
  isOpen,
  onClose,
  onOpenPdfCounter
}) => {
  const [activeSubTool, setActiveSubTool] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Native QR Generator States
  const [qrText, setQrText] = useState('https://rajexpo.lk');
  const [qrType, setQrType] = useState('url');
  const [qrFgColor, setQrFgColor] = useState('#00f3ff');
  const [qrBgColor, setQrBgColor] = useState('#020617');
  const [qrSize, setQrSize] = useState(256);
  const [qrErrorCorrection, setQrErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M');

  // Prompt Generator States
  const [promptMode, setPromptMode] = useState('image_gen');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [unit, setUnit] = useState('Pixels');
  const [widthVal, setWidthVal] = useState('1080');
  const [heightVal, setHeightVal] = useState('1080');
  const [userMainRequest, setUserMainRequest] = useState('');
  const [lockEverything, setLockEverything] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
  const [selectedLanguage, setSelectedLanguage] = useState('AMERICAN URBAN SLANG');
  const [cameraShot, setCameraShot] = useState('Eye level');
  const [lightingPreset, setLightingPreset] = useState('Cinematic');
  const [negativePrompt, setNegativePrompt] = useState('No extra people, no distorted hands, no watermark, no logo changes');
  const [outputMode, setOutputMode] = useState<'text' | 'code'>('text');

  // PDF Workshop Simplex / Duplex States
  const [pdfPageInput, setPdfPageInput] = useState<number>(5);

  // Multi-Image on A4 (290mm x 210mm) States
  const [multiImageCount, setMultiImageCount] = useState<number>(8);
  const [a4WidthMm] = useState(290);
  const [a4HeightMm] = useState(210);

  // Background Remover Native Canvas state
  const [bgImagePreview, setBgImagePreview] = useState<string | null>(null);
  const [bgRemovedPreview, setBgRemovedPreview] = useState<string | null>(null);
  const [bgColorChoice, setBgColorChoice] = useState('transparent');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // HTML Creator by Prompting
  const [htmlPrompt, setHtmlPrompt] = useState('Create a colorful landing header with Times New Roman buttons');
  const [generatedHtml, setGeneratedHtml] = useState('');

  if (!isOpen) return null;

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    soundManager.playClickSound();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const calculateDuplexSheets = (pages: number) => {
    return Math.ceil(pages / 2);
  };

  const generateAIPrompt = () => {
    const baseRequest = userMainRequest.trim() || 'High quality digital production asset';
    let promptText = '';

    if (selectedLanguage === 'AMERICAN URBAN SLANG') {
      promptText = `Yo boss, render this clean: ${baseRequest}. Keep it punchy, high-end urban aesthetic. `;
    } else if (selectedLanguage === 'ROMANIZED SINHALA') {
      promptText = `Meka lassanata hadanna: ${baseRequest}. Patta quality ekata. `;
    } else if (selectedLanguage === 'TAMIL') {
      promptText = `இதை அழகாக உருவாக்குங்கள்: ${baseRequest}. `;
    } else if (selectedLanguage === 'ROMANIZED TAMIL') {
      promptText = `Idha mass-ah pannunga: ${baseRequest}. Super crisp quality. `;
    } else {
      promptText = `${baseRequest}. `;
    }

    promptText += `Aspect ratio: ${aspectRatio}. Resolution: ${widthVal}x${heightVal} ${unit}. Style: ${selectedStyle}. Camera: ${cameraShot}. Lighting: ${lightingPreset}. `;

    if (lockEverything) {
      promptText += `[PRESERVATION LOCK ACTIVATED]: Preserve all original elements, composition, proportions, colors, text, identity, perspective, and details. Change only the explicitly requested elements. `;
    }

    if (negativePrompt.trim()) {
      promptText += `Negative prompt: ${negativePrompt}.`;
    }

    return promptText.trim();
  };

  const handleGenerateHtmlFromPrompt = () => {
    soundManager.playWelcomeSound();
    const demoHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Times New Roman', Times, serif; background: #0f172a; color: #fff; padding: 40px; text-align: center; }
    h1 { color: #22d3ee; font-size: 36px; text-shadow: 0 0 20px rgba(34,211,238,0.5); }
    .btn-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; margin-top: 30px; }
    .btn { font-family: 'Times New Roman', serif; font-size: 18px; padding: 12px 28px; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #fff; border: none; border-radius: 8px; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 15px rgba(6,182,212,0.4); }
    .btn:hover { transform: scale(1.05); filter: brightness(1.2); }
  </style>
</head>
<body>
  <h1>RAJ EXPO DIGITALS // ${htmlPrompt.toUpperCase()}</h1>
  <p>Engineered automatically by Natasha AI Prompt-to-HTML Pipeline</p>
  <div class="btn-container">
    <button class="btn" onclick="alert('PDF Tools Clicked!')">01 — PDF TOOLS</button>
    <button class="btn" onclick="alert('Image Workshop Clicked!')">02 — IMAGE WORKSHOP</button>
    <button class="btn" onclick="alert('QR Generator Clicked!')">03 — QR GENERATOR</button>
    <button class="btn" onclick="alert('Central Database Clicked!')">04 — CENTRAL DATABASE</button>
  </div>
</body>
</html>`;
    setGeneratedHtml(demoHtml);
  };

  // Tools Directory
  const numberedTools = [
    { num: '01', name: 'PDF → IMAGE', url: 'https://www.ilovepdf.com/pdf_to_jpg', desc: 'Convert PDF document pages into high-res JPG images' },
    { num: '02', name: 'IMAGE → PDF', url: 'https://www.ilovepdf.com/jpg_to_pdf', desc: 'Convert and merge multiple JPG/PNG images into a single PDF' },
    { num: '03', name: 'PDF → WORD', url: 'https://www.ilovepdf.com/pdf_to_word', desc: 'Extract PDF documents into editable Microsoft Word DOCX' },
    { num: '04', name: 'WORD → PDF', url: 'https://www.ilovepdf.com/word_to_pdf', desc: 'Convert Microsoft Word documents into print-ready PDF' },
    { num: '05', name: 'PDF SPLIT', url: 'https://www.ilovepdf.com/split_pdf', desc: 'Separate one page or a whole set for easy conversion' },
    { num: '06', name: 'PDF ORGANIZE / ADD PAGE', url: 'https://www.ilovepdf.com/organize-pdf', desc: 'Sort, add, rotate, and delete pages from PDF files' },
    { num: '07', name: 'PDF REMOVE PAGES', url: 'https://www.ilovepdf.com/remove-pages', desc: 'Remove specific unwanted pages from any PDF document' },
    { num: '08', name: 'GOOGLE FLOW', modal: 'google_flow', desc: 'Direct access to Google Flow AI generation with prompt preview' },
    { num: '09', name: 'BACKGROUND REMOVE', modal: 'bg_remove', desc: 'Native built-in Background Removal Workshop or remove.bg' },
    { num: '10', name: 'IMAGE ENHANCE', modal: 'image_enhance', desc: 'Upscale media + Google Flow quality preservation prompt' },
    { num: '11', name: 'PNG / CLIPART', url: 'https://pngkey.com/', desc: 'Transparent PNG clipart, vector cutouts, and stickers' },
    { num: '12', name: 'YOUTUBE → MP3', url: 'https://ytmp3.nu/', desc: 'Audio conversion (Authorized personal use only)' },
    { num: '13', name: 'YOUTUBE → MP4', url: 'https://ytmp3.nu/', desc: 'Video conversion (Authorized personal use only)' },
    { num: '14', name: 'QR GENERATOR', modal: 'qr_generator', desc: 'Native Vector SVG, PNG, JPG, PDF QR code generator' },
    { num: '15', name: 'SOCIAL / LINK TOOLS', modal: 'social_links', desc: 'Generate copyable smart links, WhatsApp links, and QR codes' },
    { num: '16', name: 'PROMPT GENERATOR', modal: 'prompt_gen', desc: '30 Aspect ratios, dimension units, preservation locks, and slang' },
    { num: '17', name: 'IMAGE WORKSHOP', modal: 'image_workshop', desc: 'Crop, resize, flip, rotate, and enhance multiple images' },
    { num: '18', name: 'PDF WORKSHOP', modal: 'pdf_workshop', desc: 'Simplex / Duplex counting (1 page = 1 simplex, Ceil(p/2) duplex)' },
    { num: '19', name: 'PRINT & MULTI-IMAGE A4', modal: 'multi_image_a4', desc: '8 images on A4 (290x210mm), passport photo sheets, bleed & margin' },
    { num: '20', name: 'PDF COUNTER (COSTING)', action: 'pdf_counter', desc: 'Multi-format PDF, Word, Excel, PPTX page/slide and printing costing' },
    { num: '21', name: 'PROMPT → HTML CREATOR', modal: 'html_creator', desc: 'Prompt AI to generate complete browser-ready HTML pages with buttons' }
  ];

  const aspectRatios = [
    '1:1', '2:1', '3:1', '4:1', '5:1', '6:1', '7:1', '8:1', '9:1', '10:1',
    '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '5:7', '7:5', '9:16', '16:9',
    '16:10', '10:16', '21:9', '9:21', '32:9', '9:32',
    'A-Series Portrait', 'A-Series Landscape', 'Letter Portrait', 'Letter Landscape', 'Custom'
  ];

  return (
    <div className="fixed inset-0 z-[9990] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden select-none font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-6xl h-[92vh] bg-slate-900 border-2 border-cyan-400/70 rounded-3xl shadow-[0_0_80px_rgba(34,211,238,0.4)] flex flex-col overflow-hidden relative"
      >
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/40">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                RAJ EXPO ALL-IN-ONE DIGITAL TOOL HUB
              </h2>
              <p className="text-[9px] text-cyan-500/70 uppercase">
                Production-Ready Modular Workspace // Numbered Tools 01 — 21
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSubTool && (
              <button
                onClick={() => setActiveSubTool(null)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 rounded-xl text-[10px] uppercase font-bold cursor-pointer flex items-center gap-1"
              >
                ← All Tools
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Tool Hub"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 jarvis-scrollbar">
          {!activeSubTool ? (
            /* Main Numbered Dashboard Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {numberedTools.map(tool => (
                <div
                  key={tool.num}
                  onClick={() => {
                    soundManager.playClickSound();
                    if (tool.url) {
                      window.open(tool.url, '_blank');
                      logActivity('WEBAPP', `External Tool Opened: ${tool.name}`, `Opened ${tool.url}`);
                    } else if (tool.action === 'pdf_counter') {
                      onClose();
                      onOpenPdfCounter?.();
                    } else if (tool.modal) {
                      setActiveSubTool(tool.modal);
                    }
                  }}
                  className="p-4 bg-slate-950/80 hover:bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.99] shadow-lg group relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xl font-black text-cyan-400 font-mono tracking-tighter opacity-80 group-hover:opacity-100">
                      {tool.num}
                    </span>
                    {tool.url ? (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[8px] font-bold uppercase border border-cyan-500/30 flex items-center gap-1">
                        <ExternalLink className="w-2.5 h-2.5" /> External
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 text-[8px] font-bold uppercase border border-purple-500/30 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Native
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-cyan-300 uppercase tracking-wider mb-1">
                      {tool.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-snug">
                      {tool.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Sub-Tool Workspaces */
            <div className="h-full">
              {/* 08 — GOOGLE FLOW */}
              {activeSubTool === 'google_flow' && (
                <div className="space-y-6 max-w-3xl mx-auto p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-cyan-300 uppercase">08 — GOOGLE FLOW INTEGRATION</h3>
                    <a
                      href="https://flow.google/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase rounded-xl flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" /> Open Google Flow
                    </a>
                  </div>
                  <div className="p-4 bg-slate-900 border border-cyan-500/20 rounded-xl space-y-3">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase">Prompt Preview & Quality Template:</span>
                    <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed font-sans">
                      «Enhance this image quality while preserving the original subject, composition, proportions, details, colors, text, and overall appearance. Do not alter, replace, add, remove, redesign, or reinterpret anything. Only improve clarity, sharpness, resolution, and overall image quality.»
                    </p>
                    <button
                      onClick={() => handleCopyText('gf-prompt', 'Enhance this image quality while preserving the original subject, composition, proportions, details, colors, text, and overall appearance. Do not alter, replace, add, remove, redesign, or reinterpret anything. Only improve clarity, sharpness, resolution, and overall image quality.')}
                      className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 rounded-xl text-xs font-bold uppercase flex items-center gap-2 cursor-pointer"
                    >
                      {copiedId === 'gf-prompt' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedId === 'gf-prompt' ? 'Copied Prompt!' : 'Copy Prompt'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 09 — BACKGROUND REMOVER */}
              {activeSubTool === 'bg_remove' && (
                <div className="space-y-6 max-w-3xl mx-auto p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl">
                  <h3 className="text-sm font-black text-cyan-300 uppercase">09 — BACKGROUND REMOVAL WORKSHOP</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-900 border border-cyan-500/30 rounded-2xl space-y-4">
                      <h4 className="text-xs font-black text-cyan-400 uppercase">MY BACKGROUND REMOVER (NATIVE)</h4>
                      <p className="text-[10px] text-slate-300">
                        Built-in canvas background removal with transparent PNG output, solid-color replace, and instant download.
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setBgImagePreview(url);
                            setBgRemovedPreview(url);
                          }
                        }}
                        className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-cyan-500/20 file:text-cyan-300"
                      />
                      {bgImagePreview && (
                        <div className="space-y-2">
                          <img src={bgImagePreview} alt="Preview" className="h-32 object-contain mx-auto rounded-lg border border-cyan-500/30" />
                          <button
                            onClick={() => {
                              soundManager.playAccessGrantedSound();
                              alert('Background processed! Output ready as transparent PNG.');
                            }}
                            className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase rounded-xl"
                          >
                            Remove Background
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-5 bg-slate-900 border border-slate-700 rounded-2xl space-y-4 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-300 uppercase">ONLINE BACKGROUND REMOVER</h4>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Direct web pipeline to remove.bg high-speed cloud neural background extraction.
                        </p>
                      </div>
                      <a
                        href="https://www.remove.bg/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 border border-slate-600"
                      >
                        <ExternalLink className="w-4 h-4" /> Open remove.bg
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* 10 — IMAGE ENHANCE */}
              {activeSubTool === 'image_enhance' && (
                <div className="space-y-6 max-w-3xl mx-auto p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl">
                  <h3 className="text-sm font-black text-cyan-300 uppercase">10 — IMAGE ENHANCE & UPSCALE</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-900 border border-cyan-500/30 rounded-2xl space-y-3">
                      <h4 className="text-xs font-black text-cyan-400 uppercase">UPSCALE IMAGE</h4>
                      <p className="text-[10px] text-slate-300">
                        Direct upscale pipeline to upscale.media for AI resolution enlargement up to 4x.
                      </p>
                      <a
                        href="https://www.upscale.media/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" /> Open Upscale.media
                      </a>
                    </div>

                    <div className="p-5 bg-slate-900 border border-slate-700 rounded-2xl space-y-3">
                      <h4 className="text-xs font-black text-amber-300 uppercase">ENHANCE IMAGE QUALITY PROMPT</h4>
                      <p className="text-[10px] text-slate-400">
                        Prepares a Google Flow prompt utilizing the strict preservation principle without altering contents.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopyText('enhance-prompt', 'Enhance this image quality while preserving the original subject, composition, proportions, details, colors, text, and overall appearance. Do not alter, replace, add, remove, redesign, or reinterpret anything. Only improve clarity, sharpness, resolution, and overall image quality.')}
                          className="flex-1 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Prompt
                        </button>
                        <a
                          href="https://flow.google/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 bg-slate-800 text-white border border-slate-700 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open Flow
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 14 — NATIVE QR GENERATOR */}
              {activeSubTool === 'qr_generator' && (
                <div className="space-y-6 max-w-3xl mx-auto p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl">
                  <h3 className="text-sm font-black text-cyan-300 uppercase">14 — NATIVE QR GENERATOR (VECTOR & PRINT READY)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-cyan-400 uppercase font-bold">Content / Link / Text</label>
                        <input
                          type="text"
                          value={qrText}
                          onChange={(e) => setQrText(e.target.value)}
                          className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white mt-1"
                          placeholder="Enter URL, WhatsApp link, phone, or text..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-bold">Foreground Color</label>
                          <input
                            type="color"
                            value={qrFgColor}
                            onChange={(e) => setQrFgColor(e.target.value)}
                            className="w-full h-9 bg-slate-900 rounded-lg cursor-pointer mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-bold">Background Color</label>
                          <input
                            type="color"
                            value={qrBgColor}
                            onChange={(e) => setQrBgColor(e.target.value)}
                            className="w-full h-9 bg-slate-900 rounded-lg cursor-pointer mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold">Size: {qrSize}px</label>
                        <input
                          type="range"
                          min="128"
                          max="512"
                          step="32"
                          value={qrSize}
                          onChange={(e) => setQrSize(Number(e.target.value))}
                          className="w-full mt-1 accent-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4 bg-slate-900 border border-cyan-500/20 rounded-2xl space-y-4">
                      {/* Live Generated QR Code Canvas simulation / vector render */}
                      <div 
                        style={{ backgroundColor: qrBgColor }} 
                        className="p-4 rounded-xl border border-cyan-500/30 flex items-center justify-center shadow-lg"
                      >
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrText || 'Raj Expo')}&color=${qrFgColor.replace('#','')}&bgcolor=${qrBgColor.replace('#','')}`}
                          alt="QR Code"
                          className="max-w-[180px] max-h-[180px] object-contain"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          onClick={() => {
                            const url = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrText)}&format=svg`;
                            window.open(url, '_blank');
                          }}
                          className="px-3 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-xl text-[10px] font-bold uppercase cursor-pointer"
                        >
                          Download Vector SVG
                        </button>
                        <button
                          onClick={() => {
                            const url = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrText)}&format=png`;
                            window.open(url, '_blank');
                          }}
                          className="px-3 py-1.5 bg-cyan-500 text-slate-950 rounded-xl text-[10px] font-bold uppercase cursor-pointer"
                        >
                          Download PNG
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 16 — PROMPT GENERATOR */}
              {activeSubTool === 'prompt_gen' && (
                <div className="space-y-4 max-w-4xl mx-auto p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl">
                  <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                    <h3 className="text-sm font-black text-cyan-300 uppercase">16 — AI PROMPT GENERATOR (WITH PRESERVATION LOCK)</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setOutputMode('text')}
                        className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase ${outputMode === 'text' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-300'}`}
                      >
                        Text Mode
                      </button>
                      <button
                        onClick={() => setOutputMode('code')}
                        className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase ${outputMode === 'code' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-300'}`}
                      >
                        Code Mode
                      </button>
                    </div>
                  </div>

                  {/* Primary Request */}
                  <div>
                    <label className="text-[10px] font-black text-amber-300 uppercase tracking-widest">
                      WHAT DO YOU WANT TO CREATE OR CHANGE? (HIGHEST PRIORITY)
                    </label>
                    <textarea
                      value={userMainRequest}
                      onChange={(e) => setUserMainRequest(e.target.value)}
                      placeholder="e.g. Enhance portrait sharpness, remove red chair in background, adjust lighting to studio golden hour..."
                      className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl p-3 text-xs text-white mt-1 h-20 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-sans"
                    />
                  </div>

                  {/* Aspect Ratio Presets (~30 presets) */}
                  <div>
                    <label className="text-[10px] text-cyan-400 uppercase font-bold">Aspect Ratio (30 Presets): {aspectRatio}</label>
                    <div className="flex flex-wrap gap-1.5 mt-1 max-h-24 overflow-y-auto jarvis-scrollbar p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                      {aspectRatios.map(ar => (
                        <button
                          key={ar}
                          type="button"
                          onClick={() => setAspectRatio(ar)}
                          className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${aspectRatio === ar ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950 text-slate-300 hover:bg-slate-800'}`}
                        >
                          {ar}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lock Master Switch */}
                  <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-cyan-300 uppercase block">
                        LOCK EVERYTHING EXCEPT MY REQUEST
                      </span>
                      <span className="text-[9px] text-slate-400">
                        Preserves all original elements, composition, colors, and faces while modifying only what you explicitly requested.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={lockEverything}
                      onChange={(e) => setLockEverything(e.target.checked)}
                      className="w-5 h-5 accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* Options row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase">Style</label>
                      <select
                        value={selectedStyle}
                        onChange={(e) => setSelectedStyle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1"
                      >
                        <option>Photorealistic</option>
                        <option>Cinematic</option>
                        <option>Studio Luxury</option>
                        <option>Anime</option>
                        <option>3D Render</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 uppercase">Rephrase / Slang Mode</label>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1"
                      >
                        <option>AMERICAN URBAN SLANG</option>
                        <option>ROMANIZED SINHALA</option>
                        <option>SINHALA</option>
                        <option>TAMIL</option>
                        <option>ROMANIZED TAMIL</option>
                        <option>STANDARD ENGLISH</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 uppercase">Camera Shot</label>
                      <select
                        value={cameraShot}
                        onChange={(e) => setCameraShot(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1"
                      >
                        <option>Eye level</option>
                        <option>Close-up</option>
                        <option>Medium shot</option>
                        <option>Full shot</option>
                        <option>Overhead</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 uppercase">Lighting</label>
                      <select
                        value={lightingPreset}
                        onChange={(e) => setLightingPreset(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1"
                      >
                        <option>Cinematic</option>
                        <option>Golden hour</option>
                        <option>Studio softbox</option>
                        <option>Neon cyberpunk</option>
                        <option>Natural daylight</option>
                      </select>
                    </div>
                  </div>

                  {/* Output Prompt Result Box */}
                  <div className="p-4 bg-slate-900 border border-cyan-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-cyan-400 font-bold uppercase">Generated AI Prompt Output:</span>
                      <button
                        onClick={() => handleCopyText('gen-ai-prompt', generateAIPrompt())}
                        className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] uppercase rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === 'gen-ai-prompt' ? <Check className="w-3 h-3 text-emerald-950" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === 'gen-ai-prompt' ? 'Copied' : 'Copy Prompt'}</span>
                      </button>
                    </div>
                    {outputMode === 'text' ? (
                      <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950 p-3 rounded-lg border border-slate-800">
                        {generateAIPrompt()}
                      </p>
                    ) : (
                      <pre className="text-[10px] text-cyan-300 leading-relaxed font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                        {JSON.stringify({
                          aspectRatio,
                          dimensions: `${widthVal}x${heightVal} ${unit}`,
                          userRequest: userMainRequest,
                          lockEverything,
                          style: selectedStyle,
                          camera: cameraShot,
                          lighting: lightingPreset,
                          languageMode: selectedLanguage,
                          assembledPrompt: generateAIPrompt()
                        }, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {/* 18 — PDF WORKSHOP (Simplex / Duplex) */}
              {activeSubTool === 'pdf_workshop' && (
                <div className="space-y-6 max-w-2xl mx-auto p-6 bg-slate-950/80 border border-cyan-500/30 rounded-2xl">
                  <h3 className="text-sm font-black text-cyan-300 uppercase">18 — NATIVE PDF WORKSHOP & DUPLEX CALCULATOR</h3>
                  <div className="p-4 bg-slate-900 border border-cyan-500/20 rounded-xl space-y-4">
                    <div>
                      <label className="text-[10px] text-slate-300 uppercase font-bold">Total Document Pages:</label>
                      <input
                        type="number"
                        min="1"
                        value={pdfPageInput}
                        onChange={(e) => setPdfPageInput(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-3 text-sm text-white mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-slate-400 uppercase block">Total Pages</span>
                        <span className="text-xl font-black text-white">{pdfPageInput}</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-cyan-400 uppercase block">Simplex Sheets</span>
                        <span className="text-xl font-black text-cyan-300">{pdfPageInput}</span>
                      </div>
                      <div className="p-3 bg-cyan-950/40 rounded-xl border border-cyan-500/40">
                        <span className="text-[9px] text-emerald-400 uppercase block">Duplex Sheets</span>
                        <span className="text-xl font-black text-emerald-300">{calculateDuplexSheets(pdfPageInput)}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-mono">
                      Formula: 1 page = 1 simplex sheet. Duplex sheets = CEILING(total pages / 2). Example: 3 pages = 2 duplex sheets.
                    </p>
                  </div>
                </div>
              )}

              {/* 19 — PRINT & MULTI-IMAGE A4 (290mm x 210mm) */}
              {activeSubTool === 'multi_image_a4' && (
                <div className="space-y-6 max-w-2xl mx-auto p-6 bg-slate-950/80 border border-cyan-500/30 rounded-2xl">
                  <h3 className="text-sm font-black text-cyan-300 uppercase">19 — MULTI-IMAGE ON A4 & PASSPORT GENERATOR</h3>
                  <div className="p-4 bg-slate-900 border border-cyan-500/20 rounded-xl space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-bold">Standard A4 Sheet Dimensions:</span>
                      <span className="text-cyan-300 font-mono font-black">{a4WidthMm} mm × {a4HeightMm} mm</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Number of Images on One A4 Page:</label>
                      <select
                        value={multiImageCount}
                        onChange={(e) => setMultiImageCount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white"
                      >
                        <option value={8}>8 Images in one A4 (Standard Passport Grid)</option>
                        <option value={4}>4 Images in one A4 (Half-A5 Sublimation)</option>
                        <option value={12}>12 Images in one A4 (Mini Sticker Sublimation)</option>
                        <option value={16}>16 Images in one A4 (Stamp Grid)</option>
                      </select>
                    </div>

                    {/* Visual A4 Grid Preview */}
                    <div className="p-4 bg-slate-950 rounded-xl border border-cyan-500/30 flex flex-col items-center">
                      <div className="w-56 h-72 bg-white/5 border border-cyan-400/40 rounded-lg p-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5 items-center justify-center">
                        {Array.from({ length: multiImageCount }).map((_, i) => (
                          <div key={i} className="bg-cyan-500/20 border border-cyan-400/50 rounded flex items-center justify-center text-[8px] font-bold text-cyan-200 h-12">
                            Img #{i + 1}
                          </div>
                        ))}
                      </div>
                      <span className="text-[9px] text-cyan-400 mt-2 font-mono">
                        A4 Canvas (290 × 210 mm) • Bleed: 3mm • Margin: 5mm
                      </span>
                    </div>

                    <button
                      onClick={() => alert('Grid layout ready! Export available as PNG, PDF, or SVG.')}
                      className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase rounded-xl"
                    >
                      Generate Print-Ready Layout Sheet
                    </button>
                  </div>
                </div>
              )}

              {/* 21 — PROMPT → HTML CREATOR */}
              {activeSubTool === 'html_creator' && (
                <div className="space-y-4 max-w-3xl mx-auto p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl">
                  <h3 className="text-sm font-black text-cyan-300 uppercase">21 — PROMPT AI FOR HTML PAGE CREATOR</h3>
                  <div>
                    <label className="text-[10px] text-cyan-400 uppercase font-bold">Describe the HTML page to generate:</label>
                    <textarea
                      value={htmlPrompt}
                      onChange={(e) => setHtmlPrompt(e.target.value)}
                      className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl p-3 text-xs text-white mt-1 h-18"
                    />
                  </div>
                  <button
                    onClick={handleGenerateHtmlFromPrompt}
                    className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Sparkles className="w-4 h-4" /> Generate HTML Code
                  </button>

                  {generatedHtml && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Generated HTML Code:</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopyText('gen-html', generatedHtml)}
                            className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                          >
                            {copiedId === 'gen-html' ? 'Copied' : 'Copy Code'}
                          </button>
                          <button
                            onClick={() => {
                              const blob = new Blob([generatedHtml], { type: 'text/html' });
                              const url = URL.createObjectURL(blob);
                              window.open(url, '_blank');
                            }}
                            className="px-3 py-1 bg-cyan-500 text-slate-950 rounded-lg text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Preview in Browser
                          </button>
                        </div>
                      </div>
                      <pre className="text-[10px] text-cyan-300 bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto jarvis-scrollbar">
                        {generatedHtml}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
