#!/usr/bin/env node

/**
 * Quick Test Script
 * 
 * This script performs a quick test of the Google Drive hosting functionality
 */

async function quickTest() {
    console.log('🧪 Quick Google Drive Hosting Test\n');
    
    try {
        // Test 1: Check server health
        console.log('1. Testing server health...');
        const healthResponse = await fetch('http://localhost:4000/health');
        const healthData = await healthResponse.json();
        
        if (healthData.status === 'OK') {
            console.log('   ✅ Server is running');
            console.log(`   ✅ Services available: ${Object.keys(healthData.services).length}`);
        } else {
            throw new Error('Server health check failed');
        }
        
        // Test 2: Test QR code generation endpoint
        console.log('\n2. Testing QR code generation endpoint...');
        const qrResponse = await fetch('http://localhost:4000/qrcode/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventId: 'test-event-123',
                useGoogleDrive: true
            })
        });
        
        const qrData = await qrResponse.json();
        
        if (qrResponse.ok && qrData.success) {
            console.log('   ✅ QR code generation endpoint working');
            console.log(`   ✅ Hosting method: ${qrData.data.hostingMethod}`);
            console.log(`   ✅ RSVP URL: ${qrData.data.rsvpUrl}`);
            
            if (qrData.data.hostingMethod === 'google-drive' && qrData.data.rsvpUrl.includes('drive.google.com')) {
                console.log('   ✅ Google Drive hosting is working correctly!');
            } else {
                console.log('   ⚠️  QR code is not using Google Drive hosting');
            }
        } else {
            console.log('   ❌ QR code generation failed:', qrData.message || 'Unknown error');
        }
        
        // Test 3: Test batch QR code generation
        console.log('\n3. Testing batch QR code generation...');
        const batchResponse = await fetch('http://localhost:4000/qrcode/generate-batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventId: 'test-event-123',
                inviteCount: 2,
                useGoogleDrive: true
            })
        });
        
        const batchData = await batchResponse.json();
        
        if (batchResponse.ok && batchData.success) {
            console.log('   ✅ Batch QR code generation working');
            console.log(`   ✅ Generated ${batchData.data.count} QR codes`);
            console.log(`   ✅ Hosting method: ${batchData.data.hostingMethod}`);
            
            if (batchData.data.hostingMethod === 'google-drive') {
                console.log('   ✅ Batch Google Drive hosting is working correctly!');
            } else {
                console.log('   ⚠️  Batch QR codes are not using Google Drive hosting');
            }
        } else {
            console.log('   ❌ Batch QR code generation failed:', batchData.message || 'Unknown error');
        }
        
        console.log('\n🎉 Quick test completed!');
        console.log('\n📋 Next steps:');
        console.log('   1. Go to http://localhost:4000/host-dashboard');
        console.log('   2. Create an event');
        console.log('   3. Generate invites with "Use Google Drive hosting" checked');
        console.log('   4. Scan QR codes with your phone to test external access');
        
    } catch (error) {
        console.error('❌ Quick test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Make sure the server is running on port 4000');
        console.log('   2. Check that Google Drive API is properly configured');
        console.log('   3. Verify OAuth tokens are valid');
    }
}

// Run the quick test
if (require.main === module) {
    quickTest();
}

module.exports = quickTest;






