const { eventService, inviteService, rsvpService, qrCodeService } = require('./sharedServices');

class EventManagementService {
    constructor() {
        this.eventService = eventService;
        this.inviteService = inviteService;
        this.rsvpService = rsvpService;
        this.qrCodeService = qrCodeService;
    }

    /**
     * Initialize the event management service
     */
    async initialize() {
        await this.eventService.initialize();
        await this.inviteService.initialize();
        await this.rsvpService.initialize();
    }

    /**
     * Create event with comprehensive setup
     */
    async createEventWithSetup(eventData, hostEmail) {
        try {
            // Create the event
            const event = await this.eventService.createEvent({
                ...eventData,
                hostEmail: hostEmail
            });

            // Generate initial batch of invites if requested
            if (eventData.initialInviteCount && eventData.initialInviteCount > 0) {
                const inviteResult = await this.inviteService.generateBatchInvites(
                    event.id, 
                    eventData.initialInviteCount
                );
                event.initialInvites = inviteResult;
            }

            console.log(`✅ Created event with setup: ${event.name} (ID: ${event.id})`);
            return {
                event: event,
                setupComplete: true
            };
        } catch (error) {
            console.error('❌ Failed to create event with setup:', error.message);
            throw error;
        }
    }

    /**
     * Get comprehensive event details including stats
     */
    async getEventDetails(eventId) {
        try {
            const event = await this.eventService.getEvent(eventId);
            if (!event) {
                return null;
            }

            // Get invite statistics
            const inviteStats = await this.inviteService.getInviteStats(eventId);
            
            // Get RSVP statistics
            const rsvpStats = await this.rsvpService.getRSVPStats(eventId);

            // Get recent RSVP responses
            const recentRSVPs = await this.rsvpService.getRSVPResponses(eventId);
            const recentResponses = recentRSVPs.slice(-5).reverse(); // Last 5 responses

            return {
                event: event,
                inviteStats: inviteStats,
                rsvpStats: rsvpStats,
                recentResponses: recentResponses,
                summary: {
                    totalInvites: inviteStats?.totalInvites || 0,
                    totalResponses: rsvpStats?.totalResponses || 0,
                    responseRate: inviteStats?.responseRate || 0,
                    attending: rsvpStats?.attending || 0,
                    notAttending: rsvpStats?.notAttending || 0,
                    maybe: rsvpStats?.maybe || 0,
                    totalGuests: rsvpStats?.totalGuests || 0
                }
            };
        } catch (error) {
            console.error(`❌ Failed to get event details for ${eventId}:`, error.message);
            return null;
        }
    }

