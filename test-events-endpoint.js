const axios = require('axios');

async function testEventsEndpoint() {
    console.log('🧪 Testing Events Endpoint...');
    
    try {
        // Test server health
        console.log('1. Testing server health...');
        const healthResponse = await axios.get('http://localhost:3000/health');
        console.log('✅ Server is running:', healthResponse.data);
        
        // Test all events endpoint
        console.log('2. Testing /events endpoint...');
        const eventsResponse = await axios.get('http://localhost:3000/events');
        console.log('✅ Events response:', eventsResponse.data);
        
        // Test host events endpoint
        console.log('3. Testing /events/host/host@example.com endpoint...');
        const hostEventsResponse = await axios.get('http://localhost:3000/events/host/host@example.com');
        console.log('✅ Host events response:', hostEventsResponse.data);
        
        console.log('🎉 All tests completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testEventsEndpoint();
