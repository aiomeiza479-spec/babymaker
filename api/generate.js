import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Parse body manually if needed
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch(e) {
            return res.status(400).json({ error: "Invalid request body" });
        }
    }

    const { image1, image2 } = body;

    if (!image1 || !image2) {
        return res.status(400).json({ 
            error: "Both images are required",
            received: { image1: !!image1, image2: !!image2 }
        });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-image",
            generationConfig: {
                responseModalities: ["TEXT", "IMAGE"]
            }
        });

        // Strip data URL prefix if present
        const image1Base64 = image1.includes(",")
            ? image1.split(",")[1]
            : image1;
        const image2Base64 = image2.includes(",")
            ? image2.split(",")[1]
            : image2;

        const prompt = `Generate a beautifully candid half-body portrait of a single 10-year-old child captured from the waist up. The gender of the child should be spontaneously randomized on every generation. The child is the biological offspring of the two individuals in the uploaded reference images, seamlessly inheriting an accurate natural blend of their exact facial features, bone structure, eye colors, skin tone and ethnicities — the resemblance to both parents must be clearly visible and convincing. Automatically match the visual style of the parents: if both are real humans use photorealistic photography style, if they are superheroes or comic characters use cinematic comic illustration style matching their universe, if they are anime characters use anime art style matching their show, if they are animated or CGI characters use matching animation style, if styles are mixed blend both naturally in the child. The child has a soft sweet and genuine smile showing natural warmth and childhood innocence. They are wearing a randomized unique casual everyday outfit appropriate to their visual style. For real humans: soft warm natural lighting, gentle depth of field, beautifully blurred background, authentic high-end lifestyle photography, highly detailed skin textures, 8K resolution. For fictional characters: match the lighting and atmosphere of their original universe. Generate ONE child only. Do not show both parents. Do not add text, watermarks, borders or logos.`;

        const result = await model.generateContent([
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
                text: prompt
            }
        ]);

        const response = result.response;
        const parts = response.candidates[0].content.parts;
        const imagePart = parts.find(part => part.inlineData);

        if (!imagePart) {
            return res.status(500).json({
                error: "No image generated. Please try again."
            });
        }

        const outputBase64 = `data:image/jpeg;base64,${imagePart.inlineData.data}`;

        return res.status(200).json({ output: outputBase64 });

    } catch (error) {
        console.error("Gemini error:", error.message);
        return res.status(500).json({
            error: error.message || "Something went wrong."
        });
    }
}