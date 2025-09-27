const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const driveRoutes = require('./routes/drive');
const qrCodeRoutes = require('./routes/qrcode');
const rsvpRoutes = require('./routes/rsvp');
const eventRoutes = require('./routes/events');
const rsvpManagementRoutes = require('./routes/rsvpManagement');
const inviteRoutes = require('./routes/invites');
const hostAuthRoutes = require('./routes/hostAuth');
const eventManagementRoutes = require('./routes/eventManagement');
const rsvpDashboardRoutes = require('./routes/rsvpDashboard');
const invitationGeneratorRoutes = require('./routes/invitationGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/images', express.static('uploads/images'));
app.use('/images/qr-codes', express.static('public/images/qr-codes'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/host-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'host-dashboard.html'));
});

app.get('/event-details', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'event-details.html'));
});

app.get('/rsvp-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'rsvp-dashboard.html'));
});

app.get('/oauth-callback', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'oauth-callback.html'));
});

app.get('/invitation-generator', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'invitation-generator.html'));
});


// API Routes
app.use('/auth', authRoutes);
app.use('/drive', driveRoutes);
app.use('/qrcode', qrCodeRoutes);
app.use('/rsvp', rsvpRoutes);
app.use('/api/rsvp', rsvpRoutes);
app.use('/events', eventRoutes);
app.use('/rsvp-management', rsvpManagementRoutes);
app.use('/invites', inviteRoutes);
app.use('/host-auth', hostAuthRoutes);
app.use('/event-management', eventManagementRoutes);
app.use('/rsvp-dashboard', rsvpDashboardRoutes);
app.use('/invitation-generator', invitationGeneratorRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            googleDrive: 'Available',
            qrCode: 'Available',
            rsvp: 'Available',
            events: 'Available',
            rsvpManagement: 'Available',
            invites: 'Available',
            hostAuth: 'Available',
            eventManagement: 'Available',
            rsvpDashboard: 'Available',
            invitationGenerator: 'Available'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 RSVP Management App running on port ${PORT}`);
    console.log(`📱 Access the app at: http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
