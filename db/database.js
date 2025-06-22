const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database file (will auto-create it)
const db = new sqlite3.Database(path.join(__dirname, 'events.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Create the events table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT
  )
`);

module.exports = db;
