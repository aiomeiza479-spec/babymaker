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

        // Step 1 — Analyze both parents and generate a detailed child description
        console.log("Step 1: Analyzing parent features...");

        const analysisResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                { inlineData: { mimeType: "image/jpeg", data: image1Base64 } },
                { inlineData: { mimeType: "image/jpeg", data: image2Base64 } },
                `Analyze the facial features, skin tone, eye colors, hair texture, and ethnicity of both individuals in these photos. Write a highly descriptive image generation prompt to create a realistic photo of their single biological child around 10 years old. Randomize the gender. The child must seamlessly inherit a natural blend of both parents traits. If parents are real humans use photorealistic photography style. If they are animated or fictional characters match their visual style. Include: half-body portrait from waist up, soft warm natural lighting, blurred background, only one child visible, no text, no watermarks, 8K resolution. Return ONLY the final detailed prompt text with no introduction or explanation.`
            ]
        });

        const blendedPrompt = analysisResponse.text;
        console.log("Generated prompt:", blendedPrompt);

        if (!blendedPrompt) {
            return res.status(500).json({ error: "Could not create facial analysis prompt blueprint." });
        }

        // Step 2 — Generate baby image with Automated Retry Logic
        console.log("Step 2: Generating baby image...");

        let imageResponse;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                imageResponse = await ai.models.generateImage({
                    model: "gemini-2.5-flash-image",
                    prompt: blendedPrompt,
                    config: {
                        numberOfImages: 1,
                        aspectRatio: "1:1",
                        outputMimeType: "image/jpeg",
                    },
                });
                // If successful, exit the loop instantly
                break; 
            } catch (imgError) {
                attempts++;
                console.warn(`Attempt ${attempts} failed: ${imgError.message}`);
                
                // Check if it's a traffic error (503, UNAVAILABLE, or high demand)
                const isRateError = imgError.message.includes("503") || 
                                    imgError.message.toLowerCase().includes("demand") || 
                                    imgError.message.includes("UNAVAILABLE");

                if (attempts < maxAttempts && isRateError) {
                    console.log("Server busy. Waiting 2 seconds before retrying...");
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    throw imgError;
                }
            }
        }

        // Safely extract the generated image data
        const generatedImagesArray = imageResponse?.generatedImages;
        if (!generatedImagesArray || generatedImagesArray.length === 0 || !generatedImagesArray[0]?.imageBytes) {
            return res.status(500).json({
                error: "No image bytes returned from generation engine. Please try again."
            });
        }

        const base64Bytes = generatedImagesArray[0].imageBytes;
        const outputBase64 = `data:image/jpeg;base64,${base64Bytes}`;
        
        return res.status(200).json({ output: outputBase64 });

    } catch (error) {
        console.error("Generation error:", error.message);
        return res.status(500).json({
            error: error.message || "Something went wrong during code execution."
        });
    }
}
