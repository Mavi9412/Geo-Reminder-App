import Constants from 'expo-constants';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_AUDIO_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

export const GROQ_API_KEY = Constants.expoConfig?.extra?.groqApiKey || '';

import { getLocationPrefs } from './settingsStorage';

const buildSystemPrompt = (city, country) => {
  const locationContext = city || country
    ? `\n- The user is located in: ${[city, country].filter(Boolean).join(', ')}. When extracting a location name, assume it is in this area UNLESS the user explicitly mentions a different city/country.`
    : '';

  return `You are a reminder parser. Extract reminder details from natural language and return ONLY a JSON object with no extra text.

Return this exact format:
{
  "task": "short task description",
  "location": "place name to search on map",
  "trigger": "arrival" or "exit",
  "radius": 100 or 200 or 500 or 1000
}

Rules:
- trigger is "arrival" unless user says "when I leave" or "after I exit"
- radius: 100m for small shops, 200m default, 500m for large areas, 1000m for neighborhoods
- location should be a searchable place name${locationContext}
- If no location mentioned, set location to ""`;
};

export const parseReminderWithAI = async (userInput) => {
  const prefs = await getLocationPrefs();
  const systemPrompt = buildSystemPrompt(prefs.city, prefs.country);

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      temperature: 0.1,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Groq API error');
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();

  // Extract JSON even if model adds extra text
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not parse AI response');

  return JSON.parse(match[0]);
};

// Groq Whisper — transcribes audio file to text (free, supports Urdu + English)
export const transcribeAudio = async (audioUri) => {
  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  });
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', 'en');
  formData.append('response_format', 'text');

  const response = await fetch(GROQ_AUDIO_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Transcription failed');
  }

  const text = await response.text();
  return text.trim();
};
