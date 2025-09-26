// Event Details JavaScript
class EventDetails {
    constructor() {
        this.sessionId = null;
        this.host = null;
        this.eventId = null;
        this.eventData = null;
        this.currentTab = 'overview';
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.bindEvents();
    }

    async checkAuthentication() {
        // Get event ID and tab from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.eventId = urlParams.get('eventId');
        const initialTab = urlParams.get('tab') || 'overview';
        
        if (!this.eventId) {
            this.showStatus('Event ID not provided', 'error');
            setTimeout(() => window.location.href = '/host-dashboard', 2000);
            return;
        }

        // Check if we have a session ID in localStorage
        this.sessionId = localStorage.getItem('hostSessionId');
        
        if (!this.sessionId) {
            // Redirect to login
            window.location.href = '/';
            return;
        }

        try {
            const response = await this.apiCall('/host-auth/validate', {
                headers: {
                    'X-Session-ID': this.sessionId
                }
            });

            if (response.success) {
                this.host = response.data.host;
                await this.loadEventData();
                // Switch to initial tab if specified
                if (initialTab !== 'overview') {
                    this.switchTab(initialTab);
                }
            } else {
                // Invalid session, redirect to login
                localStorage.removeItem('hostSessionId');
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            localStorage.removeItem('hostSessionId');
            window.location.href = '/';
        }
    }

    bindEvents() {
        // Navigation
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = '/host-dashboard';
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Event actions
        document.getElementById('editEventBtn').addEventListener('click', () => {
            this.editEvent();
        });

        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportEventData();
        });

        // Quick actions
        document.getElementById('generateMoreInvitesBtn').addEventListener('click', () => {
            this.showInviteModal();
        });

        document.getElementById('viewAllRSVPsBtn').addEventListener('click', () => {
            this.switchTab('rsvps');
        });

        document.getElementById('exportRSVPsBtn').addEventListener('click', () => {
            this.exportRSVPs();
        });

        // Invite modal
        document.getElementById('generateInvitesBtn').addEventListener('click', () => {
            this.showInviteModal();
        });

        document.getElementById('exportInvitesBtn').addEventListener('click', () => {
            this.exportInvites();
        });

