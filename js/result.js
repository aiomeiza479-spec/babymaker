// ===== LOAD RESULTS WHEN PAGE OPENS =====
window.onload = function () {
    const babyImage = localStorage.getItem('babyResult');
    const image1Url = localStorage.getItem('image1Url');
    const image2Url = localStorage.getItem('image2Url');

    // If no result found send back to home
    if (!babyImage) {
        window.location.href = 'index.html';
        return;
    }

    // Show parent photos
    if (image1Url) {
        document.getElementById('parentPhoto1').src = image1Url;
    }
    if (image2Url) {
        document.getElementById('parentPhoto2').src = image2Url;
    }

    // Show baby image
    const babyImg = document.getElementById('babyImage');
    const babyLoading = document.getElementById('babyLoading');

    babyImg.onload = function () {
        babyLoading.style.display = 'none';
        babyImg.style.display = 'block';
    };

    babyImg.src = babyImage;
};

// ===== DOWNLOAD BABY IMAGE =====
async function downloadBaby() {
    const babyImageUrl = localStorage.getItem('babyResult');
    if (!babyImageUrl) return;

    // Show download ad overlay first
    showDownloadAd(babyImageUrl);
}

// ===== DOWNLOAD AD OVERLAY =====
function showDownloadAd(babyImageUrl) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'downloadAdOverlay';
    overlay.innerHTML = `
        <div class="download-ad-box">
            <p class="download-ad-title">⬇️ Preparing Your Download...</p>
            <p class="download-ad-subtitle">Your image will download in <span id="countdown">5</span> seconds</p>

            <!-- PASTE YOUR ADSTERRA INTERSTITIAL CODE HERE -->
            <div class="download-ad-placeholder">
                <p>Advertisement</p>
                <div class="ad-box" style="min-height:250px; display:flex; align-items:center; justify-content:center;">
                    <p>Ad loads here</p>
                </div>
            </div>

            <button class="download-now-btn" id="downloadNowBtn" disabled>
                ⬇️ Download Now (5)
            </button>
            <button class="skip-btn" onclick="closeDownloadAd()">
                ✕ Skip
            </button>
        </div>
    `;
    document.body.appendChild(overlay);

    // Countdown timer
    let seconds = 5;
    const countdownEl = document.getElementById('countdown');
    const downloadBtn = document.getElementById('downloadNowBtn');

    const timer = setInterval(() => {
        seconds--;
        countdownEl.textContent = seconds;
        downloadBtn.textContent = `⬇️ Download Now (${seconds})`;

        if (seconds <= 0) {
            clearInterval(timer);
            downloadBtn.disabled = false;
            downloadBtn.textContent = '⬇️ Download Now';
            downloadBtn.onclick = () => {
                closeDownloadAd();
                triggerDownload(babyImageUrl);
            };
        }
    }, 1000);
}

// ===== CLOSE DOWNLOAD AD =====
function closeDownloadAd() {
    const overlay = document.getElementById('downloadAdOverlay');
    if (overlay) overlay.remove();
}

// ===== TRIGGER ACTUAL DOWNLOAD =====
async function downloadBaby() {
    const babyImageUrl = localStorage.getItem('babyResult');
    if (!babyImageUrl) return;

    // Show download ad overlay first
    showDownloadAd(babyImageUrl);
}

// ===== DOWNLOAD AD OVERLAY =====
function showDownloadAd(babyImageUrl) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'downloadAdOverlay';
    overlay.innerHTML = `
        <div class="download-ad-box">
            <p class="download-ad-title">⬇️ Preparing Your Download...</p>
            <p class="download-ad-subtitle">Your image will download in <span id="countdown">5</span> seconds</p>

            <!-- PASTE YOUR ADSTERRA INTERSTITIAL CODE HERE -->
            <div class="download-ad-placeholder">
                <p>Advertisement</p>
                <div class="ad-box" style="min-height:250px; display:flex; align-items:center; justify-content:center;">
                    <p>Ad loads here</p>
                </div>
            </div>

            <button class="download-now-btn" id="downloadNowBtn" disabled>
                ⬇️ Download Now (5)
            </button>
            <button class="skip-btn" onclick="closeDownloadAd()">
                ✕ Skip
            </button>
        </div>
    `;
    document.body.appendChild(overlay);

    // Countdown timer
    let seconds = 5;
    const countdownEl = document.getElementById('countdown');
    const downloadBtn = document.getElementById('downloadNowBtn');

    const timer = setInterval(() => {
        seconds--;
        countdownEl.textContent = seconds;
        downloadBtn.textContent = `⬇️ Download Now (${seconds})`;

        if (seconds <= 0) {
            clearInterval(timer);
            downloadBtn.disabled = false;
            downloadBtn.textContent = '⬇️ Download Now';
            downloadBtn.onclick = () => {
                closeDownloadAd();
                triggerDownload(babyImageUrl);
            };
        }
    }, 1000);
}

// ===== CLOSE DOWNLOAD AD =====
function closeDownloadAd() {
    const overlay = document.getElementById('downloadAdOverlay');
    if (overlay) overlay.remove();
}

// ===== TRIGGER ACTUAL DOWNLOAD =====
async function triggerDownload(babyImageUrl) {
    try {
        const response = await fetch(babyImageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'my-babymaker-baby.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        window.open(babyImageUrl, '_blank');
    }
}

// ===== SHARE FUNCTIONS =====

// TikTok — saves image to device
function shareTikTok() {
    downloadBaby();
    setTimeout(() => {
        alert('Image saved! Now open TikTok and upload it 🎵');
    }, 1000);
}

// WhatsApp share
function shareWhatsApp() {
    const text = encodeURIComponent(
        'I used AI to see what my future baby looks like 😍👶 Try it yourself: https://babymaker.fun'
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

// Instagram — saves image to device
function shareInstagram() {
    downloadBaby();
    setTimeout(() => {
        alert('Image saved! Now open Instagram and share it to your story 📸');
    }, 1000);
}

// Twitter share
function shareTwitter() {
    const text = encodeURIComponent(
        'I used AI to see what my future baby looks like 😭👶 The result actually shocked me 💀 Try it yourself: https://babymaker.fun'
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

// Facebook share
function shareFacebook() {
    const url = encodeURIComponent('https://babymaker.fun');
    window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        '_blank'
    );
}

// Snapchat — saves image to device
function shareSnapchat() {
    downloadBaby();
    setTimeout(() => {
        alert('Image saved! Now open Snapchat and share it 👻');
    }, 1000);
}

// ===== GO HOME =====
function goHome() {
    window.location.href = 'index.html';
}