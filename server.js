const express = require('express');
const cors = require('cors');
const Replicate = require('replicate');
const gTTS = require('gtts');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');
const https = require('https');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// Public folder ensure karein
if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public');
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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

    // 1. Generate Video from Replicate
    const output = await replicate.run(
      "minimax/video-01",
      {
        input: {
          prompt: prompt + ", vertical video, 9:16 aspect ratio, portrait view",
          prompt_optimizer: true
        }
      }
    );

    const videoUrl = Array.isArray(output) ? output[0] : output;
    
    // Download raw video to server
    const rawVideoPath = path.join(__dirname, 'public', 'raw_video.mp4');
    const file = fs.createWriteStream(rawVideoPath);
    
    await new Promise((resolve, reject) => {
      https.get(videoUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', reject);
    });

    // 2. Generate Voiceover Audio
    const speechText = voiceText || "Special discount offer available now!";
    const gtts = new gTTS(speechText, 'hi');
    const audioPath = path.join(__dirname, 'public', 'voice.mp3');
    
    await new Promise((resolve, reject) => {
      gtts.save(audioPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 3. Merge Audio and Video using FFmpeg
    const finalOutputPath = path.join(__dirname, 'public', 'final_promo.mp4');

    ffmpeg()
      .input(rawVideoPath)
      .input(audioPath)
      .outputOptions(['-c:v copy', '-c:a aac', '-shortest'])
      .save(finalOutputPath)
      .on('end', () => {
        console.log('FFmpeg merging finished!');
        const fullVideoUrl = `${req.protocol}://${req.get('host')}/public/final_promo.mp4?t=${Date.now()}`;
        res.json({
          success: true,
          videoUrl: fullVideoUrl,
          message: 'Video aur Awaaz ek sath jud chuki hain!'
        });
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        res.status(500).json({ error: 'Audio video merge karne mein dikkat aayi.' });
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
  
