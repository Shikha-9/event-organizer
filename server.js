const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require('express-session');
const db = require('./db/database');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'eventsecret123',
  resave: false,
  saveUninitialized: true
}));

// Flash middleware
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// Auth middleware
function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: '🔐 Please login to access that page.' };
    return res.redirect('/login');
  }
  next();
}

// GET: Register Page
app.get('/register', (req, res) => {
  const htmlPath = path.join(__dirname, 'views', 'register.html');
  fs.readFile(htmlPath, 'utf8', (err, html) => {
    if (err) return res.send('Error loading register page.');
    const flash = res.locals.flash
      ? `<div class="toast ${res.locals.flash.type}">${res.locals.flash.message}</div>` : '';
    res.send(html.replace('{{flashMessage}}', flash));
  });
});

// POST: Register New User
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    req.session.flash = { type: 'error', message: '⚠️ All fields are required.' };
    return res.redirect('/register');
  }

  const hash = bcrypt.hashSync(password, 10);
  const query = `INSERT INTO users (username, password) VALUES (?, ?)`;

  db.run(query, [username, hash], function (err) {
    if (err) {
      console.error('Registration error:', err.message);
      req.session.flash = { type: 'error', message: '❌ Username already exists.' };
      return res.redirect('/register');
    }
    req.session.flash = { type: 'success', message: '✅ Registered! Please log in.' };
    res.redirect('/login');
  });
});

// GET: Login Page
app.get('/login', (req, res) => {
  const htmlPath = path.join(__dirname, 'views', 'login.html');
  fs.readFile(htmlPath, 'utf8', (err, html) => {
    if (err) return res.send('Error loading login page.');
    const flash = res.locals.flash
      ? `<div class="toast ${res.locals.flash.type}">${res.locals.flash.message}</div>` : '';
    res.send(html.replace('{{flashMessage}}', flash));
  });
});

// POST: Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password)) {
      req.session.flash = { type: 'error', message: '❌ Invalid credentials.' };
      return res.redirect('/login');
    }

    req.session.user = user;
    req.session.flash = { type: 'success', message: `✅ Welcome, ${user.username}!` };
    res.redirect('/');
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// GET: Add Event Form
app.get('/add-event', requireLogin, (req, res) => {
  const htmlPath = path.join(__dirname, 'views', 'add-event.html');
  fs.readFile(htmlPath, 'utf8', (err, html) => {
    if (err) return res.send('Error loading form.');
    const flash = res.locals.flash
      ? `<div class="toast ${res.locals.flash.type}">${res.locals.flash.message}</div>` : '';
    res.send(html.replace('{{flashMessage}}', flash));
  });
});

