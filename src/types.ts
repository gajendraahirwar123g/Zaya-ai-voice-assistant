export type AppState = "idle" | "listening" | "processing" | "speaking";

export interface ChatMessage {
  id: string;
  sender: "user" | "zoya";
  text: string;
  timestamp: number;
  isAudioPlaying?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  role: "creator" | "guest" | "user";
  isSignedIn: boolean;
}
