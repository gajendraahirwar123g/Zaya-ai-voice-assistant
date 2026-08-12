import React, { useState, useEffect } from "react";
import { 
  X, 
  Smartphone, 
  Download, 
  Check, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Share2, 
  Layers, 
  Globe,
  ArrowRight
} from "lucide-react";
import { motion } from "motion/react";
import zoyaLogo from "../assets/images/zoya_app_logo_1786528123123.jpg";

interface InstallAppModalProps {
  onClose: () => void;
  deferredPrompt?: any;
}

export default function InstallAppModal({ onClose, deferredPrompt }: InstallAppModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"instant" | "apk" | "desktop">("instant");
  const [isInstalling, setIsInstalling] = useState(false);

  const appUrl = window.location.href.split("#")[0].split("?")[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      try {
        setIsInstalling(true);
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          console.log("User accepted the install prompt");
        }
      } catch (e) {
        console.error("Install prompt error", e);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Direct instructions
      setActiveTab("instant");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-[#0d0d14] border border-white/15 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-1/4 w-40 h-40 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden border border-pink-500/40 shadow-lg shadow-purple-600/30">
              <img 
                src={zoyaLogo} 
                alt="Zoya Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-1.5">
                <span>Zoya App Installation</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Android & PC
                </span>
              </h3>
              <p className="text-xs text-white/50">Install Zoya directly on your phone as an App</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-white/[0.01] px-4 pt-2">
          <button
            onClick={() => setActiveTab("instant")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
              activeTab === "instant"
                ? "border-pink-500 text-pink-400 font-semibold"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Smartphone size={14} />
            <span>1-Tap Mobile App</span>
          </button>

          <button
            onClick={() => setActiveTab("apk")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
              activeTab === "apk"
                ? "border-violet-500 text-violet-400 font-semibold"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Download size={14} />
            <span>Generate APK File</span>
          </button>

          <button
            onClick={() => setActiveTab("desktop")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
              activeTab === "desktop"
                ? "border-cyan-500 text-cyan-400 font-semibold"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Globe size={14} />
            <span>Desktop App</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === "instant" && (
            <div className="space-y-4">
              {/* Native Prompt Banner if available */}
              {deferredPrompt && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-600/30 to-pink-600/30 border border-violet-500/40 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white text-sm">Direct Install Available!</h4>
                    <p className="text-white/70 text-xs mt-0.5">Click below to add Zoya to your device instantly.</p>
                  </div>
                  <button
                    onClick={handleNativeInstall}
                    disabled={isInstalling}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-medium text-xs shadow-lg shadow-purple-600/30 hover:opacity-90 transition-all flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>Install Now</span>
                  </button>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Smartphone size={16} className="text-pink-400" />
                  <span>Android Phone par 1-Minute mein App banaye:</span>
                </h4>

                <ol className="space-y-2.5 pl-1 text-white/80 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                      1
                    </span>
                    <span>
                      Apne phone ke <strong>Google Chrome</strong> mein ye app link open karein.
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                      2
                    </span>
                    <span>
                      Chrome browser ke top-right mein <strong>3 Dots (⋮)</strong> par click karein.
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                      3
                    </span>
                    <span>
                      Menu mein <strong>"Install app"</strong> ya <strong>"Add to Home screen"</strong> par tap karein.
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                      4
                    </span>
                    <span>
                      <strong>Done!</strong> Zoya aapke Android phone ke App Drawer aur Home Screen par standalone native app ki tarah save ho jayegi!
                    </span>
                  </li>
                </ol>
              </div>

              {/* Copy App Link */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <p className="text-[11px] text-white/50 mb-1.5">App Link to open on phone:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={appUrl}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80 text-[11px] outline-none select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {copied ? <Check size={14} className="text-green-300" /> : <Copy size={14} />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "apk" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Download size={16} className="text-violet-400" />
                  <span>PWABuilder se direct APK (.apk) download karein:</span>
                </h4>

                <p className="text-white/70 text-xs">
                  Aap bina coding ke 1-minute mein Zoya ki installable <strong>.apk</strong> file generate kar sakte hain:
                </p>

                <ol className="space-y-2 text-white/80">
                  <li>1. Niche diye button se <strong>PWABuilder.com</strong> open karein.</li>
                  <li>2. Zoya ka link paste karke <strong>Start</strong> par click karein.</li>
                  <li>3. <strong>Package for Android</strong> select karke <strong>Download APK</strong> par click karein!</li>
                </ol>

                <div className="pt-2 flex flex-wrap gap-2">
                  <a
                    href="https://www.pwabuilder.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-colors"
                  >
                    <span>PWABuilder Kholo</span>
                    <ExternalLink size={13} />
                  </a>

                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs transition-colors"
                  >
                    {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    <span>{copied ? "App Link Copied" : "Copy App Link"}</span>
                  </button>
                </div>
              </div>

              {/* Developer Capacitor Option */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5">
                <span className="text-[10px] text-violet-400 uppercase font-mono tracking-wider font-semibold">
                  For Developers (Android Studio / Capacitor):
                </span>
                <p className="text-white/60 text-[11px] font-mono leading-relaxed bg-black/40 p-2.5 rounded-xl">
                  npm install @capacitor/core @capacitor/cli @capacitor/android<br />
                  npx cap init "Zoya AI" "com.gajendra.zoya" --web-dir dist<br />
                  npx cap add android && npx cap open android
                </p>
              </div>
            </div>
          )}

          {activeTab === "desktop" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Globe size={16} className="text-cyan-400" />
                  <span>PC / Laptop / Mac par App install karein:</span>
                </h4>

                <p className="text-white/80 leading-relaxed text-xs">
                  Chrome ya Edge browser mein Zoya open karein. Browser ke search bar ke right side mein <strong>Install Icon (⊕)</strong> dikhega. Us par click karke <strong>Install</strong> karein.
                </p>
                <p className="text-white/60 text-xs">
                  Zoya aapke Desktop / Start Menu mein standalone Windows/Mac app ban jayegi!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-white/50 text-[11px]">
            <Sparkles size={12} className="text-pink-400" />
            <span>Developer: Gajendra</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
