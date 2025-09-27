const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const GoogleDriveService = require('./googleDrive');

class ImageService {
    constructor() {
        this.googleDrive = new GoogleDriveService();
        this.uploadDir = path.join(__dirname, '..', 'uploads', 'images');
        this.setupMulter();
        this.ensureUploadDir();
    }

    /**
     * Setup multer for file uploads
     */
    setupMulter() {
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, this.uploadDir);
            },
            filename: (req, file, cb) => {
                const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
                cb(null, uniqueName);
            }
        });

        const fileFilter = (req, file, cb) => {
            // Check if file is an image
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed'), false);
            }
        };

        this.upload = multer({
            storage: storage,
            fileFilter: fileFilter,
            limits: {
                fileSize: 5 * 1024 * 1024 // 5MB limit
            }
        });
    }

    /**
     * Ensure upload directory exists
     */
    async ensureUploadDir() {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create upload directory:', error);
        }
    }

    /**
     * Initialize the image service
     */
    async initialize() {
        await this.googleDrive.initialize();
    }

    /**
     * Upload image and return file info
     */
    async uploadImage(file) {
        try {
            if (!file) {
                return null;
            }

            const imageInfo = {
                id: uuidv4(),
                originalName: file.originalname,
                filename: file.filename,
                path: file.path,
                size: file.size,
                mimetype: file.mimetype,
                uploadedAt: new Date().toISOString()
            };

            // Store in Google Drive if authenticated
            if (this.googleDrive.isReady()) {
                try {
                    const driveFile = await this.storeImageInDrive(imageInfo);
                    imageInfo.driveFileId = driveFile.id;
                    imageInfo.driveUrl = driveFile.webViewLink;
                } catch (error) {
                    console.log('ℹ️ Could not store image in Google Drive:', error.message);
                }
            }

            console.log(`✅ Image uploaded: ${imageInfo.originalName} (${imageInfo.filename})`);
            return imageInfo;
        } catch (error) {
            console.error('❌ Failed to upload image:', error.message);
            throw error;
        }
    }

    /**
     * Store image in Google Drive
     */
    async storeImageInDrive(imageInfo) {
        try {
            if (!this.googleDrive.isReady()) {
                console.log('ℹ️ Google Drive not authenticated, storing locally only');
                return null;
            }

            // Create images folder if it doesn't exist
            const imagesFolderName = 'RSVP-Event-Images';
            let imagesFolder;
            
            try {
                imagesFolder = await this.googleDrive.createFolder(imagesFolderName);
            } catch (error) {
                // Folder might already exist, try to find it
                const files = await this.googleDrive.listFiles(null, imagesFolderName);
                const existingFolder = files.find(file => file.name === imagesFolderName);
                if (existingFolder) {
                    imagesFolder = existingFolder;
                } else {
                    throw error;
                }
            }

            // Read file and upload to Google Drive
            const fileBuffer = await fs.readFile(imageInfo.path);
            const driveFile = await this.googleDrive.uploadFile(
                imageInfo.filename,
                fileBuffer,
                imageInfo.mimetype,
                imagesFolder.id
            );

            console.log(`✅ Image stored in Google Drive: ${imageInfo.filename}`);
            return driveFile;
        } catch (error) {
            console.error(`❌ Failed to store image in Google Drive:`, error.message);
            throw error;
        }
    }

    /**
     * Get image URL for serving
     */
    getImageUrl(imageInfo) {
        if (!imageInfo) {
            return null;
        }

        // If stored in Google Drive, use Drive URL
        if (imageInfo.driveUrl) {
            return imageInfo.driveUrl;
        }

        // Otherwise, serve from local storage
        return `/images/${imageInfo.filename}`;
    }

    /**
     * Delete image
     */
    async deleteImage(imageInfo) {
        try {
            // Delete from local storage
            if (imageInfo.path) {
                try {
                    await fs.unlink(imageInfo.path);
                    console.log(`✅ Deleted local image: ${imageInfo.filename}`);
                } catch (error) {
                    console.log(`ℹ️ Could not delete local image: ${error.message}`);
                }
            }

            // Delete from Google Drive
            if (imageInfo.driveFileId && this.googleDrive.isReady()) {
                try {
                    await this.googleDrive.deleteFile(imageInfo.driveFileId);
                    console.log(`✅ Deleted image from Google Drive: ${imageInfo.filename}`);
                } catch (error) {
                    console.log(`ℹ️ Could not delete image from Google Drive: ${error.message}`);
                }
            }

            return true;
        } catch (error) {
            console.error(`❌ Failed to delete image:`, error.message);
            throw error;
        }
    }

    /**
     * Validate image file
     */
    validateImage(file) {
        const errors = [];

        if (!file) {
            return { isValid: true }; // No image is valid (optional)
        }

        // Check file type
        if (!file.mimetype.startsWith('image/')) {
            errors.push('File must be an image');
        }

        // Check file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            errors.push('Image size must be less than 5MB');
        }

        // Check file extension
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
            errors.push('Image must be JPG, PNG, GIF, or WebP format');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Get multer middleware for single file upload
     */
    getUploadMiddleware() {
        return this.upload.single('eventImage');
    }

    /**
     * Get multer middleware for multiple file uploads
     */
    getMultipleUploadMiddleware() {
        return this.upload.array('images', 5); // Max 5 images
    }

    /**
     * Check if service is ready
     */
    isReady() {
        return this.googleDrive.initialized;
    }
}

module.exports = ImageService;










