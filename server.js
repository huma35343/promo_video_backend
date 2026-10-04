const express = require('express');
const cors = require('cors');
const Replicate = require('replicate');

const app = express();
app.use(cors());
app.use(express.json());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.post('/generate-video', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Call Replicate model for video generation
    const output = await replicate.run(
      "minimax/video-01",
      {
        input: {
          prompt: prompt
        }
      }
    );

    res.json({ videoUrl: output });
  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({ error: 'Failed to generate video' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
        
