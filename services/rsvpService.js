const { v4: uuidv4 } = require('uuid');
const { getDB } = require('./db');

class RSVPService {
    async submitRSVP(data) {
        const db = await getDB();
        const invite = await db.get('SELECT * FROM invites WHERE id = ? AND event_id = ?', data.inviteId, data.eventId);
        if (!invite) {
            throw new Error('Invite not found for this event');
        }

        const id = uuidv4();
        await db.run(
            `INSERT INTO rsvps (id, event_id, invite_id, guest_name, guest_email, guest_phone, attendance, guest_count, message)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            id,
            data.eventId,
            data.inviteId,
            data.guestName,
            data.guestEmail,
            data.guestPhone || null,
            data.attendance,
            Number(data.guestCount || 1),
            data.message || null
        );

        return this.getRSVP(id);
    }

    async getRSVP(id) {
        const db = await getDB();
        return db.get('SELECT * FROM rsvps WHERE id = ?', id);
    }
}

module.exports = RSVPService;
