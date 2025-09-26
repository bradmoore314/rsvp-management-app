// Shared service instances to ensure data consistency across routes
const EventService = require('./eventService');
const RSVPService = require('./rsvpService');
const InviteService = require('./inviteService');
const QRCodeService = require('./qrCodeService');
const GoogleDriveService = require('./googleDrive');
const GoogleSheetsService = require('./googleSheetsService');

// Create shared instances
const sharedEventService = new EventService();
const sharedGoogleDriveService = new GoogleDriveService();
const sharedGoogleSheetsService = new GoogleSheetsService(sharedGoogleDriveService);
const sharedRSVPService = new RSVPService();
const sharedInviteService = new InviteService(sharedGoogleDriveService);
const sharedQRCodeService = new QRCodeService();

// Initialize all services
(async () => {
    try {
        // Initialize Google Drive service first
        try {
            await sharedGoogleDriveService.initialize();
            // Try to load saved tokens for Google Drive
            const savedTokens = await sharedGoogleDriveService.loadTokens();
            if (savedTokens) {
                await sharedGoogleDriveService.setCredentialsFromTokens(savedTokens);
                console.log('✅ Shared Google Drive service initialized with tokens');
            } else {
                console.log('ℹ️ No saved tokens found for shared Google Drive service');
            }
        } catch (error) {
            console.log('ℹ️ Google Drive service initialization skipped:', error.message);
        }
        
        // Initialize services that depend on Google Drive
        await sharedEventService.initialize(); // Now can load events from Drive
        await sharedRSVPService.initialize();
        await sharedInviteService.initialize(); // Now can load invites from Drive
        
        // Initialize Google Sheets service
        try {
            if (sharedGoogleDriveService.isReady()) {
                await sharedGoogleSheetsService.initialize(sharedGoogleDriveService);
                console.log('✅ Shared Google Sheets service initialized');
            } else {
                console.log('ℹ️ Google Sheets service initialization skipped: Google Drive service not ready');
            }
        } catch (error) {
            console.log('ℹ️ Google Sheets service initialization skipped:', error.message);
        }
    } catch (error) {
        console.error('❌ Failed to initialize shared services:', error.message);
    }
})();

module.exports = {
    eventService: sharedEventService,
    rsvpService: sharedRSVPService,
    inviteService: sharedInviteService,
    qrCodeService: sharedQRCodeService,
    googleDriveService: sharedGoogleDriveService,
    googleSheetsService: sharedGoogleSheetsService
};




