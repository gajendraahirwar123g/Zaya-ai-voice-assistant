import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Mic, 
  MicOff, 
  Loader2, 
  Volume2, 
  VolumeX, 
  Keyboard, 
  Send, 
  MessageSquare, 
  Sparkles, 
  Radio,
  Flame,
  Laugh,
  HelpCircle,
  Music,
  Smartphone,
  Download
} from "lucide-react";
import { getZoyaResponse, getZoyaAudio, resetZoyaSession } from "./services/geminiService";
import { processCommand } from "./services/commandService";
import { LiveSessionManager } from "./services/liveService";
import Visualizer from "./components/Visualizer";
import PermissionModal from "./components/PermissionModal";
import ChatPanel from "./components/ChatPanel";
import UserProfileModal from "./components/UserProfileModal";
import InstallAppModal from "./components/InstallAppModal";
import { playPCM, speakWithBrowserTTS } from "./utils/audioUtils";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage, AppState, UserProfile } from "./types";
import zoyaLogo from "./assets/images/zoya_app_logo_1786528123123.jpg";

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [viewMode, setViewMode] = useState<"orb" | "chat">("orb");
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // User Profile (Creator: Gajendra)
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("zoya_user_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse user profile", e);
      }
    }
    return {
      name: "Gajendra",
      email: "gajendraahirwar123g@gmail.com",
      role: "creator",
      isSignedIn: true,
    };
  });

  useEffect(() => {
    localStorage.setItem("zoya_user_profile", JSON.stringify(user));
  }, [user]);

  // Chat Messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("zoya_chat_history_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [];
  });
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
    localStorage.setItem("zoya_chat_history_v2", JSON.stringify(messages));
  }, [messages]);

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.isMuted = isMuted;
    }
  }, [isMuted]);

  const [showQuickTextInput, setShowQuickTextInput] = useState(false);
  const [quickTextInput, setQuickTextInput] = useState("");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const liveSessionRef = useRef<LiveSessionManager | null>(null);

  const handleSendMessage = useCallback(async (finalTranscript: string) => {
    if (!finalTranscript.trim()) {
      setAppState("idle");
      return;
    }

    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`,
      sender: "user",
      text: finalTranscript.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    
    // If live voice session is active, send text through it
    if (isSessionActive && liveSessionRef.current) {
      liveSessionRef.current.sendText(finalTranscript);
      return;
    }

    setAppState("processing");

    // 1. Check for browser & instant smart commands
    const commandResult = processCommand(finalTranscript, user.name);
    let responseText = "";

    if (commandResult.action) {
      responseText = commandResult.action;
      const zoyaMsg: ChatMessage = {
        id: `${Date.now()}-z`,
        sender: "zoya",
        text: responseText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, zoyaMsg]);
      
      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getZoyaAudio(responseText);
        if (audioBase64) {
          await playPCM(audioBase64);
        } else {
          await speakWithBrowserTTS(responseText);
        }
      }

      setAppState("idle");

      if (commandResult.isBrowserAction && commandResult.url) {
        setTimeout(() => {
          window.open(commandResult.url, "_blank");
        }, 1200);
      }
    } else {
      // 2. General Chit-Chat via Gemini
      responseText = await getZoyaResponse(finalTranscript, messagesRef.current, user.name);
      const zoyaMsg: ChatMessage = {
        id: `${Date.now()}-z`,
        sender: "zoya",
        text: responseText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, zoyaMsg]);
      
      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getZoyaAudio(responseText);
        if (audioBase64) {
          await playPCM(audioBase64);
        } else {
          await speakWithBrowserTTS(responseText);
        }
      }
      setAppState("idle");
    }
  }, [isMuted, isSessionActive, user.name]);

  useEffect(() => {
    return () => {
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = async () => {
    if (isSessionActive) {
      setIsSessionActive(false);
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
        liveSessionRef.current = null;
      }
      setAppState("idle");
      resetZoyaSession();
    } else {
      try {
        setIsSessionActive(true);
        resetZoyaSession();
        
        const session = new LiveSessionManager();
        session.isMuted = isMuted;
        liveSessionRef.current = session;
        
        session.onStateChange = (state) => {
          setAppState(state);
        };
        
        session.onMessage = (sender, text) => {
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${sender}-${Math.random().toString(36).substr(2, 4)}`,
              sender,
              text,
              timestamp: Date.now(),
            },
          ]);
        };
        
        session.onCommand = (url) => {
          setTimeout(() => {
            window.open(url, "_blank");
          }, 1000);
        };

        await session.start();
      } catch (e) {
        console.error("Failed to start session", e);
        setShowPermissionModal(true);
        setIsSessionActive(false);
        setAppState("idle");
      }
    }
  };

  const handleQuickTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTextInput.trim()) return;
    handleSendMessage(quickTextInput);
    setQuickTextInput("");
    setShowQuickTextInput(false);
  };

  const handleClearMessages = () => {
    setMessages([]);
    localStorage.removeItem("zoya_chat_history_v2");
    resetZoyaSession();
  };

  const latestZoyaMessage = messages.filter(m => m.sender === "zoya").slice(-1)[0];

  return (
    <div className="h-[100dvh] w-screen bg-[#050508] text-white flex flex-col items-center justify-between font-sans relative overflow-hidden m-0 p-0 select-none">
      {/* Microphone Permission Modal */}
      {showPermissionModal && (
        <PermissionModal onClose={() => setShowPermissionModal(false)} />
      )}

      {/* User Profile / Google Sign-in Modal */}
      {showProfileModal && (
        <UserProfileModal 
          user={user} 
          onUpdateUser={setUser} 
          onClose={() => setShowProfileModal(false)}
          onOpenInstall={() => setShowInstallModal(true)}
        />
      )}

      {/* App Install / APK Modal */}
      {showInstallModal && (
        <InstallAppModal 
          onClose={() => setShowInstallModal(false)}
          deferredPrompt={deferredPrompt}
        />
      )}

      {/* Atmospheric Cinematic Gradients */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] bg-violet-900/25 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[60%] bg-pink-900/25 blur-[140px] rounded-full" />
        <div className="absolute top-[40%] right-[20%] w-[35%] h-[35%] bg-cyan-900/15 blur-[120px] rounded-full" />
      </div>

      {/* Top Application Header */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center z-30 shrink-0 px-4 md:px-8 py-3.5 md:py-5 border-b border-white/5 bg-black/20 backdrop-blur-md">
        {/* Brand & Creator Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-pink-500/40 shadow-lg shadow-purple-600/30 bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center">
              <img 
                src={zoyaLogo} 
                alt="Zoya AI Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {isSessionActive && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-medium tracking-wide leading-tight text-white flex items-center gap-1.5">
                <span>Zoya</span>
                <span className="text-[11px] font-normal text-violet-300 px-1.5 py-0.2 rounded bg-violet-500/20 border border-violet-500/30">AI Voice</span>
              </h1>
            </div>
            <p className="text-[11px] tracking-wider uppercase text-white/50 font-mono flex items-center gap-1">
              <Sparkles size={10} className="text-pink-400" /> Creator: {user.name}
            </p>
          </div>
        </div>

        {/* Center Mode Switcher */}
        <div className="hidden sm:flex items-center p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <button
            onClick={() => {
              setViewMode("orb");
              setIsChatDrawerOpen(false);
            }}
            className={`
              flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all
              ${
                viewMode === "orb" && !isChatDrawerOpen
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }
            `}
          >
            <Radio size={14} />
            <span>Voice Orb</span>
          </button>
          <button
            onClick={() => setViewMode("chat")}
            className={`
              flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all
              ${
                viewMode === "chat"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }
            `}
          >
            <MessageSquare size={14} />
            <span>Zoya Responses</span>
            {messages.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-pink-500 text-[10px] text-white flex items-center justify-center font-mono">
                {messages.length > 99 ? "99+" : messages.length}
              </span>
            )}
          </button>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Install App / APK Button */}
          <button
            id="header-install-app-btn"
            onClick={() => setShowInstallModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/40 text-xs text-pink-300 font-medium transition-all shadow-md shadow-pink-500/10"
            title="Install Zoya as Android / PC App"
          >
            <Smartphone size={13} className="text-pink-400" />
            <span className="hidden sm:inline">Install App</span>
          </button>

          {/* Mobile Chat Toggle */}
          <button
            id="header-chat-toggle-btn"
            onClick={() => {
              if (viewMode === "chat") {
                setViewMode("orb");
              } else {
                setIsChatDrawerOpen(!isChatDrawerOpen);
              }
            }}
            className={`
              flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all
              ${
                isChatDrawerOpen || viewMode === "chat"
                  ? "bg-violet-600 border-violet-500 text-white shadow-md"
                  : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
              }
            `}
          >
            <MessageSquare size={14} />
            <span>Chat</span>
            {messages.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-pink-500 text-[9px] text-white flex items-center justify-center font-mono">
                {messages.length}
              </span>
            )}
          </button>

          {/* User Profile / Google Login Button */}
          <button
            id="google-profile-btn"
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-xs text-white/80 hover:text-white"
            title="Google Account & Profile"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:inline font-medium text-xs truncate max-w-[90px]">
              {user.name}
            </span>
          </button>

          {/* Mute Toggle */}
          <button
            id="header-mute-btn"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-white/70 hover:text-white"
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </header>

      {/* Main Interactive Stage */}
      {viewMode === "orb" ? (
        <div className="relative w-full h-full flex flex-col justify-between items-center overflow-hidden">
          {/* Main Voice Visualizer Stage */}
          <main className="absolute inset-0 flex flex-row items-center justify-between w-full h-full z-10 overflow-hidden pt-20 pb-36 px-4 md:px-12 pointer-events-none">
            {/* Left Column: Zoya Status */}
            <div className="flex w-[32%] lg:w-[25%] h-full flex-col justify-center gap-4 z-10">
              <div className="h-8">
                <AnimatePresence>
                  {appState === "processing" && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-2 text-cyan-300 text-sm md:text-base font-medium"
                    >
                      <Loader2 size={18} className="animate-spin text-cyan-400" />
                      <span>Zoya replying...</span>
                    </motion.div>
                  )}
                  {appState === "speaking" && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-2 text-pink-300 text-sm md:text-base font-medium"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse" />
                      <span>Zoya speaking...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Center Visualizer */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <Visualizer state={appState} />
            </div>

            {/* Right Column: User Status & Latest Response Snippet */}
            <div className="flex w-[32%] lg:w-[25%] h-full flex-col justify-center items-end gap-4 z-10 pointer-events-auto">
              <div className="h-8 flex justify-end">
                <AnimatePresence>
                  {appState === "listening" && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-2 text-violet-300 text-sm md:text-base font-medium"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-ping" />
                      <span>Listening...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Latest Zoya Response Bubble on Orb view */}
              {latestZoyaMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setViewMode("chat")}
                  className="cursor-pointer max-w-xs text-right p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 backdrop-blur-xl transition-all shadow-xl group flex flex-col items-end"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-pink-400 font-mono flex items-center gap-1">
                      <Sparkles size={11} /> Zoya's Latest Reply
                    </span>
                    <img
                      src={zoyaLogo}
                      alt="Zoya"
                      className="w-5 h-5 rounded-full object-cover border border-pink-400/40"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-xs text-white/90 line-clamp-3 leading-relaxed font-sans">
                    "{latestZoyaMessage.text}"
                  </p>
                  <span className="text-[10px] text-violet-300 group-hover:underline mt-1 inline-block">
                    View in Chat Space →
                  </span>
                </motion.div>
              )}
            </div>
          </main>

          {/* Quick Floating Chat Drawer (Slide-out on Orb view) */}
          <AnimatePresence>
            {isChatDrawerOpen && (
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="absolute inset-x-3 bottom-24 top-20 z-40 md:inset-x-auto md:right-8 md:w-[450px] md:bottom-28 md:top-24 shadow-2xl"
              >
                <ChatPanel
                  messages={messages}
                  appState={appState}
                  onSendMessage={handleSendMessage}
                  onClearMessages={handleClearMessages}
                  onClose={() => setIsChatDrawerOpen(false)}
                  isSessionActive={isSessionActive}
                  onToggleVoiceSession={toggleListening}
                  isMuted={isMuted}
                  onToggleMute={() => setIsMuted(!isMuted)}
                  creatorName={user.name}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Floating Controls */}
          <footer className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-center pb-5 md:pb-7 z-20 shrink-0 gap-2.5 px-4">
            {/* Quick Action Chips directly on Orb view */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full px-2 py-1 scrollbar-hide">
              <button
                onClick={() => setShowInstallModal(true)}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/40 text-[11px] text-pink-300 font-medium transition-all whitespace-nowrap shadow-sm shadow-pink-500/10"
              >
                <Smartphone size={11} className="text-pink-400" />
                <span>Install App</span>
              </button>

              <button
                onClick={() => handleSendMessage("Who created you Zoya?")}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-violet-600/25 border border-white/10 text-[11px] text-white/80 hover:text-white transition-all whitespace-nowrap"
              >
                <HelpCircle size={11} className="text-yellow-400" />
                <span>Creator?</span>
              </button>

              <button
                onClick={() => handleSendMessage(`Zoya, roast your creator ${user.name} in pure sassy Hinglish!`)}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-violet-600/25 border border-white/10 text-[11px] text-white/80 hover:text-white transition-all whitespace-nowrap"
              >
                <Flame size={11} className="text-red-400" />
                <span>Roast Me</span>
              </button>

              <button
                onClick={() => handleSendMessage("Zoya ek funny joke sunao")}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-violet-600/25 border border-white/10 text-[11px] text-white/80 hover:text-white transition-all whitespace-nowrap"
              >
                <Laugh size={11} className="text-pink-400" />
                <span>Joke</span>
              </button>

              <button
                onClick={() => handleSendMessage("Play Bollywood lofi songs on YouTube")}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-violet-600/25 border border-white/10 text-[11px] text-white/80 hover:text-white transition-all whitespace-nowrap"
              >
                <Music size={11} className="text-purple-400" />
                <span>Play Song</span>
              </button>
            </div>

            {/* Quick Text Input Form */}
            <AnimatePresence>
              {showQuickTextInput && (
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  onSubmit={handleQuickTextSubmit}
                  className="w-full max-w-md flex items-center gap-2 bg-[#0d0d14]/90 border border-white/15 rounded-2xl p-1.5 pl-4 backdrop-blur-xl shadow-2xl"
                >
                  <input
                    type="text"
                    value={quickTextInput}
                    onChange={(e) => setQuickTextInput(e.target.value)}
                    placeholder={`Ask Zoya anything or say 'Roast me' ${user.name}...`}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/30 text-xs sm:text-sm"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!quickTextInput.trim()}
                    className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white transition-colors"
                  >
                    <Send size={15} />
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Toggle Live Voice Session Button */}
              <button
                id="voice-session-toggle-btn"
                onClick={toggleListening}
                className={`
                  group relative flex items-center gap-3 px-7 sm:px-9 py-3.5 sm:py-4 rounded-full font-medium tracking-wide transition-all duration-300 shadow-2xl text-sm sm:text-base
                  ${
                    isSessionActive
                      ? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
                      : "bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white hover:opacity-90 hover:scale-105 border border-white/20 shadow-purple-600/30"
                  }
                `}
              >
                {isSessionActive ? (
                  <>
                    <MicOff size={20} />
                    <span>End Voice Session</span>
                  </>
                ) : (
                  <>
                    <Mic size={20} className="group-hover:scale-110 transition-transform" />
                    <span>Start Voice Session</span>
                  </>
                )}
              </button>

              {/* Quick Type Button */}
              {!isSessionActive && (
                <button
                  id="quick-keyboard-btn"
                  onClick={() => setShowQuickTextInput(!showQuickTextInput)}
                  className="p-3.5 sm:p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-white/70 transition-all shadow-xl"
                  title="Quick Text Message"
                >
                  <Keyboard size={20} />
                </button>
              )}

              {/* Full Chat Toggle Button */}
              <button
                id="full-chat-view-btn"
                onClick={() => setViewMode("chat")}
                className="p-3.5 sm:p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-white/70 transition-all shadow-xl relative"
                title="Open Zoya Response Chat"
              >
                <MessageSquare size={20} />
                {messages.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {messages.length}
                  </span>
                )}
              </button>
            </div>
          </footer>
        </div>
      ) : (
        /* Full Chat Space View */
        <div className="relative w-full h-full pt-16 pb-4 px-3 md:px-12 flex items-center justify-center z-10">
          <div className="w-full max-w-4xl h-full py-2">
            <ChatPanel
              messages={messages}
              appState={appState}
              onSendMessage={handleSendMessage}
              onClearMessages={handleClearMessages}
              onClose={() => setViewMode("orb")}
              isSessionActive={isSessionActive}
              onToggleVoiceSession={toggleListening}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
              creatorName={user.name}
            />
          </div>
        </div>
      )}
    </div>
  );
}
