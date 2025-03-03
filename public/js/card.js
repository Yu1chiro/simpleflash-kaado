// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDnotXzrFZPyZSPfy7nVcFTq72Kr2mCn4c",
    authDomain: "flashcards-project-73131.firebaseapp.com",
    projectId: "flashcards-project-73131",
    storageBucket: "flashcards-project-73131.firebasestorage.app",
    messagingSenderId: "326762118238",
    appId: "1:326762118238:web:afd8037256085c35e108cf",
    measurementId: "G-2CMLSN7KPW"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Reference to auth and database
const auth = firebase.auth();
const database = firebase.database();

// Get deck ID from URL
const deckId = window.location.pathname.split('/').pop();

// DOM Elements
const backBtn = document.getElementById('backBtn');
const editDeckBtn = document.getElementById('editDeckBtn');
const deckTitleElement = document.getElementById('deckTitle');
const deckDescriptionElement = document.getElementById('deckDescription');
const progressTextElement = document.getElementById('progressText');
const progressBarElement = document.getElementById('progressBar');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const emptyStateBtn = document.getElementById('emptyStateBtn');
const flashcardContainer = document.getElementById('flashcardContainer');
const cardFront = document.getElementById('cardFront');
const cardBack = document.getElementById('cardBack');
const prevCardBtn = document.getElementById('prevCardBtn');
const nextCardBtn = document.getElementById('nextCardBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const resetBtn = document.getElementById('resetBtn');
const completedState = document.getElementById('completedState');
const restartBtn = document.getElementById('restartBtn');
const backToDeckBtn = document.getElementById('backToDeckBtn');

// Variables for tracking cards
let cards = [];
let originalCards = [];
let currentCardIndex = 0;

// Check authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        // Load deck information
        loadDeckInfo(user.uid, deckId);
        // Load cards
        loadCards(user.uid, deckId);
    } else {
        // User is signed out, redirect to login
        window.location.href = '/';
    }
});

// Back button and Edit button
backBtn.addEventListener('click', () => {
    window.location.href = `/deck/${deckId}`;
});

editDeckBtn.addEventListener('click', () => {
    window.location.href = `/deck/${deckId}`;
});

// Empty state button
emptyStateBtn.addEventListener('click', () => {
    window.location.href = `/deck/${deckId}`;
});

// Back to deck button from completed state
backToDeckBtn.addEventListener('click', () => {
    window.location.href = `/deck/${deckId}`;
});

// Load deck information
function loadDeckInfo(userId, deckId) {
    database.ref(`users/${userId}/decks/${deckId}`).once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                alert('Deck not found');
                window.location.href = '/dashboard';
                return;
            }
            
            const deck = snapshot.val();
            deckTitleElement.textContent = deck.title;
            deckDescriptionElement.textContent = deck.description || 'No description';
        })
        .catch((error) => {
            console.error('Error loading deck:', error);
            alert('Failed to load deck information');
        });
}

// Load cards
function loadCards(userId, deckId) {
    database.ref(`users/${userId}/decks/${deckId}/cards`).once('value')
        .then((snapshot) => {
            // Hide loading state
            loadingState.classList.add('hidden');
            
            if (!snapshot.exists() || snapshot.numChildren() === 0) {
                // Show empty state
                emptyState.classList.remove('hidden');
                return;
            }
            
            // Clear cards array
            cards = [];
            
            // Add each card to the array
            snapshot.forEach((cardSnapshot) => {
                const card = cardSnapshot.val();
                cards.push(card);
            });
            
            // Save original order
            originalCards = [...cards];
            
            // Show flashcard container
            flashcardContainer.classList.remove('hidden');
            
            // Show the first card with animation
            currentCardIndex = 0;
            updateCardDisplay();
            
            // Initial animation for the card
            animateCardEntrance();
        })
        .catch((error) => {
            console.error('Error loading cards:', error);
            alert('Failed to load flashcards');
        });
}

// Update the display of the current card
function updateCardDisplay() {
    if (cards.length === 0) {
        return;
    }
    
    // Remove flipped class to show front side
    document.querySelector('.flip-card-inner').classList.remove('flipped');
    
    // Get the current card
    const currentCard = cards[currentCardIndex];
    
    // Update the card content
    cardFront.textContent = currentCard.front;
    cardBack.textContent = currentCard.back;
    
    // Update progress text
    progressTextElement.textContent = `Card ${currentCardIndex + 1}/${cards.length}`;
    
    // Update progress bar
    const progressPercentage = ((currentCardIndex + 1) / cards.length) * 100;
    progressBarElement.style.width = `${progressPercentage}%`;
    
    // Animate progress bar
    gsap.to(progressBarElement, {
        width: `${progressPercentage}%`,
        duration: 0.5,
        ease: "power2.out"
    });
    
    // Disable previous button if at the first card
    prevCardBtn.disabled = currentCardIndex === 0;
    prevCardBtn.classList.toggle('opacity-50', currentCardIndex === 0);
    prevCardBtn.classList.toggle('cursor-not-allowed', currentCardIndex === 0);
}

