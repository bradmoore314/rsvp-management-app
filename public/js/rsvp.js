const params = new URLSearchParams(window.location.search);
const eventId = params.get('eventId');
const inviteId = params.get('inviteId');
const statusEl = document.getElementById('feedback');

async function loadData() {
    if (!eventId) {
        document.getElementById('eventName').textContent = 'Missing event information';
        document.getElementById('eventDetails').textContent = 'Please use the link provided by your host.';
        document.getElementById('rsvpForm').style.display = 'none';
        return;
    }

    try {
        const event = await fetch(`/events/${eventId}`).then(res => res.json());
        document.getElementById('eventName').textContent = event.name;
        document.getElementById('eventDetails').textContent = `${event.date || ''} ${event.time || ''} · ${event.location || ''}`;
        document.getElementById('eventId').value = event.id;
        if (inviteId) {
            document.getElementById('inviteId').value = inviteId;
        }
    } catch (error) {
        document.getElementById('eventName').textContent = 'Event not found';
        document.getElementById('eventDetails').textContent = 'Double-check the invite link.';
        document.getElementById('rsvpForm').style.display = 'none';
    }
}

async function submitForm(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = Object.fromEntries(formData.entries());
    payload.guestCount = Number(payload.guestCount || 1);

    statusEl.textContent = '';

    const response = await fetch('/rsvp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        statusEl.textContent = 'Thank you for your RSVP!';
        statusEl.className = 'success';
        event.target.reset();
    } else {
        const error = await response.json();
        statusEl.textContent = error.error || 'Failed to submit RSVP.';
        statusEl.className = 'error';
    }
}

document.getElementById('rsvpForm').addEventListener('submit', submitForm);
loadData();
