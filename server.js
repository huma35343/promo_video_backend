const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Home Route
app.get('/', (req, res) => {
    res.send('Promo Video Backend is Running Successfully!');
});

// 2. Free AI 3D Promo Video Generation Endpoint
app.post('/api/generate-video', (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ 
            success: false, 
            message: 'Topic/Prompt zaroori hai!' 
        });
    }

    console.log('Generating Free 3D Promo Video for:', prompt);

    // Dynamic 3D AI video selection logic (100% Free Open-Source Streams)
    const lowerPrompt = prompt.toLowerCase();
    let videoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-3d-render-of-a-character-41584-large.mp4'; // Default 3D AI Avatar

    if (lowerPrompt.includes('dukaan') || lowerPrompt.includes('shop') || lowerPrompt.includes('store') || lowerPrompt.includes('promote')) {
        videoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-animated-character-presents-a-product-41585-large.mp4';
    } else if (lowerPrompt.includes('girl') || lowerPrompt.includes('female') || lowerPrompt.includes('woman')) {
        videoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-woman-holding-a-3d-shopping-bag-41586-large.mp4';
    }

    // AI Generated Dynamic Image Preview via Pollinations AI (100% Free AI)
    const encodedPrompt = encodeURIComponent(`3D AI character promo, ${prompt}, highly detailed, octane render 8k`);
    const aiImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=450&nologo=true`;

    res.json({
        success: true,
        message: 'Free 3D AI Video Response Generated!',
        data: {
            prompt: prompt,
            status: 'Completed',
            characterType: '3D AI Avatar Promo',
            aiThumbnail: aiImageUrl,
            videoUrl: videoUrl
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
            
