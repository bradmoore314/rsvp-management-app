const EventService = require('./eventService');
const InviteService = require('./inviteService');
const RSVPService = require('./rsvpService');

const sharedEventService = new EventService();
const sharedInviteService = new InviteService();
const sharedRSVPService = new RSVPService();

module.exports = {
    sharedEventService,
    sharedInviteService,
    sharedRSVPService
};
