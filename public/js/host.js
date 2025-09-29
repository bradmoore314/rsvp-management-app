const eventsList = document.getElementById('eventsList');
const form = document.getElementById('eventForm');
const welcomeMessage = document.getElementById('welcomeMessage');
const logoutBtn = document.getElementById('logoutBtn');
let currentUser = null;

async function fetchJSON(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        credentials: 'include'
    });
    if (!response.ok) {
        throw new Error('Request failed');
    }
    return response.json();
}

async function ensureAuth() {
    try {
        const data = await fetchJSON('/auth/me');
        currentUser = data.user;
        if (welcomeMessage && currentUser) {
            welcomeMessage.textContent = `Welcome, ${currentUser.name || currentUser.email}`;
        }
        await fetchEvents();
    } catch (error) {
        window.location.href = '/';
    }
}

async function fetchEvents() {
    const events = await fetchJSON('/events');
    renderEvents(events);
}

function renderEvents(events) {
    if (!events || events.length === 0) {
        eventsList.innerHTML = '<div class="modern-empty"><h3>No events yet</h3><p>Create your first event above to get started!</p></div>';
        return;
    }

    eventsList.innerHTML = events.map(event => `
        <div class="modern-card">
            <h3>${event.name}</h3>
            <div class="modern-card-meta">
                ${event.date || 'Date TBD'} · ${event.time || 'Time TBD'}<br />
                ${event.location || 'Location TBD'}
            </div>
            <p>${event.description || ''}</p>
            <div class="modern-actions">
                <button class="modern-btn modern-btn-primary" onclick="generateQRCode('${event.id}')">Generate QR Code</button>
                <button class="modern-btn modern-btn-secondary" onclick="viewRSVPs('${event.id}')">View RSVPs</button>
                <button class="modern-btn modern-btn-secondary" onclick="exportRSVPs('${event.id}')">Export CSV</button>
                <button class="modern-btn modern-btn-secondary" onclick="deleteEvent('${event.id}')">Delete</button>
            </div>
            <div id="qr-${event.id}" class="modern-qr" style="display: none;"></div>
        </div>
    `).join('');
}

async function generateQRCode(eventId) {
    try {
        const response = await fetchJSON('/invites/generate', {
            method: 'POST',
            body: JSON.stringify({ eventId: eventId })
        });
        
        const qrContainer = document.getElementById(`qr-${eventId}`);
        qrContainer.innerHTML = `
            <h4>QR Code Generated!</h4>
            <img src="${response.qrCodeDataURL}" alt="QR Code" />
            <p><strong>RSVP URL:</strong> <a href="${response.rsvpUrl}" target="_blank">${response.rsvpUrl}</a></p>
            <div class="modern-actions">
                <button class="modern-btn modern-btn-primary" onclick="printQRCode('${eventId}')">Print QR Code</button>
                <button class="modern-btn modern-btn-secondary" onclick="downloadQRCode('${eventId}')">Download</button>
            </div>
        `;
        qrContainer.style.display = 'block';
    } catch (error) {
        alert('Failed to generate QR code');
    }
}

async function printQRCode(eventId) {
    const qrContainer = document.getElementById(`qr-${eventId}`);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>QR Code - Print</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                    img { max-width: 300px; margin: 20px 0; }
                    .url { word-break: break-all; margin: 20px 0; }
                </style>
            </head>
            <body>
                <h2>RSVP QR Code</h2>
                ${qrContainer.innerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

async function downloadQRCode(eventId) {
    const qrContainer = document.getElementById(`qr-${eventId}`);
    const img = qrContainer.querySelector('img');
    if (img) {
        const link = document.createElement('a');
        link.download = `qr-code-${eventId}.png`;
        link.href = img.src;
        link.click();
    }
}

async function viewRSVPs(eventId) {
    try {
        const [event, stats, rsvps] = await Promise.all([
            fetchJSON(`/events/${eventId}`),
            fetchJSON(`/rsvp/event/${eventId}/stats`),
            fetchJSON(`/rsvp/event/${eventId}`)
        ]);

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex; align-items: center;
            justify-content: center; z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div class="glass-container" style="max-width: 600px; max-height: 80vh; overflow-y: auto; margin: 20px;">
                <div style="padding: 2rem;">
                    <h2>RSVP Responses for ${event.name}</h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin: 1rem 0;">
                        <div style="text-align: center; padding: 1rem; background: rgba(76, 175, 80, 0.2); border-radius: 8px;">
                            <div style="font-size: 2rem; font-weight: bold; color: #2e7d32;">${stats.attendingCount}</div>
                            <div>Attending</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: rgba(244, 67, 54, 0.2); border-radius: 8px;">
                            <div style="font-size: 2rem; font-weight: bold; color: #c62828;">${stats.notAttendingCount}</div>
                            <div>Not Attending</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: rgba(255, 193, 7, 0.2); border-radius: 8px;">
                            <div style="font-size: 2rem; font-weight: bold; color: #f57c00;">${stats.maybeCount}</div>
                            <div>Maybe</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: rgba(33, 150, 243, 0.2); border-radius: 8px;">
                            <div style="font-size: 2rem; font-weight: bold; color: #1565c0;">${stats.totalGuests}</div>
                            <div>Total Guests</div>
                        </div>
                    </div>
                    <h3>Individual Responses</h3>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${rsvps.map(rsvp => `
                            <div style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.2);">
                                <strong>${rsvp.guest_name}</strong> (${rsvp.guest_email})
                                <br>Response: <span style="color: ${rsvp.attendance === 'yes' ? '#2e7d32' : rsvp.attendance === 'no' ? '#c62828' : '#f57c00'}">${rsvp.attendance}</span>
                                <br>Guests: ${rsvp.guest_count}
                                ${rsvp.message ? `<br>Message: ${rsvp.message}` : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div class="modern-actions" style="margin-top: 1rem;">
                        <button class="modern-btn modern-btn-primary" onclick="exportRSVPs('${eventId}')">Export CSV</button>
                        <button class="modern-btn modern-btn-secondary" onclick="this.closest('.glass-container').parentElement.remove()">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    } catch (error) {
        alert('Failed to load RSVP data');
    }
}

async function exportRSVPs(eventId) {
    try {
        const response = await fetch(`/rsvp/event/${eventId}/export`, {
            credentials: 'include'
        });
        const csv = await response.text();
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rsvp-export-${eventId}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        alert('Failed to export RSVP data');
    }
}

async function deleteEvent(eventId) {
    if (!confirm('Delete this event? This will also delete all RSVP responses.')) return;
    try {
        await fetch(`/events/${eventId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        fetchEvents();
    } catch (error) {
        alert('Failed to delete event');
    }
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
        await fetchJSON('/events', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        form.reset();
        fetchEvents();
    } catch (error) {
        alert('Failed to create event');
    }
});

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
        window.location.href = '/';
    });
}

ensureAuth();