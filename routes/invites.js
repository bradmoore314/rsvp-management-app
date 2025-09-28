const express = require('express');
const router = express.Router();
const { sharedInviteService } = require('../services/sharedServices');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/generate', requireAuth, async (req, res) => {
    try {
        const { eventId } = req.body;
        if (!eventId) {
            return res.status(400).json({ error: 'eventId is required' });
        }
        const invite = await sharedInviteService.createInvite(req.user.id, eventId, process.env.APP_URL);
        res.json(invite);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/:inviteId', async (req, res) => {
    const invite = await sharedInviteService.getInvite(req.params.inviteId);
    if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
    }
    res.json(invite);
});

module.exports = router;
