#!/usr/bin/env node
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkDriveData() {
    try {
        // Check if tokens exist
        if (!fs.existsSync('./tokens.json')) {
            console.log('❌ No tokens.json found');
            return;
        }

        const tokens = JSON.parse(fs.readFileSync('./tokens.json', 'utf8'));
        console.log('📋 Found Google Drive tokens');
        console.log('Token expiry:', new Date(tokens.expiry_date));
        console.log('Current time:', new Date());
        console.log('Token expired?', new Date() > new Date(tokens.expiry_date));

        if (new Date() > new Date(tokens.expiry_date)) {
            console.log('❌ Tokens are expired, cannot access Google Drive');
            return;
        }

        // Set up OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID || 'test-client',
            process.env.GOOGLE_CLIENT_SECRET || 'test-secret',
            process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
        );

        oauth2Client.setCredentials(tokens);
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // Search for state.json file
        console.log('🔍 Searching for state.json in Google Drive...');
        const response = await drive.files.list({
            q: "name='state.json'",
            fields: 'files(id, name, modifiedTime, size)'
        });

        if (response.data.files.length === 0) {
            console.log('❌ No state.json file found in Google Drive');
            return;
        }

        console.log('✅ Found state.json file(s):');
        for (const file of response.data.files) {
            console.log(`  - ${file.name} (ID: ${file.id}, Modified: ${file.modifiedTime}, Size: ${file.size} bytes)`);
            
            // Download the file
            const fileContent = await drive.files.get({
                fileId: file.id,
                alt: 'media'
            }, { responseType: 'stream' });

            const chunks = [];
            fileContent.data.on('data', chunk => chunks.push(chunk));
            fileContent.data.on('end', () => {
                const content = Buffer.concat(chunks).toString('utf8');
                console.log('📄 File content preview:');
                console.log(content.substring(0, 500) + '...');
                
                // Save to local file
                const outputPath = path.join(process.cwd(), 'recovered-state.json');
                fs.writeFileSync(outputPath, content);
                console.log(`💾 Saved to ${outputPath}`);
            });
        }

    } catch (error) {
        console.error('❌ Error checking Google Drive:', error.message);
    }
}

checkDriveData();
