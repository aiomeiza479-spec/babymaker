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

        const getMimeType = (base64String) => {
            if (base64String.startsWith('/9j/')) return 'image/jpeg';
            if (base64String.startsWith('iVBORw0KGgo')) return 'image/png';
            return 'image/jpeg';
        };

        // Step 1 — Analyze parents with Gemini text model
        console.log("Step 1: Analyzing parents...");

        const analysisResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
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
                        text: `Analyze the facial features, skin tone, eye colors, hair texture, and ethnicity of both individuals. Write a detailed image generation prompt for their biological child around 10 years old. Randomize the gender. The child must blend both parents features naturally. Use photorealistic style for real humans, match animation style for fictional characters. Include: half-body portrait from waist up, soft warm natural lighting, blurred background, only one child, no text, no watermarks, 8K resolution. Return ONLY the prompt text with no introduction.`
                    }
                ]
            }]
        });

        const blendedPrompt = analysisResponse.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!blendedPrompt) {
            return res.status(500).json({
                error: "Could not analyze parent features. Please try again."
            });
        }

        console.log("Generated prompt:", blendedPrompt);

        // Step 2 — Generate image with Hugging Face FLUX
        console.log("Step 2: Generating with HuggingFace...");

        let imageData = null;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            const hfResponse = await fetch(
                "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        inputs: blendedPrompt,
                        parameters: {
                            num_inference_steps: 4,
                            width: 512,
                            height: 512
                        }
                    })
                }
            );

            console.log("HF Status:", hfResponse.status);

            // Model still loading — wait and retry
            if (hfResponse.status === 503) {
                attempts++;
                console.log(`Model loading, attempt ${attempts}. Waiting 15 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 15000));
                continue;
            }

            if (!hfResponse.ok) {
                const errorText = await hfResponse.text();
                throw new Error(`HuggingFace error: ${errorText}`);
            }

            // Success — convert to base64
            const arrayBuffer = await hfResponse.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            imageData = `data:image/jpeg;base64,${base64}`;
            console.log("Image generated successfully!");
            break;
        }

        if (!imageData) {
            return res.status(503).json({
                error: "Image service is busy. Please try again in 30 seconds."
            });
        }

        return res.status(200).json({ output: imageData });

    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json({
            error: error.message || "Something went wrong."
        });
    }
}