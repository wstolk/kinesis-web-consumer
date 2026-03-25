// pages/api/authenticate.js
import {KinesisClient, ListStreamsCommand} from "@aws-sdk/client-kinesis";
import { fromIni } from '@aws-sdk/credential-providers';
import { AWS_REGIONS } from '@/lib/constants';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const {accessKeyId, secretAccessKey, sessionToken, region, endpoint, useDefaultCredentials, awsProfile} = req.body;

        // Input validation
        if (!region || !AWS_REGIONS.includes(region)) {
            return res.status(400).json({ authenticated: false, message: 'Invalid or missing region' });
        }

        if (!useDefaultCredentials && (!accessKeyId || !secretAccessKey)) {
            return res.status(400).json({ authenticated: false, message: 'accessKeyId and secretAccessKey are required when not using default credentials' });
        }

        let client;
        try {
            const clientConfig = {
                region,
            };

            // Use default credential chain or manual credentials
            if (useDefaultCredentials) {
                if (awsProfile && awsProfile !== 'default') {
                    // Use specific AWS profile
                    clientConfig.credentials = fromIni({ profile: awsProfile });
                } else {
                    // Use default profile or credential chain
                    // Don't set credentials property - SDK will handle credential resolution
                }
            } else {
                // Use manually provided credentials
                clientConfig.credentials = {
                    accessKeyId,
                    secretAccessKey,
                    sessionToken: sessionToken || undefined,
                };
            }

            // Add custom endpoint if provided (validated for SSRF protection)
            if (endpoint) {
                try {
                    const parsedUrl = new URL(endpoint);
                    const allowedProtocols = ['http:', 'https:'];
                    if (!allowedProtocols.includes(parsedUrl.protocol)) {
                        return res.status(400).json({ authenticated: false, message: 'Invalid endpoint protocol. Only http and https are allowed.' });
                    }
                    clientConfig.endpoint = endpoint;
                    // For LocalStack, we typically want to disable SSL
                    if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
                        clientConfig.tls = false;
                    }
                } catch (urlError) {
                    return res.status(400).json({ authenticated: false, message: 'Invalid endpoint URL format.' });
                }
            }

            client = new KinesisClient(clientConfig);
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
                console.error('Unexpected authentication error:', error.message);
                res.status(500).json({
                    authenticated: false,
                    message: 'An unexpected error occurred during authentication.'
                });
            }
        } finally {
            if (client) {
                client.destroy();
            }
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}