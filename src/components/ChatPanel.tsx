import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Trash2, 
  Download, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Search, 
  Sparkles, 
  X, 
  Mic, 
  Loader2,
  Maximize2,
  Minimize2,
  Bot,
  User as UserIcon,
  HelpCircle,
  Flame,
  Music,
  Laugh,
  Radio,
  Share2
} from "lucide-react";
import { ChatMessage, AppState } from "../types";
import { getZoyaAudio } from "../services/geminiService";
import { playPCM, speakWithBrowserTTS } from "../utils/audioUtils";
import { motion, AnimatePresence } from "motion/react";
import zoyaLogo from "../assets/images/zoya_app_logo_1786528123123.jpg";

interface ChatPanelProps {
  messages: ChatMessage[];
  appState: AppState;
  onSendMessage: (text: string) => void;
  onClearMessages: () => void;
  onClose?: () => void;
  isSessionActive: boolean;
  onToggleVoiceSession: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  creatorName?: string;
}

const QUICK_ZOYA_PROMPTS = [
  { label: "👑 Who created you?", prompt: "Who is your creator Zoya?", icon: HelpCircle, color: "text-yellow-400" },
  { label: "🔥 Roast Gajendra", prompt: "Zoya, roast your creator Gajendra in pure savage Hinglish!", icon: Flame, color: "text-red-400" },
  { label: "🤣 Funny Joke", prompt: "Zoya ek mazedaar funny joke sunao", icon: Laugh, color: "text-pink-400" },
  { label: "🎶 Play Music on YouTube", prompt: "Play trending Bollywood lofi songs on YouTube", icon: Music, color: "text-purple-400" },
  { label: "💬 Open WhatsApp", prompt: "Open WhatsApp", icon: Share2, color: "text-green-400" },
  { label: "⌚ Current Time", prompt: "Zoya abhi time kya hua hai?", icon: Radio, color: "text-cyan-400" },
];

