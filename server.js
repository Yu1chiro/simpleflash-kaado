const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public'), {
    etag: false,
    lastModified: false,
    setHeaders: (res, path) => {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
    }
  }));
app.use((req, res, next) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    next();
  });
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/deck/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'deck.html'));
});

app.get('/flashcard/:deckId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'flashcard.html'));
});
app.get('/quiz/:deckId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'quiz.html'));
  });
app.get('/quiz-blank/:deckId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'quiz-blank.html'));
  });
app.get('/quiz-memo/:deckId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'quiz-memo.html'));
  });
app.get('/memory/:deckId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'memory.html'));
  });
  

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});