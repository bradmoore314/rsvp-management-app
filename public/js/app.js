// RSVP Management App - Main JavaScript
class RSVPApp {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkHealth();
    }

    bindEvents() {
        // Host login button
        const hostLoginBtn = document.getElementById('hostLoginBtn');
        if (hostLoginBtn) {
            hostLoginBtn.addEventListener('click', () => this.handleHostLogin());
        }

        // Guest RSVP button
        const guestRsvpBtn = document.getElementById('guestRsvpBtn');
        if (guestRsvpBtn) {
            guestRsvpBtn.addEventListener('click', () => this.handleGuestRsvp());
        }

        // Demo button
        const demoBtn = document.getElementById('demoBtn');
        if (demoBtn) {
            demoBtn.addEventListener('click', () => this.handleDemo());
        }
    }

    async checkHealth() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            console.log('App health check:', data);
            this.showStatus('App is running successfully!', 'success');
        } catch (error) {
            console.error('Health check failed:', error);
            this.showStatus('App connection failed. Please check server.', 'error');
        }
    }

    async handleHostLogin() {
        try {
            this.showStatus('Redirecting to Google authentication...', 'info');
            
            // Get Google OAuth URL
            const response = await this.apiCall('/host-auth/google-url');
            
            if (response.success) {
                // Redirect to Google OAuth
                window.location.href = response.data.authUrl;
            } else {
                throw new Error(response.message || 'Failed to get authentication URL');
            }
        } catch (error) {
            console.error('Host login failed:', error);
            this.showStatus(`Login failed: ${error.message}`, 'error');
        }
    }

    handleGuestRsvp() {
        // Show a modal or redirect to guest RSVP form
        this.showGuestRSVPModal();
    }

    showGuestRSVPModal() {
        // Create a modal for guest RSVP
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Guest RSVP</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>To RSVP for an event, you need an invite link or QR code.</p>
                    <div class="form-group">
                        <label for="inviteUrl">Enter your invite URL or scan QR code:</label>
                        <input type="url" id="inviteUrl" placeholder="https://your-app.com/rsvp/event-id/invite-id">
                    </div>
                    <div class="form-group">
                        <label>Or scan QR code from your invite:</label>
                        <div class="qr-scanner-placeholder">
                            <p>📱 Use your phone's camera to scan the QR code from your physical invite</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
                    <button type="button" class="btn btn-primary" id="proceedToRSVP">Proceed to RSVP</button>
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

        modal.querySelector('#proceedToRSVP').addEventListener('click', () => {
            const inviteUrl = modal.querySelector('#inviteUrl').value;
            if (inviteUrl) {
                // Extract event ID and invite ID from URL
                const urlParts = inviteUrl.split('/');
                const eventId = urlParts[urlParts.length - 2];
                const inviteId = urlParts[urlParts.length - 1];
                
                if (eventId && inviteId) {
                    window.location.href = `/rsvp/${eventId}/${inviteId}`;
                } else {
                    this.showStatus('Invalid invite URL format', 'error');
                }
            } else {
                this.showStatus('Please enter an invite URL', 'error');
            }
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    async handleDemo() {
        try {
            this.showStatus('Loading demo event...', 'info');
            
            // Use a static demo event ID and invite ID
            const demoEventId = 'demo-event-123';
            const demoInviteId = 'demo-invite-456';
            
            // Redirect to demo RSVP form
            setTimeout(() => {
                window.location.href = `/rsvp/${demoEventId}/${demoInviteId}`;
            }, 500);
            
        } catch (error) {
            console.error('Demo failed:', error);
            this.showStatus(`Demo failed: ${error.message}`, 'error');
        }
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('statusMessage');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status-message ${type}`;
            statusElement.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 5000);
        }
    }

    // Utility method for making API calls
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
            this.showStatus(`Error: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RSVPApp();
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RSVPApp;
}