// Animation for card entrance
function animateCardEntrance() {
    const card = document.querySelector('.perspective-card');
    gsap.fromTo(card, 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
    );
}

// Flip card on click
document.querySelector('.perspective-card').addEventListener('click', () => {
    const cardInner = document.querySelector('.flip-card-inner');
    cardInner.classList.toggle('flipped');
    
    // Add sound effect for flip
    const flipSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-light-card-flip-1995.mp3');
    flipSound.volume = 0.5;
    flipSound.play().catch(e => console.log('Audio play failed:', e));
});

// Next card button
// Variabel untuk menyimpan kategori kartu berdasarkan tingkat kesulitan
let cardCategories = {
easy: [],
medium: [],
hard: []
};

// Fungsi untuk mengkategorikan kartu berdasarkan kesulitan
function categorizeCards() {
// Reset kategori
cardCategories = {
  easy: [],
  medium: [],
  hard: []
};

// Kategorikan kartu berdasarkan kompleksitas kanji
// Implementasi sederhana: kita bisa menggunakan panjang teks front sebagai indikator kesulitan
cards.forEach(card => {
  // Dapatkan panjang teks kanji di bagian depan kartu
  const kanjiLength = card.front.length;
  
  if (kanjiLength <= 2) {
      // Kanji pendek (1-2 karakter) dianggap mudah
      cardCategories.easy.push(card);
  } else if (kanjiLength <= 4) {
      // Kanji menengah (3-4 karakter) dianggap sedang
      cardCategories.medium.push(card);
  } else {
      // Kanji panjang (5+ karakter) dianggap sulit
      cardCategories.hard.push(card);
  }
});

// Pastikan setiap kategori memiliki setidaknya satu kartu
// Jika kategori kosong, tambahkan kartu dari kategori lain
if (cardCategories.easy.length === 0 && cards.length > 0) {
  cardCategories.easy = [cards[0]];
}
if (cardCategories.medium.length === 0 && cards.length > 0) {
  cardCategories.medium = cardCategories.easy.length > 0 ? [cardCategories.easy[0]] : [cards[0]];
}
if (cardCategories.hard.length === 0 && cards.length > 0) {
  cardCategories.hard = cardCategories.medium.length > 0 ? [cardCategories.medium[0]] : [cards[0]];
}

console.log("Kartu telah dikategorikan:", {
  easy: cardCategories.easy.length,
  medium: cardCategories.medium.length,
  hard: cardCategories.hard.length
});
}

// Modal untuk penilaian kesulitan kartu saat ini
const difficultyModal = document.createElement('div');
difficultyModal.className = 'fixed inset-0 z-50 flex items-center justify-center hidden';
difficultyModal.innerHTML = `
<div class="absolute inset-0 bg-black bg-opacity-50"></div>
<div class="relative bg-white rounded-lg shadow-xl p-6 mx-4 max-w-md w-full">
  <h3 class="text-lg font-semibold mb-4">Seberapa Mudah Kartu Ini?</h3>
  <p class="text-gray-600 mb-6">Pilih tingkat kesulitan kartu yang baru saja Anda pelajari:</p>
  <div class="grid grid-cols-3 gap-4">
      <button class="difficulty-btn bg-green-100 hover:bg-green-200 text-green-800 font-medium py-3 px-4 rounded-lg transition" data-level="easy">
          Mudah
      </button>
      <button class="difficulty-btn bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium py-3 px-4 rounded-lg transition" data-level="medium">
          Sedang
      </button>
      <button class="difficulty-btn bg-red-100 hover:bg-red-200 text-red-800 font-medium py-3 px-4 rounded-lg transition" data-level="hard">
          Sulit
      </button>
  </div>
</div>
`;
document.body.appendChild(difficultyModal);

