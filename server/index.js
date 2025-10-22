// server/index.js
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json({ limit: '200kb' }));
app.use(express.static('public')); // optional if you host frontend here

const XI_KEY = process.env.XI_API_KEY; // ElevenLabs key (keep secret)
if(!XI_KEY) console.warn('Warning: XI_API_KEY not set. Server TTS will fail until you add it.');


// Map friendly voice IDs (frontend) to actual ElevenLabs voice IDs.
// Replace these placeholders with real voice IDs from your ElevenLabs account.
const VOICE_MAP = {
  male_1: 'voice-id-from-elevenlabs-1',
  male_2: 'voice-id-from-elevenlabs-2',
  male_3: 'voice-id-from-elevenlabs-3',
  male_4: 'voice-id-from-elevenlabs-4',
  female_1: 'voice-id-from-elevenlabs-5',
  female_2: 'voice-id-from-elevenlabs-6',
  female_3: 'voice-id-from-elevenlabs-7',
  female_4: 'voice-id-from-elevenlabs-8'
};

// TTS endpoint -- calls ElevenLabs and returns audio
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice } = req.body;
    if(!text) return res.status(400).json({ error: 'text required' });
    const voiceId = VOICE_MAP[voice] || Object.values(VOICE_MAP)[0];
    if(!XI_KEY) return res.status(500).json({ error: 'server XI API key not configured' });

    // ElevenLabs v1 text-to-speech endpoint
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const payload = {
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: { stability: 0.4, similarity_boost: 0.5 }
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': XI_KEY,
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify(payload)
    });

    if(!r.ok){
      const txt = await r.text();
      console.error('ElevenLabs error', r.status, txt);
      return res.status(502).json({ error: 'ElevenLabs TTS failed', details: txt });
    }

    // Pipe audio back
    res.setHeader('Content-Type', 'audio/mpeg');
    const arrayBuffer = await r.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch(err){
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Lightweight AI-correct endpoint (can be replaced by OpenAI server-side call)
app.post('/api/ai-correct', async (req, res) => {
  const { text } = req.body;
  if(!text) return res.status(400).json({ error: 'text required' });

  // Simple server-side correction (same as frontend fallback)
  let corrected = text.replace(/\s+/g,' ').trim();
  if(/^[A-Za-z]/.test(corrected)){
    corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
    if(!/[.?!]$/.test(corrected)) corrected += '.';
  }
  // (Optional) call OpenAI here if OPENAI_API_KEY is set (example left out for brevity).
  res.json({ corrected });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server running on', PORT));
