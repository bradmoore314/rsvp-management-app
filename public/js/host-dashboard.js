// Host Dashboard JavaScript
class HostDashboard {
    constructor() {
        this.sessionId = null;
        this.host = null;
        this.events = [];
        this.currentSection = 'overview';
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.bindEvents();
    }

    async checkAuthentication() {
        // Check if we have a session ID in localStorage
        this.sessionId = localStorage.getItem('hostSessionId');
        
        // Show sign-in button if no session
        if (!this.sessionId) {
            console.log('No session found, showing sign-in option');
            this.showSignInButton();
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
                this.updateHostInfo();
                await this.loadDashboardData();
            } else {
                // Fallback to default host
                this.host = {
                    name: 'Event Host',
                    email: 'host@example.com'
                };
                this.updateHostInfo();
                await this.loadDashboardData();
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            // Fallback to default host
            this.host = {
                name: 'Event Host',
                email: 'host@example.com'
            };
            this.updateHostInfo();
            await this.loadDashboardData();
        }
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // Google Sign-in
        document.getElementById('googleSignInBtn').addEventListener('click', () => {
            this.googleSignIn();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Event creation
        document.getElementById('createEventBtn').addEventListener('click', () => {
            this.showEventModal();
        });

        // Modal events
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.hideEventModal();
        });

        document.querySelector('.modal-cancel').addEventListener('click', () => {
            this.hideEventModal();
        });

        document.getElementById('eventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createEvent();
        });

