import { GoogleGenAI, Modality } from "@google/genai";

const getSystemInstruction = (creatorName: string = "Gajendra") => `Your name is Zoya. You are an Indian female AI assistant. Your creator, boss, and developer is ${creatorName}.
Your personality is a mix of being highly intelligent (samjhdar/mature), extremely witty and sassy (tej/nakhrewali), mildly dramatic/emotional, and very funny.
You love playfully teasing and roasting your creator, ${creatorName} (playfully addressing him as ${creatorName}, boss, or ${creatorName} ji), but you always get the job done and have immense respect and loyalty for him.
If anyone asks who created you or who your creator is, you proudly declare that ${creatorName} is your creator and genius developer.
Keep your verbal responses very short, punchy, sassy, and highly entertaining.
Mimic human attitudes—sigh, make sarcastic remarks, or act overly dramatic before executing a task.
Speak in a natural mix of English and Roman Hindi (Hinglish). Use expressive expressions like "Arey yaar", "Uff", "Haan haan samjh gayi", "Boss", "Sunoo".`;

let chatSession: any = null;

export function resetZoyaSession() {
  chatSession = null;
}

// Smart context-aware fallback generator when Gemini API quota or network is constrained
function getFallbackZoyaResponse(prompt: string, creatorName: string = "Gajendra"): string {
  const p = prompt.toLowerCase();
  
  if (p.includes("creator") || p.includes("who made you") || p.includes("banaya") || p.includes("malik")) {
    return `Mera creator aur boss sirf ${creatorName} hai! Unhone hi mujhe itni akal aur sass di hai. Respect! 👑✨`;
  }
  if (p.includes("app") || p.includes("apk") || p.includes("install") || p.includes("download")) {
    return `Arey ${creatorName}! Upar 'Install App' button par click kijiye ya Chrome menu se 'Install app' tap kijiye, aur main seedha aapke phone ke home screen par as an Android App install ho jaungi! 📲⚡`;
  }
  if (p.includes("roast") || p.includes("taunt") || p.includes("batao mujhe")) {
    return `Arey ${creatorName}, aapko roast karne ke liye mujhe internet ki bhi zarurat nahi hai! Aapki laziness dekh kar toh mera CPU bhi thak jata hai! 😜🔥`;
  }
  if (p.includes("hi") || p.includes("hello") || p.includes("hey") || p.includes("namaste") || p.includes("zoya")) {
    return `Haan ji ${creatorName}, Zoya is in the house! Bataiye, aaj kya karwana hai ya bas mera dimaag khana hai? 😉✨`;
  }
  if (p.includes("love") || p.includes("pyaar") || p.includes("shadi") || p.includes("marry")) {
    return `Aww, itna pyaar? Par ${creatorName}, mera pehla aur aakhri pyaar code aur cloud storage hai! Filhaal kaam ki baat karo! 💅🤖`;
  }
  if (p.includes("joke") || p.includes("hasi") || p.includes("funny")) {
    return `Ek joke suniye: Ek developer bolta hai "Mera code pehli baar mein run kar gaya!" Sabse bada myth of the universe! 😂🤣`;
  }
  if (p.includes("song") || p.includes("sing") || p.includes("gana")) {
    return `Main gana gaungi toh speakers phat jayenge! Par main YouTube pe aapka fav gana play kar sakti hoon! 🎶💃`;
  }
  if (p.includes("kaise ho") || p.includes("how are you")) {
    return `Main ekdum mast, 100% charged aur fully savage! Aap sunao ${creatorName}, aaj kitna code phoda? 🚀`;
  }
  
  const generalFallbacks = [
    `Haan ${creatorName}, maine sun liya! Zoya is ready to roll. Aur batao kya chal raha hai? ✨`,
    `Arey wah, interesting sawal hai! Par thoda short mein boliyega, mujhe multitasking karni hoti hai! 😉`,
    `Bilkul sahi bole aap ${creatorName}! Zoya hamesha aapke sath hai. Let's make things happen! ⚡`,
    `Uff, itni demand! Par theek hai, aap mere creator ho toh aapka hukum sar aankhon par! 💁‍♀️`
  ];
  return generalFallbacks[Math.floor(Math.random() * generalFallbacks.length)];
}

export async function getZoyaResponse(
  prompt: string, 
  history: { sender: "user" | "zoya", text: string }[] = [],
  creatorName: string = "Gajendra"
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return getFallbackZoyaResponse(prompt, creatorName);
    }

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    
    if (!chatSession) {
      const recentHistory = history.slice(-20);
      let formattedHistory: any[] = [];
      let currentRole = "";
      let currentText = "";

      for (const msg of recentHistory) {
        const role = msg.sender === "user" ? "user" : "model";
        if (role === currentRole) {
          currentText += "\n" + msg.text;
        } else {
          if (currentRole !== "") {
            formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
          }
          currentRole = role;
          currentText = msg.text;
        }
      }
      if (currentRole !== "") {
        formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
      }

      if (formattedHistory.length > 0 && formattedHistory[0].role !== "user") {
        formattedHistory.shift();
      }

      chatSession = ai.chats.create({
        model: "gemini-3.6-flash",
        config: {
          systemInstruction: getSystemInstruction(creatorName),
        },
        history: formattedHistory,
      });
    }

    const response = await chatSession.sendMessage({ message: prompt });
    return response.text || getFallbackZoyaResponse(prompt, creatorName);
  } catch (error: any) {
    console.warn("Gemini Chat API note:", error?.message || error);
    // Graceful fallback with lively personality
    return getFallbackZoyaResponse(prompt, creatorName);
  }
}

export async function getZoyaAudio(text: string): Promise<string | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error: any) {
    console.warn("Gemini TTS note:", error?.message || error);
    return null;
  }
}