export default function ChatPanel({
  messages,
  appState,
  onSendMessage,
  onClearMessages,
  onClose,
  isSessionActive,
  onToggleVoiceSession,
  isMuted,
  onToggleMute,
  creatorName = "Gajendra"
}: ChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, appState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || appState === "processing") return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePlayAudio = async (id: string, text: string) => {
    if (playingAudioId === id) return;
    try {
      setPlayingAudioId(id);
      const audioBase64 = await getZoyaAudio(text);
      if (audioBase64) {
        await playPCM(audioBase64);
      } else {
        await speakWithBrowserTTS(text);
      }
    } catch (e) {
      console.error("Audio playback error", e);
      await speakWithBrowserTTS(text);
    } finally {
      setPlayingAudioId(null);
    }
  };

  const handleExport = () => {
    if (messages.length === 0) return;
    const exportData = messages.map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender.toUpperCase()}: ${m.text}`).join("\n\n");
    const blob = new Blob([`Zoya AI Assistant Chat Log\nCreator: ${creatorName}\nDate: ${new Date().toLocaleDateString()}\n\n` + exportData], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zoya-responses-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredMessages = searchQuery.trim() 
    ? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div 
      id="zoya-chat-panel"
      className={`
        flex flex-col h-full bg-[#08080c]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden
        ${isExpanded ? "fixed inset-2 md:inset-6 z-50" : "w-full h-full relative"}
      `}
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-pink-500/40 shadow-lg shadow-purple-500/20 bg-gradient-to-tr from-violet-600 via-purple-500 to-pink-500 flex items-center justify-center">
              <img 
                src={zoyaLogo} 
                alt="Zoya" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#08080c] ${appState === "processing" ? "bg-cyan-400 animate-ping" : appState === "speaking" ? "bg-pink-400 animate-pulse" : appState === "listening" ? "bg-green-400 animate-pulse" : "bg-violet-400"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm tracking-wide text-white">Zoya AI Responses</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono border border-violet-500/30">
                Active
              </span>
            </div>
            <p className="text-[11px] text-white/40 font-mono">
              {appState === "processing" ? "Crafting savage response..." : appState === "speaking" ? "Speaking..." : appState === "listening" ? "Listening..." : `Creator: ${creatorName}`}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            id="chat-search-btn"
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded-lg transition-colors text-white/60 hover:text-white hover:bg-white/10 ${showSearch ? "bg-white/10 text-white" : ""}`}
            title="Search messages"
          >
            <Search size={16} />
          </button>

          {messages.length > 0 && (
            <>
              <button
                id="chat-export-btn"
                onClick={handleExport}
                className="p-1.5 rounded-lg transition-colors text-white/60 hover:text-white hover:bg-white/10"
                title="Export Chat (.txt)"
              >
                <Download size={16} />
              </button>

              <button
                id="chat-clear-btn"
                onClick={() => {
                  if (window.confirm("Clear all Zoya chat history?")) {
                    onClearMessages();
                  }
                }}
                className="p-1.5 rounded-lg transition-colors text-white/60 hover:text-red-400 hover:bg-red-500/10"
                title="Clear Chat History"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}

          <button
            id="chat-mute-btn"
            onClick={onToggleMute}
            className="p-1.5 rounded-lg transition-colors text-white/60 hover:text-white hover:bg-white/10"
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button
            id="chat-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg transition-colors text-white/60 hover:text-white hover:bg-white/10 hidden md:block"
            title={isExpanded ? "Collapse" : "Expand Fullscreen"}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {onClose && (
            <button
              id="chat-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors text-white/60 hover:text-white hover:bg-white/10 ml-1"
              title="Close Chat"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search Input Bar (Expandable) */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-white/[0.03] border-b border-white/5 flex items-center gap-2"
          >
            <Search size={14} className="text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Zoya responses..."
              className="w-full bg-transparent border-none outline-none text-xs text-white placeholder:text-white/30"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="text-white/40 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-pink-500/40 shadow-xl shadow-purple-500/20 mb-3 bg-gradient-to-tr from-violet-600 to-pink-600">
              <img 
                src={zoyaLogo} 
                alt="Zoya Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className="font-medium text-white text-base">Zoya is ready for {creatorName}! ⚡</h3>
            <p className="text-white/50 text-xs mt-1 max-w-xs leading-relaxed">
              Ask anything, request a savage roast, play YouTube tunes, or get instant assistance. Zoya will respond verbally and in text.
            </p>

            {/* Quick Response Prompts */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-md">
              {QUICK_ZOYA_PROMPTS.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(sug.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/40 text-xs text-white/80 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-sm"
                >
                  <sug.icon size={13} className={sug.color} />
                  <span>{sug.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isUser = msg.sender === "user";
            const isCopied = copiedId === msg.id;
            const isPlayingThis = playingAudioId === msg.id;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 group ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className="shrink-0 mt-0.5">
                  {isUser ? (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-xs font-semibold shadow-md shadow-blue-500/10">
                      <UserIcon size={13} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-pink-500/30 shadow-md shadow-violet-500/20 bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center">
                      <img 
                        src={zoyaLogo} 
                        alt="Zoya" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>

                {/* Bubble + Metadata */}
                <div className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[10px] font-medium tracking-wide text-white/40">
                      {isUser ? creatorName : "Zoya Response"}
                    </span>
                    <span className="text-[9px] font-mono text-white/30">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`
                      relative p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg
                      ${
                        isUser
                          ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-none border border-violet-400/20"
                          : "bg-white/[0.07] text-white/95 rounded-tl-none border border-white/10 backdrop-blur-md"
                      }
                    `}
                  >
                    <p className="whitespace-pre-wrap select-text">{msg.text}</p>

                    {/* Message Actions */}
                    <div className={`mt-2 pt-1 border-t border-white/10 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? "justify-end" : "justify-start"}`}>
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="text-[11px] text-white/60 hover:text-white flex items-center gap-1 transition-colors"
                        title="Copy text"
                      >
                        {isCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        <span>{isCopied ? "Copied" : "Copy"}</span>
                      </button>

                      {!isUser && (
                        <button
                          onClick={() => handlePlayAudio(msg.id, msg.text)}
                          disabled={isPlayingThis}
                          className="text-[11px] text-violet-300 hover:text-violet-200 flex items-center gap-1 transition-colors disabled:opacity-50"
                          title="Play Voice Audio"
                        >
                          {isPlayingThis ? (
                            <Loader2 size={12} className="animate-spin text-cyan-300" />
                          ) : (
                            <Volume2 size={12} />
                          )}
                          <span>{isPlayingThis ? "Speaking..." : "Listen"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        {/* Processing Indicator */}
        {appState === "processing" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 items-start"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden border border-pink-500/30 flex items-center justify-center shrink-0">
              <img 
                src={zoyaLogo} 
                alt="Zoya" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-none p-3 text-xs text-white/80 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-violet-400" />
              <span>Zoya is typing a witty response...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Bar when active */}
      {messages.length > 0 && (
        <div className="px-3 py-2 bg-white/[0.01] border-t border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0">
          <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles size={10} className="text-violet-400" /> Instant:
          </span>
          {QUICK_ZOYA_PROMPTS.slice(0, 4).map((sug, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(sug.prompt)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/40 text-white/80 hover:text-white whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <sug.icon size={11} className={sug.color} />
              <span>{sug.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Footer */}
      <div className="p-3 border-t border-white/10 bg-white/[0.02] shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <div className="flex-1 relative flex items-center bg-white/5 border border-white/10 rounded-xl focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/30 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask Zoya, get a response, or say 'Roast me' ${creatorName}...`}
              disabled={appState === "processing"}
              className="w-full bg-transparent border-none outline-none px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/30"
            />
          </div>

          {/* Voice Session Toggle inside Chat */}
          <button
            type="button"
            onClick={onToggleVoiceSession}
            className={`
              p-2.5 rounded-xl border transition-all shrink-0
              ${
                isSessionActive
                  ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
              }
            `}
            title={isSessionActive ? "Stop Voice Mode" : "Start Voice Mic Mode"}
          >
            <Mic size={16} />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || appState === "processing"}
            className="p-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-lg shadow-purple-600/20 transition-all shrink-0 active:scale-95"
            title="Get Zoya Response"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
