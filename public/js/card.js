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
const memo = document.getElementById('memo');

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
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();

    window.location.href = `/deck/${deckId}`;
});

editDeckBtn.addEventListener('click', () => {
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();

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
    memo.textContent = currentCard.memo;
    
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
    const flipSound = new Audio('/img/swipe.mp3');
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
  
  // Variabel untuk melacak kartu yang telah ditampilkan
  let displayedCards = new Set();
  
  // Fungsi untuk mengkategorikan kartu berdasarkan kesulitan
  function categorizeCards() {
    // Reset kategori
    cardCategories = {
      easy: [],
      medium: [],
      hard: []
    };
  
    // Kategorikan kartu berdasarkan kompleksitas kanji (panjang teks)
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
  
    // Logika baru: jika pengguna menilai kartu saat ini sebagai:
    // - "easy" -> tampilkan kartu dari kategori "medium" (3-4 karakter)
    // - "medium" -> tampilkan kartu dari kategori "easy" (1-2 karakter)
    // - "hard" -> tampilkan kartu dari kategori "easy" (1-2 karakter)
    switch(currentDifficultyRating) {
      case "easy":
        targetCategory = "medium"; // Jika mudah, tampilkan kartu 3-4 karakter
        break;
      case "medium":
      case "hard":
        targetCategory = "easy"; // Jika sedang atau sulit, tampilkan kartu 1-2 karakter
        break;
      default:
        targetCategory = "medium";
    }
  
    // Tandai kartu saat ini sebagai sudah ditampilkan
    const currentCard = cards[currentCardIndex];
    displayedCards.add(currentCard.front);
  
    // Cek apakah semua kartu sudah ditampilkan
    const allCardsDisplayed = cards.every(card => displayedCards.has(card.front));
    
    // Jika semua kartu sudah ditampilkan, tapi masih ada kartu yang tersisa untuk diputar
    if (allCardsDisplayed && currentCardIndex < cards.length - 1) {
      // Tampilkan kartu berikutnya secara berurutan
      currentCardIndex++;
      return true;
    }
    
    // Jika semua kartu sudah ditampilkan dan ini adalah kartu terakhir
    if (allCardsDisplayed && currentCardIndex >= cards.length - 1) {
      // Kembali false agar sistem menampilkan completed state
      return false;
    }
  
    return findAndShowCardFromCategory(targetCategory);
  }
  
  // Fungsi untuk mencari dan menampilkan kartu dari kategori tertentu
  function findAndShowCardFromCategory(categoryName) {
    const category = cardCategories[categoryName];
  
    // Jika kategori kosong, coba pilih dari kategori lain
    if (!category || category.length === 0) {
      console.warn(`Tidak ada kartu dalam kategori: ${categoryName}, mencoba kategori lain`);
      
      // Coba kategori lain secara berurutan
      for (const altCategory of ["easy", "medium", "hard"]) {
        if (cardCategories[altCategory].length > 0) {
          return findCardNotYetDisplayed(cardCategories[altCategory]);
        }
      }
      
      // Jika masih tidak menemukan, cari kartu yang belum ditampilkan dari semua kartu
      return findNextUnseenCard();
    }
  
    return findCardNotYetDisplayed(category);
  }
  
  // Fungsi untuk mencari kartu yang belum ditampilkan dari kategori tertentu
  function findCardNotYetDisplayed(categoryCards) {
    // Cari kartu yang belum ditampilkan dari kategori ini
    const unseenCards = categoryCards.filter(card => !displayedCards.has(card.front));
    
    if (unseenCards.length > 0) {
      // Pilih kartu acak dari yang belum ditampilkan
      const randomCard = unseenCards[Math.floor(Math.random() * unseenCards.length)];
      const nextCardIndex = cards.findIndex(card => card.front === randomCard.front);
      
      if (nextCardIndex !== -1) {
        currentCardIndex = nextCardIndex;
        return true;
      }
    }
    
    // Jika semua kartu dalam kategori sudah ditampilkan, cari dari kategori lain
    return findNextUnseenCard();
  }
  
  // Fungsi untuk mencari kartu berikutnya yang belum ditampilkan dari semua kartu
  function findNextUnseenCard() {
    // Cari kartu yang belum ditampilkan dari semua kartu
    const unseenCards = cards.filter(card => !displayedCards.has(card.front));
    
    if (unseenCards.length > 0) {
      // Pilih kartu acak dari yang belum ditampilkan
      const randomCard = unseenCards[Math.floor(Math.random() * unseenCards.length)];
      const nextCardIndex = cards.findIndex(card => card.front === randomCard.front);
      
      if (nextCardIndex !== -1) {
        currentCardIndex = nextCardIndex;
        return true;
      }
    }
    
    // Jika semua kartu sudah ditampilkan, cek apakah masih ada kartu di dek
    if (currentCardIndex < cards.length - 1) {
      // Masih ada kartu yang tersisa, tampilkan berikutnya secara berurutan
      currentCardIndex++;
      return true;
    }
    
    // Tidak ada kartu lagi, tampilkan completed state
    return false;
  }
  
  // Modifikasi event listener tombol Next untuk menampilkan modal
  nextCardBtn.addEventListener('click', (e) => {
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();

    // Pastikan kartu telah dikategorikan saat awal
    if (Object.values(cardCategories).every(arr => arr.length === 0)) {
      categorizeCards();
    }
  
    // Jika bukan kartu terakhir atau masih ada kartu yang belum ditampilkan
    if (currentCardIndex < cards.length - 1 || displayedCards.size < cards.length) {
      e.stopPropagation(); // Mencegah perilaku default
      
      // Tampilkan modal dengan animasi
      difficultyModal.classList.remove('hidden');
      const modalContent = difficultyModal.querySelector('div:nth-child(2)');
      gsap.fromTo(modalContent, 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
      );
    } else {
      // Jika kartu terakhir dan semua kartu sudah ditampilkan, tampilkan status selesai
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
        const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
        audio.play();
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
            // Jika gagal menemukan kartu, tampilkan status selesai
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
        if (currentCardIndex < cards.length - 1) {
          currentCardIndex++;
          updateCardDisplay();
        } else {
          // Jika ini kartu terakhir, tampilkan status selesai
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
      }
    });
  });
  
  // Perbaikan untuk fungsi shuffle - mengacak kartu dengan algoritma Fisher-Yates
  shuffleBtn.addEventListener('click', () => {
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();

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
        
        // Reset pelacakan kartu yang sudah ditampilkan
        displayedCards = new Set();
        
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
  
  // Reset button with animation
  resetBtn.addEventListener('click', () => {
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();

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
        
        // Reset pelacakan kartu yang sudah ditampilkan
        displayedCards = new Set();
        
        updateCardDisplay();
        
        // Kategorikan kartu lagi setelah reset
        categorizeCards();
        
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
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();

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
        
        // Reset pelacakan kartu yang sudah ditampilkan
        displayedCards = new Set();
        
        updateCardDisplay();
        
        // Kategorikan kartu lagi
        categorizeCards();
        
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
// Previous card button
prevCardBtn.addEventListener('click', () => {
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();

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
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();

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
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();

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
