#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { getDB } = require('../services/db');

async function run() {
    const db = await getDB();
    const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        console.log(`Running migration ${file}`);
        await db.exec(sql);
    }

    console.log('Migrations complete');
    await db.close();
}

run().catch(err => {
    console.error('Migration failed', err);
    process.exit(1);
});
