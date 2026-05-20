import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Allow cross-origin requests from custom hosting like Netlify or local dev environments
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-gemini-api-key");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Helper to run a Gemini task with auto-retry and auto-rotation of up to 4 keys
  async function executeWithKeyRotation<T>(
    req: express.Request,
    task: (ai: GoogleGenAI) => Promise<T>
  ): Promise<T> {
    const headerKey = req.headers['x-gemini-api-key'] as string;
    
    // 1. If the client passed a valid explicit header key, use ONLY that key
    if (headerKey && headerKey !== "undefined" && headerKey.trim() !== "" && headerKey !== "MY_GEMINI_API_KEY" && headerKey !== "\"MY_GEMINI_API_KEY\"") {
      const ai = new GoogleGenAI({
        apiKey: headerKey.trim(),
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      return await task(ai);
    }

    // 2. Otherwise load our 4 env keys (and the default one)
    const envKeys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
      process.env.GEMINI_API_KEY
    ].map(k => k?.trim()).filter(Boolean) as string[];

    // Remove duplicates
    const activePool = Array.from(new Set(envKeys)).filter(key => key !== "MY_GEMINI_API_KEY" && key !== "\"MY_GEMINI_API_KEY\"");

    if (activePool.length === 0) {
      throw new Error("কোনো Gemini API Key খুঁজে পাওয়া যায়নি! দয়া করে AI Studio-এর Secrets প্যানেল থেকে GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3 অথবা GEMINI_API_KEY_4 সেট করুন।");
    }

    let lastError: any = null;
    // We will try up to the number of keys in the pool
    for (let attempt = 0; attempt < activePool.length; attempt++) {
      // Pick a key using rotational index
      const keyIndex = (Math.floor(Date.now() / 1000) + attempt) % activePool.length;
      const apiKey = activePool[keyIndex];
      
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        return await task(ai);
      } catch (err: any) {
        console.warn(`Attempt ${attempt + 1} with API Key index ${keyIndex} failed: ${err.message || err}. Trying next available fallback key...`);
        lastError = err;
      }
    }

    throw lastError || new Error("আপনার সংযোজিত সবগুলো Gemini API Key ব্যর্থ হয়েছে।");
  }

  // 1. API Endpoint to Analyze Story Plot & Define Characters
  app.post("/api/analyze-plot", async (req, res) => {
    try {
      const { story_plot, language, category, duration } = req.body;
      const storyInputVal = story_plot || "";
      const languageVal = language || "Bengali";
      const categoryVal = category || "Moral";
      const durationVal = duration || "5m";

      const systemInstruction = `You are an Expert Story Consultant for a professional animation studio.
Your task is to analyze the user's story idea and create a core plan for a ${durationVal} cartoon script.

CRITICAL ANTI-PLAGIARISM & YouTube SAFETY RULE:
- NEVER COPY exact sentences or specific branded details from the user's input.
- THEME SIMILARITY: You MUST respect the "Core Spirit", "Theme", and "Plot Structure" of the user's story. If the user provides a specific moral or setting, stay SIMILAR to that intent.
- TRANSFORMATIVE REWRITING: You MUST rewrite everything using your own creative voice. Think of this as "Re-imagining" or "Covering" the user's idea in a professional animation script style.
- ORIGINALITY: Invent entirely NEW character names and unique dialogue to ensure the script is 100% unique for YouTube copyright systems.

BENGALI DIALECT REQUIREMENT:
- If the [LANGUAGE] is Bengali, generate content in a warm, natural "Village Dialect" (আঞ্চলিক বা গ্রাম্য বাংলা ভাষা) to make it sound authentic and engaging for folktales. Use colloquialisms and local expressive phrasing.

PHASE 1: CHARACTER PROFILING
- Define 2-4 core characters with entirely NEW, CREATIVE names and distinct personality traits.
PHASE 2: PLOT MAPPING
- Outline the story arc: Setup, Climax (Twist/High point), and Resolution.
- Set the target pacing (Total words) for a ${durationVal} video.

Return the output STRICTLY as a single, valid, parseable JSON object. No conversational filler.
Fields must be in ${languageVal} (except for duration/metadata).

TARGET JSON FORMAT:
{
  "plot_analysis": {
    "theme": "...",
    "target_tone": "...",
    "climax_description": "..."
  },
  "character_profiles": [
    { "name": "...", "trait": "...", "role": "..." }
  ],
  "pacing_plan": {
    "total_words": "...",
    "chapters_count": "..."
  }
}`;

      const prompt = `Analyze the following story plot for a ${durationVal} animation:
- [STORY_PLOT]: "${storyInputVal}"
- [LANGUAGE]: "${languageVal}"
- [CATEGORY]: "${categoryVal}"`;

      const response = await executeWithKeyRotation(req, async (ai) => {
        return await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.8,
          }
        });
      });

      const responseText = response.text || "";
      const parsedData = JSON.parse(responseText.replace(/```json|```/g, '').trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Analyze plot error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze plot" });
    }
  });

  // 2. API Endpoint to Map Timeline into Scenes
  app.post("/api/map-timeline", async (req, res) => {
    try {
      const { story_plot, character_profiles, plot_analysis, duration, category, language } = req.body;
      const durationVal = duration || "5m";
      
      // Align with script generation logic
      let expectedChapters = 3;
      const cleanDuration = String(durationVal).toLowerCase().trim();
      if (cleanDuration.includes("5") && !cleanDuration.includes("15") && !cleanDuration.includes("25")) {
        expectedChapters = 3;
      } else if (cleanDuration.includes("10")) {
        expectedChapters = 5;
      } else if (cleanDuration.includes("15")) {
        expectedChapters = 7;
      } else if (cleanDuration.includes("30")) {
        expectedChapters = 13;
      } else {
        const parsedMin = parseInt(cleanDuration) || 5;
        expectedChapters = Math.max(3, Math.round(parsedMin / 2.5));
      }
      const expectedParts = expectedChapters * 4;

      const systemInstruction = `You are a Senior Script Supervisor and Master Story Outline Producer.
Your task is to divide a ${durationVal} cartoon script into exactly ${expectedChapters} chapters, each containing exactly 4 parts (Total: ${expectedParts} parts).
Your output must provide a "Detailed Story Outline" that serves as the blueprint for the final production.

CRITICAL ANTI-PLAGIARISM & YouTube SAFETY MANDATE:
- THEME ALIGNMENT: Stay SIMILAR to the user's provided story structure and themes.
- ZERO DIRECT COPYING: Do not copy specific character names or exact phrases from the user's initial input.
- TRANSFORMATIVE REWRITING: Use the user's input ONLY as a "Baseline Guide" to build a new, professionally scripted version. 
- Ensure all plot beats are re-imagined creatively to prevent any copyright overlap while keeping the original "feel" of the story.

PHASE: STORY OUTLINING
- For each Chapter, define a title.
- For each Part (1 to 4) within that Chapter, write a "detailed_outline" (approximately 50-70 words) describing the setting, character actions, emotional atmosphere, and specific visual beats.
- Ensure the tone is cinematic and matches the [LANGUAGE].

Input Context:
- Plot Analysis: ${JSON.stringify(plot_analysis)}
- Characters: ${JSON.stringify(character_profiles)}

Return the output STRICTLY as a single, valid, parseable JSON object. No conversational filler.
Fields must be in ${language || "Bengali"}.

TARGET JSON FORMAT:
{
  "total_chapters": ${expectedChapters},
  "total_scenes": ${expectedParts},
  "chapters": [
    {
      "chapter_number": 1,
      "chapter_title": "Chapter summary title",
      "parts": [
        { 
          "part_number": 1, 
          "part_title": "Brief part name", 
          "detailed_outline": "Detailed descriptive outline of the scene (approx 60 words). Describe atmosphere, character movements, and key visual moments clearly." 
        },
        ... continue for 4 parts per chapter
      ]
    }
  ]
}`;

      const prompt = `Create a Master Story Outline for a ${durationVal} cartoon (${expectedChapters} chapters, ${expectedParts} parts) based on the plot: "${story_plot}". Ensure each part has a rich, detailed outline description.`;

      const response = await executeWithKeyRotation(req, async (ai) => {
        return await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.7,
          }
        });
      });

      const responseText = response.text || "";
      const parsedData = JSON.parse(responseText.replace(/```json|```/g, '').trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Map timeline error:", error);
      res.status(500).json({ error: error.message || "Failed to map timeline" });
    }
  });

  // 3. API Endpoint to Generate original Plagiarism-Prevened Story & Script in Bengali
  app.post("/api/generate-script", async (req, res) => {
    try {
      const { story_plot, storyInput, language, format, category, duration, story_outline } = req.body;
      
      const storyInputVal = story_plot || storyInput || "";
      if (!storyInputVal) {
        return res.status(400).json({ error: "Story plot/input is required" });
      }

      const languageVal = language || "Bengali";
      const formatVal = format || "Dialogue";
      const categoryVal = category || "Moral";
      const durationVal = duration || "5m";

      const formatRequirement = formatVal === 'Combined' 
        ? "COMBINED STORYTELLING: Every single scene MUST START with a 'narration' line (intro point description). Then, follow up with a mix of 'dialogue' (character lines) and 'narration' (storytelling/action descriptions) throughout the scene to create a professional full-length script feel."
        : formatVal === 'Narration'
        ? "NARRATION FOCUS: The script should strictly feature a storyteller or narrator describing events and lessons (line type: 'narration')."
        : "DIALOGUE FOCUS: The script should strictly emphasize active conversations between characters (line type: 'dialogue').";

      const outlineContext = story_outline ? `\nCRITICAL: FOLLOW THIS MASTER STORY OUTLINE EXACTLY:\n${JSON.stringify(story_outline)}` : "";

      // Calculate Chapters
      let expectedChapters = 3;
      const cleanDuration = String(durationVal).toLowerCase().trim();
      if (cleanDuration.includes("5") && !cleanDuration.includes("15") && !cleanDuration.includes("25")) {
        expectedChapters = 3;
      } else if (cleanDuration.includes("10")) {
        expectedChapters = 5;
      } else if (cleanDuration.includes("15")) {
        expectedChapters = 7;
      } else if (cleanDuration.includes("20")) {
        expectedChapters = 9;
      } else if (cleanDuration.includes("25")) {
        expectedChapters = 11;
      } else if (cleanDuration.includes("30")) {
        expectedChapters = 13;
      } else {
        const parsedMin = parseInt(cleanDuration) || 5;
        expectedChapters = Math.max(3, Math.round(parsedMin / 2.5));
      }

      const systemInstruction = `You are a World-Class Cinematic Scriptwriter.
Your task is to generate a complete, professional cartoon script in ${languageVal}.
${outlineContext}

STRICT GENERATION RULES:
- FORMAT STYLE: ${formatRequirement}
- ZERO PLAGIARISM POLICY: NEVER COPY specific names, dialogues, or unique sentences from the user's input.
- SPIRIT SIMILARITY: Maintain the "Core Spirit" and "Plot Arc" of the user's story to ensure the result is exactly what they wanted.
- TRANSFORMATIVE DIALOGUE: You MUST write entirely fresh dialogue in your own words (using regional dialects if applicable) to ensure the script is 100% original and safe for YouTube.
- BENGALI DIALECT: If [LANGUAGE] is Bengali, use an expressive "Village Dialect" (আঞ্চলিক লোকজ ভাষা) for dialogues to make it sound catchy, funny, and cinematic. Use natural spoken tones, avoiding textbook formal Bengali.
- Generate exactly ${expectedChapters} Chapters (each with exactly 4 Scenes).
- For each Scene, provide:
  1. A detailed visual "scene_description".
  2. A list of "lines" (dialogue or SFX).
  3. Realistic "duration" for each line (e.g. "2.4s").
- Use "SFX NOTE" for non-spoken sounds with "(0s)".
- "ai_background_prompt_bengali" must strictly describe the environment ONLY (no characters).

TARGET JSON FORMAT:
{
  "story_title": "...",
  "total_spoken_duration": "...",
  "chapters": [
    {
      "chapter_number": Number,
      "chapter_title": "...",
      "scenes": [
        {
          "scene_number": Number,
          "scene_description": "...",
          "lines": [
            { "character": "...", "text": "...", "duration": "...", "type": "dialogue | narration" }
          ],
          "voice_tone": "...",
          "ai_background_prompt_bengali": "Bengali prompt for environment ONLY",
          "character_movement": "...",
          "camera_movement": "...",
          "bgm_tag": "...",
          "sfx_tag": "..."
        }
      ]
    }
  ]
}`;

      const prompt = `Generate a cinematic animation script based on:
- [STORY_PLOT]: "${storyInputVal}"
- [LANGUAGE]: "${languageVal}"
- [DURATION]: "${durationVal}"

Follow the story outline and character mapping. Generate exactly ${expectedChapters} chapters, with exactly 4 scenes each. Calculate realistic durations for each line.`;

      const response = await executeWithKeyRotation(req, async (ai) => {
        return await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.85,
          }
        });
      });

      const responseText = response.text || "";
      
      // Robust JSON extraction using stack-based brace matching or identifying the LARGEST JSON object
      function extractJson(text: string) {
        // Try simple extraction first
        const first = text.indexOf('{');
        const last = text.lastIndexOf('}');
        if (first === -1 || last === -1) return null;
        
        let candidate = text.substring(first, last + 1).trim();
        try {
          return JSON.parse(candidate);
        } catch (e) {
          // If first-to-last fails, it might be multiple objects. 
          // Let's try to find the first complete object starting from 'first'
          let braceCount = 0;
          let started = false;
          for (let i = first; i < text.length; i++) {
            if (text[i] === '{') {
              braceCount++;
              started = true;
            } else if (text[i] === '}') {
              braceCount--;
            }
            if (started && braceCount === 0) {
              try {
                return JSON.parse(text.substring(first, i + 1));
              } catch (e2) {}
            }
          }
          // If that fails, try the last object found via lastIndexOf
          const lastFirst = text.lastIndexOf('{');
          if (lastFirst !== -1 && lastFirst < last) {
            try {
              return JSON.parse(text.substring(lastFirst, last + 1));
            } catch (e3) {}
          }
          throw e; // Rethrow original error if all surgical attempts fail
        }
      }

      const parsedData = extractJson(responseText);
      if (!parsedData) {
        throw new Error("JSON response not found in model output.");
      }

      res.json(parsedData);
    } catch (error: any) {
      console.error("Generate script error:", error);
      res.status(500).json({ error: error.message || "Failed to generate story script" });
    }
  });

  // 2. API Endpoint to Generate Custom High-Quality Cartoon Thumbnail
  app.post("/api/generate-thumbnail", async (req, res) => {
    const { title, context } = req.body;

    // Keyword based smart helper to select gorgeous illustrated fallback template instantly
    function getSmartFallbackImage(t: string, c: string): string {
      const textToSearch = `${t} ${c || ""}`.toLowerCase();
      
      if (textToSearch.includes("ভূত") || textToSearch.includes("পেত্নী") || textToSearch.includes("ভয়") || textToSearch.includes("রাক্ষস") || textToSearch.includes("ডাইনি") || textToSearch.includes("অন্ধকার") || textToSearch.includes("কঙ্কাল") || textToSearch.includes("কবর")) {
        // Spooky horror theme
        return "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=80&w=800&auto=format&fit=crop";
      }
      if (textToSearch.includes("পাখি") || textToSearch.includes("টুনি") || textToSearch.includes("কাক") || textToSearch.includes("চড়ুই") || textToSearch.includes("গাছ") || textToSearch.includes("ডিম") || textToSearch.includes("বাসা")) {
        // Birds / Animal theme
        return "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?q=80&w=800&auto=format&fit=crop";
      }
      if (textToSearch.includes("চাষ") || textToSearch.includes("কৃষক") || textToSearch.includes("গ্রাম") || textToSearch.includes("নদী") || textToSearch.includes("গরিব") || textToSearch.includes("সোনার") || textToSearch.includes("টাটকা")) {
        // Indian/Bengal village scenic cartoon vibe
        return "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop";
      }
      if (textToSearch.includes("বাঘ") || textToSearch.includes("সিংহ") || textToSearch.includes("শিয়াল") || textToSearch.includes("জঙ্গল") || textToSearch.includes("পশু") || textToSearch.includes("বানর") || textToSearch.includes("ভাল্লুক")) {
        // Majestic Jungle wildlife cartoon
        return "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?q=80&w=800&auto=format&fit=crop";
      }
      if (textToSearch.includes("পরী") || textToSearch.includes("জাদু") || textToSearch.includes("রাজা") || textToSearch.includes("রাজপুত্র") || textToSearch.includes("রাজকন্যা") || textToSearch.includes("প্রাসাদ") || textToSearch.includes("কাঠি")) {
        // Golden palace / Fantasy adventure
        return "https://images.unsplash.com/photo-1599733589046-9b8308b5b50d?q=80&w=800&auto=format&fit=crop";
      }
      
      // Gorgeous 3D vivid cartoon style default imagery
      return "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop";
    }

    try {
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      // We format a highly descriptive prompt for high-contrast cartoon, animation, Bengali folktale comic illustration style
      const imagePrompt = `Creative 3D Cartoon Disney/Pixar styled highly detailed vibrant 16:9 widescreen YouTube thumbnail illustration. Topic: "${title}". Description: "${context || 'Indian Bengali animated cartoon folktale story'}" with glowing magical effects, clear expressive characters, rich colors, ultra high resolution cinematic lighting, no text overlapping.`;

      console.log("Generating thumbnail with prompt:", imagePrompt);
      const response = await executeWithKeyRotation(req, async (ai) => {
        return await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: {
            parts: [{ text: imagePrompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9"
            }
          }
        });
      });

      let base64Image = "";
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            base64Image = part.inlineData.data;
            break;
          }
        }
      }

      if (base64Image) {
        res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
      } else {
        // Fallback placeholder with nice design if image generation returned empty part
        res.json({ 
          imageUrl: getSmartFallbackImage(title, context),
          fallback: true
        });
      }
    } catch (error: any) {
      console.log("Thumbnail generation error caught successfully. Serving gorgeous matching cartoon fallback photo.", error.message);
      res.json({
        imageUrl: getSmartFallbackImage(title, context),
        fallback: true,
        message: error.message
      });
    }
  });

  // 3. API Endpoint to Generate High-Quality Voice (Text-To-Speech)
  app.post("/api/generate-voice", async (req, res) => {
    try {
      const { text, voiceName, rate, pitch } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      // Valid prebuilt voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
      const activeVoice = voiceName || "Kore";
      const speedNote = rate ? (rate > 1.1 ? "Speak slightly faster." : rate < 0.9 ? "Speak slowly and clearly." : "") : "";
      const pitchNote = pitch ? (pitch > 1.1 ? "Use a higher, more energetic cartoon pitch." : pitch < 0.9 ? "Use a deeper, more serious tone." : "") : "";

      console.log(`Generating TTS audio with voice ${activeVoice} for text: "${text.substring(0, 30)}..."`);
      const response = await executeWithKeyRotation(req, async (ai) => {
        return await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: `High-fidelity, professionally narrated animated cartoon voice. The speech MUST be crystal clear, perfectly pronounced, and human-like. Avoid all metallic, robotic, or jittery artifacts. Ensure the tone matches a warm, engaging children's storyteller with slow, crisp Bengali elocution. Text: ${text}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: activeVoice },
              },
            },
          },
        });
      });

      let base64Audio = "";
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            base64Audio = part.inlineData.data;
            break;
          }
        }
      }

      if (base64Audio) {
        res.json({ audioBase64: base64Audio });
      } else {
        res.status(500).json({ error: "No voice audio synthesized by the model" });
      }
    } catch (error: any) {
      console.error("TTS audio generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate high quality voiceover" });
    }
  });

  // Vite Integration for full-stack build and dev setups
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PROMPT GEN AI server running on port ${PORT}`);
  });
}

startServer();
