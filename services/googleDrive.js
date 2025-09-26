const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

class GoogleDriveService {
    constructor() {
        this.oauth2Client = null;
        this.drive = null;
        this.initialized = false;
    }

    /**
     * Initialize Google Drive API with OAuth2 credentials
     */
    async initialize() {
        try {
            if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
                throw new Error('Google OAuth credentials not found in environment variables');
            }

            this.oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/oauth-callback'
            );

            this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
            this.initialized = true;
            
            console.log('✅ Google Drive API initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Google Drive API:', error.message);
            this.initialized = false;
            return false;
        }
    }

    /**
     * Generate OAuth2 authorization URL
     */
    getAuthUrl() {
        if (!this.initialized) {
            throw new Error('Google Drive service not initialized');
        }

        const scopes = [
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/drive.metadata.readonly'
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent'
        });
    }

    /**
     * Exchange authorization code for tokens
     */
    async getTokens(code) {
        if (!this.initialized) {
            throw new Error('Google Drive service not initialized');
        }

        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);
            
            // Save tokens for future use
            await this.saveTokens(tokens);
            
            console.log('✅ Google OAuth tokens obtained successfully');
            return tokens;
        } catch (error) {
            console.error('❌ Failed to get OAuth tokens:', error.message);
            throw error;
        }
    }

    /**
     * Set credentials from saved tokens
     */
    async setCredentialsFromTokens(tokens) {
        if (!this.initialized) {
            throw new Error('Google Drive service not initialized');
        }

        this.oauth2Client.setCredentials(tokens);
        console.log('✅ Google Drive credentials restored from saved tokens');
    }

    /**
     * Create a folder in Google Drive
     */
    async createFolder(name, parentId = null) {
        if (!this.initialized) {
            throw new Error('Google Drive service not initialized');
        }

        try {
            const fileMetadata = {
                name: name,
                mimeType: 'application/vnd.google-apps.folder'
            };

            if (parentId) {
                fileMetadata.parents = [parentId];
            }

            const response = await this.drive.files.create({
                resource: fileMetadata,
                fields: 'id,name,webViewLink'
            });

            console.log(`✅ Created folder: ${name} (ID: ${response.data.id})`);
            return response.data;
        } catch (error) {
            console.error(`❌ Failed to create folder ${name}:`, error.message);
            throw error;
        }
    }

    /**
     * Upload a file to Google Drive
     */
    async uploadFile(filePath, fileName, folderId = null, mimeType = null) {
        if (!this.initialized) {
            throw new Error('Google Drive service not initialized');
        }

        try {
            const fileMetadata = {
                name: fileName
            };

            if (folderId) {
                fileMetadata.parents = [folderId];
            }

            const media = {
                mimeType: mimeType || 'application/octet-stream',
                body: require('fs').createReadStream(filePath)
            };

            const response = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id,name,webViewLink,size'
            });

            console.log(`✅ Uploaded file: ${fileName} (ID: ${response.data.id})`);
            return response.data;
        } catch (error) {
            console.error(`❌ Failed to upload file ${fileName}:`, error.message);
            throw error;
        }
    }

    /**
     * Create a text file in Google Drive
     */
    async createTextFile(fileName, content, folderId = null) {
        if (!this.initialized) {
            throw new Error('Google Drive service not initialized');
        }

        try {
            const fileMetadata = {
                name: fileName
            };

            if (folderId) {
                fileMetadata.parents = [folderId];
            }

            const media = {
                mimeType: 'text/plain',
                body: content
            };

            const response = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id,name,webViewLink'
            });

            console.log(`✅ Created text file: ${fileName} (ID: ${response.data.id})`);
            return response.data;
        } catch (error) {
            console.error(`❌ Failed to create text file ${fileName}:`, error.message);
            throw error;
        }
    }

    /**
     * List files in a folder
     */
    async listFiles(folderId = null, query = '') {
        if (!this.initialized) {
            throw new Error('Google Drive service not initialized');
        }

        try {
            let q = 'trashed=false';
            
            if (folderId) {
                q += ` and '${folderId}' in parents`;
            }
            
            if (query) {
                q += ` and name contains '${query}'`;
            }

            const response = await this.drive.files.list({
                q: q,
                fields: 'files(id,name,mimeType,createdTime,size,webViewLink)'
            });

            console.log(`✅ Listed ${response.data.files.length} files`);
            return response.data.files;
        } catch (error) {
            console.error('❌ Failed to list files:', error.message);
            throw error;
        }
    }

    /**
     * Get file content from Google Drive
     */
    async getFileContent(fileId) {
        if (!this.initialized) {
            throw new Error('Google Drive service not initialized');
        }

        try {
            const response = await this.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });

            console.log(`✅ Retrieved file content for ${fileId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Failed to get file content:', error.message);
            throw error;
        }
    }

    /**
     * Save OAuth tokens to file
     */
    async saveTokens(tokens) {
        try {
            const tokensPath = path.join(__dirname, '..', 'tokens.json');
            await fs.writeFile(tokensPath, JSON.stringify(tokens, null, 2));
            console.log('✅ OAuth tokens saved to file');
        } catch (error) {
            console.error('❌ Failed to save tokens:', error.message);
            throw error;
        }
    }

    /**
     * Load OAuth tokens from file
     */
    async loadTokens() {
        try {
            const tokensPath = path.join(__dirname, '..', 'tokens.json');
            const tokensData = await fs.readFile(tokensPath, 'utf8');
            const tokens = JSON.parse(tokensData);
            console.log('✅ OAuth tokens loaded from file');
            return tokens;
        } catch (error) {
            console.log('ℹ️ No saved tokens found');
            return null;
        }
    }

    /**
     * Check if service is properly initialized and authenticated
     */
    isReady() {
        return this.initialized && this.oauth2Client && this.oauth2Client.credentials;
    }
}

module.exports = GoogleDriveService;
