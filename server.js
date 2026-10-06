const express = require('express');
const cors = require('cors');
const Replicate = require('replicate');
const gTTS = require('gtts');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());
app.use(express.json());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send({ status: 'Server is Online & Ready' });
});

app.post('/generate-promo', async (req, res) => {
  try {
    const { prompt, voiceText } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt zaroori hai!' });
    }

    console.log('Generating AI Video Clip...');

    // 1. Generate Video Clip using Replicate
    const output = await replicate.run(
      "minimax/video-01",
      {
        input: {
          prompt: prompt,
          prompt_optimizer: true
        }
      }
    );

    const videoUrl = Array.isArray(output) ? output[0] : output;
    console.log('Video generated:', videoUrl);

    // 2. Generate Voiceover Audio (If text provided)
    let audioPath = null;
    if (voiceText) {
      console.log('Generating Voiceover...');
      const speechText = voiceText || "25% off discount on all clothing items!";
      const gtts = new gTTS(speechText, 'hi'); // Hindi/English voiceover
      audioPath = path.join(__dirname, 'voiceover.mp3');
      
      await new Promise((resolve, reject) => {
        gtts.save(audioPath, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('Voiceover saved at:', audioPath);
    }

    // Response sending generated assets
    res.json({
      success: true,
      videoUrl: videoUrl,
      audioGenerated: !!audioPath,
      message: 'Video aur Voiceover safaltapoorvak tayar ho gaye hain!'
    });

  } catch (error) {
    console.error('Error generating promo:', error);
    res.status(500).json({ error: error.message || 'Server error occurred' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
        