// Fungsi untuk menampilkan kartu berikutnya berdasarkan tingkat kesulitan yang dipilih
function showNextCardBasedOnRating(currentDifficultyRating) {
let targetCategory;

// Logika: jika pengguna menilai kartu sebagai "mudah", tampilkan kartu yang lebih sulit
// jika "sedang", tetap pada tingkat yang sama
// jika "sulit", tampilkan kartu yang lebih mudah
switch(currentDifficultyRating) {
  case "easy":
      // Jika pengguna menilai kartu saat ini sebagai mudah, tampilkan kartu dari kategori sulit
      targetCategory = "hard";
      break;
  case "medium":
      // Jika pengguna menilai sebagai sedang, tampilkan kartu dari kategori sedang
      targetCategory = "medium";
      break;
  case "hard":
      // Jika pengguna menilai sebagai sulit, tampilkan kartu dari kategori mudah
      targetCategory = "easy";
      break;
  default:
      targetCategory = "medium";
}

const category = cardCategories[targetCategory];

if (!category || category.length === 0) {
  console.warn(`Tidak ada kartu dalam kategori: ${targetCategory}, mencoba kategori lain`);
  // Jika kategori target kosong, coba pilih dari kategori lain
  if (cardCategories.medium.length > 0) {
      return findAndShowCardFromCategory("medium");
  } else if (cardCategories.easy.length > 0) {
      return findAndShowCardFromCategory("easy");
  } else if (cardCategories.hard.length > 0) {
      return findAndShowCardFromCategory("hard");
  } else {
      return false;
  }
}

return findAndShowCardFromCategory(targetCategory);
}

// Fungsi untuk mencari dan menampilkan kartu dari kategori tertentu
function findAndShowCardFromCategory(categoryName) {
const category = cardCategories[categoryName];

if (!category || category.length === 0) {
  return false;
}

// Pilih kartu acak dari kategori
const randomIndex = Math.floor(Math.random() * category.length);
const selectedCard = category[randomIndex];

// Cari indeks kartu dalam array utama
const nextCardIndex = cards.findIndex(card => card === selectedCard);

if (nextCardIndex !== -1 && nextCardIndex !== currentCardIndex) {
  // Jika menemukan kartu berbeda, tampilkan
  currentCardIndex = nextCardIndex;
  return true;
} else {
  // Jika hanya ada satu kartu atau tidak menemukan yang berbeda
  // Cari kartu lain yang belum ditampilkan
  if (category.length > 1) {
      for (let i = 0; i < category.length; i++) {
          if (i !== randomIndex) {
              const alternateCard = category[i];
              const alternateIndex = cards.findIndex(card => card === alternateCard);
              if (alternateIndex !== -1 && alternateIndex !== currentCardIndex) {
                  currentCardIndex = alternateIndex;
                  return true;
              }
          }
      }
  }
  
  // Jika masih tidak menemukan yang cocok, tampilkan kartu berikutnya secara berurutan
  currentCardIndex = (currentCardIndex + 1) % cards.length;
  return true;
}
}

// Modifikasi event listener tombol Next untuk menampilkan modal
nextCardBtn.addEventListener('click', (e) => {
// Jika bukan kartu terakhir, tampilkan modal penilaian kesulitan
if (currentCardIndex < cards.length - 1) {
  e.stopPropagation(); // Mencegah perilaku default
  
  // Pastikan kartu telah dikategorikan
  if (Object.values(cardCategories).every(arr => arr.length === 0)) {
      categorizeCards();
  }
  
  // Tampilkan modal dengan animasi
  difficultyModal.classList.remove('hidden');
  const modalContent = difficultyModal.querySelector('div:nth-child(2)');
  gsap.fromTo(modalContent, 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
  );
} else {
  // Jika kartu terakhir, tampilkan status selesai (perilaku asli)
  flashcardContainer.style.opacity = 1;
  gsap.to(flashcardContainer, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
          flashcardContainer.classList.add('hidden');
          completedState.classList.remove('hidden');
          completedState.style.opacity = 0;
          
          gsap.to(completedState, {
              opacity: 1,
              y: [20, 0],
              duration: 0.5,
              ease: "back.out(1.7)"
          });
      }
  });
}
});

// Tangani klik tombol kesulitan
document.querySelectorAll('.difficulty-btn').forEach(btn => {
btn.addEventListener('click', () => {
  const difficultyRating = btn.getAttribute('data-level');
  const success = showNextCardBasedOnRating(difficultyRating);
  
  // Sembunyikan modal dengan animasi
  const modalContent = difficultyModal.querySelector('div:nth-child(2)');
  gsap.to(modalContent, {
      y: 20, 
      opacity: 0, 
      duration: 0.3,
      onComplete: () => {
          difficultyModal.classList.add('hidden');
          
          if (success) {
              // Siapkan transisi
              const card = document.querySelector('.perspective-card');
              
              // Animasi kartu keluar
              gsap.to(card, {
                  x: -100,
                  opacity: 0,
                  duration: 0.3,
                  ease: "power2.in",
                  onComplete: () => {
                      updateCardDisplay();
                      
                      // Reset posisi untuk masuk
                      gsap.set(card, { x: 100, opacity: 0 });
                      
                      // Animasi masuk dari kanan
                      gsap.to(card, {
                          x: 0,
                          opacity: 1,
                          duration: 0.3,
                          ease: "power2.out"
                      });
                  }
              });
          } else {
              // Jika gagal menemukan kartu, lanjutkan ke kartu berikutnya secara default
              currentCardIndex = Math.min(currentCardIndex + 1, cards.length - 1);
              updateCardDisplay();
          }
      }
  });
});
});