// POST: Add Event
app.post('/add-event', requireLogin, (req, res) => {
  const { title, date, description, category } = req.body;
  if (!title || !date || !category) {
    req.session.flash = {
      type: 'error',
      message: '⚠️ Title, Date, and Category are required!'
    };
    return res.redirect('/add-event');
  }

  const query = `INSERT INTO events (title, date, description, category, user_id) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [title, date, description, category, req.session.user.id], function (err) {
    if (err) {
      console.error('Error inserting event:', err.message);
      req.session.flash = { type: 'error', message: '❌ Error saving event.' };
    } else {
      req.session.flash = { type: 'success', message: '✅ Event created successfully!' };
    }
    res.redirect('/');
  });
});

// GET: Edit Event Page
app.get('/edit-event/:id', requireLogin, (req, res) => {
  const eventId = req.params.id;
  db.get(`SELECT * FROM events WHERE id = ? AND user_id = ?`, [eventId, req.session.user.id], (err, event) => {
    if (err || !event) {
      req.session.flash = { type: 'error', message: '❌ Event not found or unauthorized.' };
      return res.redirect('/');
    }

    const htmlPath = path.join(__dirname, 'views', 'edit-event.html');
    fs.readFile(htmlPath, 'utf8', (err, html) => {
      if (err) return res.send('Error loading edit page.');
      const formFilled = html
        .replace('{{id}}', event.id)
        .replace('{{title}}', event.title)
        .replace('{{date}}', event.date)
        .replace('{{category}}', event.category)
        .replace('{{description}}', event.description || '');
      res.send(formFilled);
    });
  });
});

// POST: Edit Event
app.post('/edit-event/:id', requireLogin, (req, res) => {
  const eventId = req.params.id;
  const { title, date, description, category } = req.body;
  const query = `UPDATE events SET title = ?, date = ?, description = ?, category = ? WHERE id = ? AND user_id = ?`;

  db.run(query, [title, date, description, category, eventId, req.session.user.id], function (err) {
    if (err) {
      console.error('Error updating event:', err.message);
      req.session.flash = { type: 'error', message: '❌ Failed to update event.' };
    } else {
      req.session.flash = { type: 'success', message: '✏️ Event updated successfully!' };
    }
    res.redirect('/');
  });
});

// POST: Delete Event
app.post('/delete-event/:id', requireLogin, (req, res) => {
  const eventId = req.params.id;
  const query = `DELETE FROM events WHERE id = ? AND user_id = ?`;

  db.run(query, [eventId, req.session.user.id], function (err) {
    if (err) {
      console.error('Error deleting event:', err.message);
      req.session.flash = { type: 'error', message: '❌ Failed to delete event.' };
    } else {
      req.session.flash = { type: 'success', message: '🗑️ Event deleted.' };
    }
    res.redirect('/');
  });
});

// GET: Home Page with All Events / My Events
app.get('/', (req, res) => {
  const showOnlyMine = req.query.mine === '1' && req.session.user;
  const query = showOnlyMine
    ? `SELECT * FROM events WHERE user_id = ? ORDER BY date`
    : `SELECT * FROM events ORDER BY date`;
  const params = showOnlyMine ? [req.session.user.id] : [];

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching events:', err.message);
      return res.send('Error loading events.');
    }

    const eventList = rows.map(event => `
      <li>
        <strong>${event.title}</strong> - ${event.date}<br>
        <em>Category: ${event.category}</em><br>
        ${event.description || ''}<br>
        <form action="/delete-event/${event.id}" method="POST" style="display:inline-block;">
          <button type="submit">🗑️ Delete</button>
        </form>
        <a href="/edit-event/${event.id}" style="display:inline-block;">
          <button style="margin-left: 10px;">✏️ Edit</button>
        </a>
      </li>
    `).join('');

    const htmlPath = path.join(__dirname, 'views', 'events.html');
    fs.readFile(htmlPath, 'utf8', (err, html) => {
      if (err) return res.send('Error loading page.');

      const flashMessage = res.locals.flash
        ? `<div class="toast ${res.locals.flash.type}">${res.locals.flash.message}</div>` : '';

      const myEventsBtn = req.session.user
        ? `<a href="/?mine=1"><button class="my-events">📁 My Events</button></a>`
        : '';

      const updatedHtml = html
        .replace('{{flashMessage}}', flashMessage)
        .replace('{{eventList}}', eventList)
        .replace('{{buttons}}', myEventsBtn);

      res.send(updatedHtml);
    });
  });
});

// GET: Search Events
app.get('/search', (req, res) => {
  const searchTerm = `%${req.query.query}%`;
  const categoryFilter = req.query.category || '%';
  const query = `SELECT * FROM events WHERE (title LIKE ? OR category LIKE ?) AND category LIKE ? ORDER BY date`;

  db.all(query, [searchTerm, searchTerm, categoryFilter], (err, rows) => {
    if (err) {
      console.error('Error during search:', err.message);
      return res.send('Error searching events.');
    }

    const eventList = rows.length
      ? rows.map(event => `
          <li>
            <strong>${event.title}</strong> - ${event.date}<br>
            <em>Category: ${event.category}</em><br>
            ${event.description || ''}<br>
            <form action="/delete-event/${event.id}" method="POST" style="display:inline-block;">
              <button type="submit">🗑️ Delete</button>
            </form>
            <a href="/edit-event/${event.id}" style="display:inline-block;">
              <button style="margin-left: 10px;">✏️ Edit</button>
            </a>
          </li>
        `).join('')
      : `<p>No results found for "<strong>${req.query.query}</strong>"</p>`;

    const htmlPath = path.join(__dirname, 'views', 'events.html');
    fs.readFile(htmlPath, 'utf8', (err, html) => {
      if (err) return res.send('Error loading page.');
      const flashMessage = res.locals.flash
        ? `<div class="toast ${res.locals.flash.type}">${res.locals.flash.message}</div>` : '';

      const updatedHtml = html
        .replace('{{flashMessage}}', flashMessage)
        .replace('{{eventList}}', eventList)
        .replace('{{buttons}}', '');

      res.send(updatedHtml);
    });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🎉 Server is running on http://localhost:${PORT}`);
});
