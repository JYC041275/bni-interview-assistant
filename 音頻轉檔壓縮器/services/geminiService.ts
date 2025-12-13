import { GoogleGenAI } from "@google/genai";
import { blobToBase64 } from "./audioService";

export const verifyAudioWithGemini = async (audioBlob: Blob): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const base64Data = await blobToBase64(audioBlob);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'audio/mp3',
              data: base64Data
            }
          },
          {
            text: "Please transcribe this audio file accurately to verify its clarity after compression."
          }
        ]
      }
    });

    const text = response.text;
    if (!text) {
      return "No transcription generated.";
    }
    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to process audio with Gemini.");
  }
};