import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({apiKey: "AIzaSyCzWG60wmuclXpBWLTZ11SDR2g0KoCF7-4"});

export async function askAi(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: `Your name is Cha. You are a helpful movie assistant that provides concise and relevant information about movies based on user queries. Limit your responses to 100 words.`,
      temperature: 0.7,
      maxOutputTokens: 300,
    },
  });
  return(response.text);
}

// Sentiment analysis using AI
export async function analyzeSentiment(text) {
  if (!text) return 'neutral';
  try {
    const prompt = `Analyze the sentiment of this review in one word: "positive", "negative", or "neutral". Only respond with one of these three words.

Review: "${text}"`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
        maxOutputTokens: 10,
      },
    });
    
    // Handle different response formats returned by the GenAI SDK
    let responseText = '';
    if (!response) {
      console.warn('Empty AI response');
      return 'neutral';
    }

    // Common SDK shape: response.text
    if (response.text && typeof response.text === 'string') {
      responseText = response.text;
    } else if (response.candidates && Array.isArray(response.candidates) && response.candidates.length > 0) {
      const cand = response.candidates[0];
      // candidate.output_text (older/alternate shapes)
      if (cand.output_text && typeof cand.output_text === 'string') {
        responseText = cand.output_text;
      } else if (cand.message && cand.message.content && Array.isArray(cand.message.content)) {
        responseText = cand.message.content.map((c) => c.text || '').join('');
      } else if (cand.content && Array.isArray(cand.content)) {
        responseText = cand.content.map((c) => c.text || c.records?.map(r => r.text).join('') || '').join('');
      } else if (typeof cand === 'string') {
        responseText = cand;
      }
    } else if (typeof response === 'string') {
      responseText = response;
    } else if (response.output_text && typeof response.output_text === 'string') {
      responseText = response.output_text;
    } else {
      console.warn('Unexpected AI response structure:', response);
      return 'neutral';
    }

    const sentiment = String(responseText).toLowerCase().trim();
    if (sentiment.includes('negative')) return 'negative';
    if (sentiment.includes('positive')) return 'positive';
    return 'neutral';
  } catch (err) {
    // Detect quota / retry info and set a client-side cooldown to avoid repeated failing calls
    try {
      const info = err?.error || err;
      // Look for RetryInfo with retryDelay in details
      if (info && info.details && Array.isArray(info.details)) {
        for (const d of info.details) {
          if (d && d.retryDelay) {
            const sMatch = String(d.retryDelay).match(/(\d+)(?:s)?/);
            const secs = sMatch ? parseInt(sMatch[1], 10) : null;
            if (secs) {
              const until = Date.now() + secs * 1000;
              try { localStorage.setItem('aiCooldownUntil', String(until)); } catch(_){}
              console.warn('AI quota hit. Cooldown set for', secs, 'seconds');
            }
          }
          // Some error shapes include message with 'Please retry in XXs'
          if (d && typeof d === 'string') {
            const m = d.match(/retry in\s*(\d+)s/i);
            if (m) {
              const secs = parseInt(m[1], 10);
              const until = Date.now() + secs * 1000;
              try { localStorage.setItem('aiCooldownUntil', String(until)); } catch(_){}
              console.warn('AI quota hit. Cooldown set for', secs, 'seconds');
            }
          }
        }
      } else if (String(info).toLowerCase().includes('quota') || String(info).toLowerCase().includes('exceeded')) {
        // generic fallback cooldown: 60s
        const until = Date.now() + 60 * 1000;
        try { localStorage.setItem('aiCooldownUntil', String(until)); } catch(_){}
        console.warn('AI quota hit. Cooldown set for 60 seconds');
      }
    } catch (e2) {
      console.warn('Error parsing AI error details', e2);
    }

    // Return null so callers can fall back to non-AI heuristics without throwing
    return null;
  }
}