export async function playPCM(base64Data: string): Promise<void> {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("AudioContext not supported");
      return;
    }
    const audioCtx = new AudioContextClass({ sampleRate: 24000 });
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
 * Fallback Speech Synthesis if Gemini TTS API is busy/unavailable
 */
export function speakWithBrowserTTS(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown and emojis for clean speech
    const cleanText = text
      .replace(/[*_~`#\[\]]/g, "")
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .trim();

    if (!cleanText) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();

    // Try to pick an Indian English / Hindi female voice if available
    const indianVoice = voices.find(
      (v) =>
        (v.lang.includes("en-IN") || v.lang.includes("hi-IN") || v.name.toLowerCase().includes("india") || v.name.toLowerCase().includes("heera") || v.name.toLowerCase().includes("neerja") || v.name.toLowerCase().includes("zira")) &&
        v.name.toLowerCase().includes("female")
    ) || voices.find((v) => v.lang.includes("en-IN") || v.lang.includes("hi-IN")) || voices.find((v) => v.name.toLowerCase().includes("female"));

    if (indianVoice) {
      utterance.voice = indianVoice;
    }

    utterance.rate = 1.05;
    utterance.pitch = 1.15; // Slightly high pitch for youthful sassy tone

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}
