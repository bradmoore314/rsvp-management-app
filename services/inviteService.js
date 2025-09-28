const { v4: uuidv4 } = require('uuid');
const { getDB } = require('./db');
const QRCodeService = require('./qrCodeService');

class InviteService {
    constructor() {
        this.qrCodeService = new QRCodeService();
    }

    async createInvite(userId, eventId, baseUrl) {
        const db = await getDB();
        const event = await db.get('SELECT * FROM events WHERE id = ? AND user_id = ?', eventId, userId);
        if (!event) {
            throw new Error('Event not found');
        }

        const id = uuidv4();
        const qrData = await this.qrCodeService.generateQRCodeDataURL(id, eventId, baseUrl);
        await db.run(
            'INSERT INTO invites (id, event_id, rsvp_url, qr_code_data_url) VALUES (?, ?, ?, ?)',
            id,
            eventId,
            qrData.rsvpUrl,
            qrData.qrCodeDataURL
        );

        return {
            id,
            eventId,
            rsvpUrl: qrData.rsvpUrl,
            qrCodeDataURL: qrData.qrCodeDataURL
        };
    }

    async getInvite(inviteId) {
        const db = await getDB();
        return db.get('SELECT * FROM invites WHERE id = ?', inviteId);
    }
}

module.exports = InviteService;
