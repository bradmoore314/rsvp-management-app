// RSVP Dashboard JavaScript
class RSVPDashboard {
    constructor() {
        this.sessionId = null;
        this.host = null;
        this.eventId = null;
        this.dashboardData = null;
        this.currentTab = 'overview';
        this.charts = {};
        this.filters = {
            search: '',
            attendance: 'all',
            sortBy: 'submittedAt'
        };
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.bindEvents();
    }

    async checkAuthentication() {
        // Get event ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.eventId = urlParams.get('eventId');
        
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
                await this.loadDashboardData();
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
            window.location.href = `/event-details?eventId=${this.eventId}`;
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Actions
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadDashboardData();
        });

        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.showExportModal();
        });

        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.debounceSearch();
        });

        document.getElementById('attendanceFilter').addEventListener('change', (e) => {
            this.filters.attendance = e.target.value;
            this.filterResponses();
        });

        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.filters.sortBy = e.target.value;
            this.filterResponses();
        });

        // Export modal
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.hideExportModal();
        });

        document.querySelector('.modal-cancel').addEventListener('click', () => {
            this.hideExportModal();
        });

        document.getElementById('exportForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.exportData();
        });

        // Close modal when clicking outside
        document.getElementById('exportModal').addEventListener('click', (e) => {
            if (e.target.id === 'exportModal') {
                this.hideExportModal();
            }
        });
    }

    async loadDashboardData() {
        try {
            const response = await this.apiCall(`/rsvp-dashboard/event/${this.eventId}`, {
                headers: {
                    'X-Session-ID': this.sessionId
                }
            });

            if (response.success) {
                this.dashboardData = response.data;
                this.updateEventInfo();
                this.updateSummaryStats();
                this.loadTabContent();
            } else {
                throw new Error(response.message || 'Failed to load dashboard data');
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showStatus(`Failed to load dashboard data: ${error.message}`, 'error');
        }
    }

    updateEventInfo() {
        const event = this.dashboardData.event;
        
        document.getElementById('eventName').textContent = event.name;
        document.getElementById('eventDate').textContent = `${new Date(event.date).toLocaleDateString()} at ${event.time}`;
        document.getElementById('eventLocation').textContent = `📍 ${event.location}`;
        
        const statusElement = document.getElementById('eventStatus');
        statusElement.textContent = event.status;
        statusElement.className = `status-badge ${event.status}`;
    }

    updateSummaryStats() {
        const summary = this.dashboardData.summary;
        
        document.getElementById('totalInvites').textContent = summary.totalInvites;
        document.getElementById('totalResponses').textContent = summary.totalResponses;
        document.getElementById('responseRate').textContent = `${summary.responseRate}%`;
        document.getElementById('attending').textContent = summary.attending;
        document.getElementById('notAttending').textContent = summary.notAttending;
        document.getElementById('totalGuests').textContent = summary.totalGuests;
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
            case 'responses':
                await this.loadResponsesContent();
                break;
            case 'analytics':
                this.loadAnalyticsContent();
                break;
            case 'trends':
                this.loadTrendsContent();
                break;
            case 'dietary':
                this.loadDietaryContent();
                break;
        }
    }

    loadOverviewContent() {
        // Update quick insights
        const analytics = this.dashboardData.analytics;
        document.getElementById('avgResponseTime').textContent = `${analytics.averageResponseTime} days`;
        document.getElementById('peakResponseDay').textContent = analytics.peakResponseDay || 'N/A';
        document.getElementById('peakResponseHour').textContent = analytics.peakResponseHour ? `${analytics.peakResponseHour}:00` : 'N/A';
        document.getElementById('avgGuestsPerResponse').textContent = analytics.averageGuestsPerResponse;

        // Update recent responses
        const recentResponsesElement = document.getElementById('recentResponses');
        if (this.dashboardData.responses && this.dashboardData.responses.length > 0) {
            const recentResponses = this.dashboardData.responses
                .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                .slice(0, 5);

            recentResponsesElement.innerHTML = recentResponses.map(response => `
                <div class="response-item">
                    <div class="response-guest">${response.guestName}</div>
                    <div class="response-status ${response.attendance}">${response.attendance}</div>
                </div>
            `).join('');
        } else {
            recentResponsesElement.innerHTML = '<p>No responses yet.</p>';
        }

        // Create charts
        this.createResponseChart();
        this.createGuestCountChart();
    }

    async loadResponsesContent() {
        await this.filterResponses();
    }

    async filterResponses() {
        try {
            const response = await this.apiCall(`/rsvp-dashboard/event/${this.eventId}/filter`, {
                method: 'POST',
                body: JSON.stringify(this.filters),
                headers: {
                    'X-Session-ID': this.sessionId
                }
            });

            if (response.success) {
                this.displayResponses(response.data.responses);
            } else {
                throw new Error(response.message || 'Failed to filter responses');
            }
        } catch (error) {
            console.error('Failed to filter responses:', error);
            this.showStatus(`Failed to filter responses: ${error.message}`, 'error');
        }
    }

    displayResponses(responses) {
        const responsesListElement = document.getElementById('responsesList');
        
        if (responses.length === 0) {
            responsesListElement.innerHTML = '<p>No responses found matching your criteria.</p>';
            return;
        }

        responsesListElement.innerHTML = responses.map(response => `
            <div class="response-card">
                <div class="response-info">
                    <div class="response-guest-name">${response.guestName}</div>
                    <div class="response-guest-email">${response.guestEmail}</div>
                    <div class="response-details">
                        <div class="response-detail">
                            <span>👥</span>
                            <span>${response.guestCount} guest(s)</span>
                        </div>
                        <div class="response-detail">
                            <span>🍽️</span>
                            <span>${response.dietaryOptions && response.dietaryOptions.length > 0 
                                ? response.dietaryOptions.join(', ') 
                                : 'No dietary restrictions'}</span>
                        </div>
                        ${response.message ? `
                            <div class="response-detail">
                                <span>💬</span>
                                <span>${response.message}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="response-actions-card">
                    <div class="response-status-badge ${response.attendance}">${response.attendance}</div>
                    <div class="response-date">${new Date(response.submittedAt).toLocaleDateString()}</div>
                </div>
            </div>
        `).join('');
    }

    loadAnalyticsContent() {
        // Update milestones
        const timeline = this.dashboardData.timeline;
        const milestonesListElement = document.getElementById('milestonesList');
        
        if (timeline.milestones && timeline.milestones.length > 0) {
            milestonesListElement.innerHTML = timeline.milestones.map(milestone => `
                <div class="milestone-item">
                    <div class="milestone-percentage">${milestone.percentage}%</div>
                    <div class="milestone-details">
                        <div>${milestone.count} responses</div>
                        <div>${milestone.daysUntilEvent} days before event</div>
                    </div>
                </div>
            `).join('');
        } else {
            milestonesListElement.innerHTML = '<p>No milestone data available.</p>';
        }

        // Update pattern values
        const milestones = timeline.milestones || [];
        document.getElementById('milestone25').textContent = milestones.find(m => m.percentage === 25)?.daysUntilEvent || '-';
        document.getElementById('milestone50').textContent = milestones.find(m => m.percentage === 50)?.daysUntilEvent || '-';
        document.getElementById('milestone75').textContent = milestones.find(m => m.percentage === 75)?.daysUntilEvent || '-';
        document.getElementById('milestone100').textContent = milestones.find(m => m.percentage === 100)?.daysUntilEvent || '-';

        // Create timeline chart
        this.createTimelineChart();
    }

    loadTrendsContent() {
        this.createDailyTrendsChart();
        this.createResponseRateChart();
    }

    loadDietaryContent() {
        const dietaryAnalysis = this.dashboardData.dietaryAnalysis;
        
        // Update dietary statistics
        document.getElementById('withDietary').textContent = dietaryAnalysis.totalWithDietary;
        document.getElementById('withoutDietary').textContent = dietaryAnalysis.totalWithoutDietary;

        // Update combinations list
        const combinationsListElement = document.getElementById('combinationsList');
        const combinations = Object.entries(dietaryAnalysis.commonCombinations || {})
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        if (combinations.length > 0) {
            combinationsListElement.innerHTML = combinations.map(([combination, count]) => `
                <div class="combination-item">
                    <div class="combination-name">${combination}</div>
                    <div class="combination-count">${count} guests</div>
                </div>
            `).join('');
        } else {
            combinationsListElement.innerHTML = '<p>No common combinations found.</p>';
        }

        // Create dietary chart
        this.createDietaryChart();
    }

    // Chart creation methods
    createResponseChart() {
        const ctx = document.getElementById('responseChart').getContext('2d');
        
        if (this.charts.responseChart) {
            this.charts.responseChart.destroy();
        }

        const summary = this.dashboardData.summary;
        this.charts.responseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Attending', 'Not Attending', 'Maybe'],
                datasets: [{
                    data: [summary.attending, summary.notAttending, summary.maybe],
                    backgroundColor: ['#48bb78', '#f56565', '#ed8936'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createGuestCountChart() {
        const ctx = document.getElementById('guestCountChart').getContext('2d');
        
        if (this.charts.guestCountChart) {
            this.charts.guestCountChart.destroy();
        }

        const guestAnalysis = this.dashboardData.guestAnalysis;
        const distribution = guestAnalysis.guestCountDistribution || {};
        
        const labels = Object.keys(distribution).sort((a, b) => parseInt(a) - parseInt(b));
        const data = labels.map(label => distribution[label]);

        this.charts.guestCountChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.map(label => `${label} guest${label === '1' ? '' : 's'}`),
                datasets: [{
                    label: 'Number of Responses',
                    data: data,
                    backgroundColor: '#667eea',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    createTimelineChart() {
        const ctx = document.getElementById('timelineChart').getContext('2d');
        
        if (this.charts.timelineChart) {
            this.charts.timelineChart.destroy();
        }

        const trends = this.dashboardData.trends || {};
        const labels = Object.keys(trends).sort();
        const responseData = labels.map(label => trends[label].responses);
        const attendingData = labels.map(label => trends[label].attending);

        this.charts.timelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.map(label => new Date(label).toLocaleDateString()),
                datasets: [{
                    label: 'Total Responses',
                    data: responseData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Attending',
                    data: attendingData,
                    borderColor: '#48bb78',
                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    createDailyTrendsChart() {
        const ctx = document.getElementById('dailyTrendsChart').getContext('2d');
        
        if (this.charts.dailyTrendsChart) {
            this.charts.dailyTrendsChart.destroy();
        }

        const trends = this.dashboardData.trends || {};
        const labels = Object.keys(trends).sort();
        const responseData = labels.map(label => trends[label].responses);

        this.charts.dailyTrendsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.map(label => new Date(label).toLocaleDateString()),
                datasets: [{
                    label: 'Daily Responses',
                    data: responseData,
                    backgroundColor: '#667eea',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    createResponseRateChart() {
        const ctx = document.getElementById('responseRateChart').getContext('2d');
        
        if (this.charts.responseRateChart) {
            this.charts.responseRateChart.destroy();
        }

        // Calculate cumulative response rate
        const trends = this.dashboardData.trends || {};
        const labels = Object.keys(trends).sort();
        const totalInvites = this.dashboardData.summary.totalInvites;
        
        let cumulativeResponses = 0;
        const responseRateData = labels.map(label => {
            cumulativeResponses += trends[label].responses;
            return totalInvites > 0 ? (cumulativeResponses / totalInvites * 100).toFixed(1) : 0;
        });

        this.charts.responseRateChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.map(label => new Date(label).toLocaleDateString()),
                datasets: [{
                    label: 'Response Rate (%)',
                    data: responseRateData,
                    borderColor: '#48bb78',
                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    createDietaryChart() {
        const ctx = document.getElementById('dietaryChart').getContext('2d');
        
        if (this.charts.dietaryChart) {
            this.charts.dietaryChart.destroy();
        }

        const dietaryAnalysis = this.dashboardData.dietaryAnalysis;
        const preferences = dietaryAnalysis.preferences || {};
        
        const labels = Object.keys(preferences);
        const data = Object.values(preferences);

        this.charts.dietaryChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#667eea', '#48bb78', '#ed8936', '#f56565', 
                        '#9f7aea', '#38b2ac', '#ecc94b', '#fc8181'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    showExportModal() {
        document.getElementById('exportModal').style.display = 'block';
    }

    hideExportModal() {
        document.getElementById('exportModal').style.display = 'none';
    }

    async exportData() {
        try {
            const format = document.getElementById('exportFormat').value;
            const includeSummary = document.getElementById('includeSummary').checked;
            const includeAnalytics = document.getElementById('includeAnalytics').checked;

            const options = {
                includeSummary: includeSummary,
                includeAnalytics: includeAnalytics
            };

            const response = await fetch(`/rsvp-dashboard/event/${this.eventId}/export?format=${format}`, {
                headers: {
                    'X-Session-ID': this.sessionId
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `rsvp-dashboard-${this.eventId}-${new Date().toISOString().split('T')[0]}.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.showStatus('Data exported successfully!', 'success');
                this.hideExportModal();
            } else {
                throw new Error('Failed to export data');
            }
        } catch (error) {
            console.error('Failed to export data:', error);
            this.showStatus(`Failed to export data: ${error.message}`, 'error');
        }
    }

    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.filterResponses();
        }, 300);
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

// Initialize dashboard when DOM is loaded
let rsvpDashboard;
document.addEventListener('DOMContentLoaded', () => {
    rsvpDashboard = new RSVPDashboard();
});




