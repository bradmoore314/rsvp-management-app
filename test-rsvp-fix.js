const axios = require('axios');

async function testRSVPFix() {
    console.log('🧪 Testing RSVP Fix...');
    
    try {
        // Test server health
        console.log('1. Testing server health...');
        const healthResponse = await axios.get('http://localhost:3000/health');
        console.log('✅ Server is running:', healthResponse.data);
        
        // Test RSVP submission
        console.log('2. Testing RSVP submission...');
        const rsvpData = {
            eventId: 'demo-event-123',
            inviteId: 'test-invite-456',
            guestName: 'Test User',
            guestEmail: 'test@example.com',
            attendance: 'yes',
            guestCount: 1,
            guestPhone: '',
            dietaryRestrictions: '',
            message: 'Looking forward to it!',
            ipAddress: '',
            userAgent: 'Test'
        };
        
        const rsvpResponse = await axios.post('http://localhost:3000/rsvp/submit', rsvpData);
        console.log('✅ RSVP submission successful:', rsvpResponse.data);
        
        console.log('🎉 All tests passed! RSVP fix is working.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testRSVPFix();
