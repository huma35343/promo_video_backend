document.getElementById('generate-btn').addEventListener('click', async () => {
    const promptInput = document.getElementById('prompt').value;
    const resultBox = document.getElementById('result-box');
    const videoPreview = document.getElementById('video-preview');

    if (!promptInput) {
        alert('Kripya apna topic dakhil karein!');
        return;
    }

    resultBox.classList.remove('hidden');
    videoPreview.innerHTML = '<p>Video generate ho rahi hai, kripya intezar karein...</p>';

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: promptInput })
        });

        const data = await response.json();

        if (response.ok && data.videoUrl) {
            videoPreview.innerHTML = `<video controls width="100%"><source src="${data.videoUrl}" type="video/mp4"></video>`;
        } else {
            videoPreview.innerHTML = `<p style="color: red;">🔴 ${data.message || 'Server se connect karne mein dikkat aayi!'}</p>`;
        }
    } catch (error) {
        videoPreview.innerHTML = '<p style="color: red;">🔴 Server se connect karne mein dikkat aayi!</p>';
    }
});

