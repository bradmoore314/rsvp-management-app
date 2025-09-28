const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

class QRCodeService {
    constructor() {
        this.qrCodeOptions = {
            type: 'png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 300
        };
    }

    /**
     * Generate a unique invite ID
     */
    generateInviteId() {
        return uuidv4();
    }

    /**
     * Generate QR code data URL for an invite
     */
    async generateQRCodeDataURL(inviteId, eventId, baseUrl = null, useGoogleDrive = false) {
        try {
            let rsvpUrl;
            
            if (useGoogleDrive) {
                // Use Google Drive hosted RSVP form
                rsvpUrl = `https://drive.google.com/file/d/${inviteId}/view`;
            } else {
                // Use traditional app URL
                const appUrl = baseUrl || process.env.APP_URL || 'http://localhost:3000';
                rsvpUrl = `${appUrl}/rsvp/${eventId}/${inviteId}`;
            }
            
            const qrCodeDataURL = await QRCode.toDataURL(rsvpUrl, this.qrCodeOptions);
            
            console.log(`✅ Generated QR code for invite ${inviteId} (${useGoogleDrive ? 'Google Drive' : 'App URL'})`);
            return {
                inviteId: inviteId,
                eventId: eventId,
                rsvpUrl: rsvpUrl,
                qrCodeDataURL: qrCodeDataURL,
                hostingMethod: useGoogleDrive ? 'google-drive' : 'app-url',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Failed to generate QR code:', error.message);
            throw error;
        }
    }

    /**
     * Generate QR code and save as file
     */
    async generateQRCodeFile(inviteId, eventId, outputPath = null, baseUrl = null) {
        try {
            const appUrl = baseUrl || process.env.APP_URL || 'http://localhost:3000';
            const rsvpUrl = `${appUrl}/rsvp/${eventId}/${inviteId}`;
            
            // Create output directory if it doesn't exist
            const outputDir = outputPath || path.join(__dirname, '..', 'public', 'images', 'qr-codes');
            await fs.mkdir(outputDir, { recursive: true });
            
            // Generate file path
            const fileName = `qr-${eventId}-${inviteId}.png`;
            const filePath = path.join(outputDir, fileName);
            
            // Generate QR code file
            await QRCode.toFile(filePath, rsvpUrl, this.qrCodeOptions);
            
            console.log(`✅ Generated QR code file: ${fileName}`);
            return {
                inviteId: inviteId,
                eventId: eventId,
                rsvpUrl: rsvpUrl,
                fileName: fileName,
                filePath: filePath,
                webPath: `/images/qr-codes/${fileName}`,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Failed to generate QR code file:', error.message);
            throw error;
        }
    }

    /**
     * Generate multiple QR codes for an event
     */
    async generateEventQRCodes(eventId, inviteCount = 1, baseUrl = null) {
        try {
            const results = [];
            
            for (let i = 0; i < inviteCount; i++) {
                const inviteId = this.generateInviteId();
                const qrCodeData = await this.generateQRCodeDataURL(inviteId, eventId, baseUrl);
                results.push(qrCodeData);
            }
            
            console.log(`✅ Generated ${inviteCount} QR codes for event ${eventId}`);
            return {
                eventId: eventId,
                inviteCount: inviteCount,
                qrCodes: results,
                generatedAt: new Date().toISOString(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Failed to generate event QR codes:', error.message);
            throw error;
        }
    }

    /**
     * Generate QR codes and save as files for an event
     */
    async generateEventQRCodeFiles(eventId, inviteCount = 1, baseUrl = null) {
        try {
            const results = [];
            
            for (let i = 0; i < inviteCount; i++) {
                const inviteId = this.generateInviteId();
                const qrCodeFile = await this.generateQRCodeFile(inviteId, eventId, null, baseUrl);
                results.push(qrCodeFile);
            }
            
            console.log(`✅ Generated ${inviteCount} QR code files for event ${eventId}`);
            return {
                eventId: eventId,
                inviteCount: inviteCount,
                qrCodeFiles: results,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Failed to generate event QR code files:', error.message);
            throw error;
        }
    }

    /**
     * Create a printable invite with QR code
     */
    async createPrintableInvite(eventData, inviteId, baseUrl = null) {
        try {
            const qrCodeData = await this.generateQRCodeDataURL(inviteId, eventData.id, baseUrl);
            
            const inviteData = {
                inviteId: inviteId,
                eventId: eventData.id,
                eventName: eventData.name,
                eventDate: eventData.date,
                eventTime: eventData.time,
                eventLocation: eventData.location,
                hostName: eventData.hostName,
                rsvpUrl: qrCodeData.rsvpUrl,
                qrCodeDataURL: qrCodeData.qrCodeDataURL,
                instructions: "Scan the QR code above to RSVP for this event",
                timestamp: new Date().toISOString()
            };
            
            console.log(`✅ Created printable invite for event ${eventData.id}`);
            return inviteData;
        } catch (error) {
            console.error('❌ Failed to create printable invite:', error.message);
            throw error;
        }
    }

    /**
     * Validate QR code URL format
     */
    validateQRCodeURL(url) {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            
            // Expected format: /rsvp/{eventId}/{inviteId}
            if (pathParts.length === 4 && pathParts[1] === 'rsvp') {
                return {
                    isValid: true,
                    eventId: pathParts[2],
                    inviteId: pathParts[3]
                };
            }
            
            return { isValid: false };
        } catch (error) {
            return { isValid: false, error: error.message };
        }
    }

    /**
     * Get QR code options (for customization)
     */
    getQROptions() {
        return { ...this.qrCodeOptions };
    }

    /**
     * Update QR code options
     */
    setQROptions(options) {
        this.qrCodeOptions = { ...this.qrCodeOptions, ...options };
        console.log('✅ QR code options updated');
    }
}

module.exports = QRCodeService;




