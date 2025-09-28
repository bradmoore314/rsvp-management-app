const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let dbPromise;

async function getDB() {
    if (!dbPromise) {
        const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'app.db');
        const dir = path.dirname(dbPath);
        if (dbPath !== ':memory:' && !fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        dbPromise = open({
            filename: dbPath,
            driver: sqlite3.Database
        });
    }
    return dbPromise;
}

module.exports = {
    getDB
};
