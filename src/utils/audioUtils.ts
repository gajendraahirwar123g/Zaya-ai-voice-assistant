// Cache preloaded voices to avoid empty voice list bug on mobile/Chromium
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const loadVoices = () => {
    try {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        cachedVoices = v;
      }
    } catch (_) {}
  };

  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export function getCleanSpokenText(rawText: string): string {
  if (!rawText) return "";
  return rawText
    // Remove markdown formatting
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#+\s*/g, "")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    // Remove URLs
    .replace(/https?:\/\/\S+/gi, "link")
    // Remove emojis
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, "")
    // Clean multiple spaces and newlines
    .replace(/\n+/g, ". ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function playPCM(base64Data: string): Promise<void> {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("AudioContext not supported");
      return;
    }
    const audioCtx = new AudioContextClass({ sampleRate: 24000 });
    
    // Resume context if suspended (browser autoplay policy)
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const buffer = new Int16Array(bytes.buffer);
    const audioBuffer = audioCtx.createBuffer(1, buffer.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      channelData[i] = buffer[i] / 32768.0;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();
    
    return new Promise<void>(resolve => {
      source.onended = () => {
        try {
          audioCtx.close();
        } catch (_) {}
        resolve();
      };
    });
  } catch (error) {
    console.error("Error playing PCM audio:", error);
  }
}

/**
 * Natural & Expressive Speech Synthesis fallback
 */
export function speakWithBrowserTTS(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = getCleanSpokenText(text);
    if (!cleanText) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Retrieve freshest voices list
    let voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
    }

    // Select the most natural human female voice available
    // Priority:
    // 1. Google / Microsoft / Apple Indian Hindi or Indian English Female (e.g. Swara, Neerja, Lekha, Veena, Google हिन्दी, Google English India)
    // 2. High-quality natural female voices
    // 3. Indian English / Hindi voice
    // 4. Any clean female English voice
    const bestVoice = 
      voices.find((v) => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        const isIndian = lang.includes("hi") || lang.includes("in") || name.includes("india") || name.includes("hindi");
        const isFemale = name.includes("female") || name.includes("swara") || name.includes("neerja") || name.includes("heera") || name.includes("lekha") || name.includes("veena") || name.includes("zira") || name.includes("kalpana") || name.includes("ananya");
        return isIndian && isFemale;
      }) ||
      voices.find((v) => {
        const name = v.name.toLowerCase();
        return (name.includes("google") || name.includes("natural") || name.includes("online") || name.includes("neural")) && 
               (v.lang.includes("hi") || v.lang.includes("IN") || name.includes("hindi") || name.includes("india"));
      }) ||
      voices.find((v) => v.lang.includes("hi-IN") || v.lang.includes("hi_IN")) ||
      voices.find((v) => v.lang.includes("en-IN") || v.lang.includes("en_IN")) ||
      voices.find((v) => {
        const name = v.name.toLowerCase();
        return (name.includes("female") || name.includes("samantha") || name.includes("victoria") || name.includes("karen") || name.includes("zira")) &&
               (v.lang.includes("en") || v.lang.includes("hi"));
      }) ||
      voices.find((v) => v.lang.includes("en") && !v.name.toLowerCase().includes("male"));

    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang || "hi-IN";
    } else {
      utterance.lang = "hi-IN";
    }

    // Natural human conversational pitch and speed (no high-pitch robot effect)
    utterance.rate = 0.98; // Natural, relaxed pace
    utterance.pitch = 1.0;  // Standard natural human pitch (prevent robotic chipmunk sound)

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

