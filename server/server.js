import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Predefined 8 realistic voices (replace with your ElevenLabs voice IDs)
const VOICES = {
  male_1: "lyPbHf3pO5t4kYZYenaY",
  male_2: "6MoEUz34rbRrmmyxgRm4",
  male_3: "nZrzehiJO7UYXi9GOxS8",
  male_4: "Hmz0MdhDqv9vPpSMfDkh",
  female_1: "fG9s0SXJb213f4UxVHyG",
  female_2: "pGYsZruQzo8cpdFVZyJc",
  female_3: "MF4J4IDTRo0AxOO4dpFR",
  female_4: "OwA6IqdLakQOd19pSLOn"
};

// TTS endpoint
app.post('/api/tts', async (req, res) => {
  const { text, voice, lang, rate=1, pitch=1 } = req.body;
  if(!text || !voice || !VOICES[voice]) return res.status(400).json({error:'Invalid parameters'});
  
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICES[voice]}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVEN_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        voice_settings: { stability: 0.7, similarity_boost: 0.75 }
      })
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader('Content-Type','audio/mpeg');
    res.send(buffer);
  } catch(err){
    console.error(err);
    res.status(500).json({error:'TTS failed'});
  }
});

// Simple AI correction endpoint (optional)
app.post('/api/ai-correct', async (req,res)=>{
  const { text } = req.body;
  // Dummy example: return text as corrected
  res.json({ corrected: text });
});

app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
