export default async function handler(req, res) {

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { image1, image2 } = req.body;

    // Check both images provided
    if (!image1 || !image2) {
        return res.status(400).json({ error: 'Both images are required' });
    }

    try {
        // Start prediction on Replicate
        const startResponse = await fetch(
            'https://api.replicate.com/v1/predictions',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    version: "9283608cc6b7be6b65a8e44983db012355f33b892e9cce2ea8ef5f3ec4e9d6d6",
                    input: {
                        source_image: image1,
                        target_image: image2
                    }
                })
            }
        );

        const prediction = await startResponse.json();

        // Poll every 2 seconds until result is ready
        let result = prediction;
        let attempts = 0;

        while (
            result.status !== 'succeeded' && 
            result.status !== 'failed' && 
            attempts < 30
        ) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const pollResponse = await fetch(
                `https://api.replicate.com/v1/predictions/${result.id}`,
                {
                    headers: {
                        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
                    }
                }
            );
            
            result = await pollResponse.json();
            attempts++;
        }

        // Handle failure
        if (result.status === 'failed' || attempts >= 30) {
            return res.status(500).json({ 
                error: 'Generation failed. Please try again.' 
            });
        }

        // Return generated baby image
        return res.status(200).json({ 
            output: result.output 
        });

    } catch (error) {
        return res.status(500).json({ 
            error: 'Something went wrong. Please try again.' 
        });
    }
}