import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    let body = req.body;
    if (typeof body === "string") {
        try {
            body = JSON.parse(body);
        } catch(e) {
            return res.status(400).json({ error: "Invalid request body" });
        }
    }

    const { image1, image2 } = body;

    if (!image1 || !image2) {
        return res.status(400).json({ error: "Both images are required" });
    }

    try {
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });

        const image1Base64 = image1.includes(",") ? image1.split(",")[1] : image1;
        const image2Base64 = image2.includes(",") ? image2.split(",")[1] : image2;

        // Smart mime type detection
        const getMimeType = (base64String) => {
            if (base64String.startsWith('/9j/')) return 'image/jpeg';
            if (base64String.startsWith('iVBORw0KGgo')) return 'image/png';
            return 'image/jpeg';
        };

        // Step 1 — Analyze both parents
        console.log("Step 1: Analyzing parent features...");

        const analysisResponse = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{
                parts: [
                    {
                        inlineData: {
                            mimeType: getMimeType(image1Base64),
                            data: image1Base64
                        }
                    },
                    {
                        inlineData: {
                            mimeType: getMimeType(image2Base64),
                            data: image2Base64
                        }
                    },
                    {
                        text: `Analyze the facial features, skin tone, eye colors, hair texture, and ethnicity of both individuals in these photos. Write a highly descriptive image generation prompt to create a realistic photo of their single biological child around 10 years old. Randomize the gender. The child must seamlessly inherit a natural blend of both parents traits. If parents are real humans use photorealistic photography style. If they are animated or fictional characters match their visual style. Include: half-body portrait from waist up, soft warm natural lighting, blurred background, only one child visible, no text, no watermarks, 8K resolution. Return ONLY the final detailed prompt text with no introduction or explanation.`
                    }
                ]
            }]
        });

        let blendedPrompt = '';
        if (analysisResponse.candidates?.[0]?.content?.parts?.[0]) {
            blendedPrompt = analysisResponse.candidates[0].content.parts[0].text;
        }

        console.log("Generated prompt:", blendedPrompt);

        if (!blendedPrompt) {
            return res.status(500).json({
                error: "Could not analyze parent features. Please try again."
            });
        }

        // Step 2 — Generate baby image with retry logic
        console.log("Step 2: Generating baby image...");

        let imageResponse = null;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            try {
                imageResponse = await ai.models.generateContent({
                    model: "gemini-2.5-flash-image",
                    contents: [{
                        parts: [{
                            text: blendedPrompt
                        }]
                    }],
                    config: {
                        responseModalities: ["TEXT", "IMAGE"]
                    }
                });
                break;
            } catch (imgError) {
                attempts++;
                console.warn(`Attempt ${attempts} failed: ${imgError.message}`);

                const isBusy = imgError.message.includes("503") ||
                               imgError.message.toLowerCase().includes("demand") ||
                               imgError.message.includes("UNAVAILABLE") ||
                               imgError.message.includes("429");

                if (attempts < maxAttempts && isBusy) {
                    const delay = 3000 * attempts;
                    console.log(`Waiting ${delay/1000}s before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    throw imgError;
                }
            }
        }

        if (!imageResponse) {
            return res.status(503).json({
                error: "Service is busy. Please try again in a moment."
            });
        }

        const parts = imageResponse.candidates?.[0]?.content?.parts;
        const imagePart = parts?.find(part => part.inlineData);

        if (!imagePart) {
            return res.status(500).json({
                error: "No image generated. Please try again."
            });
        }

        const outputBase64 = `data:image/jpeg;base64,${imagePart.inlineData.data}`;
        return res.status(200).json({ output: outputBase64 });

    } catch (error) {
        console.error("Generation error:", error.message);
        return res.status(500).json({
            error: error.message || "Something went wrong."
        });
    }
}