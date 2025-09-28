const EventService = require('./eventService');
const InviteService = require('./inviteService');
const RSVPService = require('./rsvpService');
const AIInvitationService = require('./aiInvitationService');

const sharedEventService = new EventService();
const sharedInviteService = new InviteService();
const sharedRSVPService = new RSVPService();
const sharedAIInvitationService = new AIInvitationService();

module.exports = {
    sharedEventService,
    sharedInviteService,
    sharedRSVPService,
    sharedAIInvitationService
};
