// AI Invitation Generator JavaScript
class InvitationGenerator {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.selectedTheme = null;
        this.generatedInvitation = null;
        this.eventData = {};
        this.currentUser = null;
        
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.loadThemes();
        this.setMinDate();
    }

    async checkAuthentication() {
        try {
            const response = await fetch('/auth/me', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.showUserInfo();
            } else {
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.redirectToLogin();
        }
    }

    showUserInfo() {
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        
        if (this.currentUser) {
            userName.textContent = `Welcome, ${this.currentUser.name || this.currentUser.email}`;
            userInfo.style.display = 'block';
        }
    }

    redirectToLogin() {
        window.location.href = '/';
    }

    setupEventListeners() {
        // Event type change handler
        document.getElementById('eventType').addEventListener('change', (e) => {
            this.loadAISuggestions();
        });

        // Theme selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-card')) {
                this.selectTheme(e.target.closest('.theme-card'));
            }
        });

        // Photo upload handler
        document.getElementById('photos').addEventListener('change', (e) => {
            this.handlePhotoUpload(e.target.files);
        });

        // Logout handler
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    setMinDate() {
        const dateInput = document.getElementById('eventDate');
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }

    // Step Navigation
    nextStep() {
        if (this.validateCurrentStep()) {
            this.currentStep++;
            this.updateStepDisplay();
            this.animateStepTransition();
            
            if (this.currentStep === 2) {
                this.loadThemes();
            } else if (this.currentStep === 3) {
                this.loadAISuggestions();
            }
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
            this.animateStepTransition();
        }
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.validateEventDetails();
            case 2:
                return this.selectedTheme !== null;
            case 3:
                return true; // Customization is optional
            default:
                return true;
        }
    }

    validateEventDetails() {
        const requiredFields = ['eventType', 'eventName', 'eventDate', 'eventTime', 'eventLocation', 'hostName'];
        let isValid = true;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                field.style.borderColor = '#dc3545';
                isValid = false;
            } else {
                field.style.borderColor = '#e0e0e0';
            }
        });

        if (!isValid) {
            this.showStatus('Please fill in all required fields', 'error');
        }

        return isValid;
    }

    updateStepDisplay() {
        // Hide all steps
        document.querySelectorAll('.step-section').forEach(step => {
            step.classList.remove('active');
        });

        // Show current step
        document.getElementById(`step${this.currentStep}`).classList.add('active');

        // Update progress indicator (if you add one)
        this.updateProgressIndicator();
    }

    updateProgressIndicator() {
        const progress = (this.currentStep / this.totalSteps) * 100;
        // You can add a progress bar here if needed
    }

    animateStepTransition() {
        const currentStepElement = document.getElementById(`step${this.currentStep}`);
        currentStepElement.classList.add('fade-in');
        
        setTimeout(() => {
            currentStepElement.classList.remove('fade-in');
        }, 500);
    }

    // Theme Management
    async loadThemes() {
        try {
            const response = await fetch('/invitation-generator/themes');
            const data = await response.json();
            
            if (data.success) {
                this.displayThemes(data.themes);
            } else {
                this.showStatus('Failed to load themes', 'error');
            }
        } catch (error) {
            console.error('Error loading themes:', error);
            this.showStatus('Error loading themes', 'error');
        }
    }

    displayThemes(themes) {
        const themeGrid = document.getElementById('themeGrid');
        themeGrid.innerHTML = '';

        themes.forEach(theme => {
            const themeCard = document.createElement('div');
            themeCard.className = 'theme-card';
            themeCard.dataset.themeId = theme.id;
            themeCard.style.setProperty('--color1', theme.colors[0]);
            themeCard.style.setProperty('--color2', theme.colors[1]);

            themeCard.innerHTML = `
                <div class="theme-header">
                    <div class="theme-icon">${this.getThemeIcon(theme.id)}</div>
                    <h3 class="theme-name">${theme.name}</h3>
                </div>
                <p class="theme-description">${this.getThemeDescription(theme.id)}</p>
                <div class="theme-colors">
                    ${theme.colors.map(color => `<div class="color-swatch" style="background-color: ${color}"></div>`).join('')}
                </div>
                <div class="theme-fonts">Fonts: ${theme.fonts.join(', ')}</div>
            `;

            themeGrid.appendChild(themeCard);
        });
    }

    selectTheme(themeCard) {
        // Remove previous selection
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Select new theme
        themeCard.classList.add('selected');
        this.selectedTheme = themeCard.dataset.themeId;

        // Animate selection
        gsap.to(themeCard, {
            duration: 0.3,
            scale: 1.05,
            ease: "back.out(1.7)"
        });

        setTimeout(() => {
            gsap.to(themeCard, {
                duration: 0.3,
                scale: 1,
                ease: "power2.out"
            });
        }, 200);
    }

    getThemeIcon(themeId) {
        const icons = {
            birthday: '🎂',
            wedding: '💒',
            corporate: '🏢',
            holiday: '🎄',
            casual: '🎉'
        };
        return icons[themeId] || '🎨';
    }

    getThemeDescription(themeId) {
        const descriptions = {
            birthday: 'Fun, colorful, and playful design perfect for birthday celebrations',
            wedding: 'Elegant, romantic, and sophisticated design for your special day',
            corporate: 'Professional, clean, and modern design for business events',
            holiday: 'Festive, cheerful, and seasonal design for holiday parties',
            casual: 'Relaxed, friendly, and informal design for casual gatherings'
        };
        return descriptions[themeId] || 'Beautiful design for any occasion';
    }

    // AI Suggestions
    async loadAISuggestions() {
        const eventType = document.getElementById('eventType').value;
        const eventName = document.getElementById('eventName').value;

        if (!eventType || !eventName) return;

        try {
            this.showLoading('Getting AI suggestions...');
            
            const response = await fetch('/invitation-generator/suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ eventType, eventName })
            });

            const data = await response.json();
            this.hideLoading();

            if (data.success) {
                this.displaySuggestions(data.suggestions);
            } else {
                this.showStatus('Failed to load AI suggestions', 'error');
            }
        } catch (error) {
            console.error('Error loading AI suggestions:', error);
            this.hideLoading();
            this.showStatus('Error loading AI suggestions', 'error');
        }
    }

    displaySuggestions(suggestions) {
        const suggestionsList = document.getElementById('suggestionsList');
        suggestionsList.innerHTML = '';

        suggestions.forEach((suggestion, index) => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = suggestion;
            suggestionItem.dataset.suggestion = suggestion;

            suggestionItem.addEventListener('click', () => {
                this.selectSuggestion(suggestionItem, suggestion);
            });

            suggestionsList.appendChild(suggestionItem);
        });
    }

    selectSuggestion(suggestionItem, suggestion) {
        // Remove previous selection
        document.querySelectorAll('.suggestion-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Select new suggestion
        suggestionItem.classList.add('selected');

        // Update custom prompt
        document.getElementById('customPrompt').value = suggestion;
    }

    // Photo Upload
    handlePhotoUpload(files) {
        if (files.length > 5) {
            this.showStatus('Maximum 5 photos allowed', 'error');
            return;
        }

        // Validate file types and sizes
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        for (let file of files) {
            if (!allowedTypes.includes(file.type)) {
                this.showStatus(`Invalid file type: ${file.name}`, 'error');
                return;
            }
            if (file.size > maxSize) {
                this.showStatus(`File too large: ${file.name}`, 'error');
                return;
            }
        }

        this.showStatus(`${files.length} photo(s) ready for upload`, 'success');
    }

    // Generate Invitation
    async generateInvitation() {
        try {
            this.showLoading('AI is creating your invitation...');
            
            // Collect form data
            const formData = new FormData();
            formData.append('eventType', document.getElementById('eventType').value);
            formData.append('eventName', document.getElementById('eventName').value);
            formData.append('eventDate', document.getElementById('eventDate').value);
            formData.append('eventTime', document.getElementById('eventTime').value);
            formData.append('eventLocation', document.getElementById('eventLocation').value);
            formData.append('hostName', document.getElementById('hostName').value);
            formData.append('customPrompt', document.getElementById('customPrompt').value);
            formData.append('theme', this.selectedTheme);
            formData.append('animationType', document.getElementById('animationType').value);

            // Add photos
            const photosInput = document.getElementById('photos');
            if (photosInput.files.length > 0) {
                for (let file of photosInput.files) {
                    formData.append('photos', file);
                }
            }

            const response = await fetch('/invitation-generator/generate', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            this.hideLoading();

            if (data.success) {
                this.generatedInvitation = data.invitation;
                this.nextStep();
                this.displayPreview();
            } else {
                this.showStatus('Failed to generate invitation: ' + data.error, 'error');
            }
        } catch (error) {
            console.error('Error generating invitation:', error);
            this.hideLoading();
            this.showStatus('Error generating invitation', 'error');
        }
    }

    displayPreview() {
        const previewContainer = document.getElementById('previewContainer');
        const invitationDetails = document.getElementById('invitationDetails');

        // Create preview HTML
        const previewHTML = this.createPreviewHTML(this.generatedInvitation);
        previewContainer.innerHTML = previewHTML;
        previewContainer.classList.add('has-content');

        // Display invitation details
        invitationDetails.innerHTML = `
            <div class="detail-item">
                <span class="detail-label">Event:</span>
                <span class="detail-value">${this.generatedInvitation.content.title}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${this.generatedInvitation.content.date}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${this.generatedInvitation.content.time}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${this.generatedInvitation.content.location}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Host:</span>
                <span class="detail-value">${this.generatedInvitation.content.host}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Theme:</span>
                <span class="detail-value">${this.generatedInvitation.theme.name}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Animation:</span>
                <span class="detail-value">${this.generatedInvitation.animation.config.name}</span>
            </div>
        `;

        // Animate preview entrance
        gsap.fromTo(previewContainer, 
            { scale: 0, opacity: 0 },
            { duration: 0.8, scale: 1, opacity: 1, ease: "back.out(1.7)" }
        );
    }

    createPreviewHTML(invitation) {
        const theme = invitation.theme;
        const colors = theme.colors;
        
        return `
            <div class="invitation-preview" style="
                background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%);
                color: white;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                font-family: '${theme.fonts[0]}', sans-serif;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                transform-style: preserve-3d;
            ">
                <h2 style="font-size: 2rem; margin-bottom: 20px; font-weight: bold;">
                    ${invitation.content.title}
                </h2>
                <p style="font-size: 1.2rem; margin-bottom: 15px;">
                    ${invitation.content.date}
                </p>
                <p style="font-size: 1.1rem; margin-bottom: 15px;">
                    ${invitation.content.time}
                </p>
                <p style="font-size: 1rem; margin-bottom: 20px;">
                    ${invitation.content.location}
                </p>
                <p style="font-size: 0.9rem; opacity: 0.9;">
                    Hosted by ${invitation.content.host}
                </p>
                <div style="
                    background: rgba(255,255,255,0.2);
                    padding: 15px;
                    border-radius: 10px;
                    margin-top: 20px;
                    backdrop-filter: blur(10px);
                ">
                    <p style="font-size: 0.8rem; margin: 0;">
                        ${invitation.content.rsvpMessage}
                    </p>
                </div>
            </div>
        `;
    }

    // Actions
    async printInvitation() {
        try {
            this.showLoading('Preparing print version...');
            
            const response = await fetch('/invitation-generator/print', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    invitationData: this.generatedInvitation,
                    printOptions: { format: 'A4', doubleSided: true }
                })
            });

            const data = await response.json();
            this.hideLoading();

            if (data.success) {
                // Open print window
                const printWindow = window.open('', '_blank');
                printWindow.document.write(data.printHTML);
                printWindow.document.close();
                printWindow.focus();
                
                // Auto-print after a short delay
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            } else {
                this.showStatus('Failed to generate print version', 'error');
            }
        } catch (error) {
            console.error('Error generating print version:', error);
            this.hideLoading();
            this.showStatus('Error generating print version', 'error');
        }
    }

    async previewRSVP() {
        try {
            this.showLoading('Generating RSVP preview...');
            
            const response = await fetch('/invitation-generator/rsvp-page', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    invitationData: this.generatedInvitation,
                    rsvpUrl: 'https://your-app.com/rsvp/sample'
                })
            });

            const data = await response.json();
            this.hideLoading();

            if (data.success) {
                // Open RSVP preview in new window
                const rsvpWindow = window.open('', '_blank');
                rsvpWindow.document.write(data.rsvpHTML);
                rsvpWindow.document.close();
            } else {
                this.showStatus('Failed to generate RSVP preview', 'error');
            }
        } catch (error) {
            console.error('Error generating RSVP preview:', error);
            this.hideLoading();
            this.showStatus('Error generating RSVP preview', 'error');
        }
    }

    downloadInvitation() {
        // Create downloadable version
        const downloadData = {
            invitation: this.generatedInvitation,
            generatedAt: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(downloadData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.generatedInvitation.content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_invitation.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showStatus('Invitation data downloaded!', 'success');
    }

    createNewInvitation() {
        // Reset form and go back to step 1
        document.getElementById('eventForm').reset();
        this.selectedTheme = null;
        this.generatedInvitation = null;
        this.currentStep = 1;
        this.updateStepDisplay();
        this.setMinDate();
        
        this.showStatus('Ready to create a new invitation!', 'info');
    }

    async logout() {
        try {
            await fetch('/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
            this.showStatus('Logout failed', 'error');
        }
    }

    async createEventAndInvites() {
        if (!this.currentUser) {
            this.showStatus('Please log in to create events', 'error');
            return;
        }

        if (!this.generatedInvitation) {
            this.showStatus('Please generate an invitation first', 'error');
            return;
        }

        this.showLoading('Creating event and generating invites...');

        try {
            const eventData = {
                eventName: this.eventData.eventName,
                eventDate: this.eventData.eventDate,
                eventTime: this.eventData.eventTime,
                eventLocation: this.eventData.eventLocation,
                hostName: this.eventData.hostName,
                hostEmail: this.currentUser.email,
                description: this.eventData.description || '',
                invitationData: this.generatedInvitation,
                inviteCount: 1
            };

            const response = await fetch('/invitation-generator/create-event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(eventData)
            });

            const result = await response.json();

            if (result.success) {
                this.showStatus('Event created and invites generated successfully!', 'success');
                
                // Show the generated invites with QR codes
                this.showGeneratedInvites(result.event, result.invites);
            } else {
                this.showStatus(result.error || 'Failed to create event', 'error');
            }
        } catch (error) {
            console.error('Error creating event:', error);
            this.showStatus('Failed to create event', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showGeneratedInvites(event, invites) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>🎉 Event Created Successfully!</h3>
                <p><strong>Event:</strong> ${event.name}</p>
                <p><strong>Date:</strong> ${event.date} at ${event.time}</p>
                <p><strong>Location:</strong> ${event.location}</p>
                
                <h4>Generated Invites with QR Codes:</h4>
                <div class="invites-list">
                    ${invites.map(invite => `
                        <div class="invite-item">
                            <p><strong>RSVP URL:</strong> <a href="${invite.rsvpUrl}" target="_blank">${invite.rsvpUrl}</a></p>
                            <div class="qr-code">
                                <img src="${invite.qrCodeDataURL}" alt="QR Code" style="max-width: 150px;">
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="window.location.href='/host.html'">Go to Event Manager</button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Utility Functions
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingContent = overlay.querySelector('.loading-content h3');
        loadingContent.textContent = message;
        overlay.classList.add('active');
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.remove('active');
    }

    showStatus(message, type = 'info') {
        const statusMessage = document.getElementById('statusMessage');
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.classList.add('show');

        setTimeout(() => {
            statusMessage.classList.remove('show');
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
let invitationGenerator;

function nextStep() {
    invitationGenerator.nextStep();
}

function prevStep() {
    invitationGenerator.prevStep();
}

function loadAISuggestions() {
    invitationGenerator.loadAISuggestions();
}

function generateInvitation() {
    invitationGenerator.generateInvitation();
}

function printInvitation() {
    invitationGenerator.printInvitation();
}

function previewRSVP() {
    invitationGenerator.previewRSVP();
}

function downloadInvitation() {
    invitationGenerator.downloadInvitation();
}

function createNewInvitation() {
    invitationGenerator.createNewInvitation();
}

function createEventAndInvites() {
    invitationGenerator.createEventAndInvites();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    invitationGenerator = new InvitationGenerator();
});
