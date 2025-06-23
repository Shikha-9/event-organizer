const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('./db/database');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Route: Serve Add Event Form
app.get('/add-event', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'add-event.html'));
});

// Route: Handle Form Submission
app.post('/add-event', (req, res) => {
  const { title, date, description } = req.body;

  const query = `INSERT INTO events (title, date, description) VALUES (?, ?, ?)`;
  db.run(query, [title, date, description], function (err) {
    if (err) {
      console.error('Error inserting event:', err.message);
      res.send('Error saving event.');
    } else {
      console.log('Event added with ID:', this.lastID);
      res.redirect('/');
    }
  });
});

// Route: Show All Events on Homepage
app.get('/', (req, res) => {
  const query = `SELECT * FROM events ORDER BY date`;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching events:', err.message);
      res.send('Error loading events.');
    } else {
      const eventList = rows.map(event => {
        return `
          <li>
            <strong>${event.title}</strong> - ${event.date}<br>
            ${event.description || ''}<br>
            <form action="/delete-event/${event.id}" method="POST" style="display:inline;">
              <button type="submit">🗑️ Delete</button>
            </form>
          </li>
        `;
      }).join('');

      const htmlPath = path.join(__dirname, 'views', 'events.html');
      fs.readFile(htmlPath, 'utf8', (err, html) => {
        if (err) {
          res.send('Error loading page.');
        } else {
          const updatedHtml = html.replace('{{eventList}}', eventList);
          res.send(updatedHtml);
        }
      });
    }
  });
});

// Route: Delete an Event
app.post('/delete-event/:id', (req, res) => {
  const eventId = req.params.id;

  const query = `DELETE FROM events WHERE id = ?`;
  db.run(query, [eventId], function (err) {
    if (err) {
      console.error('Error deleting event:', err.message);
      res.send('Error deleting event.');
    } else {
      console.log(`Event with ID ${eventId} deleted.`);
      res.redirect('/');
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
