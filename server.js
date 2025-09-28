const express = require('express');
const path = require('path');
const cors = require('cors');
const { withCookies } = require('./middleware/authMiddleware');

const authRouter = require('./routes/auth');
const eventsRouter = require('./routes/events');
const invitesRouter = require('./routes/invites');
const rsvpRouter = require('./routes/rsvp');
const invitationGeneratorRouter = require('./routes/invitationGenerator');

const app = express();
const PORT = process.env.PORT || 3000;
const shouldListen = process.env.JEST_WORKER_ID === undefined;
const allowedOrigin = process.env.APP_ORIGIN || process.env.APP_URL || 'http://localhost:3000';

app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());
withCookies(app);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/invitation-generator', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'invitation-generator.html'));
});

app.use('/auth', authRouter);
app.use('/events', eventsRouter);
app.use('/invites', invitesRouter);
app.use('/rsvp', rsvpRouter);
app.use('/invitation-generator', invitationGeneratorRouter);

if (shouldListen) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
