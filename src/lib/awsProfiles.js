// lib/awsProfiles.js
import { fromIni } from '@aws-sdk/credential-providers';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Discover available AWS profiles from ~/.aws/config and ~/.aws/credentials
 * This runs server-side only due to filesystem access
 */
export const discoverAwsProfiles = async () => {
    const profiles = new Set();
    const homeDir = os.homedir();
    
    try {
        // Check ~/.aws/credentials
        const credentialsPath = path.join(homeDir, '.aws', 'credentials');
        if (fs.existsSync(credentialsPath)) {
            const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
            const credProfiles = parseIniProfiles(credentialsContent);
            credProfiles.forEach(profile => profiles.add(profile));
        }
        
        // Check ~/.aws/config
        const configPath = path.join(homeDir, '.aws', 'config');
        if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf8');
            const configProfiles = parseIniProfiles(configContent);
            configProfiles.forEach(profile => profiles.add(profile));
        }
        
        return Array.from(profiles).sort();
    } catch (error) {
        console.error('Error discovering AWS profiles:', error);
        return [];
    }
};

/**
 * Parse INI-style AWS config/credentials files to extract profile names
 */
const parseIniProfiles = (content) => {
    const profiles = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            let profileName = trimmed.slice(1, -1);
            
            // Handle config file format where profiles are prefixed with "profile "
            if (profileName.startsWith('profile ')) {
                profileName = profileName.slice(8);
            }
            
            // Skip empty profile names
            if (profileName && profileName !== 'default') {
                profiles.push(profileName);
            }
        }
    }
    
    // Always include 'default' if we found any profiles
    if (profiles.length > 0) {
        profiles.unshift('default');
    }
    
    return profiles;
};

/**
 * Test if a specific AWS profile can be loaded
 * Returns profile info including region if available
 */
export const testAwsProfile = async (profileName) => {
    try {
        // Test credential loading
        const credentials = fromIni({ profile: profileName });
        await credentials(); // This will throw if profile doesn't exist or has issues
        
        // Try to get region from config
        const homeDir = os.homedir();
        const configPath = path.join(homeDir, '.aws', 'config');
        let region = 'us-east-1'; // default fallback
        
        if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf8');
            region = extractRegionFromConfig(configContent, profileName) || region;
        }
        
        return {
            profileName,
            region,
            available: true
        };
    } catch (error) {
        return {
            profileName,
            available: false,
            error: error.message
        };
    }
};

/**
 * Extract region for a specific profile from AWS config
 */
const extractRegionFromConfig = (configContent, profileName) => {
    const lines = configContent.split('\n');
    let inTargetProfile = false;
    let profileSection = profileName === 'default' ? '[default]' : `[profile ${profileName}]`;
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('[')) {
            inTargetProfile = trimmed === profileSection;
        } else if (inTargetProfile && trimmed.startsWith('region')) {
            const match = trimmed.match(/region\s*=\s*(.+)/);
            if (match) {
                return match[1].trim();
            }
        }
    }
    
    return null;
};