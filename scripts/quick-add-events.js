#!/usr/bin/env node
const { getDB } = require('../services/db');
const { v4: uuidv4 } = require('uuid');

// Sample events to help you get started quickly
const sampleEvents = [
    {
        name: "Birthday Party",
        description: "Come celebrate with us!",
        date: "2025-10-15",
        time: "19:00",
        location: "123 Main St, City",
        hostName: "Brad Moore",
        hostEmail: "brad@example.com"
    },
    {
        name: "Company Meeting",
        description: "Quarterly team meeting",
        date: "2025-10-20",
        time: "14:00",
        location: "Office Conference Room",
        hostName: "Brad Moore",
        hostEmail: "brad@example.com"
    },
    {
        name: "Holiday Party",
        description: "End of year celebration",
        date: "2025-12-15",
        time: "18:00",
        location: "Community Center",
        hostName: "Brad Moore",
        hostEmail: "brad@example.com"
    }
];

async function addSampleEvents() {
    try {
        const db = await getDB();
        
        // First, create a user for Brad Moore
        const userId = uuidv4();
        await db.run(
            'INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)',
            userId,
            'brad@example.com',
            'Brad Moore'
        );
        
        console.log('👤 Created user: Brad Moore');
        
        // Add sample events
        for (const eventData of sampleEvents) {
            const eventId = uuidv4();
            await db.run(
                `INSERT INTO events (id, user_id, name, description, date, time, location, host_name, host_email, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                eventId,
                userId,
                eventData.name,
                eventData.description,
                eventData.date,
                eventData.time,
                eventData.location,
                eventData.hostName,
                eventData.hostEmail,
                'active'
            );
            
            console.log(`✅ Created event: ${eventData.name}`);
        }
        
        console.log('🎉 Sample events added successfully!');
        console.log('You can now log in and see your events in the Event Manager.');
        
    } catch (error) {
        console.error('❌ Error adding sample events:', error.message);
    }
}

addSampleEvents();