    /**
     * Update event with validation
     */
    async updateEventWithValidation(eventId, updateData, hostEmail) {
        try {
            // Verify the event belongs to the host
            const event = await this.eventService.getEvent(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            if (event.hostEmail !== hostEmail) {
                throw new Error('Unauthorized: Event does not belong to this host');
            }

            // Update the event
            const updatedEvent = await this.eventService.updateEvent(eventId, updateData);

            console.log(`✅ Updated event: ${updatedEvent.name} (ID: ${eventId})`);
            return updatedEvent;
        } catch (error) {
            console.error(`❌ Failed to update event ${eventId}:`, error.message);
            throw error;
        }
    }

    /**
     * Delete event and cleanup related data
     */
    async deleteEvent(eventId, hostEmail) {
        try {
            // Verify the event belongs to the host
            const event = await this.eventService.getEvent(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            if (event.hostEmail !== hostEmail) {
                throw new Error('Unauthorized: Event does not belong to this host');
            }

            // Mark event as deleted (soft delete)
            const deletedEvent = await this.eventService.updateEvent(eventId, {
                status: 'deleted',
                deletedAt: new Date().toISOString()
            });

            console.log(`✅ Deleted event: ${deletedEvent.name} (ID: ${eventId})`);
            return deletedEvent;
        } catch (error) {
            console.error(`❌ Failed to delete event ${eventId}:`, error.message);
            throw error;
        }
    }

    /**
     * Generate invites for event with options
     */
    async generateEventInvites(eventId, inviteOptions, hostEmail) {
        try {
            // Verify the event belongs to the host
            const event = await this.eventService.getEvent(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            if (event.hostEmail !== hostEmail) {
                throw new Error('Unauthorized: Event does not belong to this host');
            }

            let result;

            if (inviteOptions.guestList && inviteOptions.guestList.length > 0) {
                // Generate personalized invites
                result = await this.inviteService.generateInvitesWithGuests(eventId, inviteOptions.guestList);
            } else {
                // Generate batch invites
                result = await this.inviteService.generateBatchInvites(
                    eventId, 
                    inviteOptions.inviteCount || 1,
                    inviteOptions.inviteData || {}
                );
            }

            console.log(`✅ Generated invites for event ${eventId}`);
            return result;
        } catch (error) {
            console.error(`❌ Failed to generate invites for event ${eventId}:`, error.message);
            throw error;
        }
    }

    /**
     * Get event analytics and insights
     */
    async getEventAnalytics(eventId, hostEmail) {
        try {
            // Verify the event belongs to the host
            const event = await this.eventService.getEvent(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            if (event.hostEmail !== hostEmail) {
                throw new Error('Unauthorized: Event does not belong to this host');
            }

            const eventDetails = await this.getEventDetails(eventId);
            if (!eventDetails) {
                throw new Error('Failed to get event details');
            }

            // Calculate additional analytics
            const analytics = {
                event: eventDetails.event,
                inviteStats: eventDetails.inviteStats,
                rsvpStats: eventDetails.rsvpStats,
                insights: {
                    responseRate: eventDetails.summary.responseRate,
                    attendanceRate: eventDetails.summary.totalInvites > 0 
                        ? (eventDetails.summary.attending / eventDetails.summary.totalInvites * 100).toFixed(1)
                        : 0,
                    averageGuestsPerResponse: eventDetails.summary.totalResponses > 0
                        ? (eventDetails.summary.totalGuests / eventDetails.summary.totalResponses).toFixed(1)
                        : 0,
                    daysUntilEvent: this.calculateDaysUntilEvent(event.date),
                    daysUntilRSVPDeadline: event.rsvpDeadline ? this.calculateDaysUntilEvent(event.rsvpDeadline) : null
                },
                trends: {
                    responsesOverTime: await this.getResponseTrends(eventId),
                    dietaryPreferences: eventDetails.rsvpStats?.dietaryOptions || {}
                }
            };

            return analytics;
        } catch (error) {
            console.error(`❌ Failed to get analytics for event ${eventId}:`, error.message);
            throw error;
        }
    }

    /**
     * Export event data
     */
    async exportEventData(eventId, format = 'json', hostEmail) {
        try {
            // Verify the event belongs to the host
            const event = await this.eventService.getEvent(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            if (event.hostEmail !== hostEmail) {
                throw new Error('Unauthorized: Event does not belong to this host');
            }

            const eventDetails = await this.getEventDetails(eventId);
            if (!eventDetails) {
                throw new Error('Failed to get event details');
            }

            const exportData = {
                event: eventDetails.event,
                invites: await this.inviteService.getInvitesForEvent(eventId),
                rsvps: eventDetails.rsvpStats?.responses || [],
                statistics: {
                    inviteStats: eventDetails.inviteStats,
                    rsvpStats: eventDetails.rsvpStats
                },
                exportedAt: new Date().toISOString(),
                exportedBy: hostEmail
            };

            if (format === 'csv') {
                return this.convertToCSV(exportData);
            } else {
                return JSON.stringify(exportData, null, 2);
            }
        } catch (error) {
            console.error(`❌ Failed to export data for event ${eventId}:`, error.message);
            throw error;
        }
    }

    /**
     * Get events for host with summary data
     */
    async getHostEventsSummary(hostEmail) {
        try {
            const events = await this.eventService.getEventsByHost(hostEmail);
            
            const eventsWithSummary = await Promise.all(
                events.map(async (event) => {
                    const inviteStats = await this.inviteService.getInviteStats(event.id);
                    const rsvpStats = await this.rsvpService.getRSVPStats(event.id);
                    
                    return {
                        ...event,
                        summary: {
                            totalInvites: inviteStats?.totalInvites || 0,
                            totalResponses: rsvpStats?.totalResponses || 0,
                            responseRate: inviteStats?.responseRate || 0,
                            attending: rsvpStats?.attending || 0,
                            totalGuests: rsvpStats?.totalGuests || 0
                        }
                    };
                })
            );

            return eventsWithSummary;
        } catch (error) {
            console.error(`❌ Failed to get events summary for host ${hostEmail}:`, error.message);
            return [];
        }
    }

    /**
     * Helper methods
     */
    calculateDaysUntilEvent(dateString) {
        const eventDate = new Date(dateString);
        const today = new Date();
        const diffTime = eventDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    async getResponseTrends(eventId) {
        try {
            const responses = await this.rsvpService.getRSVPResponses(eventId);
            
            // Group responses by date
            const trends = {};
            responses.forEach(response => {
                const date = new Date(response.submittedAt).toDateString();
                if (!trends[date]) {
                    trends[date] = { responses: 0, attending: 0 };
                }
                trends[date].responses++;
                if (response.attendance === 'yes') {
                    trends[date].attending++;
                }
            });

            return trends;
        } catch (error) {
            console.error('Failed to get response trends:', error.message);
            return {};
        }
    }

    convertToCSV(data) {
        const csvRows = [];
        
        // Event info
        csvRows.push('Event Information');
        csvRows.push(`Name,${data.event.name}`);
        csvRows.push(`Date,${data.event.date}`);
        csvRows.push(`Time,${data.event.time}`);
        csvRows.push(`Location,${data.event.location}`);
        csvRows.push(`Host,${data.event.hostName}`);
        csvRows.push('');
        
        // RSVP data
        csvRows.push('RSVP Responses');
        csvRows.push('Guest Name,Guest Email,Attendance,Guest Count,Dietary Options,Dietary Restrictions,Message,Submitted At');
        
        data.rsvps.forEach(rsvp => {
            const row = [
                rsvp.guestName,
                rsvp.guestEmail,
                rsvp.attendance,
                rsvp.guestCount,
                (rsvp.dietaryOptions || []).join('; '),
                rsvp.dietaryRestrictions || '',
                rsvp.message || '',
                rsvp.submittedAt
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    /**
     * Update an existing event
     */
    async updateEvent(eventId, updateData) {
        try {
            return await this.eventService.updateEvent(eventId, updateData);
        } catch (error) {
            console.error('❌ Failed to update event:', error.message);
            throw error;
        }
    }

    /**
     * Delete an event
     */
    async deleteEvent(eventId) {
        try {
            // First delete all associated invites and RSVPs
            await this.inviteService.deleteInvitesByEvent(eventId);
            await this.rsvpService.deleteRSVPsByEvent(eventId);
            
            // Then delete the event
            return await this.eventService.deleteEvent(eventId);
        } catch (error) {
            console.error('❌ Failed to delete event:', error.message);
            throw error;
        }
    }

    /**
     * Duplicate an event
     */
    async duplicateEvent(eventId, newEventData = {}) {
        try {
            return await this.eventService.duplicateEvent(eventId, newEventData);
        } catch (error) {
            console.error('❌ Failed to duplicate event:', error.message);
            throw error;
        }
    }

    /**
     * Change event status
     */
    async changeEventStatus(eventId, status) {
        try {
            return await this.eventService.changeEventStatus(eventId, status);
        } catch (error) {
            console.error('❌ Failed to change event status:', error.message);
            throw error;
        }
    }

    /**
     * Get events by category
     */
    async getEventsByCategory(category) {
        try {
            return await this.eventService.getEventsByCategory(category);
        } catch (error) {
            console.error('❌ Failed to get events by category:', error.message);
            throw error;
        }
    }

    /**
     * Get events by status
     */
    async getEventsByStatus(status) {
        try {
            return await this.eventService.getEventsByStatus(status);
        } catch (error) {
            console.error('❌ Failed to get events by status:', error.message);
            throw error;
        }
    }

    /**
     * Check if service is ready
     */
    isReady() {
        return this.eventService && this.inviteService && this.rsvpService;
    }
}

module.exports = EventManagementService;
