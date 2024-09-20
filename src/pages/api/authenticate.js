// pages/api/authenticate.js
import {KinesisClient, ListStreamsCommand} from "@aws-sdk/client-kinesis";

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const {accessKeyId, secretAccessKey, sessionToken, region} = req.body;

        try {
            const client = new KinesisClient({
                region,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                    sessionToken
                },
            });

            // Attempt to list streams to verify credentials and permissions
            const command = new ListStreamsCommand({});
            const response = await client.send(command);

            res.status(200).json({
                authenticated: true,
                canListStreams: true,
                streams: response.StreamNames
            });
        } catch (error) {
            console.error('Authentication error:', error);

            if (error.name === 'InvalidClientTokenId' || error.name === 'SignatureDoesNotMatch') {
                // Invalid credentials
                res.status(401).json({authenticated: false, message: 'Invalid credentials'});
            } else if (error.name === 'AccessDeniedException') {
                // Authentication successful, but user does not have permission to list streams
                res.status(403).json({
                    authenticated: true,
                    canListStreams: false,
                    message: 'Authentication successful, but insufficient permissions to list streams'
                });
            } else {
                res.status(500).json({authenticated: false, message: 'An unexpected error occurred'});
            }
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