// Tutup modal saat mengklik luar
difficultyModal.querySelector('.absolute').addEventListener('click', () => {
const modalContent = difficultyModal.querySelector('div:nth-child(2)');
gsap.to(modalContent, {
  y: 20, 
  opacity: 0, 
  duration: 0.3,
  onComplete: () => {
      difficultyModal.classList.add('hidden');
      
      // Tampilkan kartu berikutnya secara berurutan jika pengguna membatalkan pilihan
      currentCardIndex = Math.min(currentCardIndex + 1, cards.length - 1);
      updateCardDisplay();
  }
});
});

// Perbaikan untuk fungsi shuffle - mengacak kartu dengan algoritma Fisher-Yates
shuffleBtn.addEventListener('click', () => {
// Siapkan animasi acak
const card = document.querySelector('.perspective-card');

gsap.to(card, {
  y: -20,
  opacity: 0,
  scale: 0.9,
  duration: 0.3,
  ease: "power2.in",
  onComplete: () => {
      // Algoritma Fisher-Yates untuk pengacakan menyeluruh
      for (let i = cards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cards[i], cards[j]] = [cards[j], cards[i]];
      }
      
      // Kembali ke kartu pertama
      currentCardIndex = 0;
      updateCardDisplay();
      
      // Kategorikan kartu lagi setelah pengacakan
      categorizeCards();
      
      // Animasi kartu masuk setelah pengacakan
      gsap.to(card, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "bounce.out"
      });
  }
});
});

// Previous card button
prevCardBtn.addEventListener('click', () => {
    if (currentCardIndex > 0) {
        // Prepare for transition
        const card = document.querySelector('.perspective-card');
        
        // Animate card exit
        gsap.to(card, {
            x: 100,
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
                currentCardIndex--;
                updateCardDisplay();
                
                // Reset position for entrance
                gsap.set(card, { x: -100, opacity: 0 });
                
                // Animate entrance from left
                gsap.to(card, {
                    x: 0,
                    opacity: 1,
                    duration: 0.3,
                    ease: "power2.out"
                });
            }
        });
    }
});

// Shuffle button with animation

// Reset button with animation
resetBtn.addEventListener('click', () => {
    // Prepare for reset animation
    const card = document.querySelector('.perspective-card');
    
    gsap.to(card, {
        y: -20,
        opacity: 0,
        scale: 0.9,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
            // Restore original order
            cards = [...originalCards];
            
            // Reset to the first card
            currentCardIndex = 0;
            updateCardDisplay();
            
            // Animate card entrance after reset
            gsap.to(card, {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.5,
                ease: "elastic.out(1, 0.5)"
            });
        }
    });
});

// Restart button
restartBtn.addEventListener('click', () => {
    // Prepare for transition
    completedState.style.opacity = 1;
    
    // Animate transition
    gsap.to(completedState, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        onComplete: () => {
            // Hide completed state
            completedState.classList.add('hidden');
            
            // Show flashcard container
            flashcardContainer.classList.remove('hidden');
            flashcardContainer.style.opacity = 0;
            
            // Reset to the first card
            currentCardIndex = 0;
            updateCardDisplay();
            
            // Animate flashcard container entrance
            gsap.to(flashcardContainer, {
                opacity: 1,
                duration: 0.5
            });
            
            // Also animate the card
            animateCardEntrance();
        }
    });
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (flashcardContainer.classList.contains('hidden')) {
        return;
    }
    
    if (e.key === 'ArrowRight') {
        // Next card
        nextCardBtn.click();
    } else if (e.key === 'ArrowLeft') {
        // Previous card
        if (!prevCardBtn.disabled) {
            prevCardBtn.click();
        }
    } else if (e.key === ' ' || e.key === 'Enter') {
        // Flip card
        document.querySelector('.flip-card-inner').classList.toggle('flipped');
        e.preventDefault();
    }
});
