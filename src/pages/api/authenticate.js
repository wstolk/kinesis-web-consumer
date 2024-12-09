// pages/api/authenticate.js
import {KinesisClient, ListStreamsCommand} from "@aws-sdk/client-kinesis";

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const {accessKeyId, secretAccessKey, sessionToken, region, endpoint} = req.body;

        try {
            const clientConfig = {
                region,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                    sessionToken: sessionToken || undefined,
                },
            };

            // Add custom endpoint if provided
            if (endpoint) {
                clientConfig.endpoint = endpoint;
                // For LocalStack, we typically want to disable SSL
                if (endpoint.includes('localhost') || endpoint.includes('127.0.0.1')) {
                    clientConfig.tls = false;
                }
            }

            const client = new KinesisClient(clientConfig);
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
                res.status(401).json({authenticated: false, message: 'Invalid credentials'});
            } else if (error.name === 'AccessDeniedException') {
                res.status(403).json({
                    authenticated: true,
                    canListStreams: false,
                    message: 'Authentication successful, but insufficient permissions to list streams'
                });
            } else {
                res.status(500).json({
                    authenticated: false,
                    message: `An unexpected error occurred: ${error.message}`
                });
            }
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}