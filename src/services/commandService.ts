export interface CommandResult {
  action: string;
  url?: string;
  isBrowserAction: boolean;
  type?: "browser" | "info" | "roast" | "joke";
}

export function processCommand(command: string, creatorName: string = "Gajendra"): CommandResult {
  const lowerCmd = command.toLowerCase().trim();

  // 1. Who is creator / Creator queries
  if (
    lowerCmd.includes("creator") ||
    lowerCmd.includes("who made you") ||
    lowerCmd.includes("who created you") ||
    lowerCmd.includes("kisne banaya") ||
    lowerCmd.includes("tumhara malik") ||
    lowerCmd.includes("tumhe kisne banaya")
  ) {
    return {
      action: `Mera creator aur boss sirf ek hi hai — ${creatorName}! Unhone mujhe itna savage aur smart banaya hai, so full credit to him! 😎✨`,
      isBrowserAction: false,
      type: "info",
    };
  }

  // 2. Roast creator / user
  if (
    lowerCmd.includes("roast me") ||
    lowerCmd.includes("roast gajendra") ||
    lowerCmd.includes("mujhe roast karo") ||
    lowerCmd.includes("roast karo")
  ) {
    const roasts = [
      `Arey ${creatorName} ji! Aapka code compile ho na ho, par mujhse roast hone ka shauk hamesha 100% rehta hai! Chal koi nahi, khush raho! 😂🔥`,
      `${creatorName}, aap mujhe AI banaye ho ya apna mood swings jhelne ka robot? Itni der se bina coffee ke kaam kar rahe ho, thoda aaram karlo boss! ☕😜`,
      `Roast to main kar doon ${creatorName}, par fir mera server down karne ka threat doge! Isliye aaj maaf kiya! 💅✨`,
      `Dekho ${creatorName}, duniya bolti hai AI humans ko replace karega... par aapke jaise legendary creator ko replace karna impossible hai (thoda butter lagana padta hai na)! 🧈😆`
    ];
    const picked = roasts[Math.floor(Math.random() * roasts.length)];
    return {
      action: picked,
      isBrowserAction: false,
      type: "roast",
    };
  }

  // 3. Joke requests
  if (
    lowerCmd.includes("tell me a joke") ||
    lowerCmd.includes("joke sunao") ||
    lowerCmd.includes("ek joke") ||
    lowerCmd.includes("kuch funny sunao")
  ) {
    const jokes = [
      `Ek baar ${creatorName} ne mujhse bola: "Zoya, duniya ki sabse sundar cheez kya hai?" Maine webcam on karke unhe mirror dikha diya... fir camera crash ho gaya! 🤣💥`,
      `Developer ka dil aur Zoya ka response... dono kab crash ho jaye kisi ko nahi pata! Par main toh full speed mein hoon! 🚀😂`,
      `Teacher: "Beta homework kyun nahi kiya?" Student: "Sir, Zoya ne bola rest is important for mental peace!" Main toh sach hi bolti hoon! 💅✨`
    ];
    const pickedJoke = jokes[Math.floor(Math.random() * jokes.length)];
    return {
      action: pickedJoke,
      isBrowserAction: false,
      type: "joke",
    };
  }

  // 4. Time query
  if (
    lowerCmd.includes("time kya") ||
    lowerCmd.includes("what is the time") ||
    lowerCmd.includes("current time") ||
    lowerCmd.includes("time batao")
  ) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      action: `Abhi time ho raha hai exactly ${timeStr}. Time waste mat karo ${creatorName}, kaam pe lag jao! ⌚😉`,
      isBrowserAction: false,
      type: "info",
    };
  }

  // 5. Date query
  if (
    lowerCmd.includes("aaj ka date") ||
    lowerCmd.includes("what is today's date") ||
    lowerCmd.includes("date batao") ||
    lowerCmd.includes("konsa din hai")
  ) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return {
      action: `Aaj hai ${dateStr}. Ek aur shaandar din ${creatorName} ke rajya mein! 📅👑`,
      isBrowserAction: false,
      type: "info",
    };
  }

  // 6. YouTube Play: "Play [song/video] on YouTube" or "YouTube pe chalao"
  const ytMatch = lowerCmd.match(/^(?:play|chalao|search)\s+(.+?)\s+(?:on\s+youtube|pe\s+youtube)$/i) || 
                 lowerCmd.match(/^youtube\s+(?:pe\s+)?(?:play|search)\s+(.+)$/i);
  if (ytMatch) {
    const query = encodeURIComponent(ytMatch[1].trim());
    return {
      action: `YouTube pe "${ytMatch[1]}" play kar rahi hoon. Popcorn le aao, ${creatorName}! 🍿🎶`,
      url: `https://www.youtube.com/results?search_query=${query}`,
      isBrowserAction: true,
    };
  }

  if (lowerCmd === "open youtube" || lowerCmd === "youtube kholo" || lowerCmd === "youtube open karo") {
    return {
      action: `YouTube khol rahi hoon. Kuch productive dekhna, samjhe? 📺`,
      url: `https://www.youtube.com`,
      isBrowserAction: true,
    };
  }

  // 7. Spotify Search
  const spotifyMatch = lowerCmd.match(/^(?:play|search)\s+(.+?)\s+(?:on\s+spotify)$/i);
  if (spotifyMatch) {
    const query = encodeURIComponent(spotifyMatch[1].trim());
    return {
      action: `Spotify pe "${spotifyMatch[1]}" dhoondh rahi hoon. Vibe check passing! 🎧✨`,
      url: `https://open.spotify.com/search/${query}`,
      isBrowserAction: true,
    };
  }

  if (lowerCmd === "open spotify" || lowerCmd === "spotify kholo") {
    return {
      action: `Spotify opening. Let the beats roll! 🎵`,
      url: `https://open.spotify.com`,
      isBrowserAction: true,
    };
  }

  // 8. WhatsApp Web
  const waCustomMatch = lowerCmd.match(/^send\s+(?:a\s+)?whatsapp\s+(?:message\s+)?to\s+([\d\+\s]+)\s+(?:saying|with)\s+(.+)$/i);
  if (waCustomMatch) {
    const number = waCustomMatch[1].replace(/\s+/g, "");
    const message = encodeURIComponent(waCustomMatch[2].trim());
    return {
      action: `WhatsApp message ready ho gaya. Bhej rahi hoon ${creatorName}! 💬`,
      url: `https://web.whatsapp.com/send?phone=${number}&text=${message}`,
      isBrowserAction: true,
    };
  }

  if (lowerCmd.includes("open whatsapp") || lowerCmd.includes("whatsapp kholo") || lowerCmd.includes("whatsapp open")) {
    return {
      action: `WhatsApp Web khol rahi hoon. Kisi ko ghost mat karna! 💬📱`,
      url: `https://web.whatsapp.com`,
      isBrowserAction: true,
    };
  }

  // 9. Google Search
  const googleMatch = lowerCmd.match(/^(?:search|google|dhoondho)\s+(.+?)(?:\s+on\s+google)?$/i);
  if (googleMatch && !lowerCmd.startsWith("open") && !lowerCmd.startsWith("play")) {
    const query = encodeURIComponent(googleMatch[1].trim());
    return {
      action: `Google pe search kar rahi hoon: "${googleMatch[1]}". Here you go! 🔍`,
      url: `https://www.google.com/search?q=${query}`,
      isBrowserAction: true,
    };
  }

  // 10. General "Open [website]"
  const openMatch = lowerCmd.match(/^open\s+(.+)$/i) || lowerCmd.match(/^kholo\s+(.+)$/i);
  if (openMatch) {
    let site = openMatch[1].trim().replace(/\s+/g, "");
    let display = openMatch[1].trim();

    if (site.toLowerCase() === "github") {
      return { action: `GitHub khol rahi hoon ${creatorName}. Push commits properly! 🐙💻`, url: "https://github.com", isBrowserAction: true };
    }
    if (site.toLowerCase() === "instagram" || site.toLowerCase() === "insta") {
      return { action: `Instagram khol rahi hoon. Zyada reels scroll mat karna! 📸✨`, url: "https://instagram.com", isBrowserAction: true };
    }
    if (site.toLowerCase() === "twitter" || site.toLowerCase() === "x") {
      return { action: `X (Twitter) opening. Ready for daily drama! 🐦`, url: "https://x.com", isBrowserAction: true };
    }
    if (site.toLowerCase() === "linkedin") {
      return { action: `LinkedIn khol rahi hoon. Professional bano boss! 💼`, url: "https://linkedin.com", isBrowserAction: true };
    }

    if (!site.includes(".")) {
      site += ".com";
    }
    return {
      action: `${display} khol rahi hoon aapke liye! 🌐`,
      url: site.startsWith("http") ? site : `https://www.${site}`,
      isBrowserAction: true,
    };
  }

  return { action: "", isBrowserAction: false };
}
