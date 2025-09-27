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
        
        // If no session, use default host (no need to show sign-in for now)
        if (!this.sessionId) {
            console.log('No session found, using default host');
            this.host = {
                name: 'Event Host',
                email: 'host@example.com'
            };
            this.updateHostInfo();
            await this.loadDashboardData();
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
                console.log('Session validation failed, using default host');
                this.host = {
                    name: 'Event Host',
                    email: 'host@example.com'
                };
                this.updateHostInfo();
                await this.loadDashboardData();
            }
        } catch (error) {
            console.log('Authentication check failed, using default host:', error.message);
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

        // Event editing
        document.getElementById('eventEditForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateEvent();
        });

        document.getElementById('deleteEventBtn').addEventListener('click', () => {
            this.deleteEvent();
        });

        // Enhanced form interactions
        document.getElementById('showDressCode').addEventListener('change', (e) => {
            document.getElementById('dressCodeGroup').style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('showHostMessage').addEventListener('change', (e) => {
            document.getElementById('hostMessageGroup').style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('reminderEnabled').addEventListener('change', (e) => {
            document.getElementById('reminderDaysGroup').style.display = e.target.checked ? 'block' : 'none';
        });

        // Edit form interactions
        document.getElementById('editShowDressCode').addEventListener('change', (e) => {
            document.getElementById('editDressCodeGroup').style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('editShowHostMessage').addEventListener('change', (e) => {
            document.getElementById('editHostMessageGroup').style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('editReminderEnabled').addEventListener('change', (e) => {
            document.getElementById('editReminderDaysGroup').style.display = e.target.checked ? 'block' : 'none';
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
            // Load ALL events (since we're having host email filtering issues)
            console.log('🔍 Loading ALL events for overview stats');
            const eventsResponse = await this.apiCall(`/events`);
            this.events = eventsResponse.data || [];
            console.log(`📊 Loaded ${this.events.length} events for overview stats`);

            // Update stats
            document.getElementById('totalEvents').textContent = this.events.length;
            document.getElementById('activeEvents').textContent = this.events.filter(e => e.status === 'active').length;

            // Calculate comprehensive stats
            let totalInvites = 0;
            let totalRSVPs = 0;
            let totalGuests = 0;
            let attendingCount = 0;
            let upcomingEvents = 0;

            for (const event of this.events) {
                try {
                    const invitesResponse = await this.apiCall(`/invites/event/${event.id}`);
                    totalInvites += invitesResponse.count || 0;

                    const rsvpResponse = await this.apiCall(`/rsvp-management/stats/${event.id}`);
                    const eventRSVPs = rsvpResponse.data?.totalResponses || 0;
                    totalRSVPs += eventRSVPs;
                    
                    // Calculate total guests (including +1s)
                    const eventGuests = rsvpResponse.data?.totalGuests || 0;
                    totalGuests += eventGuests;
                    
                    // Calculate attending count
                    const eventAttending = rsvpResponse.data?.attendingCount || 0;
                    attendingCount += eventAttending;
                    
                    // Check for upcoming events (next 7 days)
                    const eventDate = new Date(event.date);
                    const today = new Date();
                    const daysDiff = (eventDate - today) / (1000 * 60 * 60 * 24);
                    if (daysDiff >= 0 && daysDiff <= 7) {
                        upcomingEvents++;
                    }
                } catch (error) {
                    console.error(`Failed to load data for event ${event.id}:`, error);
                }
            }

            // Calculate response rate
            const responseRate = totalInvites > 0 ? Math.round((totalRSVPs / totalInvites) * 100) : 0;

            // Update all stats
            document.getElementById('totalInvites').textContent = totalInvites;
            document.getElementById('totalRSVPs').textContent = totalRSVPs;
            document.getElementById('totalGuests').textContent = totalGuests;
            document.getElementById('responseRate').textContent = responseRate + '%';
            document.getElementById('attendingCount').textContent = attendingCount;
            document.getElementById('upcomingEvents').textContent = upcomingEvents;
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

            // Check browser cache first
            const cachedEvents = localStorage.getItem('cachedEvents');
            const cacheTimestamp = localStorage.getItem('eventsCacheTimestamp');
            const now = Date.now();
            const cacheExpiry = 5 * 60 * 1000; // 5 minutes

            if (cachedEvents && cacheTimestamp && (now - parseInt(cacheTimestamp)) < cacheExpiry) {
                console.log('📦 Loading events from browser cache');
                this.events = JSON.parse(cachedEvents);
                this.renderEvents();
                return;
            }

            // Load all events first, then filter if needed
            let response;
            let events = [];
            
            try {
                // Always try to get all events first (most reliable)
                console.log('🔍 Loading all events from system');
                response = await this.apiCall(`/events`);
                const allEvents = response.data || [];
                console.log(`📊 Found ${allEvents.length} total events in system`);
                
                // For now, show ALL events (host email filtering is causing issues)
                events = allEvents;
                console.log(`📊 Showing all ${events.length} events (host email filtering disabled for debugging)`);
                
                // TODO: Re-enable host filtering once we fix the host email assignment issue
                // events = allEvents.filter(event => 
                //     event.hostEmail === this.host.email || 
                //     event.hostEmail === 'host@example.com' ||
                //     event.hostEmail === 'test@example.com'
                // );
                
            } catch (error) {
                console.log('Failed to load all events, trying host-specific endpoints:', error);
                
                // Fallback to host-specific endpoints
                try {
                    console.log(`🔍 Fallback: Loading events for host: ${this.host.email}`);
                    response = await this.apiCall(`/events/host/${this.host.email}`);
                    events = response.data || [];
                    console.log(`📊 Found ${events.length} events for host ${this.host.email}`);
                } catch (error2) {
                    console.log('Failed to load events with current host email:', error2);
                }
                
                // If still no events, try default host
                if (events.length === 0) {
                    try {
                        console.log('🔍 Fallback: Trying default host email: host@example.com');
                        response = await this.apiCall(`/events/host/host@example.com`);
                        events = response.data || [];
                        console.log(`📊 Found ${events.length} events for default host`);
                    } catch (error3) {
                        console.log('Failed to load events with default host:', error3);
                    }
                }
            }
            
            this.events = events;

            // Cache events in browser for faster loading
            localStorage.setItem('cachedEvents', JSON.stringify(events));
            localStorage.setItem('eventsCacheTimestamp', Date.now().toString());
            console.log('💾 Events cached in browser');

            this.renderEvents();
        } catch (error) {
            console.error('Failed to load events:', error);
            document.getElementById('eventsList').innerHTML = '<p>Failed to load events. Please try again.</p>';
        }
    }

    renderEvents() {
        const eventsList = document.getElementById('eventsList');
        
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
                            <div class="event-meta">
                                <span class="event-category">${event.eventCategory || 'General'}</span>
                                ${event.eventTags && event.eventTags.length > 0 ? `<span class="event-tags">${event.eventTags.join(', ')}</span>` : ''}
                            </div>
                        </div>
                        <div class="event-status-container">
                            <span class="event-status ${event.status || 'active'}">${event.status || 'active'}</span>
                            <div class="event-status-actions">
                                ${event.status === 'active' ? 
                                    `<button class="btn btn-small btn-warning" onclick="dashboard.changeEventStatus('${event.id}', 'paused')">Pause</button>` :
                                    event.status === 'paused' ?
                                    `<button class="btn btn-small btn-success" onclick="dashboard.changeEventStatus('${event.id}', 'active')">Resume</button>` :
                                    ''
                                }
                            </div>
                        </div>
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
                        ${event.displayOptions?.showDressCode && event.dressCode ? `
                        <div class="event-detail">
                            <span>👔</span>
                            <span>Dress Code: ${event.dressCode}</span>
                        </div>
                        ` : ''}
                        ${event.displayOptions?.showHostMessage && event.hostMessage ? `
                        <div class="event-detail">
                            <span>💬</span>
                            <span>Host Message: ${event.hostMessage.substring(0, 50)}${event.hostMessage.length > 50 ? '...' : ''}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="event-actions">
                        <button class="btn btn-primary" onclick="dashboard.viewEvent('${event.id}')">View Details</button>
                        <button class="btn btn-secondary" onclick="dashboard.generateInvitesForEvent('${event.id}')">Generate Invites</button>
                        <button class="btn btn-secondary" onclick="dashboard.printQRCodes('${event.id}')">Print QR Codes</button>
                        <button class="btn btn-secondary" onclick="dashboard.viewRSVPs('${event.id}')">View RSVPs</button>
                        <button class="btn btn-secondary" onclick="dashboard.showEventEditModal('${event.id}')">Edit Event</button>
                        <button class="btn btn-secondary" onclick="dashboard.duplicateEvent('${event.id}')">Duplicate</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to render events:', error);
            eventsList.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Failed to render events</h3>
                    <p>There was an error rendering your events. Please try again.</p>
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
        
        // Load email notification settings
        const notificationEmail = localStorage.getItem('notificationEmail') || 'moore.brad.m@gmail.com';
        const emailNotificationsEnabled = localStorage.getItem('emailNotificationsEnabled') !== 'false';
        
        document.getElementById('notificationEmail').value = notificationEmail;
        document.getElementById('emailNotificationsEnabled').checked = emailNotificationsEnabled;
        
        // Add event listener for save settings
        document.getElementById('saveSettingsBtn').onclick = () => this.saveSettings();
    }

    async saveSettings() {
        try {
            const settings = {
                hostName: document.getElementById('hostNameInput').value,
                notificationEmail: document.getElementById('notificationEmail').value,
                emailNotificationsEnabled: document.getElementById('emailNotificationsEnabled').checked
            };

            // Save to localStorage
            localStorage.setItem('notificationEmail', settings.notificationEmail);
            localStorage.setItem('emailNotificationsEnabled', settings.emailNotificationsEnabled);

            // Update host info
            this.host.name = settings.hostName;
            this.updateHostInfo();

            this.showStatus('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showStatus('Failed to save settings', 'error');
        }
    }

    showEventModal() {
        document.getElementById('eventModal').style.display = 'block';
        document.getElementById('eventForm').reset();
    }

    hideEventModal() {
        document.getElementById('eventModal').style.display = 'none';
        this.clearEventForm();
    }

    showEventEditModal(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) {
            this.showStatus('Event not found', 'error');
            return;
        }

        // Populate edit form with event data
        document.getElementById('editEventId').value = event.id;
        document.getElementById('editEventName').value = event.name;
        document.getElementById('editEventDescription').value = event.description || '';
        document.getElementById('editEventDate').value = event.date;
        document.getElementById('editEventStartTime').value = event.time;
        document.getElementById('editEventEndTime').value = event.endTime || '';
        document.getElementById('editEventLocation').value = event.location;
        document.getElementById('editMaxGuests').value = event.maxGuests || '';
        document.getElementById('editRsvpDeadline').value = event.rsvpDeadline || '';
        document.getElementById('editEventCategory').value = event.eventCategory || 'General';
        document.getElementById('editEventTags').value = event.eventTags ? event.eventTags.join(', ') : '';
        document.getElementById('editDietaryOptions').value = event.dietaryOptions ? event.dietaryOptions.join('\n') : '';
        document.getElementById('editSpecialInstructions').value = event.specialInstructions || '';
        
        // Display options
        document.getElementById('editShowDietaryRestrictions').checked = event.displayOptions?.showDietaryRestrictions === true;
        document.getElementById('editShowDressCode').checked = event.displayOptions?.showDressCode === true;
        document.getElementById('editShowHostMessage').checked = event.displayOptions?.showHostMessage === true;
        document.getElementById('editDressCode').value = event.dressCode || '';
        document.getElementById('editHostMessage').value = event.hostMessage || '';
        
        // Event management
        document.getElementById('editEventStatus').value = event.status || 'active';
        document.getElementById('editReminderEnabled').checked = event.reminderSettings?.enabled || false;
        document.getElementById('editReminderDays').value = event.reminderSettings?.daysBefore || 7;
        
        // Show/hide conditional fields
        document.getElementById('editDressCodeGroup').style.display = event.displayOptions?.showDressCode === true ? 'block' : 'none';
        document.getElementById('editHostMessageGroup').style.display = event.displayOptions?.showHostMessage === true ? 'block' : 'none';
        document.getElementById('editReminderDaysGroup').style.display = event.reminderSettings?.enabled === true ? 'block' : 'none';

        document.getElementById('eventEditModal').style.display = 'block';
    }

    hideEventEditModal() {
        document.getElementById('eventEditModal').style.display = 'none';
    }

    clearEventForm() {
        document.getElementById('eventForm').reset();
        document.getElementById('dressCodeGroup').style.display = 'none';
        document.getElementById('hostMessageGroup').style.display = 'none';
        document.getElementById('reminderDaysGroup').style.display = 'none';
        document.getElementById('imagePreview').style.display = 'none';
    }

    async createEvent() {
        try {
            console.log('🎉 Starting event creation...');
            
            // Get form elements with null checks
            const eventNameEl = document.getElementById('eventName');
            const eventDateEl = document.getElementById('eventDate');
            const eventTimeEl = document.getElementById('eventStartTime');
            const eventLocationEl = document.getElementById('eventLocation');
            const eventImageEl = document.getElementById('eventImage');
            
            // Check if required elements exist
            if (!eventNameEl || !eventDateEl || !eventTimeEl || !eventLocationEl) {
                console.error('❌ Required form elements not found');
                this.showStatus('Form elements not found. Please refresh the page and try again.', 'error');
                return;
            }
            
            // Validate required fields
            const eventName = eventNameEl.value;
            const eventDate = eventDateEl.value;
            const eventTime = eventTimeEl.value;
            const eventLocation = eventLocationEl.value;
            
            if (!eventName || !eventDate || !eventTime || !eventLocation) {
                this.showStatus('Please fill in all required fields (Name, Date, Time, Location)', 'error');
                return;
            }
            
            const eventImageFile = eventImageEl ? eventImageEl.files[0] : null;
            
            // Create FormData for file upload
            const formData = new FormData();
            
            // Add event data with null checks
            formData.append('name', eventName);
            formData.append('description', this.getFormValue('eventDescription') || '');
            formData.append('date', eventDate);
            formData.append('time', eventTime);
            formData.append('endTime', this.getFormValue('eventEndTime') || '');
            formData.append('location', eventLocation);
            formData.append('maxGuests', this.getFormValue('maxGuests') ? parseInt(this.getFormValue('maxGuests')) : '');
            formData.append('rsvpDeadline', this.getFormValue('rsvpDeadline') || '');
            
            // Enhanced configuration options
            formData.append('eventCategory', this.getFormValue('eventCategory') || 'General');
            formData.append('eventTags', this.getFormValue('eventTags') || '');
            
            // Display options
            formData.append('showDietaryRestrictions', this.getFormChecked('showDietaryRestrictions'));
            formData.append('showDressCode', this.getFormChecked('showDressCode'));
            formData.append('showHostMessage', this.getFormChecked('showHostMessage'));
            formData.append('dressCode', this.getFormValue('dressCode') || '');
            formData.append('hostMessage', this.getFormValue('hostMessage') || '');
            
            // Event management
            formData.append('status', this.getFormValue('eventStatus') || 'active');
            formData.append('reminderEnabled', this.getFormChecked('reminderEnabled'));
            formData.append('reminderDays', this.getFormValue('reminderDays') || '7');
            
            // Handle dietary options
            const dietaryText = this.getFormValue('dietaryOptions');
            const dietaryOptions = dietaryText ? dietaryText.split('\n').filter(option => option.trim()) : ['No Restrictions'];
            formData.append('dietaryOptions', JSON.stringify(dietaryOptions));
            
            formData.append('specialInstructions', this.getFormValue('specialInstructions') || '');
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

    async updateEvent() {
        try {
            const eventId = document.getElementById('editEventId').value;
            if (!eventId) {
                this.showStatus('Event ID not found', 'error');
                return;
            }

            // Validate required fields
            const eventName = document.getElementById('editEventName').value;
            const eventDate = document.getElementById('editEventDate').value;
            const eventTime = document.getElementById('editEventStartTime').value;
            const eventLocation = document.getElementById('editEventLocation').value;
            
            if (!eventName || !eventDate || !eventTime || !eventLocation) {
                this.showStatus('Please fill in all required fields (Name, Date, Time, Location)', 'error');
                return;
            }

            const updateData = {
                name: eventName,
                description: document.getElementById('editEventDescription').value || '',
                date: eventDate,
                time: eventTime,
                endTime: document.getElementById('editEventEndTime').value || '',
                location: eventLocation,
                maxGuests: document.getElementById('editMaxGuests').value ? parseInt(document.getElementById('editMaxGuests').value) : null,
                rsvpDeadline: document.getElementById('editRsvpDeadline').value || '',
                eventCategory: document.getElementById('editEventCategory').value || 'General',
                eventTags: document.getElementById('editEventTags').value ? document.getElementById('editEventTags').value.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
                dietaryOptions: document.getElementById('editDietaryOptions').value ? document.getElementById('editDietaryOptions').value.split('\n').filter(option => option.trim()) : ['No Restrictions'],
                specialInstructions: document.getElementById('editSpecialInstructions').value || '',
                displayOptions: {
                    showDietaryRestrictions: document.getElementById('editShowDietaryRestrictions').checked,
                    showDressCode: document.getElementById('editShowDressCode').checked,
                    showHostMessage: document.getElementById('editShowHostMessage').checked
                },
                dressCode: document.getElementById('editDressCode').value || '',
                hostMessage: document.getElementById('editHostMessage').value || '',
                status: document.getElementById('editEventStatus').value || 'active',
                reminderSettings: {
                    enabled: document.getElementById('editReminderEnabled').checked,
                    daysBefore: parseInt(document.getElementById('editReminderDays').value) || 7
                }
            };

            this.showStatus('Updating event...', 'info');

            const response = await this.apiCall(`/event-management/update/${eventId}`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });

            if (response.success) {
                this.showStatus('Event updated successfully!', 'success');
                this.hideEventEditModal();
                await this.loadEvents();
                await this.loadOverviewStats();
            } else {
                throw new Error(response.message || 'Failed to update event');
            }
        } catch (error) {
            console.error('❌ Failed to update event:', error);
            this.showStatus(`Failed to update event: ${error.message}`, 'error');
        }
    }

    async deleteEvent() {
        try {
            const eventId = document.getElementById('editEventId').value;
            if (!eventId) {
                this.showStatus('Event ID not found', 'error');
                return;
            }

            const eventName = document.getElementById('editEventName').value;
            if (!confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
                return;
            }

            this.showStatus('Deleting event...', 'info');

            const response = await this.apiCall(`/event-management/delete/${eventId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                this.showStatus('Event deleted successfully!', 'success');
                this.hideEventEditModal();
                await this.loadEvents();
                await this.loadOverviewStats();
            } else {
                throw new Error(response.message || 'Failed to delete event');
            }
        } catch (error) {
            console.error('❌ Failed to delete event:', error);
            this.showStatus(`Failed to delete event: ${error.message}`, 'error');
        }
    }

    async duplicateEvent(eventId) {
        try {
            const event = this.events.find(e => e.id === eventId);
            if (!event) {
                this.showStatus('Event not found', 'error');
                return;
            }

            const newEventName = prompt(`Enter name for the duplicated event:`, `${event.name} (Copy)`);
            if (!newEventName) return;

            this.showStatus('Duplicating event...', 'info');

            const response = await this.apiCall(`/event-management/duplicate/${eventId}`, {
                method: 'POST',
                body: JSON.stringify({ name: newEventName })
            });

            if (response.success) {
                this.showStatus('Event duplicated successfully!', 'success');
                await this.loadEvents();
                await this.loadOverviewStats();
            } else {
                throw new Error(response.message || 'Failed to duplicate event');
            }
        } catch (error) {
            console.error('❌ Failed to duplicate event:', error);
            this.showStatus(`Failed to duplicate event: ${error.message}`, 'error');
        }
    }

    async changeEventStatus(eventId, status) {
        try {
            this.showStatus(`Changing event status to ${status}...`, 'info');

            const response = await this.apiCall(`/event-management/status/${eventId}`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });

            if (response.success) {
                this.showStatus(`Event status changed to ${status}!`, 'success');
                await this.loadEvents();
                await this.loadOverviewStats();
            } else {
                throw new Error(response.message || 'Failed to change event status');
            }
        } catch (error) {
            console.error('❌ Failed to change event status:', error);
            this.showStatus(`Failed to change event status: ${error.message}`, 'error');
        }
    }


    async printQRCodes(eventId) {
        try {
            const event = this.events.find(e => e.id === eventId);
            if (!event) {
                this.showStatus('Event not found', 'error');
                return;
            }

            this.showStatus('Loading QR codes for printing...', 'info');

            // Get all invites for this event
            const response = await this.apiCall(`/invites/event/${eventId}`);
            
            if (!response.success || !response.data || response.data.length === 0) {
                this.showStatus('No QR codes found for this event. Generate invites first.', 'error');
                return;
            }

            // Create print-friendly page
            const printWindow = window.open('', '_blank');
            const qrCodes = response.data;
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>QR Codes - ${event.name}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                            background: white;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 30px;
                            border-bottom: 2px solid #333;
                            padding-bottom: 20px;
                        }
                        .qr-grid {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 20px;
                            margin-bottom: 30px;
                        }
                        .qr-item {
                            text-align: center;
                            border: 1px solid #ddd;
                            padding: 15px;
                            border-radius: 8px;
                            page-break-inside: avoid;
                        }
                        .qr-code {
                            margin: 10px 0;
                        }
                        .qr-code img {
                            max-width: 150px;
                            height: auto;
                        }
                        .invite-info {
                            font-size: 12px;
                            color: #666;
                            margin-top: 10px;
                        }
                        .event-info {
                            background: #f5f5f5;
                            padding: 15px;
                            border-radius: 8px;
                            margin-bottom: 20px;
                        }
                        @media print {
                            body { margin: 0; }
                            .qr-grid { grid-template-columns: repeat(2, 1fr); }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${event.name}</h1>
                        <p>QR Code Invitations</p>
                        <p>Generated on ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div class="event-info">
                        <h3>Event Details</h3>
                        <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> ${event.time}${event.endTime ? ` - ${event.endTime}` : ''}</p>
                        <p><strong>Location:</strong> ${event.location}</p>
                        <p><strong>Host:</strong> ${event.hostName}</p>
                    </div>
                    
                    <div class="qr-grid">
                        ${qrCodes.map((invite, index) => `
                            <div class="qr-item">
                                <div class="qr-code">
                                    <img src="${invite.qrCodeFile?.webPath || invite.qrCode}" alt="QR Code" onerror="this.src='${invite.qrCode}'">
                                </div>
                                <div class="invite-info">
                                    <p><strong>Invite #${index + 1}</strong></p>
                                    <p>Scan to RSVP</p>
                                    ${invite.guestName ? `<p><strong>Guest:</strong> ${invite.guestName}</p>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
                        <p>Total QR Codes: ${qrCodes.length}</p>
                        <p>Print this page and cut along the dotted lines to distribute QR codes</p>
                    </div>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            
            // Wait for images to load, then print
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
                this.showStatus('QR codes ready for printing!', 'success');
            }, 1000);
            
        } catch (error) {
            console.error('❌ Failed to print QR codes:', error);
            this.showStatus(`Failed to print QR codes: ${error.message}`, 'error');
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
            // Get session ID from localStorage
            const sessionId = localStorage.getItem('hostSessionId');
            
            const response = await fetch(endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': sessionId || '',
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
                    <button type="button" class="btn btn-primary" id="printQRCodes">Print QR Codes</button>
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

        // Add print functionality
        modal.querySelector('#printQRCodes').addEventListener('click', () => {
            this.printQRCodes(invites);
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // Helper methods for safe form element access
    getFormValue(elementId) {
        const element = document.getElementById(elementId);
        return element ? element.value : '';
    }
    
    getFormChecked(elementId) {
        const element = document.getElementById(elementId);
        return element ? element.checked : false;
    }

    printQRCodes(invites) {
        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        
        // Create print-optimized HTML content
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Codes for Printing</title>
                <style>
                    @media print {
                        @page {
                            margin: 0.5in;
                            size: letter;
                        }
                        body {
                            font-family: Arial, sans-serif;
                            font-size: 12pt;
                            line-height: 1.4;
                            color: #000;
                            background: white;
                        }
                        .qr-container {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 20px;
                            justify-content: center;
                            align-items: flex-start;
                        }
                        .qr-item {
                            border: 2px solid #000;
                            padding: 15px;
                            text-align: center;
                            width: 200px;
                            page-break-inside: avoid;
                            margin-bottom: 20px;
                        }
                        .qr-code {
                            width: 150px;
                            height: 150px;
                            border: 1px solid #ccc;
                            margin: 0 auto 10px auto;
                            display: block;
                        }
                        .qr-label {
                            font-weight: bold;
                            margin-bottom: 5px;
                            font-size: 14pt;
                        }
                        .qr-id {
                            font-size: 10pt;
                            color: #666;
                            word-break: break-all;
                            margin-bottom: 5px;
                        }
                        .qr-url {
                            font-size: 9pt;
                            color: #333;
                            word-break: break-all;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 30px;
                            border-bottom: 2px solid #000;
                            padding-bottom: 15px;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 18pt;
                        }
                        .header p {
                            margin: 5px 0 0 0;
                            font-size: 12pt;
                        }
                    }
                    @media screen {
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                            background: #f5f5f5;
                        }
                        .qr-container {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 20px;
                            justify-content: center;
                            align-items: flex-start;
                        }
                        .qr-item {
                            border: 2px solid #000;
                            padding: 15px;
                            text-align: center;
                            width: 200px;
                            background: white;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        .qr-code {
                            width: 150px;
                            height: 150px;
                            border: 1px solid #ccc;
                            margin: 0 auto 10px auto;
                            display: block;
                        }
                        .qr-label {
                            font-weight: bold;
                            margin-bottom: 5px;
                        }
                        .qr-id {
                            font-size: 10pt;
                            color: #666;
                            word-break: break-all;
                            margin-bottom: 5px;
                        }
                        .qr-url {
                            font-size: 9pt;
                            color: #333;
                            word-break: break-all;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 30px;
                            border-bottom: 2px solid #000;
                            padding-bottom: 15px;
                            background: white;
                            padding: 20px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        .print-button {
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background: #007bff;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                            z-index: 1000;
                        }
                        .print-button:hover {
                            background: #0056b3;
                        }
                    }
                </style>
            </head>
            <body>
                <button class="print-button" onclick="window.print()">Print QR Codes</button>
                
                <div class="header">
                    <h1>Event QR Codes</h1>
                    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                    <p>Total QR Codes: ${invites.length}</p>
                </div>
                
                <div class="qr-container">
                    ${invites.map((invite, index) => `
                        <div class="qr-item">
                            <div class="qr-label">Invite #${index + 1}</div>
                            <img src="${invite.qrCodeDataURL}" alt="QR Code" class="qr-code">
                            <div class="qr-id">ID: ${invite.inviteId}</div>
                            <div class="qr-url">${invite.rsvpUrl}</div>
                        </div>
                    `).join('')}
                </div>
                
                <script>
                    // Auto-print when window loads
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;
        
        // Write content to print window
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Focus the print window
        printWindow.focus();
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

            // Get both stats and detailed RSVP responses
            const [statsResponse, rsvpsResponse] = await Promise.all([
                fetch(`/rsvp-management/stats/${eventId}`),
                fetch(`/rsvp-management/responses/${eventId}`)
            ]);
            
            // Check if responses are ok before parsing JSON
            if (!statsResponse.ok) {
                throw new Error(`Stats request failed: ${statsResponse.status} ${statsResponse.statusText}`);
            }
            if (!rsvpsResponse.ok) {
                throw new Error(`RSVPs request failed: ${rsvpsResponse.status} ${rsvpsResponse.statusText}`);
            }
            
            const statsResult = await statsResponse.json();
            const rsvpsResult = await rsvpsResponse.json();

            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h3>RSVP Responses for "${event.name}"</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${statsResult.success ? `
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                                <div style="background: #f0fff4; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #9ae6b4;">
                                    <div style="font-size: 1.5rem; font-weight: 600; color: #22543d;">${statsResult.data?.attending || 0}</div>
                                    <div style="font-size: 0.875rem; color: #22543d;">Attending</div>
                                </div>
                                <div style="background: #fed7d7; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #feb2b2;">
                                    <div style="font-size: 1.5rem; font-weight: 600; color: #742a2a;">${statsResult.data?.notAttending || 0}</div>
                                    <div style="font-size: 0.875rem; color: #742a2a;">Not Attending</div>
                                </div>
                                <div style="background: #ebf8ff; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #90cdf4;">
                                    <div style="font-size: 1.5rem; font-weight: 600; color: #2a4365;">${statsResult.data?.maybe || 0}</div>
                                    <div style="font-size: 0.875rem; color: #2a4365;">Maybe</div>
                                </div>
                            </div>
                            <div style="background: #f7fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                                <p style="margin: 0; font-size: 0.875rem; color: #4a5568;">
                                    <strong>Total Responses:</strong> ${statsResult.data?.totalResponses || 0} | 
                                    <strong>Total Guests:</strong> ${statsResult.data?.totalGuests || 0} | 
                                    <strong>Response Rate:</strong> ${statsResult.data?.responseRate || 0}%
                                </p>
                            </div>
                        ` : `
                            <div style="text-align: center; padding: 40px; color: #718096;">
                                <div style="font-size: 2rem; margin-bottom: 16px;">📊</div>
                                <h3 style="margin: 0 0 8px 0; color: #2d3748;">No RSVP data yet</h3>
                                <p style="margin: 0;">Generate invites and share them with guests to start collecting RSVP responses.</p>
                            </div>
                        `}
                        
                        ${rsvpsResult.success && rsvpsResult.data && rsvpsResult.data.length > 0 ? `
                            <div style="margin-top: 24px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                    <h4 style="margin: 0;">Guest Responses</h4>
                                    <div style="display: flex; gap: 12px; align-items: center;">
                                        <input type="text" id="guestSearch" placeholder="Search guests..." style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem;">
                                        <select id="attendanceFilter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem;">
                                            <option value="">All Responses</option>
                                            <option value="yes">Attending</option>
                                            <option value="no">Not Attending</option>
                                            <option value="maybe">Maybe</option>
                                        </select>
                                        <button class="btn btn-secondary" onclick="dashboard.exportGuestList('${eventId}')">Export</button>
                                    </div>
                                </div>
                                <div id="guestList" style="max-height: 400px; overflow-y: auto;">
                                    ${rsvpsResult.data.map(rsvp => `
                                        <div class="guest-card" data-attendance="${rsvp.attendance}" data-name="${rsvp.guestName.toLowerCase()}" data-email="${rsvp.guestEmail.toLowerCase()}">
                                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                                <div>
                                                    <h5 style="margin: 0 0 4px 0; font-size: 1rem; color: #2d3748;">${rsvp.guestName}</h5>
                                                    <p style="margin: 0; font-size: 0.875rem; color: #718096;">${rsvp.guestEmail}</p>
                                                </div>
                                                <span class="attendance-badge ${rsvp.attendance}" style="padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">
                                                    ${rsvp.attendance === 'yes' ? 'Attending' : rsvp.attendance === 'no' ? 'Not Attending' : 'Maybe'}
                                                </span>
                                            </div>
                                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.875rem; color: #4a5568;">
                                                <div>
                                                    <strong>Guests:</strong> ${rsvp.guestCount || 1}
                                                </div>
                                                <div>
                                                    <strong>Submitted:</strong> ${new Date(rsvp.submittedAt).toLocaleDateString()}
                                                </div>
                                                ${rsvp.guestPhone ? `
                                                <div>
                                                    <strong>Phone:</strong> ${rsvp.guestPhone}
                                                </div>
                                                ` : ''}
                                                ${rsvp.emergencyContact ? `
                                                <div>
                                                    <strong>Emergency Contact:</strong> ${rsvp.emergencyContact}
                                                </div>
                                                ` : ''}
                                            </div>
                                            ${rsvp.dietaryRestrictions ? `
                                            <div style="margin-top: 8px; font-size: 0.875rem;">
                                                <strong>Dietary Restrictions:</strong> ${rsvp.dietaryRestrictions}
                                            </div>
                                            ` : ''}
                                            ${rsvp.message ? `
                                            <div style="margin-top: 8px; font-size: 0.875rem; color: #4a5568; font-style: italic;">
                                                "${rsvp.message}"
                                            </div>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
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

            // Add search and filter functionality
            if (rsvpsResult.success && rsvpsResult.data && rsvpsResult.data.length > 0) {
                const searchInput = modal.querySelector('#guestSearch');
                const filterSelect = modal.querySelector('#attendanceFilter');
                const guestCards = modal.querySelectorAll('.guest-card');

                const filterGuests = () => {
                    const searchTerm = searchInput.value.toLowerCase();
                    const filterValue = filterSelect.value;

                    guestCards.forEach(card => {
                        const name = card.dataset.name;
                        const email = card.dataset.email;
                        const attendance = card.dataset.attendance;

                        const matchesSearch = !searchTerm || name.includes(searchTerm) || email.includes(searchTerm);
                        const matchesFilter = !filterValue || attendance === filterValue;

                        card.style.display = matchesSearch && matchesFilter ? 'block' : 'none';
                    });
                };

                searchInput.addEventListener('input', filterGuests);
                filterSelect.addEventListener('change', filterGuests);
            }
        } catch (error) {
            console.error('Error showing event RSVPs:', error);
            this.showStatus('Error loading RSVP data', 'error');
        }
    }

    async exportGuestList(eventId) {
        try {
            const event = this.events.find(e => e.id === eventId);
            if (!event) {
                this.showStatus('Event not found', 'error');
                return;
            }

            this.showStatus('Exporting guest list...', 'info');

            const response = await fetch(`/rsvp-management/responses/${eventId}`);
            const result = await response.json();

            if (!result.success || !result.data) {
                this.showStatus('No guest data to export', 'error');
                return;
            }

            // Create CSV content
            const csvHeaders = [
                'Name',
                'Email',
                'Phone',
                'Emergency Contact',
                'Attendance',
                'Guest Count',
                'Dietary Restrictions',
                'Message',
                'Submitted At'
            ];

            const csvRows = [csvHeaders.join(',')];

            result.data.forEach(rsvp => {
                const row = [
                    `"${rsvp.guestName}"`,
                    `"${rsvp.guestEmail}"`,
                    `"${rsvp.guestPhone || ''}"`,
                    `"${rsvp.emergencyContact || ''}"`,
                    `"${rsvp.attendance}"`,
                    rsvp.guestCount || 1,
                    `"${rsvp.dietaryRestrictions || ''}"`,
                    `"${rsvp.message || ''}"`,
                    `"${new Date(rsvp.submittedAt).toLocaleString()}"`
                ];
                csvRows.push(row.join(','));
            });

            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_guest_list.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            this.showStatus('Guest list exported successfully!', 'success');
        } catch (error) {
            console.error('❌ Failed to export guest list:', error);
            this.showStatus(`Failed to export guest list: ${error.message}`, 'error');
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

// Image preview function
function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
    }
}
