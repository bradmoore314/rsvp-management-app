const QRCodeService = require('../../services/qrCodeService');
const fs = require('fs').promises;
const path = require('path');

// Mock QRCode module
jest.mock('qrcode', () => ({
    toDataURL: jest.fn(),
    toFile: jest.fn()
}));

const QRCode = require('qrcode');

describe('QRCodeService', () => {
    let qrCodeService;

    beforeEach(() => {
        qrCodeService = new QRCodeService();
        jest.clearAllMocks();
    });

    describe('generateInviteId', () => {
        test('should generate unique invite IDs', () => {
            const id1 = qrCodeService.generateInviteId();
            const id2 = qrCodeService.generateInviteId();

            expect(id1).toBeDefined();
            expect(id2).toBeDefined();
            expect(id1).not.toBe(id2);
            expect(typeof id1).toBe('string');
            expect(typeof id2).toBe('string');
        });
    });

    describe('generateQRCodeDataURL', () => {
        test('should generate QR code data URL for app URL', async () => {
            const mockDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            QRCode.toDataURL.mockResolvedValue(mockDataURL);

            const inviteId = 'test-invite-123';
            const eventId = 'test-event-456';
            const baseUrl = 'https://example.com';

            const result = await qrCodeService.generateQRCodeDataURL(inviteId, eventId, baseUrl);

            expect(QRCode.toDataURL).toHaveBeenCalledWith(
                `${baseUrl}/rsvp/${eventId}/${inviteId}`,
                qrCodeService.qrCodeOptions
            );

            expect(result).toEqual({
                inviteId: inviteId,
                eventId: eventId,
                rsvpUrl: `${baseUrl}/rsvp/${eventId}/${inviteId}`,
                qrCodeDataURL: mockDataURL,
                hostingMethod: 'app-url',
                timestamp: expect.any(String)
            });
        });

        test('should generate QR code data URL for Google Drive', async () => {
            const mockDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            QRCode.toDataURL.mockResolvedValue(mockDataURL);

            const inviteId = 'test-invite-123';
            const eventId = 'test-event-456';

            const result = await qrCodeService.generateQRCodeDataURL(inviteId, eventId, null, true);

            expect(QRCode.toDataURL).toHaveBeenCalledWith(
                `https://drive.google.com/file/d/${inviteId}/view`,
                qrCodeService.qrCodeOptions
            );

            expect(result).toEqual({
                inviteId: inviteId,
                eventId: eventId,
                rsvpUrl: `https://drive.google.com/file/d/${inviteId}/view`,
                qrCodeDataURL: mockDataURL,
                hostingMethod: 'google-drive',
                timestamp: expect.any(String)
            });
        });

        test('should handle errors gracefully', async () => {
            QRCode.toDataURL.mockRejectedValue(new Error('QR Code generation failed'));

            const inviteId = 'test-invite-123';
            const eventId = 'test-event-456';

            await expect(qrCodeService.generateQRCodeDataURL(inviteId, eventId)).rejects.toThrow('QR Code generation failed');
        });
    });

    describe('generateQRCodeFile', () => {
        test('should generate QR code file', async () => {
            QRCode.toFile.mockResolvedValue(undefined);

            const inviteId = 'test-invite-123';
            const eventId = 'test-event-456';
            const baseUrl = 'https://example.com';
            const outputPath = '/tmp/test-output';

            // Mock fs.mkdir
            jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);

            const result = await qrCodeService.generateQRCodeFile(inviteId, eventId, outputPath, baseUrl);

            expect(fs.mkdir).toHaveBeenCalledWith(outputPath, { recursive: true });
            expect(QRCode.toFile).toHaveBeenCalledWith(
                path.join(outputPath, `qr-${eventId}-${inviteId}.png`),
                `${baseUrl}/rsvp/${eventId}/${inviteId}`,
                qrCodeService.qrCodeOptions
            );

            expect(result).toEqual({
                inviteId: inviteId,
                eventId: eventId,
                rsvpUrl: `${baseUrl}/rsvp/${eventId}/${inviteId}`,
                fileName: `qr-${eventId}-${inviteId}.png`,
                filePath: path.join(outputPath, `qr-${eventId}-${inviteId}.png`),
                webPath: `/images/qr-codes/qr-${eventId}-${inviteId}.png`,
                timestamp: expect.any(String)
            });
        });

        test('should use default output path if not provided', async () => {
            QRCode.toFile.mockResolvedValue(undefined);
            jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);

            const inviteId = 'test-invite-123';
            const eventId = 'test-event-456';
            const baseUrl = 'https://example.com';

            const result = await qrCodeService.generateQRCodeFile(inviteId, eventId, null, baseUrl);

            const expectedPath = path.join(__dirname, '..', '..', 'public', 'images', 'qr-codes');
            expect(fs.mkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });
            expect(result.filePath).toBe(path.join(expectedPath, `qr-${eventId}-${inviteId}.png`));
        });

        test('should handle file generation errors', async () => {
            QRCode.toFile.mockRejectedValue(new Error('File generation failed'));
            jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);

            const inviteId = 'test-invite-123';
            const eventId = 'test-event-456';

            await expect(qrCodeService.generateQRCodeFile(inviteId, eventId)).rejects.toThrow('File generation failed');
        });
    });

    describe('generateEventQRCodes', () => {
        test('should generate multiple QR codes for an event', async () => {
            const mockDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            QRCode.toDataURL.mockResolvedValue(mockDataURL);

            const eventId = 'test-event-456';
            const inviteCount = 3;
            const baseUrl = 'https://example.com';

            const result = await qrCodeService.generateEventQRCodes(eventId, inviteCount, baseUrl);

            expect(result).toHaveProperty('eventId', eventId);
            expect(result).toHaveProperty('inviteCount', inviteCount);
            expect(result).toHaveProperty('qrCodes');
            expect(result.qrCodes).toHaveLength(inviteCount);
            expect(result).toHaveProperty('generatedAt');

            // Check that each QR code has the expected structure
            result.qrCodes.forEach((qrCode, index) => {
                expect(qrCode).toHaveProperty('inviteId');
                expect(qrCode).toHaveProperty('eventId', eventId);
                expect(qrCode).toHaveProperty('rsvpUrl');
                expect(qrCode).toHaveProperty('qrCodeDataURL', mockDataURL);
                expect(qrCode).toHaveProperty('hostingMethod', 'app-url');
                expect(qrCode).toHaveProperty('timestamp');
            });

            expect(QRCode.toDataURL).toHaveBeenCalledTimes(inviteCount);
        });

        test('should use default invite count of 1', async () => {
            const mockDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            QRCode.toDataURL.mockResolvedValue(mockDataURL);

            const eventId = 'test-event-456';

            const result = await qrCodeService.generateEventQRCodes(eventId);

            expect(result.inviteCount).toBe(1);
            expect(result.qrCodes).toHaveLength(1);
        });
    });

    describe('qrCodeOptions', () => {
        test('should have correct default options', () => {
            expect(qrCodeService.qrCodeOptions).toEqual({
                type: 'png',
                quality: 0.92,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                width: 300
            });
        });
    });
});
