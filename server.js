const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// 1. Home Route (Status Check)
app.get('/', (req, res) => {
    res.send('Promo Video Backend is Running Successfully!');
});

// 2. Video Generation API Endpoint
app.post('/api/generate-video', (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ 
            success: false, 
            message: 'Topic/Prompt zaroori hai!' 
        });
    }

    console.log('New Video Request Received for:', prompt);

    // Mock Video Response (AI Video Pipeline Payload)
    res.json({
        success: true,
        message: 'Video Generation Request Received Successfully!',
        data: {
            prompt: prompt,
            status: 'Processing',
            characterType: '3D AI Avatar',
            estimatedTime: '15-30 seconds',
            previewUrl: 'https://assets.mixkit.co/videos/preview/mixkit-3d-render-of-a-character-41584-large.mp4'
        }
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
         
