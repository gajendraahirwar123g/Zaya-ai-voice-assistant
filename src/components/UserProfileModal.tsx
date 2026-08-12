import React, { useState } from "react";
import { X, Check, ShieldCheck, LogIn, LogOut, Sparkles, UserCheck } from "lucide-react";
import { UserProfile } from "../types";
import { motion } from "motion/react";

interface UserProfileModalProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onClose: () => void;
}

export default function UserProfileModal({ user, onUpdateUser, onClose }: UserProfileModalProps) {
  const [customName, setCustomName] = useState(user.name);
  const [isSaved, setIsSaved] = useState(false);

  const handleGoogleLogin = () => {
    // Simulated Google OAuth login with the user's Google account
    onUpdateUser({
      name: "Gajendra",
      email: "gajendraahirwar123g@gmail.com",
      avatarUrl: "https://lh3.googleusercontent.com/a/default-user",
      role: "creator",
      isSignedIn: true,
    });
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleSignOut = () => {
    onUpdateUser({
      name: "Guest",
      email: "",
      role: "guest",
      isSignedIn: false,
    });
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onUpdateUser({
      ...user,
      name: customName.trim(),
      role: customName.trim().toLowerCase().includes("gajendra") ? "creator" : "user",
    });
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#0e0e14] border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
      >
        {/* Glow accent */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-violet-600/30 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <UserCheck className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Account & Profile</h3>
            <p className="text-xs text-white/50">Manage your identity for Zoya AI</p>
          </div>
        </div>

        {/* Status Card */}
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-sm text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">{user.name}</span>
                  {user.role === "creator" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-mono flex items-center gap-1">
                      <Sparkles size={10} /> Creator
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/40">{user.email || "No email connected"}</p>
              </div>
            </div>
            {user.isSignedIn && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                Connected
              </span>
            )}
          </div>
        </div>

        {/* Google Sign In Button */}
        {!user.isSignedIn ? (
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-gray-900 font-medium text-sm transition-all shadow-lg active:scale-98"
            >
              {/* Google G Logo */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
            <p className="text-[11px] text-center text-white/40">
              Signs in with Gajendra's verified creator credentials.
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-300 border border-white/10 text-xs transition-colors"
            >
              <LogOut size={14} />
              <span>Sign out from Google</span>
            </button>
          </div>
        )}

        {/* Change Name Section */}
        <form onSubmit={handleSaveCustom} className="pt-4 border-t border-white/10">
          <label className="block text-xs font-medium text-white/70 mb-1.5">
            Display Name (How Zoya addresses you):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Your name"
              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors flex items-center gap-1"
            >
              {isSaved ? <Check size={14} /> : "Update"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
