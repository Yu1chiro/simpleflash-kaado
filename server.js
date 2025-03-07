const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');
const cheerio = require('cheerio');

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
app.get('/user-info/:deckId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user-info.html'));
  });
app.get('/jisho', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'jisho.html'));
  });
  
// Endpoint untuk pencarian awal
app.get('/api/jisho/search', async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ error: 'Parameter pencarian diperlukan' });
      }
  
      // Melakukan request ke takoboto untuk pencarian
      const response = await axios.get(`https://takoboto.jp/?q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
  
      // Parse HTML untuk mendapatkan hasil pencarian
      const $ = cheerio.load(response.data);
      const results = [];
  
      // Mengekstrak semua elemen ResultDiv
      $('.ResultDiv').each((index, element) => {
        const resultId = $(element).attr('id');
        if (!resultId) return;
  
        // Mendapatkan ID kata dari element
        const wordIdElement = $(element).find('#ResultWordId' + resultId.replace('ResultWord', ''));
        const wordId = wordIdElement.val();
        
        // Mendapatkan teks kata (jika tersedia)
        let word = '';
        let reading = '';
        
        // Coba untuk mendapatkan teks kata dari hasil pencarian
        // Format ini mungkin perlu disesuaikan berdasarkan struktur HTML takoboto
        $(element).find('.word').each((i, wordElement) => {
          word = $(wordElement).text().trim();
        });
        
        $(element).find('.reading').each((i, readingElement) => {
          reading = $(readingElement).text().trim();
        });
        
        // Jika tidak bisa mendapatkan teks kata, gunakan teks keseluruhan
        if (!word) {
          word = $(element).text().trim();
        }
  
        // Tambahkan hasil pencarian ke array
        if (wordId) {
          results.push({
            id: wordId,
            word: word,
            reading: reading
          });
        }
      });
  
      res.json({ results });
    } catch (error) {
      console.error('Error saat pencarian takoboto:', error);
      res.status(500).json({ error: 'Gagal melakukan pencarian' });
    }
  });
  
  // Endpoint untuk mengambil detail kata berdasarkan ID
  app.get('/api/jisho/word', async (req, res) => {
    try {
      const wordId = req.query.id;
      if (!wordId) {
        return res.status(400).json({ error: 'ID kata diperlukan' });
      }
  
      // Melakukan request ke halaman detail kata
      const response = await axios.get(`https://takoboto.jp/?w=${encodeURIComponent(wordId)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
  
      // Parse HTML untuk mendapatkan informasi detail kata
      const $ = cheerio.load(response.data);
      
      // Mengekstrak kata Jepang dari WordJapDiv
      const word = $('.WordJapDiv').first().text().trim();
      
      // Mengekstrak furigana (cara baca)
      let reading = '';
      // Mungkin perlu penyesuaian selector berdasarkan struktur HTML takoboto
      $('.furigana, .reading').each((i, el) => {
        reading += $(el).text().trim() + ' ';
      });
      reading = reading.trim();
      
      // Mengekstrak kelas kata (part of speech)
      const partOfSpeech = $('span[style="color:#8F8F8F"]').first().text().trim();
      
      // Mengekstrak arti kata
      const meanings = [];
      
      $('span[style="display:block;padding:10px"]').each((i, el) => {
        const langImg = $(el).find('img').first();
        let lang = 'other';
        
        // Menentukan bahasa berdasarkan gambar bendera
        if (langImg.length) {
          const imgSrc = langImg.attr('src');
          if (imgSrc.includes('en.png')) lang = 'en';
          else if (imgSrc.includes('id.png')) lang = 'id';
          // Tambahkan bahasa lain sesuai kebutuhan
        }
        
        // Mengekstrak teks arti
        const meaningSpan = $(el).find('span[style="font-size:17px;vertical-align:middle"]');
        let text = '';
        
        if (meaningSpan.length) {
          text = meaningSpan.text().trim();
        } else {
          // Fallback jika selector di atas tidak cocok
          text = $(el).text().trim().replace(/^\s*\S+\s*/, ''); // Hapus teks pertama (kemungkinan kode bahasa)
        }
        
        if (text) {
          meanings.push({
            lang,
            text
          });
        }
      });
      
      // Mengekstrak contoh kalimat (jika ada)
      const examples = [];
      
      // Selector untuk contoh kalimat perlu disesuaikan dengan struktur HTML takoboto
      $('.example-container').each((i, el) => {
        const japanese = $(el).find('.japanese-example').text().trim();
        const translation = $(el).find('.translation').text().trim();
        
        if (japanese) {
          examples.push({
            japanese,
            translation
          });
        }
      });
      
      // Mengembalikan data kata yang sudah diekstrak
      res.json({
        word: {
          id: wordId,
          word,
          reading,
          partOfSpeech,
          meanings,
          examples
        }
      });
      
    } catch (error) {
      console.error('Error saat mengambil detail kata:', error);
      res.status(500).json({ error: 'Gagal mengambil detail kata' });
    }
  });

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});