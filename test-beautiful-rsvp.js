const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testBeautifulRSVP() {
    console.log('🎨 Testing Beautiful RSVP Form...\n');
    
    try {
        // Test 1: Check if the new RSVP form loads
        console.log('1. Testing RSVP form accessibility...');
        const formResponse = await axios.get(`${BASE_URL}/rsvp/demo-event-123/test-invite-456`);
        
        if (formResponse.status === 200) {
            console.log('✅ RSVP form loads successfully');
            
            // Check for key elements in the new design
            const html = formResponse.data;
            const hasNewDesign = html.includes('You\'re Invited! 🎉') && 
                                html.includes('event-card') && 
                                html.includes('attendance-options') &&
                                html.includes('form-row');
            
            if (hasNewDesign) {
                console.log('✅ New beautiful design elements present');
            } else {
                console.log('❌ New design elements not found');
            }
        } else {
            console.log('❌ RSVP form failed to load');
        }
        
        // Test 2: Test RSVP submission
        console.log('\n2. Testing RSVP submission...');
        const submissionData = {
            eventId: 'demo-event-123',
            inviteId: 'test-invite-456',
            guestName: 'Beautiful Test User',
            guestEmail: 'beautiful@example.com',
            attendance: 'yes',
            guestCount: 1,
            guestPhone: '',
            dietaryRestrictions: '',
            message: 'Love the new design!',
            ipAddress: '',
            userAgent: 'Beautiful RSVP Test'
        };
        
        const submitResponse = await axios.post(`${BASE_URL}/rsvp/submit`, submissionData);
        
        if (submitResponse.data.success) {
            console.log('✅ RSVP submission successful');
            console.log(`   Response: ${submitResponse.data.message}`);
        } else {
            console.log('❌ RSVP submission failed');
            console.log(`   Error: ${submitResponse.data.message}`);
        }
        
        // Test 3: Check form compactness
        console.log('\n3. Checking form compactness...');
        const formHtml = formResponse.data;
        
        // Count form fields to ensure it's compact
        const inputCount = (formHtml.match(/<input/g) || []).length;
        const textareaCount = (formHtml.match(/<textarea/g) || []).length;
        const selectCount = (formHtml.match(/<select/g) || []).length;
        
        const totalFields = inputCount + textareaCount + selectCount;
        
        console.log(`   Total form fields: ${totalFields}`);
        
        if (totalFields <= 8) {
            console.log('✅ Form is compact (≤8 fields)');
        } else {
            console.log('❌ Form has too many fields');
        }
        
        // Test 4: Check for single-screen design
        console.log('\n4. Checking single-screen design...');
        const hasOverflowHidden = formHtml.includes('overflow: hidden');
        const hasFlexbox = formHtml.includes('display: flex');
        const hasJustifyCenter = formHtml.includes('justify-content: center');
        
        if (hasOverflowHidden && hasFlexbox && hasJustifyCenter) {
            console.log('✅ Single-screen design implemented');
        } else {
            console.log('❌ Single-screen design not properly implemented');
        }
        
        console.log('\n🎉 Beautiful RSVP Form Test Complete!');
        console.log('\n📱 The new RSVP form features:');
        console.log('   • Beautiful gradient background');
        console.log('   • Compact card-based layout');
        console.log('   • Single-screen design (no scrolling)');
        console.log('   • Modern form styling');
        console.log('   • Responsive grid layout');
        console.log('   • Enhanced user experience');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Run the test
testBeautifulRSVP();
