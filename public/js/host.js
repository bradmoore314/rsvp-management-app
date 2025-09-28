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
        eventsList.innerHTML = '<p class="empty">No events yet. Create one above!</p>';
        return;
    }

    eventsList.innerHTML = events.map(event => `
        <article class="event-card">
            <h3>${event.name}</h3>
            <p class="event-meta">
                ${event.date || 'Date TBD'} · ${event.time || 'Time TBD'}<br />
                ${event.location || 'Location TBD'}
            </p>
            <p>${event.description || ''}</p>
            <div class="actions">
                <a class="secondary" href="/rsvp.html?eventId=${event.id}" target="_blank">Open RSVP Page</a>
                <button onclick="deleteEvent('${event.id}')">Delete</button>
            </div>
            <div id="qr-${event.id}"></div>
        </article>
    `).join('');
}

async function deleteEvent(eventId) {
    if (!confirm('Delete this event?')) return;
    await fetch(`/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    fetchEvents();
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
