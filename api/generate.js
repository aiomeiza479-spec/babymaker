import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    let body = req.body;
    if (typeof body === "string") {
        try { body = JSON.parse(body); } catch(e) {
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
            contents: [{
                parts: [
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: image1Base64
                        }
                    },
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: image2Base64
                        }
                    },
                    {
                        text: `Analyze the facial features, skin tone, eye colors, hair texture, and ethnicity of both individuals in these photos. Write a highly descriptive image generation prompt to create a realistic photo of their single biological child around 10 years old. Randomize the gender. The child must seamlessly inherit a natural blend of both parents traits. If parents are real humans use photorealistic photography style. If they are animated or fictional characters match their visual style. Include: half-body portrait from waist up, soft warm natural lighting, blurred background, only one child visible, no text, no watermarks, 8K resolution. Return ONLY the final detailed prompt text with no introduction or explanation.`
                    }
                ]
            }]
        });

        const blendedPrompt = analysisResponse.candidates[0].content.parts[0].text;
        console.log("Generated prompt:", blendedPrompt);

        // Step 2 — Generate baby image using the prompt
        console.log("Step 2: Generating baby image...");

        const imageResponse = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp-image-generation",
            contents: [{
                parts: [
                    {
                        text: blendedPrompt
                    }
                ]
            }],
            config: {
                responseModalities: ["TEXT", "IMAGE"]
            }
        });

        const parts = imageResponse.candidates[0].content.parts;
        const imagePart = parts.find(part => part.inlineData);

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