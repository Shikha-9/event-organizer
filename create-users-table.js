// create-users-table.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./db/events.db');

// 🔐 Create users table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )
`, (err) => {
  if (err) return console.error('❌ Error creating table:', err.message);

  // 💾 Insert default admin (username: admin, password: admin123)
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`, ['admin', hashedPassword], (err) => {
    if (err) return console.error('❌ Error inserting user:', err.message);
    console.log('✅ Admin user created. Username: admin | Password: admin123');
    db.close();
  });
});
