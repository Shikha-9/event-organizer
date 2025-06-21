const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to serve static files from 'public' folder
app.use(express.static('public'));

// Home route
app.get('/', (req, res) => {
  res.send('Welcome to the Event Organizer Website!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
