const RSVPService = require('./rsvpService');
const EventService = require('./eventService');
const InviteService = require('./inviteService');

class RSVPDashboardService {
    constructor() {
        this.rsvpService = new RSVPService();
        this.eventService = new EventService();
        this.inviteService = new InviteService();
    }

    /**
     * Initialize the RSVP dashboard service
     */
    async initialize() {
        await this.rsvpService.initialize();
        await this.eventService.initialize();
        await this.inviteService.initialize();
    }

    /**
     * Get comprehensive RSVP dashboard data for an event
     */
    async getRSVPDashboardData(eventId, hostEmail) {
        try {
            // Verify the event belongs to the host
            const event = await this.eventService.getEvent(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            if (event.hostEmail !== hostEmail) {
                throw new Error('Unauthorized: Event does not belong to this host');
            }

            // Get all RSVP responses
            const rsvpResponses = await this.rsvpService.getRSVPResponses(eventId);
            
            // Get invite statistics
            const inviteStats = await this.inviteService.getInviteStats(eventId);
            
            // Get RSVP statistics
            const rsvpStats = await this.rsvpService.getRSVPStats(eventId);

            // Calculate dashboard metrics
            const dashboardData = {
                event: event,
                summary: {
                    totalInvites: inviteStats?.totalInvites || 0,
                    totalResponses: rsvpStats?.totalResponses || 0,
                    responseRate: inviteStats?.responseRate || 0,
                    attending: rsvpStats?.attending || 0,
                    notAttending: rsvpStats?.notAttending || 0,
                    maybe: rsvpStats?.maybe || 0,
                    totalGuests: rsvpStats?.totalGuests || 0,
                    pendingResponses: (inviteStats?.totalInvites || 0) - (rsvpStats?.totalResponses || 0)
                },
                responses: rsvpResponses,
                analytics: await this.calculateRSVPAnalytics(rsvpResponses, event),
                trends: await this.calculateResponseTrends(rsvpResponses),
                dietaryAnalysis: this.analyzeDietaryPreferences(rsvpResponses),
                guestAnalysis: this.analyzeGuestCounts(rsvpResponses),
                timeline: await this.calculateResponseTimeline(rsvpResponses, event)
            };

            return dashboardData;
        } catch (error) {
            console.error(`❌ Failed to get RSVP dashboard data for ${eventId}:`, error.message);
            throw error;
        }
    }

    /**
     * Get RSVP analytics for multiple events (host overview)
     */
    async getHostRSVPAnalytics(hostEmail) {
        try {
            const events = await this.eventService.getEventsByHost(hostEmail);
            const analytics = [];

            for (const event of events) {
                try {
                    const rsvpStats = await this.rsvpService.getRSVPStats(event.id);
                    const inviteStats = await this.inviteService.getInviteStats(event.id);
                    
                    analytics.push({
                        eventId: event.id,
                        eventName: event.name,
                        eventDate: event.date,
                        eventStatus: event.status,
                        summary: {
                            totalInvites: inviteStats?.totalInvites || 0,
                            totalResponses: rsvpStats?.totalResponses || 0,
                            responseRate: inviteStats?.responseRate || 0,
                            attending: rsvpStats?.attending || 0,
                            totalGuests: rsvpStats?.totalGuests || 0
                        }
                    });
                } catch (error) {
                    console.error(`Failed to get analytics for event ${event.id}:`, error.message);
                }
            }

            return analytics.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
        } catch (error) {
            console.error(`❌ Failed to get host RSVP analytics for ${hostEmail}:`, error.message);
            return [];
        }
    }

    /**
     * Filter and search RSVP responses
     */
    async filterRSVPResponses(eventId, filters, hostEmail) {
        try {
            // Verify the event belongs to the host
            const event = await this.eventService.getEvent(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            if (event.hostEmail !== hostEmail) {
                throw new Error('Unauthorized: Event does not belong to this host');
            }

            const allResponses = await this.rsvpService.getRSVPResponses(eventId);
            let filteredResponses = [...allResponses];

            // Apply filters
            if (filters.attendance && filters.attendance !== 'all') {
                filteredResponses = filteredResponses.filter(r => r.attendance === filters.attendance);
            }

            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                filteredResponses = filteredResponses.filter(r => 
                    r.guestName.toLowerCase().includes(searchTerm) ||
                    r.guestEmail.toLowerCase().includes(searchTerm) ||
                    (r.message && r.message.toLowerCase().includes(searchTerm))
                );
            }

            if (filters.dietaryOptions && filters.dietaryOptions.length > 0) {
                filteredResponses = filteredResponses.filter(r => 
                    r.dietaryOptions && r.dietaryOptions.some(option => 
                        filters.dietaryOptions.includes(option)
                    )
                );
            }

            if (filters.guestCount) {
                filteredResponses = filteredResponses.filter(r => 
                    r.guestCount >= filters.guestCount.min && 
                    r.guestCount <= filters.guestCount.max
                );
            }

            if (filters.dateRange) {
                const startDate = new Date(filters.dateRange.start);
                const endDate = new Date(filters.dateRange.end);
                filteredResponses = filteredResponses.filter(r => {
                    const responseDate = new Date(r.submittedAt);
                    return responseDate >= startDate && responseDate <= endDate;
                });
            }

            // Sort results
            if (filters.sortBy) {
                filteredResponses.sort((a, b) => {
                    switch (filters.sortBy) {
                        case 'name':
                            return a.guestName.localeCompare(b.guestName);
                        case 'email':
                            return a.guestEmail.localeCompare(b.guestEmail);
                        case 'attendance':
                            return a.attendance.localeCompare(b.attendance);
                        case 'guestCount':
                            return b.guestCount - a.guestCount;
                        case 'submittedAt':
                            return new Date(b.submittedAt) - new Date(a.submittedAt);
                        default:
                            return 0;
                    }
                });
            }

            return {
                responses: filteredResponses,
                totalCount: filteredResponses.length,
                originalCount: allResponses.length
            };
        } catch (error) {
            console.error(`❌ Failed to filter RSVP responses for ${eventId}:`, error.message);
            throw error;
        }
    }

    /**
     * Calculate RSVP analytics
     */
    async calculateRSVPAnalytics(responses, event) {
        const analytics = {
            responseRate: 0,
            attendanceRate: 0,
            averageGuestsPerResponse: 0,
            averageResponseTime: 0,
            peakResponseDay: null,
            peakResponseHour: null,
            dietaryBreakdown: {},
            guestCountDistribution: {},
            responsePatterns: {}
        };

        if (responses.length === 0) {
            return analytics;
        }

        // Calculate basic metrics
        const totalResponses = responses.length;
        const attendingResponses = responses.filter(r => r.attendance === 'yes').length;
        const totalGuests = responses.reduce((sum, r) => sum + r.guestCount, 0);

        analytics.attendanceRate = totalResponses > 0 ? (attendingResponses / totalResponses * 100).toFixed(1) : 0;
        analytics.averageGuestsPerResponse = totalResponses > 0 ? (totalGuests / totalResponses).toFixed(1) : 0;

        // Calculate response time patterns
        const responseTimes = responses.map(r => new Date(r.submittedAt));
        const eventDate = new Date(event.date);
        
        const responseTimeDiffs = responseTimes.map(time => 
            Math.abs(eventDate - time) / (1000 * 60 * 60 * 24) // days
        );
        
        analytics.averageResponseTime = responseTimeDiffs.length > 0 
            ? (responseTimeDiffs.reduce((sum, diff) => sum + diff, 0) / responseTimeDiffs.length).toFixed(1)
            : 0;

        // Find peak response day and hour
        const dayCounts = {};
        const hourCounts = {};
        
        responseTimes.forEach(time => {
            const day = time.toDateString();
            const hour = time.getHours();
            
            dayCounts[day] = (dayCounts[day] || 0) + 1;
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        analytics.peakResponseDay = Object.keys(dayCounts).reduce((a, b) => 
            dayCounts[a] > dayCounts[b] ? a : b, Object.keys(dayCounts)[0]
        );

        analytics.peakResponseHour = Object.keys(hourCounts).reduce((a, b) => 
            hourCounts[a] > hourCounts[b] ? a : b, Object.keys(hourCounts)[0]
        );

        // Analyze dietary preferences
        responses.forEach(response => {
            if (response.dietaryOptions && response.dietaryOptions.length > 0) {
                response.dietaryOptions.forEach(option => {
                    analytics.dietaryBreakdown[option] = (analytics.dietaryBreakdown[option] || 0) + 1;
                });
            }
        });

        // Analyze guest count distribution
        responses.forEach(response => {
            const count = response.guestCount;
            analytics.guestCountDistribution[count] = (analytics.guestCountDistribution[count] || 0) + 1;
        });

        return analytics;
    }

    /**
     * Calculate response trends over time
     */
    async calculateResponseTrends(responses) {
        const trends = {};
        
        responses.forEach(response => {
            const date = new Date(response.submittedAt).toDateString();
            if (!trends[date]) {
                trends[date] = {
                    responses: 0,
                    attending: 0,
                    notAttending: 0,
                    maybe: 0,
                    totalGuests: 0
                };
            }
            
            trends[date].responses++;
            trends[date][response.attendance]++;
            trends[date].totalGuests += response.guestCount;
        });

        return trends;
    }

    /**
     * Analyze dietary preferences
     */
    analyzeDietaryPreferences(responses) {
        const analysis = {
            totalWithDietary: 0,
            totalWithoutDietary: 0,
            preferences: {},
            restrictions: {},
            commonCombinations: {}
        };

        responses.forEach(response => {
            if (response.dietaryOptions && response.dietaryOptions.length > 0) {
                analysis.totalWithDietary++;
                
                response.dietaryOptions.forEach(option => {
                    analysis.preferences[option] = (analysis.preferences[option] || 0) + 1;
                });

                // Track combinations
                if (response.dietaryOptions.length > 1) {
                    const combination = response.dietaryOptions.sort().join(', ');
                    analysis.commonCombinations[combination] = (analysis.commonCombinations[combination] || 0) + 1;
                }
            } else {
                analysis.totalWithoutDietary++;
            }

            if (response.dietaryRestrictions && response.dietaryRestrictions.trim()) {
                analysis.restrictions[response.dietaryRestrictions] = (analysis.restrictions[response.dietaryRestrictions] || 0) + 1;
            }
        });

        return analysis;
    }

    /**
     * Analyze guest counts
     */
    analyzeGuestCounts(responses) {
        const analysis = {
            totalResponses: responses.length,
            totalGuests: responses.reduce((sum, r) => sum + r.guestCount, 0),
            averageGuestsPerResponse: 0,
            guestCountDistribution: {},
            soloAttendees: 0,
            groupAttendees: 0,
            maxGroupSize: 0
        };

        if (responses.length > 0) {
            analysis.averageGuestsPerResponse = (analysis.totalGuests / responses.length).toFixed(1);
        }

        responses.forEach(response => {
            const count = response.guestCount;
            analysis.guestCountDistribution[count] = (analysis.guestCountDistribution[count] || 0) + 1;
            
            if (count === 1) {
                analysis.soloAttendees++;
            } else {
                analysis.groupAttendees++;
            }
            
            analysis.maxGroupSize = Math.max(analysis.maxGroupSize, count);
        });

        return analysis;
    }

    /**
     * Calculate response timeline
     */
    async calculateResponseTimeline(responses, event) {
        const timeline = {
            daysUntilEvent: [],
            responsePatterns: {},
            milestones: []
        };

        const eventDate = new Date(event.date);
        const now = new Date();

        // Calculate days until event for each response
        responses.forEach(response => {
            const responseDate = new Date(response.submittedAt);
            const daysUntilEvent = Math.ceil((eventDate - responseDate) / (1000 * 60 * 60 * 24));
            timeline.daysUntilEvent.push(daysUntilEvent);
        });

        // Identify response patterns
        const sortedResponses = responses.sort((a, b) => 
            new Date(a.submittedAt) - new Date(b.submittedAt)
        );

        const totalDays = Math.ceil((eventDate - new Date(sortedResponses[0]?.submittedAt || now)) / (1000 * 60 * 60 * 24));
        
        for (let day = 0; day <= totalDays; day++) {
            const dayDate = new Date(eventDate);
            dayDate.setDate(dayDate.getDate() - day);
            
            const dayResponses = responses.filter(r => {
                const responseDate = new Date(r.submittedAt);
                return responseDate.toDateString() === dayDate.toDateString();
            });

            if (dayResponses.length > 0) {
                timeline.responsePatterns[day] = {
                    date: dayDate.toDateString(),
                    responses: dayResponses.length,
                    attending: dayResponses.filter(r => r.attendance === 'yes').length,
                    totalGuests: dayResponses.reduce((sum, r) => sum + r.guestCount, 0)
                };
            }
        }

        // Identify milestones
        const totalResponses = responses.length;
        const milestones = [0.25, 0.5, 0.75, 1.0];
        
        milestones.forEach(percentage => {
            const targetCount = Math.ceil(totalResponses * percentage);
            let cumulativeCount = 0;
            
            for (let i = 0; i < sortedResponses.length; i++) {
                cumulativeCount++;
                if (cumulativeCount >= targetCount) {
                    timeline.milestones.push({
                        percentage: percentage * 100,
                        count: cumulativeCount,
                        date: sortedResponses[i].submittedAt,
                        daysUntilEvent: Math.ceil((eventDate - new Date(sortedResponses[i].submittedAt)) / (1000 * 60 * 60 * 24))
                    });
                    break;
                }
            }
        });

        return timeline;
    }

    /**
     * Export RSVP data with advanced formatting
     */
    async exportRSVPData(eventId, format = 'csv', options = {}, hostEmail) {
        try {
            // Verify the event belongs to the host
            const event = await this.eventService.getEvent(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            if (event.hostEmail !== hostEmail) {
                throw new Error('Unauthorized: Event does not belong to this host');
            }

            const responses = await this.rsvpService.getRSVPResponses(eventId);
            const inviteStats = await this.inviteService.getInviteStats(eventId);
            const rsvpStats = await this.rsvpService.getRSVPStats(eventId);

            const exportData = {
                event: event,
                summary: {
                    totalInvites: inviteStats?.totalInvites || 0,
                    totalResponses: rsvpStats?.totalResponses || 0,
                    responseRate: inviteStats?.responseRate || 0,
                    attending: rsvpStats?.attending || 0,
                    totalGuests: rsvpStats?.totalGuests || 0
                },
                responses: responses,
                exportedAt: new Date().toISOString(),
                exportedBy: hostEmail,
                exportOptions: options
            };

            if (format === 'csv') {
                return this.convertToAdvancedCSV(exportData, options);
            } else if (format === 'excel') {
                return this.convertToExcel(exportData, options);
            } else {
                return JSON.stringify(exportData, null, 2);
            }
        } catch (error) {
            console.error(`❌ Failed to export RSVP data for ${eventId}:`, error.message);
            throw error;
        }
    }

    /**
     * Convert to advanced CSV format
     */
    convertToAdvancedCSV(data, options) {
        const csvRows = [];
        
        // Event summary
        csvRows.push('EVENT SUMMARY');
        csvRows.push(`Event Name,${data.event.name}`);
        csvRows.push(`Date,${data.event.date}`);
        csvRows.push(`Time,${data.event.time}`);
        csvRows.push(`Location,${data.event.location}`);
        csvRows.push(`Host,${data.event.hostName}`);
        csvRows.push(`Total Invites,${data.summary.totalInvites}`);
        csvRows.push(`Total Responses,${data.summary.totalResponses}`);
        csvRows.push(`Response Rate,${data.summary.responseRate}%`);
        csvRows.push(`Attending,${data.summary.attending}`);
        csvRows.push(`Total Guests,${data.summary.totalGuests}`);
        csvRows.push('');
        
        // RSVP data
        csvRows.push('RSVP RESPONSES');
        csvRows.push('Guest Name,Guest Email,Attendance,Guest Count,Dietary Options,Dietary Restrictions,Message,Submitted At,Response Time (Days Before Event)');
        
        const eventDate = new Date(data.event.date);
        
        data.responses.forEach(rsvp => {
            const responseDate = new Date(rsvp.submittedAt);
            const daysBeforeEvent = Math.ceil((eventDate - responseDate) / (1000 * 60 * 60 * 24));
            
            const row = [
                rsvp.guestName,
                rsvp.guestEmail,
                rsvp.attendance,
                rsvp.guestCount,
                (rsvp.dietaryOptions || []).join('; '),
                rsvp.dietaryRestrictions || '',
                rsvp.message || '',
                rsvp.submittedAt,
                daysBeforeEvent
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    /**
     * Convert to Excel format (simplified)
     */
    convertToExcel(data, options) {
        // For now, return CSV format
        // In a real implementation, you would use a library like 'xlsx'
        return this.convertToAdvancedCSV(data, options);
    }

    /**
     * Check if service is ready
     */
    isReady() {
        return this.rsvpService && this.eventService && this.inviteService;
    }
}

module.exports = RSVPDashboardService;




