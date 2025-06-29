const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/events.db');

db.serialize(() => {
  db.run(`ALTER TABLE events ADD COLUMN user_id INTEGER`, (err) => {
    if (err) {
      if (err.message.includes("duplicate column name")) {
        console.log("✅ Column 'user_id' already exists.");
      } else {
        console.error("❌ Error adding column:", err.message);
      }
    } else {
      console.log("✅ 'user_id' column added successfully.");
    }
  });
});

db.close();
