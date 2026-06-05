export default async function handler(req, res) {

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { image1, image2 } = req.body;

    if (!image1 || !image2) {
        return res.status(400).json({ error: 'Both images are required' });
    }

    try {
        // First call — load model
        const response = await fetch(
            'https://api-inference.huggingface.co/models/deepinsight/insightface',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: {
                        source_image: image1,
                        target_image: image2
                    }
                })
            }
        );

        // If model is loading wait and retry
        if (response.status === 503) {
            await new Promise(resolve => setTimeout(resolve, 20000));

            const retryResponse = await fetch(
                'https://api-inference.huggingface.co/models/deepinsight/insightface',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        inputs: {
                            source_image: image1,
                            target_image: image2
                        }
                    })
                }
            );

            const retryBuffer = await retryResponse.arrayBuffer();
            const retryBase64 = Buffer.from(retryBuffer).toString('base64');
            return res.status(200).json({
                output: `data:image/jpeg;base64,${retryBase64}`
            });
        }

        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        return res.status(200).json({
            output: `data:image/jpeg;base64,${base64}`
        });

    } catch (error) {
        return res.status(500).json({
            error: 'Something went wrong. Please try again.'
        });
    }
}