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
            const reader = new FileReader();
            reader.onload = function (e) {
                const preview = document.getElementById(previewId);
                preview.innerHTML = `<img src="${e.target.result}" alt="preview">`;

                // Store image data
                if (inputId === 'upload1') {
                    image1 = e.target.result;
                } else {
                    image2 = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    };
}

// ===== GENERATE BABY FUNCTION =====
async function generateBaby() {

    // Check both photos are uploaded
    if (!image1 || !image2) {
        document.getElementById('errorMsg').textContent = 
        '⚠️ Please upload both photos first';
        return;
    }

    // Clear error message
    document.getElementById('errorMsg').textContent = '';

    // Disable generate button
    const btn = document.getElementById('generateBtn');
    btn.disabled = true;
    btn.textContent = '✨ Generating...';

    // Show loading ad section
    document.getElementById('adLoading').style.display = 'block';

    // Update loading messages every few seconds
    const messages = [
        'Analyzing facial features... ✨',
        'Mixing your DNA... 🧬',
        'Creating your baby... 👶',
        'Almost ready... 🎉'
    ];
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
        if (msgIndex < messages.length) {
            document.getElementById('loadingText').textContent = 
            messages[msgIndex];
            msgIndex++;
        }
    }, 2000);

    try {
        // Convert base64 images to blobs for sending
        const blob1 = await base64ToBlob(image1);
        const blob2 = await base64ToBlob(image2);

        // Upload images to Cloudinary first
        const imageUrl1 = await uploadToCloudinary(blob1);
        const imageUrl2 = await uploadToCloudinary(blob2);

        // Send to Replicate AI to generate baby
        const babyImageUrl = await generateWithReplicate(imageUrl1, imageUrl2);

        // Stop loading messages
        clearInterval(msgInterval);

        // Save result and go to result page
        localStorage.setItem('babyResult', babyImageUrl);
        localStorage.setItem('image1Url', imageUrl1);
        localStorage.setItem('image2Url', imageUrl2);
        window.location.href = 'result.html';

    } catch (error) {
        clearInterval(msgInterval);
        document.getElementById('errorMsg').textContent = 
        '❌ Something went wrong. Please try again.';
        document.getElementById('adLoading').style.display = 'none';
        btn.disabled = false;
        btn.textContent = '✨ Generate Our Baby';
    }
}

// ===== CONVERT BASE64 TO BLOB =====
function base64ToBlob(base64) {
    return new Promise((resolve) => {
        const parts = base64.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        resolve(new Blob([uInt8Array], { type: contentType }));
    });
}

// ===== UPLOAD IMAGE TO CLOUDINARY =====
async function uploadToCloudinary(blob) {
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', 'YOUR_CLOUDINARY_UPLOAD_PRESET');

    const response = await fetch(
        'https://api.cloudinary.com/v1_1/YOUR_CLOUDINARY_CLOUD_NAME/image/upload',
        { method: 'POST', body: formData }
    );
    const data = await response.json();
    return data.secure_url;
}

// ===== GENERATE BABY WITH REPLICATE AI =====
async function generateWithReplicate(imageUrl1, imageUrl2) {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image1: imageUrl1, image2: imageUrl2 })
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