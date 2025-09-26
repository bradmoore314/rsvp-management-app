const QRCodeService = require('./qrCodeService');
const EventService = require('./eventService');
const RSVPService = require('./rsvpService');
const { v4: uuidv4 } = require('uuid');

class InviteService {
    constructor(googleDriveService = null) {
        this.qrCodeService = new QRCodeService();
        this.eventService = new EventService();
        this.rsvpService = new RSVPService();
        this.googleDrive = googleDriveService;
        this.invites = new Map(); // In-memory cache for invites
    }

    /**
     * Initialize the invite service
     */
    async initialize() {
        await this.eventService.initialize();
        await this.rsvpService.initialize();
        
        // Load invites from Google Drive if available
        if (this.googleDrive && this.googleDrive.isReady()) {
            await this.loadInvitesFromDrive();
        }
    }

    /**
     * Generate a single invite for an event
     */
    async generateInvite(eventId, inviteData = {}) {
        try {
            // Get event data
            const event = await this.eventService.getEvent(eventId);
            if (!event) {
                throw new Error(`Event not found: ${eventId}`);
            }

            // Generate unique invite ID
            const inviteId = uuidv4();
            
            // Create invite object
            const invite = {
                id: inviteId,
                eventId: eventId,
                guestName: inviteData.guestName || null,
                guestEmail: inviteData.guestEmail || null,
                customMessage: inviteData.customMessage || null,
                maxGuests: inviteData.maxGuests || 1,
                rsvpDeadline: inviteData.rsvpDeadline || event.rsvpDeadline,
                created: new Date().toISOString(),
                status: 'active',
                qrCode: null,
                rsvpUrl: null
            };

            // Generate QR code and RSVP URL
            const qrCodeData = await this.qrCodeService.generateQRCodeDataURL(
                inviteId, 
                eventId, 
                process.env.APP_URL || 'http://localhost:3000'
            );

            invite.qrCode = qrCodeData.qrCodeDataURL;
            invite.rsvpUrl = qrCodeData.rsvpUrl;

            // Store invite in memory
            this.invites.set(inviteId, invite);

            // Store invite in Google Drive
            await this.storeInviteInDrive(invite);

            console.log(`✅ Generated invite: ${inviteId} for event ${eventId}`);
            return {
                invite: invite,
                event: event,
                qrCodeData: qrCodeData
            };
        } catch (error) {
            console.error('❌ Failed to generate invite:', error.message);
            throw error;
        }
    }

