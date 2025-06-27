const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/events.db');

db.serialize(() => {
  db.run(`ALTER TABLE events ADD COLUMN category TEXT`, (err) => {
    if (err) {
      console.error("🚫 Failed to alter table (maybe already added):", err.message);
    } else {
      console.log("✅ Category column added successfully!");
    }
  });
});

db.close();
