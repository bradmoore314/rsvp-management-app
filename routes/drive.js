const express = require('express');
const { googleDriveService } = require('../services/sharedServices');
const router = express.Router();

// Use shared Google Drive service
const googleDrive = googleDriveService;

/**
 * Middleware to check if Google Drive is authenticated
 */
const requireAuth = (req, res, next) => {
    if (!googleDrive.isReady()) {
        return res.status(401).json({
            error: 'Not authenticated',
            message: 'Please authenticate with Google Drive first'
        });
    }
    next();
};

/**
 * POST /drive/folder
 * Create a new folder in Google Drive
 */
router.post('/folder', requireAuth, async (req, res) => {
    try {
        const { name, parentId } = req.body;

        if (!name) {
            return res.status(400).json({
                error: 'Folder name is required'
            });
        }

        const folder = await googleDrive.createFolder(name, parentId);
        
        res.json({
            success: true,
            folder: folder,
            message: `Folder '${name}' created successfully`
        });
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({
            error: 'Failed to create folder',
            message: error.message
        });
    }
});

/**
 * POST /drive/file
 * Create a text file in Google Drive
 */
router.post('/file', requireAuth, async (req, res) => {
    try {
        const { fileName, content, folderId } = req.body;

        if (!fileName || !content) {
            return res.status(400).json({
                error: 'File name and content are required'
            });
        }

        const file = await googleDrive.createTextFile(fileName, content, folderId);
        
        res.json({
            success: true,
            file: file,
            message: `File '${fileName}' created successfully`
        });
    } catch (error) {
        console.error('Error creating file:', error);
        res.status(500).json({
            error: 'Failed to create file',
            message: error.message
        });
    }
});

/**
 * GET /drive/files
 * List files in Google Drive
 */
router.get('/files', requireAuth, async (req, res) => {
    try {
        const { folderId, query } = req.query;
        const files = await googleDrive.listFiles(folderId, query);
        
        res.json({
            success: true,
            files: files,
            count: files.length
        });
    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({
            error: 'Failed to list files',
            message: error.message
        });
    }
});

/**
 * POST /drive/rsvp-data
 * Store RSVP data in Google Drive
 */
router.post('/rsvp-data', requireAuth, async (req, res) => {
    try {
        const { eventId, guestData } = req.body;

        if (!eventId || !guestData) {
            return res.status(400).json({
                error: 'Event ID and guest data are required'
            });
        }

        // Create event folder if it doesn't exist
        const eventFolderName = `RSVP-Event-${eventId}`;
        let eventFolder;
        
        try {
            eventFolder = await googleDrive.createFolder(eventFolderName);
        } catch (error) {
            // Folder might already exist, try to find it
            const files = await googleDrive.listFiles(null, eventFolderName);
            const existingFolder = files.find(file => file.name === eventFolderName);
            if (existingFolder) {
                eventFolder = existingFolder;
            } else {
                throw error;
            }
        }

        // Create RSVP data file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `rsvp-${timestamp}.json`;
        const content = JSON.stringify({
            timestamp: new Date().toISOString(),
            eventId: eventId,
            guestData: guestData
        }, null, 2);

        const file = await googleDrive.createTextFile(fileName, content, eventFolder.id);
        
        res.json({
            success: true,
            file: file,
            message: 'RSVP data stored successfully'
        });
    } catch (error) {
        console.error('Error storing RSVP data:', error);
        res.status(500).json({
            error: 'Failed to store RSVP data',
            message: error.message
        });
    }
});

/**
 * GET /drive/rsvp-data/:eventId
 * Retrieve RSVP data for an event
 */
router.get('/rsvp-data/:eventId', requireAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const eventFolderName = `RSVP-Event-${eventId}`;
        
        const files = await googleDrive.listFiles(null, eventFolderName);
        const eventFolder = files.find(file => file.name === eventFolderName);
        
        if (!eventFolder) {
            return res.json({
                success: true,
                rsvpData: [],
                message: 'No RSVP data found for this event'
            });
        }

        const rsvpFiles = await googleDrive.listFiles(eventFolder.id, 'rsvp-');
        
        res.json({
            success: true,
            rsvpData: rsvpFiles,
            count: rsvpFiles.length,
            message: `Found ${rsvpFiles.length} RSVP responses`
        });
    } catch (error) {
        console.error('Error retrieving RSVP data:', error);
        res.status(500).json({
            error: 'Failed to retrieve RSVP data',
            message: error.message
        });
    }
});

module.exports = router;