    /**
     * Generate multiple invites for an event
     */
    async generateBatchInvites(eventId, inviteCount, inviteData = {}) {
        try {
            const results = [];
            
            for (let i = 0; i < inviteCount; i++) {
                const result = await this.generateInvite(eventId, inviteData);
                results.push(result);
            }
            
            console.log(`✅ Generated ${inviteCount} invites for event ${eventId}`);
            return {
                eventId: eventId,
                inviteCount: inviteCount,
                invites: results,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Failed to generate batch invites:', error.message);
            throw error;
        }
    }

    /**
     * Generate invites with guest information
     */
    async generateInvitesWithGuests(eventId, guestList) {
        try {
            const results = [];
            
            for (const guest of guestList) {
                const result = await this.generateInvite(eventId, {
                    guestName: guest.name,
                    guestEmail: guest.email,
                    customMessage: guest.message || null,
                    maxGuests: guest.maxGuests || 1
                });
                results.push(result);
            }
            
            console.log(`✅ Generated ${guestList.length} personalized invites for event ${eventId}`);
            return {
                eventId: eventId,
                inviteCount: guestList.length,
                invites: results,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Failed to generate personalized invites:', error.message);
            throw error;
        }
    }

    /**
     * Get invite by ID
     */
    async getInvite(inviteId) {
        try {
            return this.invites.get(inviteId) || null;
        } catch (error) {
            console.error(`❌ Failed to get invite ${inviteId}:`, error.message);
            return null;
        }
    }

    /**
     * Get all invites for an event
     */
    async getInvitesForEvent(eventId) {
        try {
            const invites = Array.from(this.invites.values())
                .filter(invite => invite.eventId === eventId)
                .sort((a, b) => new Date(a.created) - new Date(b.created));

            return invites;
        } catch (error) {
            console.error(`❌ Failed to get invites for event ${eventId}:`, error.message);
            return [];
        }
    }

    /**
     * Update invite
     */
    async updateInvite(inviteId, updateData) {
        try {
            const invite = this.invites.get(inviteId);
            if (!invite) {
                throw new Error('Invite not found');
            }

            const updatedInvite = {
                ...invite,
                ...updateData,
                updated: new Date().toISOString()
            };

            this.invites.set(inviteId, updatedInvite);
            
            console.log(`✅ Updated invite: ${inviteId}`);
            return updatedInvite;
        } catch (error) {
            console.error(`❌ Failed to update invite ${inviteId}:`, error.message);
            throw error;
        }
    }

    /**
     * Deactivate invite
     */
    async deactivateInvite(inviteId) {
        try {
            return await this.updateInvite(inviteId, { status: 'inactive' });
        } catch (error) {
            console.error(`❌ Failed to deactivate invite ${inviteId}:`, error.message);
            throw error;
        }
    }

    /**
     * Get invite statistics
     */
    async getInviteStats(eventId) {
        try {
            const invites = await this.getInvitesForEvent(eventId);
            const rsvpStats = await this.rsvpService.getRSVPStats(eventId);
            
            const stats = {
                eventId: eventId,
                totalInvites: invites.length,
                activeInvites: invites.filter(i => i.status === 'active').length,
                inactiveInvites: invites.filter(i => i.status === 'inactive').length,
                personalizedInvites: invites.filter(i => i.guestName).length,
                anonymousInvites: invites.filter(i => !i.guestName).length,
                rsvpStats: rsvpStats,
                responseRate: rsvpStats ? (rsvpStats.totalResponses / invites.length * 100).toFixed(1) : 0
            };

            return stats;
        } catch (error) {
            console.error(`❌ Failed to get invite stats for event ${eventId}:`, error.message);
            return null;
        }
    }

    /**
     * Create printable invite
     */
    async createPrintableInvite(inviteId) {
        try {
            const invite = await this.getInvite(inviteId);
            if (!invite) {
                throw new Error('Invite not found');
            }

            const event = await this.eventService.getEvent(invite.eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            const printableInvite = {
                invite: invite,
                event: event,
                qrCode: invite.qrCode,
                rsvpUrl: invite.rsvpUrl,
                instructions: "Scan the QR code above to RSVP for this event",
                created: new Date().toISOString()
            };

            console.log(`✅ Created printable invite: ${inviteId}`);
            return printableInvite;
        } catch (error) {
            console.error(`❌ Failed to create printable invite ${inviteId}:`, error.message);
            throw error;
        }
    }

    /**
     * Generate QR code files for printing
     */
    async generateQRCodeFiles(eventId, inviteIds = null) {
        try {
            const invites = inviteIds 
                ? inviteIds.map(id => this.invites.get(id)).filter(Boolean)
                : await this.getInvitesForEvent(eventId);

            const results = [];
            
            for (const invite of invites) {
                const qrCodeFile = await this.qrCodeService.generateQRCodeFile(
                    invite.id,
                    invite.eventId,
                    null,
                    process.env.APP_URL || 'http://localhost:3000'
                );
                
                results.push({
                    inviteId: invite.id,
                    qrCodeFile: qrCodeFile
                });
            }
            
            console.log(`✅ Generated ${results.length} QR code files for event ${eventId}`);
            return {
                eventId: eventId,
                fileCount: results.length,
                files: results,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Failed to generate QR code files:', error.message);
            throw error;
        }
    }

    /**
     * Validate invite data
     */
    validateInviteData(inviteData) {
        const errors = [];

        if (inviteData.guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteData.guestEmail)) {
            errors.push('Guest email must be a valid email address');
        }

        if (inviteData.maxGuests && (isNaN(inviteData.maxGuests) || inviteData.maxGuests < 1 || inviteData.maxGuests > 20)) {
            errors.push('Max guests must be a number between 1 and 20');
        }

        if (inviteData.rsvpDeadline && isNaN(Date.parse(inviteData.rsvpDeadline))) {
            errors.push('RSVP deadline must be a valid date');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Store invite in Google Drive
     */
    async storeInviteInDrive(invite) {
        if (!this.googleDrive || !this.googleDrive.isReady()) {
            console.log('⚠️ Google Drive not available, skipping invite storage');
            return;
        }

        try {
            // Find or create RSVP-Invites folder
            const invitesFolder = await this.googleDrive.findFolder('RSVP-Invites');
            if (!invitesFolder) {
                console.log('📁 Creating RSVP-Invites folder...');
                await this.googleDrive.createFolder('RSVP-Invites');
                const newInvitesFolder = await this.googleDrive.findFolder('RSVP-Invites');
                if (!newInvitesFolder) {
                    throw new Error('Failed to create RSVP-Invites folder');
                }
            }

            const fileName = `invite-${invite.id}.json`;
            const content = JSON.stringify(invite, null, 2);

            // Check if file already exists
            const existingFiles = await this.googleDrive.listFiles(invitesFolder.id, fileName);
            
            if (existingFiles.length > 0) {
                // Update existing file
                await this.googleDrive.updateFile(existingFiles[0].id, content);
                console.log(`✅ Updated invite ${invite.id} in Google Drive`);
            } else {
                // Create new file
                await this.googleDrive.createTextFile(fileName, content, invitesFolder.id);
                console.log(`✅ Stored new invite ${invite.id} in Google Drive`);
            }
        } catch (error) {
            console.error(`❌ Failed to store invite ${invite.id} in Google Drive:`, error.message);
        }
    }

    /**
     * Load all invites from Google Drive
     */
    async loadInvitesFromDrive() {
        if (!this.googleDrive || !this.googleDrive.isReady()) {
            console.log('⚠️ Google Drive not available, skipping invite loading');
            return;
        }

        try {
            const invitesFolder = await this.googleDrive.findFolder('RSVP-Invites');
            if (!invitesFolder) {
                console.log('📁 No RSVP-Invites folder found, skipping invite loading');
                return;
            }

            const files = await this.googleDrive.listFiles(invitesFolder.id);
            const inviteFiles = files.filter(file => file.name.startsWith('invite-') && file.name.endsWith('.json'));

            console.log(`📥 Loading ${inviteFiles.length} invites from Google Drive...`);

            for (const file of inviteFiles) {
                try {
                    const content = await this.googleDrive.downloadFile(file.id);
                    const invite = JSON.parse(content);
                    
                    // Store in memory cache
                    this.invites.set(invite.id, invite);
                } catch (error) {
                    console.error(`❌ Failed to load invite from file ${file.name}:`, error.message);
                }
            }

            console.log(`✅ Loaded ${this.invites.size} invites from Google Drive`);
        } catch (error) {
            console.error('❌ Failed to load invites from Google Drive:', error.message);
        }
    }

    /**
     * Delete invite from Google Drive
     */
    async deleteInviteFromDrive(inviteId) {
        if (!this.googleDrive || !this.googleDrive.isReady()) {
            console.log('⚠️ Google Drive not available, skipping invite deletion');
            return;
        }

        try {
            const invitesFolder = await this.googleDrive.findFolder('RSVP-Invites');
            if (!invitesFolder) {
                return;
            }

            const fileName = `invite-${inviteId}.json`;
            const files = await this.googleDrive.listFiles(invitesFolder.id, fileName);
            
            if (files.length > 0) {
                await this.googleDrive.deleteFile(files[0].id);
                console.log(`✅ Deleted invite ${inviteId} from Google Drive`);
            }
        } catch (error) {
            console.error(`❌ Failed to delete invite ${inviteId} from Google Drive:`, error.message);
        }
    }

    /**
     * Check if service is ready
     */
    isReady() {
        return this.eventService && this.rsvpService && this.qrCodeService;
    }
}

module.exports = InviteService;




