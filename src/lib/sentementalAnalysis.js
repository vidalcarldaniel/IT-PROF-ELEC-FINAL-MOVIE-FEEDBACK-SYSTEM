import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({apiKey: "AIzaSyCzWG60wmuclXpBWLTZ11SDR2g0KoCF7-4"});

export async function askAi(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: `you are a sentiment analysis model that classifies user reviews as positive, negative, or neutral. Respond with a single lowercase word only.
        Limit your response to one word: positive, negative, or neutral.

        trashtalk always results in negative sentiment.
        trashtalk examples: "This movie was terrible and I hated every minute of it.", "I can't believe I wasted my time on this awful film."
        1 word examples: "awful", "horrible", "dreadful", "pathetic", "lame", "disgusting", "abysmal", "atrocious", "embarrassing", "unwatchable", "painful", "nauseating", "insulting", "garbage", "trash", "worst", "ripoff", "disaster", "sucks", "junk", "forgettable", "boring", "disappointing", "mediocre", "cliché", "predictable", "confusing", "slow", "dull", "fluffy", "shallow", "cheesy", "corny", "overhyped", "underwhelming", "forgettable".

        praise always results in positive sentiment.
        praise examples: "I absolutely loved this movie! It was fantastic from start to finish.", "An amazing film with a great story and wonderful characters."

        neutral reviews are neither positive nor negative.
        neutral examples: "The movie was okay, not great but not terrible either.", "It was an average film with some good and some bad moments."

        Template:
        Review:
        """[user review text]"""
        Sentiment:
        [your one-word sentiment response]
      `,
      temperature: 0.7,
      maxOutputTokens: 300,
    },
  });
  return(response.text);
}