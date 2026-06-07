// ===== STORE UPLOADED IMAGES =====
let image1 = null;
let image2 = null;

// ===== TRIGGER FILE UPLOAD =====
function triggerUpload(inputId, previewId) {
    const input = document.getElementById(inputId);
    input.click();
    input.onchange = function () {
        const file = input.files[0];
        if (file) {
            compressImage(file, function(compressedBase64) {
                const preview = document.getElementById(previewId);
                preview.innerHTML = `<img src="${compressedBase64}" alt="preview">`;
                if (inputId === 'upload1') {
                    image1 = compressedBase64;
                } else {
                    image2 = compressedBase64;
                }
            });
        }
    };
}

// ===== COMPRESS IMAGE BEFORE SENDING =====
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            
            // Max size 800px
            let width = img.width;
            let height = img.height;
            if (width > 800) {
                height = (height * 800) / width;
                width = 800;
            }
            if (height > 800) {
                width = (width * 800) / height;
                height = 800;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress to JPEG at 70% quality
            const compressed = canvas.toDataURL('image/jpeg', 0.7);
            callback(compressed);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ===== GENERATE BABY FUNCTION =====
async function generateBaby() {

    if (!image1 || !image2) {
        document.getElementById('errorMsg').textContent =
        '⚠️ Please upload both photos first';
        return;
    }

    document.getElementById('errorMsg').textContent = '';

    const btn = document.getElementById('generateBtn');
    btn.disabled = true;
    btn.textContent = '✨ Generating...';

    document.getElementById('adLoading').style.display = 'block';

    const messages = [
        'Analyzing facial features... ✨',
        'Mixing your DNA... 🧬',
        'Creating your child... 👶',
        'Almost ready... 🎉'
    ];
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
        if (msgIndex < messages.length) {
            document.getElementById('loadingText').textContent =
            messages[msgIndex];
            msgIndex++;
        }
    }, 4000);

    try {
        // Upload images to Cloudinary first
        const imageUrl1 = await uploadToCloudinary(image1);
        const imageUrl2 = await uploadToCloudinary(image2);

        // Generate baby with Gemini
        const babyImageUrl = await generateWithGemini(image1, image2);

        clearInterval(msgInterval);

        // Save results
        localStorage.setItem('babyResult', babyImageUrl);
        localStorage.setItem('image1Url', imageUrl1);
        localStorage.setItem('image2Url', imageUrl2);
        window.location.href = 'result.html';

    } catch (error) {
        clearInterval(msgInterval);
        document.getElementById('errorMsg').textContent =
        '❌ ' + (error.message || 'Something went wrong. Please try again.');
        document.getElementById('adLoading').style.display = 'none';
        btn.disabled = false;
        btn.textContent = '✨ Generate Our Baby';
    }
}

// ===== UPLOAD TO CLOUDINARY =====
async function uploadToCloudinary(base64Image) {
    const formData = new FormData();
    formData.append('file', base64Image);
    formData.append('upload_preset', 'YOUR_CLOUDINARY_UPLOAD_PRESET');

    const response = await fetch(
        'https://api.cloudinary.com/v1_1/YOUR_CLOUDINARY_CLOUD_NAME/image/upload',
        { method: 'POST', body: formData }
    );
    const data = await response.json();
    return data.secure_url;
}

// ===== GENERATE WITH GEMINI =====
async function generateWithGemini(base64Image1, base64Image2) {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            image1: base64Image1,
            image2: base64Image2
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
    }

    const data = await response.json();

    if (!data.output) {
        throw new Error('No image generated. Please try again.');
    }

    return data.output;
}