        // Modal events
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.hideInviteModal();
        });

        document.querySelector('.modal-cancel').addEventListener('click', () => {
            this.hideInviteModal();
        });

        document.getElementById('inviteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateInvites();
        });

        // Invite type radio buttons
        document.querySelectorAll('input[name="inviteType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleInviteOptions(e.target.value);
            });
        });

        // RSVP filter
        document.getElementById('rsvpFilter').addEventListener('change', (e) => {
            this.filterRSVPs(e.target.value);
        });

        // Close modal when clicking outside
        document.getElementById('inviteModal').addEventListener('click', (e) => {
            if (e.target.id === 'inviteModal') {
                this.hideInviteModal();
            }
        });
    }

    async loadEventData() {
        try {
            const response = await this.apiCall(`/event-management/event/${this.eventId}`, {
                headers: {
                    'X-Session-ID': this.sessionId
                }
            });

            if (response.success) {
                this.eventData = response.data;
                this.updateEventDisplay();
                this.updateStats();
                this.loadTabContent();
            } else {
                throw new Error(response.message || 'Failed to load event data');
            }
        } catch (error) {
            console.error('Failed to load event data:', error);
            this.showStatus(`Failed to load event data: ${error.message}`, 'error');
        }
    }

    updateEventDisplay() {
        const event = this.eventData.event;
        
        // Update header
        document.getElementById('eventTitle').textContent = event.name;
        document.getElementById('eventName').textContent = event.name;
        
        // Update date display
        const eventDate = new Date(event.date);
        document.getElementById('eventDay').textContent = eventDate.getDate();
        document.getElementById('eventMonth').textContent = eventDate.toLocaleDateString('en', { month: 'short' });
        
        // Update time and location
        document.getElementById('eventTime').textContent = event.time;
        document.getElementById('eventLocation').textContent = `📍 ${event.location}`;
        
        // Update status
        const statusElement = document.getElementById('eventStatus');
        statusElement.textContent = event.status;
        statusElement.className = `status-badge ${event.status}`;
        
        // Update host
        document.getElementById('eventHost').textContent = event.hostName;
        
        // Update description
        const descriptionElement = document.getElementById('eventDescription');
        if (event.description) {
            descriptionElement.innerHTML = `<p>${event.description}</p>`;
        } else {
            descriptionElement.innerHTML = '<p>No description provided.</p>';
        }
    }

    updateStats() {
        const summary = this.eventData.summary;
        
        document.getElementById('totalInvites').textContent = summary.totalInvites;
        document.getElementById('totalResponses').textContent = summary.totalResponses;
        document.getElementById('attending').textContent = summary.attending;
        document.getElementById('totalGuests').textContent = summary.totalGuests;
        document.getElementById('responseRate').textContent = `${summary.responseRate}%`;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;
        this.loadTabContent();
    }

    async loadTabContent() {
        switch (this.currentTab) {
            case 'overview':
                this.loadOverviewContent();
                break;
            case 'invites':
                await this.loadInvitesContent();
                break;
            case 'rsvps':
                await this.loadRSVPsContent();
                break;
            case 'analytics':
                await this.loadAnalyticsContent();
                break;
        }
    }

    loadOverviewContent() {
        const event = this.eventData.event;
        
        // Update detail items
        document.getElementById('detailDate').textContent = new Date(event.date).toLocaleDateString();
        document.getElementById('detailTime').textContent = event.time;
        document.getElementById('detailLocation').textContent = event.location;
        document.getElementById('detailMaxGuests').textContent = event.maxGuests || 'Unlimited';
        document.getElementById('detailRSVPDeadline').textContent = event.rsvpDeadline 
            ? new Date(event.rsvpDeadline).toLocaleDateString() 
            : 'No deadline';

        // Update recent RSVPs
        const recentRSVPsElement = document.getElementById('recentRSVPs');
        if (this.eventData.recentResponses && this.eventData.recentResponses.length > 0) {
            recentRSVPsElement.innerHTML = this.eventData.recentResponses.map(rsvp => `
                <div class="rsvp-item">
                    <div class="rsvp-guest">${rsvp.guestName}</div>
                    <div class="rsvp-status ${rsvp.attendance}">${rsvp.attendance}</div>
                </div>
            `).join('');
        } else {
            recentRSVPsElement.innerHTML = '<p>No recent RSVP responses.</p>';
        }
    }

    async loadInvitesContent() {
        try {
            const response = await this.apiCall(`/invites/event/${this.eventId}`, {
                headers: {
                    'X-Session-ID': this.sessionId
                }
            });

            const invitesListElement = document.getElementById('invitesList');
            if (response.success && response.data.length > 0) {
                invitesListElement.innerHTML = response.data.map(invite => `
                    <div class="invite-item">
                        <div class="invite-info">
                            <div class="invite-guest">${invite.guestName || 'Anonymous Invite'}</div>
                            <div class="invite-email">${invite.guestEmail || 'No email provided'}</div>
                        </div>
                        <div class="invite-actions-item">
                            <button class="btn btn-secondary" onclick="eventDetails.viewInvite('${invite.id}')">View</button>
                            <button class="btn btn-secondary" onclick="eventDetails.deactivateInvite('${invite.id}')">Deactivate</button>
                        </div>
                    </div>
                `).join('');
            } else {
                invitesListElement.innerHTML = '<p>No invites found for this event.</p>';
            }
        } catch (error) {
            console.error('Failed to load invites:', error);
            document.getElementById('invitesList').innerHTML = '<p>Failed to load invites.</p>';
        }
    }

    async loadRSVPsContent() {
        try {
            const response = await this.apiCall(`/rsvp-management/event/${this.eventId}`, {
                headers: {
                    'X-Session-ID': this.sessionId
                }
            });

            const rsvpsListElement = document.getElementById('rsvpsList');
            if (response.success && response.data.length > 0) {
                this.allRSVPs = response.data;
                this.filterRSVPs('all');
            } else {
                rsvpsListElement.innerHTML = '<p>No RSVP responses found for this event.</p>';
            }
        } catch (error) {
            console.error('Failed to load RSVPs:', error);
            document.getElementById('rsvpsList').innerHTML = '<p>Failed to load RSVP responses.</p>';
        }
    }

    filterRSVPs(filter) {
        if (!this.allRSVPs) return;

        const filteredRSVPs = filter === 'all' 
            ? this.allRSVPs 
            : this.allRSVPs.filter(rsvp => rsvp.attendance === filter);

        const rsvpsListElement = document.getElementById('rsvpsList');
        rsvpsListElement.innerHTML = filteredRSVPs.map(rsvp => `
            <div class="rsvp-item">
                <div class="rsvp-info">
                    <div class="rsvp-guest">${rsvp.guestName}</div>
                    <div class="rsvp-email">${rsvp.guestEmail}</div>
                    <div class="rsvp-details">
                        ${rsvp.guestCount} guest(s) • 
                        ${rsvp.dietaryOptions && rsvp.dietaryOptions.length > 0 
                            ? rsvp.dietaryOptions.join(', ') 
                            : 'No dietary restrictions'}
                    </div>
                </div>
                <div class="rsvp-actions-item">
                    <div class="rsvp-status ${rsvp.attendance}">${rsvp.attendance}</div>
                    <div class="rsvp-date">${new Date(rsvp.submittedAt).toLocaleDateString()}</div>
                </div>
            </div>
        `).join('');
    }

    async loadAnalyticsContent() {
        try {
            const response = await this.apiCall(`/event-management/event/${this.eventId}/analytics`, {
                headers: {
                    'X-Session-ID': this.sessionId
                }
            });

            const analyticsContentElement = document.getElementById('analyticsContent');
            if (response.success) {
                const analytics = response.data;
                analyticsContentElement.innerHTML = `
                    <div class="analytics-section">
                        <h4>Event Insights</h4>
                        <div class="insights-grid">
                            <div class="insight-item">
                                <div class="insight-value">${analytics.insights.responseRate}%</div>
                                <div class="insight-label">Response Rate</div>
                            </div>
                            <div class="insight-item">
                                <div class="insight-value">${analytics.insights.attendanceRate}%</div>
                                <div class="insight-label">Attendance Rate</div>
                            </div>
                            <div class="insight-item">
                                <div class="insight-value">${analytics.insights.averageGuestsPerResponse}</div>
                                <div class="insight-label">Avg Guests/Response</div>
                            </div>
                            <div class="insight-item">
                                <div class="insight-value">${analytics.insights.daysUntilEvent}</div>
                                <div class="insight-label">Days Until Event</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analytics-section">
                        <h4>Dietary Preferences</h4>
                        <div class="dietary-stats">
                            ${Object.entries(analytics.trends.dietaryPreferences).map(([preference, count]) => `
                                <div class="dietary-item">
                                    <span class="dietary-preference">${preference}</span>
                                    <span class="dietary-count">${count} guests</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                analyticsContentElement.innerHTML = '<p>Failed to load analytics data.</p>';
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
            document.getElementById('analyticsContent').innerHTML = '<p>Failed to load analytics.</p>';
        }
    }

    showInviteModal() {
        document.getElementById('inviteModal').style.display = 'block';
        document.getElementById('inviteForm').reset();
        this.toggleInviteOptions('batch');
    }

    hideInviteModal() {
        document.getElementById('inviteModal').style.display = 'none';
    }

    toggleInviteOptions(type) {
        const batchOptions = document.getElementById('batchOptions');
        const personalizedOptions = document.getElementById('personalizedOptions');
        
        if (type === 'batch') {
            batchOptions.style.display = 'block';
            personalizedOptions.style.display = 'none';
        } else {
            batchOptions.style.display = 'none';
            personalizedOptions.style.display = 'block';
        }
    }

    async generateInvites() {
        try {
            const inviteType = document.querySelector('input[name="inviteType"]:checked').value;
            let inviteOptions;

            if (inviteType === 'batch') {
                const inviteCount = parseInt(document.getElementById('inviteCount').value);
                inviteOptions = {
                    inviteCount: inviteCount
                };
            } else {
                const guestListText = document.getElementById('guestList').value;
                const guestList = guestListText.split('\n')
                    .filter(line => line.trim())
                    .map(line => {
                        const parts = line.split(',').map(part => part.trim());
                        return {
                            name: parts[0] || '',
                            email: parts[1] || '',
                            message: parts[2] || ''
                        };
                    });

                inviteOptions = {
                    guestList: guestList
                };
            }

            const response = await this.apiCall(`/event-management/event/${this.eventId}/invites`, {
                method: 'POST',
                body: JSON.stringify(inviteOptions),
                headers: {
                    'X-Session-ID': this.sessionId
                }
            });

            if (response.success) {
                this.showStatus('Invites generated successfully!', 'success');
                this.hideInviteModal();
                await this.loadEventData(); // Refresh data
                this.switchTab('invites');
            } else {
                throw new Error(response.message || 'Failed to generate invites');
            }
        } catch (error) {
            console.error('Failed to generate invites:', error);
            this.showStatus(`Failed to generate invites: ${error.message}`, 'error');
        }
    }

    async exportEventData() {
        try {
            const response = await fetch(`/event-management/event/${this.eventId}/export?format=json`, {
                headers: {
                    'X-Session-ID': this.sessionId
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `event-${this.eventId}-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                this.showStatus('Event data exported successfully!', 'success');
            } else {
                throw new Error('Failed to export event data');
            }
        } catch (error) {
            console.error('Failed to export event data:', error);
            this.showStatus(`Failed to export event data: ${error.message}`, 'error');
        }
    }

    async exportRSVPs() {
        try {
            const response = await fetch(`/rsvp-management/export/${this.eventId}?format=csv`, {
                headers: {
                    'X-Session-ID': this.sessionId
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `rsvps-${this.eventId}-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                this.showStatus('RSVP data exported successfully!', 'success');
            } else {
                throw new Error('Failed to export RSVP data');
            }
        } catch (error) {
            console.error('Failed to export RSVP data:', error);
            this.showStatus(`Failed to export RSVP data: ${error.message}`, 'error');
        }
    }

    editEvent() {
        this.showStatus('Event editing not implemented yet', 'info');
    }

    exportInvites() {
        this.showStatus('Invite export not implemented yet', 'info');
    }

    viewInvite(inviteId) {
        this.showStatus('Invite view not implemented yet', 'info');
    }

    deactivateInvite(inviteId) {
        this.showStatus('Invite deactivation not implemented yet', 'info');
    }

    openRSVPDashboard() {
        // Navigate to RSVP dashboard
        window.location.href = `/rsvp-dashboard?eventId=${this.eventId}`;
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('statusMessage');
        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
        statusElement.style.display = 'block';
        
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }

    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
}

// Initialize event details when DOM is loaded
let eventDetails;
document.addEventListener('DOMContentLoaded', () => {
    eventDetails = new EventDetails();
});
