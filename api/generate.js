export default async function handler(req, res) {

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { image1, image2 } = req.body;

    if (!image1 || !image2) {
        return res.status(400).json({ error: 'Both images are required' });
    }

    try {
        const { Client } = await import('@gradio/client');

        const client = await Client.connect('tonyassi/face-swap', {
            hf_token: process.env.HUGGINGFACE_API_TOKEN
        });

        const result = await client.predict('/predict', {
            image_1: image1,
            image_2: image2
        });

        if (!result || !result.data) {
            return res.status(500).json({
                error: 'Generation failed. Please try again.'
            });
        }

        const outputUrl = result.data[0]?.url || result.data[0];

        return res.status(200).json({
            output: outputUrl
        });

    } catch (error) {
        console.error('Generation error:', error);
        return res.status(500).json({
            error: 'Something went wrong. Please try again.'
        });
    }
}