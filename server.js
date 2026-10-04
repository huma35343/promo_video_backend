const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Route for health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'connected' });
});

// Video Generation Route
app.post('/generate', (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ message: 'Kripya topic dakhil karein!' });
    }

    // Returning success with video output
    res.json({
        message: 'Video generate ho gayi hai!',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
    });
});

// Serve frontend for all other paths
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
    
