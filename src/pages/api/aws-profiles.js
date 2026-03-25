// pages/api/aws-profiles.js
import { discoverAwsProfiles, testAwsProfile } from '@/lib/awsProfiles';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const profiles = await discoverAwsProfiles();
            
            // Test each profile to get additional info
            const profileDetails = await Promise.all(
                profiles.map(async (profileName) => {
                    const details = await testAwsProfile(profileName);
                    return details;
                })
            );
            
            res.status(200).json({
                profiles: profileDetails.filter(p => p.available),
                totalFound: profiles.length,
                available: profileDetails.filter(p => p.available).length
            });
        } catch (error) {
            console.error('Error listing AWS profiles:', error);
            res.status(500).json({
                error: 'Failed to discover AWS profiles',
                profiles: []
            });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}