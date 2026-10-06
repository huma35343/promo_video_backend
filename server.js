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
    const prompt = (req.body && req.body.prompt) ? req.body.prompt.trim() : "";
    const voiceText = (req.body && req.body.voiceText) ? req.body.voiceText.trim() : "";

    if (!prompt) {
      return res.status(400).json({ error: "Prompt zaroori hai!" });
    }

    let imageUri = null;
    if (req.file) {
      const fileData = fs.readFileSync(req.file.path);
      imageUri = `data:${req.file.mimetype};base64,${fileData.toString('base64')}`;
      fs.unlinkSync(req.file.path);
    }

    console.log('Generating video...');

    const inputParams = {
      prompt: `${prompt}, vertical video, 9:16 aspect ratio, portrait view`,
      prompt_optimizer: true
    };

    if (imageUri) {
      inputParams.first_frame_image = imageUri;
    }

    const output = await replicate.run("minimax/video-01", { input: inputParams });
    const videoUrl = Array.isArray(output) ? output[0] : output;

    const rawVideoPath = path.join(__dirname, 'public', 'raw_video.mp4');
    const file = fs.createWriteStream(rawVideoPath);

    await new Promise((resolve, reject) => {
      https.get(videoUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', reject);
    });

    const speechText = voiceText || "Special promo video!";
    const gtts = new gTTS(speechText, 'hi');
    const audioPath = path.join(__dirname, 'public', 'voice.mp3');

    await new Promise((resolve, reject) => {
      gtts.save(audioPath, (err) => err ? reject(err) : resolve());
    });

    const finalOutputPath = path.join(__dirname, 'public', 'final_promo.mp4');

    ffmpeg()
      .input(rawVideoPath)
      .input(audioPath)
      .outputOptions(['-c:v copy', '-c:a aac', '-shortest'])
      .save(finalOutputPath)
      .on('end', () => {
        const fullVideoUrl = `${req.protocol}://${req.get('host')}/public/final_promo.mp4?t=${Date.now()}`;
        res.json({
          success: true,
          videoUrl: fullVideoUrl,
          message: 'Video generated successfully!'
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
  
