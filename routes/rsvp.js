const express = require('express');
const router = express.Router();
const { sharedRSVPService } = require('../services/sharedServices');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/submit', async (req, res) => {
    try {
        const record = await sharedRSVPService.submitRSVP(req.body);
        res.status(201).json(record);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/event/:eventId/stats', requireAuth, async (req, res) => {
    const stats = await sharedRSVPService.getStats(req.params.eventId);
    res.json(stats);
});

router.get('/event/:eventId/export', requireAuth, async (req, res) => {
    const csv = await sharedRSVPService.exportCSV(req.user.id, req.params.eventId);
    res.header('Content-Type', 'text/csv');
    res.attachment('rsvps.csv');
    res.send(csv);
});

module.exports = router;
