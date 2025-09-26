const GoogleDriveService = require('./googleDrive');
const { v4: uuidv4 } = require('uuid');

class HostAuthService {
    constructor() {
        this.googleDrive = new GoogleDriveService();
        this.hostSessions = new Map(); // In-memory session storage
        this.hostProfiles = new Map(); // In-memory host profile storage
    }

    /**
     * Initialize the host authentication service
     */
    async initialize() {
        await this.googleDrive.initialize();
        
        // Try to load saved tokens
        const savedTokens = await this.googleDrive.loadTokens();
        if (savedTokens) {
            await this.googleDrive.setCredentialsFromTokens(savedTokens);
        }
    }

    /**
     * Authenticate host with Google OAuth
     */
    async authenticateHost(googleTokens, userInfo) {
        try {
            // Validate Google tokens
            if (!googleTokens || !googleTokens.access_token) {
                throw new Error('Invalid Google tokens provided');
            }

            // Extract host information from Google user info
            const hostProfile = {
                id: uuidv4(),
                googleId: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                verifiedEmail: userInfo.verified_email,
                locale: userInfo.locale,
                created: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                status: 'active'
            };

            // Store or update host profile
            this.hostProfiles.set(hostProfile.email, hostProfile);

            // Create session
            const sessionId = uuidv4();
            const session = {
                id: sessionId,
                hostEmail: hostProfile.email,
                hostId: hostProfile.id,
                googleTokens: googleTokens,
                created: new Date().toISOString(),
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
                isActive: true
            };

            this.hostSessions.set(sessionId, session);

            // Store host profile in Google Drive if authenticated
            if (this.googleDrive.isReady()) {
                try {
                    await this.storeHostProfileInDrive(hostProfile);
                } catch (error) {
                    console.log('ℹ️ Could not store host profile in Google Drive:', error.message);
                }
            }

            console.log(`✅ Host authenticated: ${hostProfile.name} (${hostProfile.email})`);
            return {
                session: session,
                host: hostProfile
            };
        } catch (error) {
            console.error('❌ Failed to authenticate host:', error.message);
            throw error;
        }
    }

    /**
     * Validate session
     */
    async validateSession(sessionId) {
        try {
            const session = this.hostSessions.get(sessionId);
            
            if (!session) {
                return { isValid: false, reason: 'Session not found' };
            }

            if (!session.isActive) {
                return { isValid: false, reason: 'Session inactive' };
            }

            if (new Date() > new Date(session.expires)) {
                // Session expired
                this.hostSessions.delete(sessionId);
                return { isValid: false, reason: 'Session expired' };
            }

            // Get host profile
            const host = this.hostProfiles.get(session.hostEmail);
            if (!host) {
                return { isValid: false, reason: 'Host profile not found' };
            }

            return {
                isValid: true,
                session: session,
                host: host
            };
        } catch (error) {
            console.error('❌ Failed to validate session:', error.message);
            return { isValid: false, reason: 'Validation error' };
        }
    }

    /**
     * Get host by email
     */
    async getHostByEmail(email) {
        try {
            return this.hostProfiles.get(email) || null;
        } catch (error) {
            console.error(`❌ Failed to get host by email ${email}:`, error.message);
            return null;
        }
    }

    /**
     * Get host by ID
     */
    async getHostById(hostId) {
        try {
            for (const host of this.hostProfiles.values()) {
                if (host.id === hostId) {
                    return host;
                }
            }
            return null;
        } catch (error) {
            console.error(`❌ Failed to get host by ID ${hostId}:`, error.message);
            return null;
        }
    }

    /**
     * Update host profile
     */
    async updateHostProfile(email, updateData) {
        try {
            const host = this.hostProfiles.get(email);
            if (!host) {
                throw new Error('Host not found');
            }

            const updatedHost = {
                ...host,
                ...updateData,
                updated: new Date().toISOString()
            };

            this.hostProfiles.set(email, updatedHost);

            // Update in Google Drive if authenticated
            if (this.googleDrive.isReady()) {
                try {
                    await this.storeHostProfileInDrive(updatedHost);
                } catch (error) {
                    console.log('ℹ️ Could not update host profile in Google Drive:', error.message);
                }
            }

            console.log(`✅ Updated host profile: ${email}`);
            return updatedHost;
        } catch (error) {
            console.error(`❌ Failed to update host profile ${email}:`, error.message);
            throw error;
        }
    }

    /**
     * Logout host
     */
    async logoutHost(sessionId) {
        try {
            const session = this.hostSessions.get(sessionId);
            if (session) {
                session.isActive = false;
                session.loggedOut = new Date().toISOString();
                this.hostSessions.set(sessionId, session);
                console.log(`✅ Host logged out: ${session.hostEmail}`);
            }
            return true;
        } catch (error) {
            console.error('❌ Failed to logout host:', error.message);
            return false;
        }
    }

    /**
     * Get all hosts
     */
    async getAllHosts() {
        try {
            return Array.from(this.hostProfiles.values())
                .sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin));
        } catch (error) {
            console.error('❌ Failed to get all hosts:', error.message);
            return [];
        }
    }

    /**
     * Get active sessions
     */
    async getActiveSessions() {
        try {
            const now = new Date();
            return Array.from(this.hostSessions.values())
                .filter(session => session.isActive && new Date(session.expires) > now)
                .sort((a, b) => new Date(b.created) - new Date(a.created));
        } catch (error) {
            console.error('❌ Failed to get active sessions:', error.message);
            return [];
        }
    }

    /**
     * Store host profile in Google Drive
     */
    async storeHostProfileInDrive(hostProfile) {
        try {
            if (!this.googleDrive.isReady()) {
                console.log('ℹ️ Google Drive not authenticated, storing in memory only');
                return;
            }

            // Create hosts folder if it doesn't exist
            const hostsFolderName = 'RSVP-Hosts';
            let hostsFolder;
            
            try {
                hostsFolder = await this.googleDrive.createFolder(hostsFolderName);
            } catch (error) {
                // Folder might already exist, try to find it
                const files = await this.googleDrive.listFiles(null, hostsFolderName);
                const existingFolder = files.find(file => file.name === hostsFolderName);
                if (existingFolder) {
                    hostsFolder = existingFolder;
                } else {
                    throw error;
                }
            }

            // Create host profile file
            const fileName = `host-${hostProfile.email.replace('@', '-at-')}.json`;
            const content = JSON.stringify(hostProfile, null, 2);

            await this.googleDrive.createTextFile(fileName, content, hostsFolder.id);
            console.log(`✅ Stored host profile ${hostProfile.email} in Google Drive`);
        } catch (error) {
            console.error(`❌ Failed to store host profile in Google Drive:`, error.message);
            throw error;
        }
    }

    /**
     * Validate host data
     */
    validateHostData(hostData) {
        const errors = [];

        if (!hostData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hostData.email)) {
            errors.push('Valid email address is required');
        }

        if (!hostData.name || hostData.name.trim().length === 0) {
            errors.push('Host name is required');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Check if service is ready
     */
    isReady() {
        return this.googleDrive.initialized;
    }

    /**
     * Get Google OAuth URL for host authentication
     */
    getGoogleAuthUrl() {
        if (!this.googleDrive.initialized) {
            throw new Error('Google Drive service not initialized');
        }

        return this.googleDrive.getAuthUrl();
    }

    /**
     * Exchange Google OAuth code for tokens
     */
    async exchangeGoogleCode(code) {
        if (!this.googleDrive.initialized) {
            throw new Error('Google Drive service not initialized');
        }

        return await this.googleDrive.getTokens(code);
    }
}

module.exports = HostAuthService;




