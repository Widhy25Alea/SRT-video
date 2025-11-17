import { GoogleGenAI, Type } from "@google/genai";
import { Subtitle } from '../types';

// Define the Word interface for word-level timestamps from the model
interface Word {
  word: string;
  startTime: number;
  endTime: number;
}

/**
 * Groups an array of words with timestamps into subtitle objects.
 * This function creates subtitle chunks based on word count and pauses between words.
 * @param words - An array of Word objects, pre-filtered for validity.
 * @returns An array of subtitle objects, without the 'id' property.
 */
const groupWordsIntoSubtitles = (words: Word[]): Omit<Subtitle, 'id'>[] => {
    if (!words.length) {
        return [];
    }

    const subtitles: Omit<Subtitle, 'id'>[] = [];
    let currentSubtitleWords: Word[] = [];
    
    // Configuration for subtitle chunking
    const MAX_WORDS_PER_SUBTITLE = 2; // Reduced from 3 to make subtitles shorter
    const MAX_PAUSE_SECONDS = 0.5; // A pause longer than this will force a new subtitle

    // Helper to finalize and push the current subtitle being built
    const finalizeSubtitle = () => {
        if (currentSubtitleWords.length === 0) return;
        
        const firstWord = currentSubtitleWords[0];
        const lastWord = currentSubtitleWords[currentSubtitleWords.length - 1];
        
        subtitles.push({
            startTime: firstWord.startTime,
            endTime: lastWord.endTime,
            text: currentSubtitleWords.map(w => w.word).join(' '),
        });
        currentSubtitleWords = [];
    };

    for (const word of words) {
        if (currentSubtitleWords.length > 0) {
            const previousWord = currentSubtitleWords[currentSubtitleWords.length - 1];
            const pause = word.startTime - previousWord.endTime;

            // Start a new subtitle if there's a long pause or the word limit is reached
            if (pause > MAX_PAUSE_SECONDS || currentSubtitleWords.length >= MAX_WORDS_PER_SUBTITLE) {
                finalizeSubtitle();
            }
        }
        currentSubtitleWords.push(word);
    }
    
    // Finalize the last subtitle after the loop
    finalizeSubtitle(); 
    return subtitles;
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateSubtitlesFromAudio = async (
  audioBase64: string,
  mimeType: string,
  duration: number
): Promise<Omit<Subtitle, 'id'>[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not set. Please set the API_KEY environment variable.");
  }

  // New prompt requesting precise word-level timestamps for better sync
  const prompt = `
    You are a highly accurate audio transcription service. Your task is to transcribe the provided audio and provide word-level timestamps.
    The audio is from a video that is ${Math.round(duration)} seconds long.
    Generate a JSON array of word objects. Each object must contain:
    - "word": The transcribed word as a string.
    - "startTime": The precise start time of the word in seconds (float).
    - "endTime": The precise end time of the word in seconds (float).

    IMPORTANT RULES:
    1.  **Extreme Precision:** Timestamps must be extremely precise, reflecting the exact moment each word is spoken.
    2.  **Word-level Granularity:** Every single spoken word must be a separate object in the JSON array.
    3.  **Correctness:** Ensure 'endTime' is always greater than 'startTime'. Timestamps must be in seconds and fall within the video's total duration of ${Math.round(duration)} seconds.
    4.  **Punctuation:** Do not include punctuation as separate words. Punctuation should be attached to the word it follows (e.g., "Hello.").
    5.  **Completeness:** The output must be a valid JSON array of objects. Do not wrap it in markdown or any other text.
  `;

  try {
    const audioPart = {
      inlineData: {
        data: audioBase64,
        mimeType: mimeType,
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: { parts: [{ text: prompt }, audioPart] },
      config: {
        responseMimeType: "application/json",
        // Updated schema to expect word-level data
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: {
                type: Type.STRING,
                description: 'The transcribed word.',
              },
              startTime: {
                type: Type.NUMBER,
                description: 'The start time of the word in seconds.',
              },
              endTime: {
                type: Type.NUMBER,
                description: 'The end time of the word in seconds.',
              },
            },
            required: ["word", "startTime", "endTime"],
          },
        },
      },
    });

    const jsonString = response.text.trim();
    const words: Word[] = JSON.parse(jsonString);

    // Validate and clean the data received from the model
    const validWords = words.filter((w: any) =>
      w &&
      typeof w.word === 'string' &&
      typeof w.startTime === 'number' &&
      typeof w.endTime === 'number' &&
      w.startTime < w.endTime &&
      w.endTime <= (duration + 1) // Add a small buffer for timing inaccuracies
    );

    // Group the validated words into subtitle chunks for display
    return groupWordsIntoSubtitles(validWords);

  } catch (error) {
    console.error("Error generating subtitles from audio:", error);
    if (error instanceof SyntaxError) {
      console.error("Failed to parse JSON response from Gemini. The model may have returned an invalid format.");
    }
    throw new Error("Failed to generate subtitles from Gemini API. The model may have returned an unexpected format or failed to process the audio.");
  }
};