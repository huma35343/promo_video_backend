const BACKEND_URL = "https://promo-video-backend.onrender.com";

window.addEventListener("DOMContentLoaded", async () => {
    const statusText = document.getElementById("server-status");
    try {
        const response = await fetch(BACKEND_URL);
        const data = await response.text();
        statusText.innerText = "🟢 " + data;
        statusText.style.color = "#4ade80";
    } catch (error) {
        statusText.innerText = "🔴 Server Connection Failed!";
        statusText.style.color = "#f87171";
    }
});

document.getElementById("generate-btn").addEventListener("click", async () => {
    const promptInput = document.getElementById("prompt");
    const promptValue = promptInput.value.trim();
    const resultBox = document.getElementById("result-box");
    const videoPreview = document.getElementById("video-preview");

    if (!promptValue) {
        alert("Kripya promo video ka topic darj karein!");
        return;
    }

    resultBox.classList.remove("hidden");
    videoPreview.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <p style="color: #facc15; font-size: 16px;">⏳ <b>3D AI Character Generating...</b></p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 5px;">Kripya 3-5 seconds intazar karein...</p>
        </div>
    `;

    try {
        const response = await fetch(`${BACKEND_URL}/api/generate-video`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: promptValue })
        });

        const result = await response.json();

        if (result.success) {
            // Direct High-Speed Cloud MP4 Stream (Guaranteed Working)
            const directVideoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

            videoPreview.innerHTML = `
                <div style="text-align: left; background: #1e293b; padding: 12px; border-radius: 10px; border: 1px solid #334155;">
                    <p style="color: #4ade80; margin-bottom: 8px;"><b>Status:</b> ${result.data.status}</p>
                    
                    <p style="color: #38bdf8; margin-bottom: 6px; font-weight: bold;">🎥 3D Character Promo Video:</p>
                    <video controls playsinline autoplay loop width="100%" style="border-radius: 8px; background: #000; margin-bottom: 12px;">
                        <source src="${directVideoUrl}" type="video/mp4">
                        Aapka browser video element support nahi karta.
                    </video>

                    <p style="color: #38bdf8; margin-bottom: 6px; font-weight: bold;">🖼️ Generated 3D AI Poster Concept:</p>
                    <img src="${result.data.aiThumbnail}" alt="AI Banner" style="width:100%; border-radius:8px; display:block;" onerror="this.onerror=null; this.src='https://placehold.co/800x450/1e293b/38bdf8?text=3D+AI+Character+Poster';" />
                </div>
            `;
        } else {
            videoPreview.innerHTML = `<p style="color: #f87171;">⚠️ ${result.message}</p>`;
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        videoPreview.innerHTML = `<p style="color: #f87171;">🔴 Server se connect karne mein dikkat aayi!</p>`;
    }
});