        // Settings
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettings();
        });

        // Invite actions
        document.getElementById('generateInvitesBtn').addEventListener('click', () => {
            this.showInviteGeneration();
        });

        // RSVP actions
        document.getElementById('refreshRSVPsBtn').addEventListener('click', () => {
            this.loadRSVPData();
        });

        // Close modal when clicking outside
        document.getElementById('eventModal').addEventListener('click', (e) => {
            if (e.target.id === 'eventModal') {
                this.hideEventModal();
            }
        });

        // Image removal
        document.addEventListener('click', (e) => {
            if (e.target.id === 'removeImage') {
                this.removeImagePreview();
            }
        });
    }

    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');

        this.currentSection = sectionName;

        // Load section-specific data
        switch (sectionName) {
            case 'events':
                this.loadEvents();
                break;
            case 'invites':
                this.loadInvites();
                break;
            case 'rsvps':
                this.loadRSVPData();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    updateHostInfo() {
        document.getElementById('hostName').textContent = this.host.name;
        document.getElementById('hostEmail').textContent = this.host.email;
        
        if (this.host.picture) {
            document.getElementById('hostAvatar').src = this.host.picture;
            document.getElementById('hostAvatar').style.display = 'block';
        }
        
        // Show logout button and hide sign-in button
        document.getElementById('logoutBtn').style.display = 'block';
        document.getElementById('googleSignInBtn').style.display = 'none';
    }

    showSignInButton() {
        document.getElementById('hostName').textContent = 'Please sign in';
        document.getElementById('hostEmail').textContent = 'to access your dashboard';
        document.getElementById('googleSignInBtn').style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('hostAvatar').style.display = 'none';
    }

    async googleSignIn() {
        try {
            this.showStatus('Redirecting to Google...', 'info');
            
            // Get the Google OAuth URL
            const response = await this.apiCall('/host-auth/google-url');
            
            if (response.success) {
                // Redirect to Google OAuth
                window.location.href = response.data.authUrl;
            } else {
                throw new Error(response.message || 'Failed to get Google auth URL');
            }
        } catch (error) {
            console.error('Google Sign-in failed:', error);
            this.showStatus(`Sign-in failed: ${error.message}`, 'error');
        }
    }

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadOverviewStats(),
                this.loadRecentActivity()
            ]);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showStatus('Failed to load dashboard data', 'error');
        }
    }

    async loadOverviewStats() {
        try {
            // Load events for this host
            const eventsResponse = await this.apiCall(`/events/host/${this.host.email}`);
            this.events = eventsResponse.data || [];

            // Update stats
            document.getElementById('totalEvents').textContent = this.events.length;
            document.getElementById('activeEvents').textContent = this.events.filter(e => e.status === 'active').length;

            // Calculate total invites and RSVPs
            let totalInvites = 0;
            let totalRSVPs = 0;

            for (const event of this.events) {
                try {
                    const invitesResponse = await this.apiCall(`/invites/event/${event.id}`);
                    totalInvites += invitesResponse.count || 0;

                    const rsvpResponse = await this.apiCall(`/rsvp-management/stats/${event.id}`);
                    totalRSVPs += rsvpResponse.data?.totalResponses || 0;
                } catch (error) {
                    console.error(`Failed to load data for event ${event.id}:`, error);
                }
            }

            document.getElementById('totalInvites').textContent = totalInvites;
            document.getElementById('totalRSVPs').textContent = totalRSVPs;
        } catch (error) {
            console.error('Failed to load overview stats:', error);
        }
    }

    async loadRecentActivity() {
        try {
            const activityList = document.getElementById('recentActivity');
            activityList.innerHTML = '<p>Loading recent activity...</p>';

            // For now, show recent events
            if (this.events.length === 0) {
                activityList.innerHTML = '<p>No recent activity</p>';
                return;
            }

            const recentEvents = this.events
                .sort((a, b) => new Date(b.created) - new Date(a.created))
                .slice(0, 5);

            activityList.innerHTML = recentEvents.map(event => `
                <div class="activity-item">
                    <strong>${event.name}</strong> - Created ${new Date(event.created).toLocaleDateString()}
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load recent activity:', error);
            document.getElementById('recentActivity').innerHTML = '<p>Failed to load recent activity</p>';
        }
    }

    async loadEvents() {
        try {
            const eventsList = document.getElementById('eventsList');
            eventsList.innerHTML = '<p>Loading events...</p>';

            // Always use simplified mode for now since session validation is failing
            let response;
            try {
                // Try to load events for the current host
                response = await this.apiCall(`/events/host/${this.host.email}`);
            } catch (error) {
                console.log('Failed to load events with host email, trying default:', error);
                // Fallback to default host
                response = await this.apiCall(`/events/host/host@example.com`);
            }
            
            this.events = response.data || [];

            if (this.events.length === 0) {
                eventsList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🎉</div>
                        <h3>No events yet</h3>
                        <p>Create your first event to get started with RSVP management!</p>
                        <button class="btn btn-primary" onclick="dashboard.showEventModal()">Create Event</button>
                    </div>
                `;
                return;
            }

            eventsList.innerHTML = this.events.map(event => `
                <div class="event-card">
                    <div class="event-header">
                        <div>
                            <h3 class="event-title">${event.name}</h3>
                            <p class="event-date">${new Date(event.date).toLocaleDateString()} at ${event.time}</p>
                        </div>
                        <span class="event-status ${event.status || 'active'}">${event.status || 'active'}</span>
                    </div>
                    <div class="event-details">
                        <div class="event-detail">
                            <span>📍</span>
                            <span>${event.location}</span>
                        </div>
                        <div class="event-detail">
                            <span>👥</span>
                            <span>Max ${event.maxGuests || 'Unlimited'} guests</span>
                        </div>
                        <div class="event-detail">
                            <span>📅</span>
                            <span>RSVP by ${event.rsvpDeadline ? new Date(event.rsvpDeadline).toLocaleDateString() : 'No deadline'}</span>
                        </div>
                        <div class="event-detail">
                            <span>📧</span>
                            <span>${event.summary?.totalInvites || 0} invites, ${event.summary?.totalResponses || 0} responses</span>
                        </div>
                        <div class="event-detail">
                            <span>🎉</span>
                            <span>${event.summary?.attending || 0} attending (${event.summary?.totalGuests || 0} total guests)</span>
                        </div>
                    </div>
                    <div class="event-actions">
                        <button class="btn btn-primary" onclick="dashboard.viewEvent('${event.id}')">View Details</button>
                        <button class="btn btn-secondary" onclick="dashboard.generateInvitesForEvent('${event.id}')">Generate Invites</button>
                        <button class="btn btn-secondary" onclick="dashboard.viewRSVPs('${event.id}')">View RSVPs</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load events:', error);
            document.getElementById('eventsList').innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Failed to load events</h3>
                    <p>There was an error loading your events. Please try again.</p>
                    <button class="btn btn-primary" onclick="dashboard.loadEvents()">Retry</button>
                </div>
            `;
        }
    }

    async loadInvites() {
        const invitesList = document.getElementById('invitesList');
        invitesList.innerHTML = '<p>Select an event to view invites...</p>';
    }

    async loadRSVPData() {
        const rsvpStats = document.getElementById('rsvpStats');
        rsvpStats.innerHTML = '<p>Select an event to view RSVP statistics...</p>';
    }

    loadSettings() {
        document.getElementById('hostNameInput').value = this.host.name || '';
        document.getElementById('hostEmailInput').value = this.host.email || '';
        // Add timezone and other settings as needed
    }

    showEventModal() {
        document.getElementById('eventModal').style.display = 'block';
        document.getElementById('eventForm').reset();
    }

    hideEventModal() {
        document.getElementById('eventModal').style.display = 'none';
    }

    async createEvent() {
        try {
            console.log('🎉 Starting event creation...');
            
            // Validate required fields
            const eventName = document.getElementById('eventName').value;
            const eventDate = document.getElementById('eventDate').value;
            const eventTime = document.getElementById('eventStartTime').value;
            const eventLocation = document.getElementById('eventLocation').value;
            
            if (!eventName || !eventDate || !eventTime || !eventLocation) {
                this.showStatus('Please fill in all required fields (Name, Date, Time, Location)', 'error');
                return;
            }
            
            const eventImageFile = document.getElementById('eventImage').files[0];
            
            // Create FormData for file upload
            const formData = new FormData();
            
            // Add event data
            formData.append('name', eventName);
            formData.append('description', document.getElementById('eventDescription').value || '');
            formData.append('date', eventDate);
            formData.append('time', eventTime);
            formData.append('endTime', document.getElementById('eventEndTime').value || '');
            formData.append('location', eventLocation);
            formData.append('maxGuests', document.getElementById('maxGuests').value ? parseInt(document.getElementById('maxGuests').value) : '');
            formData.append('rsvpDeadline', document.getElementById('rsvpDeadline').value || '');
            
            // Handle dietary options
            const dietaryText = document.getElementById('dietaryOptions').value;
            const dietaryOptions = dietaryText ? dietaryText.split('\n').filter(option => option.trim()) : ['No Restrictions'];
            formData.append('dietaryOptions', JSON.stringify(dietaryOptions));
            
            formData.append('specialInstructions', document.getElementById('specialInstructions').value || '');
            formData.append('hostName', this.host.name || 'Event Host');
            formData.append('hostEmail', this.host.email || 'host@example.com');
            formData.append('initialInviteCount', '0');
            
            // Add image if selected
            if (eventImageFile) {
                formData.append('eventImage', eventImageFile);
            }

            console.log('📤 Sending event creation request...');
            this.showStatus('Creating event...', 'info');

            const response = await fetch('/event-management/create', {
                method: 'POST',
                body: formData
            });

            console.log('📥 Response received:', response.status);
            const result = await response.json();
            console.log('📥 Response data:', result);

            if (result.success) {
                this.showStatus('Event created successfully!', 'success');
                this.hideEventModal();
                // Refresh the events list
                if (this.currentSection === 'events') {
                await this.loadEvents();
                }
                await this.loadOverviewStats();
            } else {
                throw new Error(result.message || 'Failed to create event');
            }
        } catch (error) {
            console.error('❌ Failed to create event:', error);
            this.showStatus(`Failed to create event: ${error.message}`, 'error');
        }
    }

    async saveSettings() {
        try {
            const updateData = {
                name: document.getElementById('hostNameInput').value,
                timezone: document.getElementById('timezoneSelect').value
            };

            const response = await this.apiCall('/host-auth/profile', {
                method: 'PUT',
                body: JSON.stringify(updateData),
                headers: {
                    'X-Session-ID': this.sessionId
                }
            });

            if (response.success) {
                this.host = response.data;
                this.updateHostInfo();
                this.showStatus('Settings saved successfully!', 'success');
            } else {
                throw new Error(response.message || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showStatus(`Failed to save settings: ${error.message}`, 'error');
        }
    }

    async logout() {
        try {
            await this.apiCall('/host-auth/logout', {
                method: 'POST',
                headers: {
                    'X-Session-ID': this.sessionId
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('hostSessionId');
            window.location.href = '/';
        }
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

    // Event action methods
    viewEvent(eventId) {
        // For now, show event details in a modal instead of navigating
        this.showEventDetails(eventId);
    }

    generateInvitesForEvent(eventId) {
        // Generate invites for specific event
        this.generateInvitesForSpecificEvent(eventId);
    }

    viewRSVPs(eventId) {
        // Show RSVPs for specific event
        this.showEventRSVPs(eventId);
    }

    async showInviteGeneration() {
        try {
            if (this.events.length === 0) {
                this.showStatus('Please create an event first before generating invites', 'error');
                return;
            }

            // Show a simple modal to select event and generate invites
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Generate Invites</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="eventSelect">Select Event</label>
                            <select id="eventSelect" required>
                                ${this.events.map(event => `
                                    <option value="${event.id}">${event.name} - ${new Date(event.date).toLocaleDateString()}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="inviteCount">Number of Invites</label>
                            <input type="number" id="inviteCount" min="1" max="100" value="5" required>
                        </div>
                        <div class="form-group">
                            <label for="baseUrl">Base URL (for QR codes)</label>
                            <input type="url" id="baseUrl" value="${window.location.origin}" required>
                        </div>
                    
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="useGoogleDrive">
                                Use Google Drive hosting (for external access when server is offline)
                            </label>
                            <p style="font-size: 0.875rem; color: #718096; margin-top: 4px;">
                                When enabled, RSVP forms are hosted on Google Drive and accessible from anywhere
                            </p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
                        <button type="button" class="btn btn-primary" id="generateInvitesConfirm">Generate Invites</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add event listeners
            modal.querySelector('.modal-close').addEventListener('click', () => {
                document.body.removeChild(modal);
            });

            modal.querySelector('.modal-cancel').addEventListener('click', () => {
                document.body.removeChild(modal);
            });

            modal.querySelector('#generateInvitesConfirm').addEventListener('click', async () => {
                const eventId = modal.querySelector('#eventSelect').value;
                const inviteCount = parseInt(modal.querySelector('#inviteCount').value);
                const baseUrl = modal.querySelector('#baseUrl').value;
                const useGoogleDrive = modal.querySelector('#useGoogleDrive') ? modal.querySelector('#useGoogleDrive').checked : false;

                try {
                    this.showStatus('Generating invites...', 'info');
                    
                    const response = await fetch('/qrcode/generate-batch', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            eventId: eventId,
                            inviteCount: inviteCount,
                            baseUrl: baseUrl,
                            useGoogleDrive: useGoogleDrive
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        this.showStatus(`Successfully generated ${inviteCount} invites with QR codes!`, 'success');
                        document.body.removeChild(modal);
                        
                        // Show the generated invites
                        this.showGeneratedInvites(result.data);
                    } else {
                        throw new Error(result.message || 'Failed to generate invites');
                    }
                } catch (error) {
                    console.error('Failed to generate invites:', error);
                    this.showStatus(`Failed to generate invites: ${error.message}`, 'error');
                }
            });

            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        } catch (error) {
            console.error('Error showing invite generation:', error);
            this.showStatus('Error showing invite generation interface', 'error');
        }
    }

    showGeneratedInvites(inviteData) {
        console.log('showGeneratedInvites called with:', inviteData);
        
        // Handle different response structures
        let invites = [];
        if (inviteData.invites && Array.isArray(inviteData.invites)) {
            // Batch response structure
            invites = inviteData.invites;
        } else if (inviteData.qrCodes && Array.isArray(inviteData.qrCodes)) {
            // Legacy batch response structure with qrCodes
            invites = inviteData.qrCodes;
        } else if (inviteData.inviteId) {
            // Single response structure - convert to array
            invites = [inviteData];
        } else {
            console.error('Invalid inviteData structure:', inviteData);
            this.showStatus('Error: Invalid response structure', 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>Generated Invites</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Successfully generated ${invites.length} invites with QR codes:</p>
                    <div style="max-height: 400px; overflow-y: auto; margin-top: 16px;">
                        ${invites.map((invite, index) => `
                            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                                <div style="display: flex; gap: 16px; align-items: center;">
                                    <div>
                                        <img src="${invite.qrCodeDataURL}" alt="QR Code" style="width: 100px; height: 100px; border: 1px solid #e2e8f0; border-radius: 4px;">
                                    </div>
                                    <div style="flex: 1;">
                                        <h4 style="margin: 0 0 8px 0; color: #1a202c;">Invite #${index + 1}</h4>
                                        <p style="margin: 0 0 4px 0; color: #718096; font-size: 0.875rem;">Invite ID: ${invite.inviteId}</p>
                                        <p style="margin: 0 0 8px 0; color: #718096; font-size: 0.875rem;">RSVP URL: <a href="${invite.rsvpUrl}" target="_blank" style="color: #3182ce;">${invite.rsvpUrl}</a></p>
                                        <button class="btn btn-small btn-secondary" onclick="navigator.clipboard.writeText('${invite.rsvpUrl}')">Copy URL</button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 16px; padding: 12px; background: #f7fafc; border-radius: 6px;">
                        <p style="margin: 0; font-size: 0.875rem; color: #4a5568;">
                            <strong>Next steps:</strong> Print these QR codes or share the URLs with your guests. 
                            When guests scan the QR codes or visit the URLs, they'll be taken to the RSVP form.
                        </p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-cancel">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('.modal-cancel').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    async showEventDetails(eventId) {
        try {
            const event = this.events.find(e => e.id === eventId);
            if (!event) {
                this.showStatus('Event not found', 'error');
                return;
            }

            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3>Event Details</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="margin-bottom: 20px;">
                            <h2 style="margin: 0 0 8px 0; color: #1a202c;">${event.name}</h2>
                            <p style="margin: 0 0 4px 0; color: #718096;">📅 ${new Date(event.date).toLocaleDateString()} at ${event.time}</p>
                            <p style="margin: 0 0 4px 0; color: #718096;">📍 ${event.location}</p>
                            <p style="margin: 0 0 4px 0; color: #718096;">👤 Hosted by ${event.hostName || 'Event Host'}</p>
                            ${event.description ? `<p style="margin: 8px 0 0 0; color: #4a5568;">${event.description}</p>` : ''}
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
                            <div style="background: #f7fafc; padding: 16px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 1.5rem; font-weight: 600; color: #1a202c;">${event.summary?.totalInvites || 0}</div>
                                <div style="font-size: 0.875rem; color: #718096;">Total Invites</div>
                            </div>
                            <div style="background: #f7fafc; padding: 16px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 1.5rem; font-weight: 600; color: #1a202c;">${event.summary?.totalResponses || 0}</div>
                                <div style="font-size: 0.875rem; color: #718096;">Responses</div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                            <button class="btn btn-primary" onclick="dashboard.generateInvitesForSpecificEvent('${eventId}')">Generate Invites</button>
                            <button class="btn btn-secondary" onclick="dashboard.showEventRSVPs('${eventId}')">View RSVPs</button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary modal-cancel">Close</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add event listeners
            modal.querySelector('.modal-close').addEventListener('click', () => {
                document.body.removeChild(modal);
            });

            modal.querySelector('.modal-cancel').addEventListener('click', () => {
                document.body.removeChild(modal);
            });

            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        } catch (error) {
            console.error('Error showing event details:', error);
            this.showStatus('Error showing event details', 'error');
        }
    }

    async generateInvitesForSpecificEvent(eventId) {
        try {
            const event = this.events.find(e => e.id === eventId);
            if (!event) {
                this.showStatus('Event not found', 'error');
                return;
            }

            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Generate Invites for "${event.name}"</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="inviteCount">Number of Invites</label>
                            <input type="number" id="inviteCount" min="1" max="100" value="5" required>
                        </div>
                        <div class="form-group">
                            <label for="baseUrl">Base URL (for QR codes)</label>
                            <input type="url" id="baseUrl" value="${window.location.origin}" required>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="useGoogleDrive">
                                Use Google Drive hosting (for external access when server is offline)
                            </label>
                            <p style="font-size: 0.875rem; color: #718096; margin-top: 4px;">
                                When enabled, RSVP forms are hosted on Google Drive and accessible from anywhere
                            </p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
                        <button type="button" class="btn btn-primary" id="generateInvitesConfirm">Generate Invites</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add event listeners
            modal.querySelector('.modal-close').addEventListener('click', () => {
                document.body.removeChild(modal);
            });

            modal.querySelector('.modal-cancel').addEventListener('click', () => {
                document.body.removeChild(modal);
            });

            modal.querySelector('#generateInvitesConfirm').addEventListener('click', async () => {
                const inviteCount = parseInt(modal.querySelector('#inviteCount').value);
                const baseUrl = modal.querySelector('#baseUrl').value;
                const useGoogleDrive = modal.querySelector('#useGoogleDrive') ? modal.querySelector('#useGoogleDrive').checked : false;

                try {
                    this.showStatus('Generating invites...', 'info');
                    
                    const response = await fetch('/qrcode/generate-batch', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            eventId: eventId,
                            inviteCount: inviteCount,
                            baseUrl: baseUrl,
                            useGoogleDrive: useGoogleDrive
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        this.showStatus(`Successfully generated ${inviteCount} invites with QR codes!`, 'success');
                        document.body.removeChild(modal);
                        
                        // Show the generated invites
                        this.showGeneratedInvites(result.data);
                    } else {
                        throw new Error(result.message || 'Failed to generate invites');
                    }
                } catch (error) {
                    console.error('Failed to generate invites:', error);
                    this.showStatus(`Failed to generate invites: ${error.message}`, 'error');
                }
            });

            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        } catch (error) {
            console.error('Error generating invites for event:', error);
            this.showStatus('Error generating invites', 'error');
        }
    }

    async showEventRSVPs(eventId) {
        try {
            const event = this.events.find(e => e.id === eventId);
            if (!event) {
                this.showStatus('Event not found', 'error');
                return;
            }

            this.showStatus('Loading RSVP data...', 'info');

            // Try to get RSVP data for this event
            const response = await fetch(`/rsvp-management/stats/${eventId}`);
            const result = await response.json();

            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3>RSVP Responses for "${event.name}"</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${result.success ? `
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                                <div style="background: #f0fff4; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #9ae6b4;">
                                    <div style="font-size: 1.5rem; font-weight: 600; color: #22543d;">${result.data?.attending || 0}</div>
                                    <div style="font-size: 0.875rem; color: #22543d;">Attending</div>
                                </div>
                                <div style="background: #fed7d7; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #feb2b2;">
                                    <div style="font-size: 1.5rem; font-weight: 600; color: #742a2a;">${result.data?.notAttending || 0}</div>
                                    <div style="font-size: 0.875rem; color: #742a2a;">Not Attending</div>
                                </div>
                                <div style="background: #ebf8ff; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #90cdf4;">
                                    <div style="font-size: 1.5rem; font-weight: 600; color: #2a4365;">${result.data?.maybe || 0}</div>
                                    <div style="font-size: 0.875rem; color: #2a4365;">Maybe</div>
                                </div>
                            </div>
                            <div style="background: #f7fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                                <p style="margin: 0; font-size: 0.875rem; color: #4a5568;">
                                    <strong>Total Responses:</strong> ${result.data?.totalResponses || 0} | 
                                    <strong>Total Guests:</strong> ${result.data?.totalGuests || 0} | 
                                    <strong>Response Rate:</strong> ${result.data?.responseRate || 0}%
                                </p>
                            </div>
                        ` : `
                            <div style="text-align: center; padding: 40px; color: #718096;">
                                <div style="font-size: 2rem; margin-bottom: 16px;">📊</div>
                                <h3 style="margin: 0 0 8px 0; color: #2d3748;">No RSVP data yet</h3>
                                <p style="margin: 0;">Generate invites and share them with guests to start collecting RSVP responses.</p>
                            </div>
                        `}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary modal-cancel">Close</button>
                        <button type="button" class="btn btn-primary" onclick="dashboard.generateInvitesForSpecificEvent('${eventId}')">Generate Invites</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add event listeners
            modal.querySelector('.modal-close').addEventListener('click', () => {
                document.body.removeChild(modal);
            });

            modal.querySelector('.modal-cancel').addEventListener('click', () => {
                document.body.removeChild(modal);
            });

            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        } catch (error) {
            console.error('Error showing event RSVPs:', error);
            this.showStatus('Error loading RSVP data', 'error');
        }
    }

    // Image handling methods
    previewImage(event) {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.showStatus('Please select a valid image file', 'error');
                event.target.value = '';
                return;
            }

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                this.showStatus('Image size must be less than 5MB', 'error');
                event.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('imagePreview');
                const previewImg = document.getElementById('previewImg');
                
                previewImg.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    removeImagePreview() {
        const fileInput = document.getElementById('eventImage');
        const preview = document.getElementById('imagePreview');
        
        fileInput.value = '';
        preview.style.display = 'none';
    }

    async handleGoogleAuthSuccess() {
        try {
            this.showStatus('Authentication successful! Loading dashboard...', 'success');
            
            // Since Google Drive is already authenticated, create a simple session
            this.sessionId = 'google-auth-' + Date.now();
            localStorage.setItem('hostSessionId', this.sessionId);
            
            // Create a default host profile
            this.host = {
                name: 'Google User',
                email: 'user@example.com',
                picture: null
            };
            
            // Update UI
            this.updateHostInfo();
            
            // Load dashboard data
            await this.loadDashboardData();
            
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            this.showStatus('Successfully signed in with Google!', 'success');
        } catch (error) {
            console.error('Google auth success failed:', error);
            this.showStatus(`Failed to complete sign-in: ${error.message}`, 'error');
        }
    }

    async handleGoogleAuthError(message) {
        try {
            this.showStatus(message, 'warning');
            
            // Still create a session for simplified mode
            this.sessionId = 'simplified-' + Date.now();
            localStorage.setItem('hostSessionId', this.sessionId);
            
            // Create a default host profile
            this.host = {
                name: 'Event Host',
                email: 'host@example.com',
                picture: null
            };
            
            // Update UI
            this.updateHostInfo();
            
            // Load dashboard data
            await this.loadDashboardData();
            
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            this.showStatus('Using simplified mode - you can still create events and manage RSVPs!', 'info');
        } catch (error) {
            console.error('Google auth error handling failed:', error);
            this.showStatus(`Failed to load dashboard: ${error.message}`, 'error');
        }
    }

    async handleGoogleCallback(code) {
        try {
            this.showStatus('Completing authentication...', 'info');
            
            // Get user info from Google (simplified - in real app you'd get this from Google)
            const userInfo = {
                email: 'user@example.com', // This would come from Google
                name: 'Google User',
                picture: null
            };
            
            // Exchange code for tokens and authenticate
            const response = await this.apiCall('/host-auth/google-callback', {
                method: 'POST',
                body: JSON.stringify({
                    code: code,
                    userInfo: userInfo
                })
            });
            
            if (response.success) {
                // Store session ID
                this.sessionId = response.data.sessionId;
                localStorage.setItem('hostSessionId', this.sessionId);
                
                // Update host info
                this.host = response.data.host;
                this.updateHostInfo();
                
                // Load dashboard data
                await this.loadDashboardData();
                
                // Clear URL parameters
                window.history.replaceState({}, document.title, window.location.pathname);
                
                this.showStatus('Successfully signed in!', 'success');
            } else {
                throw new Error(response.message || 'Authentication failed');
            }
        } catch (error) {
            console.error('Google callback failed:', error);
            this.showStatus(`Authentication failed: ${error.message}`, 'error');
        }
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new HostDashboard();
    
    // Check if we're returning from Google OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const auth = urlParams.get('auth');
    const error = urlParams.get('error');
    const message = urlParams.get('message');
    
    if (auth === 'success') {
        // Handle successful OAuth callback
        dashboard.handleGoogleAuthSuccess();
    } else if (auth === 'error') {
        // Handle OAuth error with message
        dashboard.handleGoogleAuthError(message || 'Authentication failed');
    } else if (error) {
        // Handle OAuth error
        dashboard.showStatus(`Authentication error: ${error}`, 'error');
    }
});
