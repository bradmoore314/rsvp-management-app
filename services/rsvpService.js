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

    async getRSVPResponses(eventId) {
        const db = await getDB();
        return db.all('SELECT * FROM rsvps WHERE event_id = ? ORDER BY submitted_at DESC', eventId);
    }

    async getStats(eventId) {
        const db = await getDB();
        const rsvps = await this.getRSVPResponses(eventId);
        
        const stats = {
            eventId,
            totalResponses: rsvps.length,
            attendingCount: rsvps.filter(r => r.attendance === 'yes').length,
            notAttendingCount: rsvps.filter(r => r.attendance === 'no').length,
            maybeCount: rsvps.filter(r => r.attendance === 'maybe').length,
            totalGuests: rsvps.reduce((sum, r) => sum + (r.guest_count || 1), 0)
        };

        return stats;
    }

    async exportCSV(userId, eventId) {
        const db = await getDB();
        const event = await db.get('SELECT * FROM events WHERE id = ? AND user_id = ?', eventId, userId);
        if (!event) {
            throw new Error('Event not found');
        }

        const rsvps = await this.getRSVPResponses(eventId);
        
        if (rsvps.length === 0) {
            return 'Timestamp,Guest Name,Guest Email,Phone Number,Attendance,Guest Count,Message,Invite ID\n';
        }

        const headers = 'Timestamp,Guest Name,Guest Email,Phone Number,Attendance,Guest Count,Message,Invite ID\n';
        const rows = rsvps.map(rsvp => {
            const timestamp = rsvp.submitted_at || '';
            const guestName = (rsvp.guest_name || '').replace(/"/g, '""');
            const guestEmail = (rsvp.guest_email || '').replace(/"/g, '""');
            const guestPhone = (rsvp.guest_phone || '').replace(/"/g, '""');
            const attendance = rsvp.attendance || '';
            const guestCount = rsvp.guest_count || 1;
            const message = (rsvp.message || '').replace(/"/g, '""');
            const inviteId = rsvp.invite_id || '';

            return `"${timestamp}","${guestName}","${guestEmail}","${guestPhone}","${attendance}",${guestCount},"${message}","${inviteId}"`;
        }).join('\n');

        return headers + rows + '\n';
    }

    validateRSVPData(data) {
        const errors = [];

        if (!data.guestName || data.guestName.trim() === '') {
            errors.push('Guest name is required');
        }

        if (!data.guestEmail || data.guestEmail.trim() === '') {
            errors.push('Guest email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.guestEmail)) {
            errors.push('Invalid email format');
        }

        if (!data.attendance || !['yes', 'no', 'maybe'].includes(data.attendance)) {
            errors.push('Attendance must be yes, no, or maybe');
        }

        if (data.guestCount && (isNaN(data.guestCount) || data.guestCount < 1 || data.guestCount > 20)) {
            errors.push('Guest count must be a number between 1 and 20');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = RSVPService;
