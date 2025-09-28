const express = require('express');
const router = express.Router();
const { sharedEventService } = require('../services/sharedServices');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, async (req, res) => {
    const events = await sharedEventService.listEvents(req.user.id);
    res.json(events);
});

router.post('/', requireAuth, async (req, res) => {
    try {
        if (!req.body.name) {
            return res.status(400).json({ error: 'name is required' });
        }
        const event = await sharedEventService.createEvent(req.user.id, req.body);
        res.status(201).json(event);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/:eventId', async (req, res) => {
    const event = await sharedEventService.getEventPublic(req.params.eventId);
    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
});

router.delete('/:eventId', requireAuth, async (req, res) => {
    const deleted = await sharedEventService.deleteEvent(req.user.id, req.params.eventId);
    if (!deleted) {
        return res.status(404).json({ error: 'Event not found' });
    }
    res.status(204).send();
});

module.exports = router;
