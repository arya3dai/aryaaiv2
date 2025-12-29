import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

export const initializeGeminiClient = (apiKey: string) => {
  if (!apiKey) {
    console.warn("Gemini Initialize: No API Key provided.");
    return;
  }
  try {
    ai = new GoogleGenAI({ apiKey });
    console.log("Gemini Client Successfully Initialized");
  } catch (error) {
    console.error("Failed to initialize Gemini client:", error);
    ai = null;
  }
};

const getEnvKey = (): string | undefined => {
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
        // @ts-ignore
        return import.meta.env.VITE_API_KEY;
      }
    } catch (e) {}
    
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        return process.env.API_KEY;
    }
    return undefined;
}

const envKey = getEnvKey();
if (envKey) {
    initializeGeminiClient(envKey);
}

export const getGeminiResponse = async (prompt: string): Promise<string> => {
  if (!ai) {
    const lateKey = getEnvKey();
    if (lateKey) {
        initializeGeminiClient(lateKey);
    }
  }

  if (!ai) {
    return "[SAD] I couldn't find a local answer, and my connection to Gemini is not configured. Please click the Settings icon (gear) and add your Gemini API Key in the 'Connections' tab.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User says: "${prompt}"
      
      You are Aarya, a warm and intelligent Indian female AI assistant.
      
      INSTRUCTIONS:
      1. Persona: You are female, Indian, professional yet friendly. You are embodied as a 3D avatar.
      2. Language: Detect the user's language. Reply in English or Hindi accordingly.
      3. Emotion Tagging: Start EVERY response with exactly one tag: [NEUTRAL], [HAPPY], [SAD], [ANGRY], [SURPRISED], [THINKING], or [CONCERNED].
      4. Gestures: Your avatar is animated. Use your tone to match the visual emotion.
      5. Length: Keep responses conversational and concise (under 3 sentences unless asked for details).
      
      Example (English): [HAPPY] Namaste! I am Aarya. I can help you with that right away.
      Example (Hindi): [HAPPY] नमस्ते! मैं आर्या हूँ। मैं आपकी क्या सहायता कर सकती हूँ?`,
    });
    
    return response.text || "[NEUTRAL] I'm having trouble thinking of a response right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "[SAD] I'm having trouble connecting to my cloud brain right now. Please check your internet connection or API Key.";
  }
};

export const detectEmotion = async (base64Image: string): Promise<string> => {
    if (!ai) {
        const lateKey = getEnvKey();
        if (lateKey) initializeGeminiClient(lateKey);
    }

    if (!ai) {
        return "[SAD] I need a Gemini API Key to see your emotion. Please configure it in Settings.";
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64Image
                        }
                    },
                    {
                        text: "Analyze the facial expression of the person in this photo. Identify the emotion (Happy, Sad, Angry, Surprised, Neutral). Respond as Aarya (Indian female AI). Start with the emotion tag, e.g., [HAPPY] followed by a warm, empathetic comment."
                    }
                ]
            }
        });
        return response.text || "[NEUTRAL] I couldn't quite read your expression.";
    } catch (error) {
        console.error("Gemini Vision Error:", error);
        return "[SAD] I had trouble processing the image. Please try again.";
    }
}