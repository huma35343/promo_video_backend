
        const express = require('express');
const cors = require('cors');
const Replicate = require('replicate');
const gTTS = require('gtts');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');
const https = require('https');
const multer = require('multer');

ffmpeg.setFfmpegPath(ffmpegPath);

const upload = multer({ dest: 'uploads/' });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

if (!fs.existsSync('./public')) fs.mkdirSync('./public');
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.get('/', (req, res) => {
  res.send({ status: 'Server is Online & Ready' });
});

app.post('/generate-promo', upload.single('image'), async (req, res) => {
  try {
    // Prompt aur VoiceText ko sahi se read karein (Fallback ke saath)
    const prompt = req.body && req.body.prompt ? req.body.prompt.trim() : "";
    const voiceText = req.body && req.body.voiceText ? req.body.voiceText.trim() : "";
    const voiceGender = req.body && req.body.voiceGender ? req.body.voiceGender : "female";

    if (!prompt) {
      return res.status(400).json({ error: "Please enter a valid video prompt." });
    }

    let imageUri = null;
    if (req.file) {
      const fileData = fs.readFileSync(req.file.path);
      imageUri = `data:${req.file.mimetype};base64,${fileData.toString('base64')}`;
      fs.unlinkSync(req.file.path); // Clean up temp file
    }

    console.log('Generating 15-sec multi-shot video...');

    // 1. Generate 3 Clips of 5 seconds each (Vertical 9:16)
    const videoPaths = [];
    for (let i = 0; i < 3; i++) {
      console.log(`Generating Clip ${i + 1}/3...`);
      const inputParams = {
        prompt: `${prompt}, clip ${i+1}, vertical video, 9:16 aspect ratio, portrait view`,
        prompt_optimizer: true
      };

      if (imageUri) {
        inputParams.first_frame_image = imageUri;
      }

      const output = await replicate.run("minimax/video-01", { input: inputParams });
      const videoUrl = Array.isArray(output) ? output[0] : output;

      const clipPath = path.join(__dirname, 'public', `clip_${i}.mp4`);
      const file = fs.createWriteStream(clipPath);

      await new Promise((resolve, reject) => {
        https.get(videoUrl, (response) => {
          response.pipe(file);
          file.on('finish', () => file.close(resolve));
        }).on('error', reject);
      });

      videoPaths.push(clipPath);
    }

    // 2. Stitch Clips using FFmpeg
    const listFilePath = path.join(__dirname, 'public', 'files.txt');
    const fileContent = videoPaths.map(p => `file '${p}'`).join('\n');
    fs.writeFileSync(listFilePath, fileContent);

    const mergedVideoPath = path.join(__dirname, 'public', 'merged_15sec.mp4');

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(listFilePath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions('-c copy')
        .save(mergedVideoPath)
        .on('end', resolve)
        .on('error', reject);
    });

    // 3. Generate Voiceover Audio
    const speechText = voiceText || "Special announcement video!";
    const langCode = 'hi'; 
    const gtts = new gTTS(speechText, langCode);
    const audioPath = path.join(__dirname, 'public', 'voice.mp3');

    await new Promise((resolve, reject) => {
      gtts.save(audioPath, (err) => err ? reject(err) : resolve());
    });

    // 4. Final Audio + Video Merge
    const finalOutputPath = path.join(__dirname, 'public', 'final_15sec_promo.mp4');

    ffmpeg()
      .input(mergedVideoPath)
      .input(audioPath)
      .outputOptions(['-c:v copy', '-c:a aac', '-shortest'])
      .save(finalOutputPath)
      .on('end', () => {
        const fullVideoUrl = `${req.protocol}://${req.get('host')}/public/final_15sec_promo.mp4?t=${Date.now()}`;
        res.json({
          success: true,
          videoUrl: fullVideoUrl,
          message: '15-second video generated successfully!'
        });
      })
      .on('error', (err) => {
        console.error('FFmpeg merge error:', err);
        res.status(500).json({ error: 'Audio and Video merging failed.' });
      });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'Server error occurred' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
      
