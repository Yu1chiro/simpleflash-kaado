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
  const deckTitleElement = document.getElementById('deckTitle');
  const deckDescriptionElement = document.getElementById('deckDescription');
  const cardCountElement = document.getElementById('cardCount');
  const newCardBtn = document.getElementById('newCardBtn');
  const emptyStateBtn = document.getElementById('emptyStateBtn');
  const emptyState = document.getElementById('emptyState');
  const cardList = document.getElementById('cardList');
  const cardModal = document.getElementById('cardModal');
  const cardModalTitle = document.getElementById('cardModalTitle');
  const cardFrontInput = document.getElementById('cardFront');
  const cardBackInput = document.getElementById('cardBack');
  const cardIdInput = document.getElementById('cardId');
  const cancelCardBtn = document.getElementById('cancelCardBtn');
  const saveCardBtn = document.getElementById('saveCardBtn');
  const playDeckBtn = document.getElementById('playDeckBtn');
  const playQuiz = document.getElementById('playquiz');
  const quizMemo = document.getElementById('quiz-memo');
  const playBlank = document.getElementById('playblank');
  const playMemory = document.getElementById('playmemory');
  const studyBtnNav = document.getElementById('studyBtnNav');
  const cardMemoInput = document.getElementById('cardMemo');
  
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
  // Ambil elemen textarea
const cardFront = document.getElementById('cardFront');
const cardBack = document.getElementById('cardBack');
const cardMemo = document.getElementById('cardMemo');

let enterCount = 0;

// Tambahkan event listener untuk textarea Front
cardFront.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Mencegah enter membuat baris baru
        cardBack.focus();
    }
});

// Tambahkan event listener untuk textarea Back
cardBack.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        cardMemo.focus();
    }
});

//   // Back button
//   backBtn.addEventListener('click', () => {
//     const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
//     audio.volume = 0.5; // Set volume ke 50%
//     audio.play();
    
//     window.location.href = '/dashboard';
//   });
  
  // Play deck button
  playDeckBtn.addEventListener('click', () => {
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
    audio.volume = 0.5; // Set volume ke 50%
    audio.play();
    
    window.location.href = `/flashcard/${deckId}`;
  });
  
  // Study button in navigation
  studyBtnNav.addEventListener('click', () => {
    window.location.href = `/flashcard/${deckId}`;
  });
  playQuiz.addEventListener('click', () => {
    window.location.href = `/quiz/${deckId}`;
  });
  playBlank.addEventListener('click', () => {
    window.location.href = `/quiz-blank/${deckId}`;
  });
  quizMemo.addEventListener('click', () => {
    window.location.href = `/quiz-memo/${deckId}`;
  });
  playMemory.addEventListener('click', () => {
    window.location.href = `/memory/${deckId}`;
  });
  
  // New card button
  newCardBtn.addEventListener('click', () => {
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
    audio.volume = 0.5; // Set volume ke 50%
    audio.play();
    
    openCardModal();
  });
  
  // Empty state button
  emptyStateBtn.addEventListener('click', () => {
    openCardModal();
  });
  
  // Cancel card button
  cancelCardBtn.addEventListener('click', () => {
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
    audio.volume = 0.5; // Set volume ke 50%
    audio.play();
    
    closeCardModal();
  });
  
  // Close modal when clicking outside
  cardModal.addEventListener('click', (e) => {
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
    audio.volume = 0.5; // Set volume ke 50%
    audio.play();
    
    if (e.target === cardModal) {
      closeCardModal();
    }
  });
  
  // Save card button
  saveCardBtn.addEventListener('click', () => {
    const audio = new Audio('/img/primary.wav');
    audio.volume = 0.5;
    audio.play();
    
    const user = auth.currentUser;
    
    if (!user) return;
    
    const front = cardFrontInput.value.trim();
    const back = cardBackInput.value.trim();
    const memo = cardMemoInput.value.trim();
    const cardId = cardIdInput.value;
    
    if (!front || !back) {
      alert('Please fill in both the front and back of the card');
      return;
    }
    
    if (cardId) {
      // Update existing card
      updateCard(user.uid, deckId, cardId, front, back, memo);
    } else {
      // Create new card
      createCard(user.uid, deckId, front, back, memo);
    }
  });
  
// move cards to another decks 
// Tambahkan fungsi berikut ke dalam file JavaScript Anda

// Pastikan SweetAlert sudah diimpor di HTML Anda
// <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

// Referensi ke tombol Pindahkan
const moveCardBtn = document.getElementById('move-card');

// Event listener untuk tombol Pindahkan
moveCardBtn.addEventListener('click', () => {
  const audio = new Audio('/img/primary.wav');
  audio.volume = 0.5;
  audio.play();
  
  openBackupCardModal();
});

// Buat modal untuk memilih deck tujuan dengan animasi
function openBackupCardModal() {
  // Periksa apakah pengguna sudah login
  const user = auth.currentUser;
  if (!user) return;
  
  // Buat elemen modal jika belum ada
  let backupModal = document.getElementById('backupCardModal');
  
  if (!backupModal) {
    // Buat modal baru jika belum ada
    backupModal = document.createElement('div');
    backupModal.id = 'backupCardModal';
    backupModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 opacity-0 transition-opacity duration-300 ease-in-out';
    
    backupModal.innerHTML = `
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-auto transform scale-95 transition-transform duration-300 ease-in-out">
        <h2 class="text-xl font-bold mb-4" id="backupModalTitle">Pindahkan ke Deck Lain</h2>
        <p class="mb-4">Pilih deck tujuan untuk menyalin semua kartu dari deck ini:</p>
        <select id="targetDeckSelect" class="w-full p-2 border border-gray-300 rounded mb-4">
          <option value="">Pilih Deck Tujuan</option>
        </select>
        <div class="flex justify-end space-x-2">
          <button id="cancelBackupBtn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
            Batal
          </button>
          <button id="confirmBackupBtn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Pindahkan
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(backupModal);
    
    // Tambahkan event listener untuk tombol di modal
    document.getElementById('cancelBackupBtn').addEventListener('click', () => {
      closeBackupCardModal();
    });
    
    document.getElementById('confirmBackupBtn').addEventListener('click', () => {
      const targetDeckId = document.getElementById('targetDeckSelect').value;
      if (targetDeckId) {
        backupCardsToOtherDeck(user.uid, deckId, targetDeckId);
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Pilih Deck',
          text: 'Silakan pilih deck tujuan terlebih dahulu',
          confirmButtonColor: '#3085d6'
        });
      }
    });
    
    // Tutup modal jika klik di luar modal
    backupModal.addEventListener('click', (e) => {
      if (e.target === backupModal) {
        closeBackupCardModal();
      }
    });
  }
  
  // Tampilkan modal dengan animasi
  backupModal.classList.remove('opacity-0');
  backupModal.classList.remove('hidden');
  
  // Animasi untuk konten modal
  setTimeout(() => {
    const modalContent = backupModal.querySelector('div');
    modalContent.classList.remove('scale-95');
    modalContent.classList.add('scale-100');
  }, 10);
  
  // Muat deck yang dimiliki pengguna (kecuali deck saat ini)
  loadUserDecks(user.uid);
}

// Fungsi untuk menutup modal Pindahkan dengan animasi
function closeBackupCardModal() {
  const backupModal = document.getElementById('backupCardModal');
  if (backupModal) {
    // Animasi fade out
    backupModal.classList.add('opacity-0');
    
    // Animasi untuk konten modal
    const modalContent = backupModal.querySelector('div');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    
    // Hapus modal setelah animasi selesai
    setTimeout(() => {
      backupModal.classList.add('hidden');
    }, 300);
  }
}

// Fungsi untuk memuat deck yang dimiliki pengguna
function loadUserDecks(userId) {
  const targetDeckSelect = document.getElementById('targetDeckSelect');
  targetDeckSelect.innerHTML = '<option value="">Pilih Deck Tujuan</option>';
  
  database.ref(`users/${userId}/decks`).once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((deckSnapshot) => {
          const deck = deckSnapshot.val();
          const id = deckSnapshot.key;
          
          // Jangan tampilkan deck saat ini di daftar
          if (id !== deckId) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = deck.title || 'Deck Tanpa Judul';
            targetDeckSelect.appendChild(option);
          }
        });
      }
    })
    .catch((error) => {
      console.error('Error loading decks:', error);
      Swal.fire({
        icon: 'error',
        title: 'Terjadi Kesalahan',
        text: 'Gagal memuat daftar deck',
        confirmButtonColor: '#3085d6'
      });
    });
}

// Fungsi untuk memPindahkan ke deck lain tanpa menghapus dari deck saat ini
function backupCardsToOtherDeck(userId, sourceDeckId, targetDeckId) {
  // Tampilkan konfirmasi dengan SweetAlert
  Swal.fire({
    text: 'Apakah anda ingin memindahkan cards ke deck lain?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Pindahkan',
    cancelButtonText: 'Batal'
  }).then((result) => {
    if (result.isConfirmed) {
      // Tampilkan loading
      Swal.fire({
        title: 'Memproses...',
        text: 'Sedang memindahkan....',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      // Dapatkan referensi ke kartu di deck sumber
      const sourceCardsRef = database.ref(`users/${userId}/decks/${sourceDeckId}/cards`);
      
      // Dapatkan semua kartu dari deck sumber
      sourceCardsRef.once('value')
        .then((snapshot) => {
          if (!snapshot.exists()) {
            Swal.fire({
              icon: 'info',
              title: 'Tidak Ada Kartu',
              text: 'Tidak ada kartu untuk di pindahkan silahkan buat cards anda',
              confirmButtonColor: '#3085d6'
            });
            closeBackupCardModal();
            return;
          }
          
          const cards = snapshot.val();
          const updates = {};
          
          // Persiapkan pembaruan untuk menyalin kartu
          Object.keys(cards).forEach((cardId) => {
            const card = cards[cardId];
            
            // Generate ID baru untuk kartu di deck tujuan
            const newCardKey = database.ref().child(`users/${userId}/decks/${targetDeckId}/cards`).push().key;
            
            // Buat objek kartu baru dengan ID baru
            const newCard = {
              ...card,
              id: newCardKey,
              created: firebase.database.ServerValue.TIMESTAMP
            };
            
            // Tambahkan kartu ke deck tujuan dengan ID baru
            updates[`users/${userId}/decks/${targetDeckId}/cards/${newCardKey}`] = newCard;
          });
          
          // Perbarui jumlah kartu di deck tujuan
          database.ref(`users/${userId}/decks/${targetDeckId}`).once('value')
            .then((targetDeckSnapshot) => {
              if (targetDeckSnapshot.exists()) {
                const targetDeck = targetDeckSnapshot.val();
                const targetCardCount = targetDeck.cardCount || 0;
                const backupCardCount = Object.keys(cards).length;
                
                // Perbarui jumlah kartu di deck tujuan
                updates[`users/${userId}/decks/${targetDeckId}/cardCount`] = targetCardCount + backupCardCount;
                
                // Lakukan pembaruan sekaligus
                return database.ref().update(updates);
              }
            })
            .then(() => {
                Swal.fire({
                  icon: 'success',
                  title: 'Berhasil!',
                  text: 'Silahkan cek deck anda',
                  confirmButtonColor: '#3085d6'
                }).then(() => {
                  // Arahkan ke route yang kamu tentukan
                  window.location.href = '/dashboard';
                });
                closeBackupCardModal();
              })              
            .catch((error) => {
              console.error('Error backing up cards:', error);
              Swal.fire({
                icon: 'error',
                title: 'Terjadi Kesalahan',
                text: 'Gagal memPindahkan. Silakan coba lagi.',
                confirmButtonColor: '#3085d6'
              });
            });
        })
        .catch((error) => {
          console.error('Error reading cards:', error);
          Swal.fire({
            icon: 'error',
            title: 'Terjadi Kesalahan',
            text: 'Gagal membaca kartu. Silakan coba lagi.',
            confirmButtonColor: '#3085d6'
          });
        });
    }
  });
}






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
        cardCountElement.textContent = deck.cardCount || 0;
        
        // Disable play button if no cards
        if (!deck.cardCount || deck.cardCount === 0) {
          playDeckBtn.disabled = true;
          playDeckBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
          playDeckBtn.disabled = false;
          playDeckBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      })
      .catch((error) => {
        console.error('Error loading deck:', error);
        alert('Failed to load deck information');
      });
  }
  
  // Load cards
  function loadCards(userId, deckId) {
    database.ref(`users/${userId}/decks/${deckId}/cards`).on('value', (snapshot) => {
      cardList.innerHTML = '';
      
      if (!snapshot.exists()) {
        // Show empty state
        emptyState.classList.remove('hidden');
        return;
      }
      
      // Hide empty state
      emptyState.classList.add('hidden');
      
      // Count cards
      let cardCount = 0;
      
      // Add each card to the list
      snapshot.forEach((cardSnapshot) => {
        const card = cardSnapshot.val();
        addCardToList(card);
        cardCount++;
      });
      
      // Update card count
      cardCountElement.textContent = cardCount;
      
      // Update deck card count
      database.ref(`users/${userId}/decks/${deckId}`).update({
        cardCount: cardCount
      });
      
      // Enable/disable play button
      if (cardCount === 0) {
        playDeckBtn.disabled = true;
        playDeckBtn.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        playDeckBtn.disabled = false;
        playDeckBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    });
  }
  
  // Add card to the list
  function addCardToList(card) {
    const cardElement = document.createElement('div');
    cardElement.className = 'bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition animate__animated animate__fadeIn';
    
    // Create memo HTML only if memo exists
    const memoHtml = card.memo ? `
      <h4 class="font-semibold text-gray-800 mb-2">Memo :</h4>
      <p class="text-gray-600 mb-4 italic">${card.memo}</p>
    ` : '';
    
    cardElement.innerHTML = `
      <div class="p-4">
        <h4 class="font-semibold text-gray-800 mb-2">Front :</h4>
        <p class="text-gray-700 mb-4">${card.front}</p>
        <h4 class="font-semibold text-gray-800 mb-2">Back :</h4>
        <p class="text-gray-700 mb-4">${card.back}</p>
        ${memoHtml}
        <div class="flex justify-end space-x-2">
          <button class="edit-card-btn text-blue-600 hover:text-blue-800" data-id="${card.id}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button class="delete-card-btn text-red-600 hover:text-red-800" data-id="${card.id}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    `;
    
    // Rest of the function stays the same
    cardList.appendChild(cardElement);
    
    // Add event listeners to the buttons
    cardElement.querySelector('.edit-card-btn').addEventListener('click', () => {
      const audio = new Audio('/img/primary.wav');
      audio.volume = 0.5;
      audio.play();
      
      openCardModal(card);
    });
    
    cardElement.querySelector('.delete-card-btn').addEventListener('click', () => {
      const audio = new Audio('/img/primary.wav');
      audio.volume = 0.5;
      audio.play();
      
      if (confirm('Are you sure you want to delete this card?')) {
        deleteCard(auth.currentUser.uid, deckId, card.id);
      }
    });
  }
  
  const profileBtn = document.getElementById('profileBtnNav');
  profileBtn.addEventListener('click', () => {
    window.location.href = '/user-info.html';
  });
  
  function openCardModal(card = null) {
    if (card) {
      // Edit existing card
      cardModalTitle.textContent = 'Edit Flashcard';
      cardFrontInput.value = card.front;
      cardBackInput.value = card.back;
      cardMemoInput.value = card.memo || '';
      cardIdInput.value = card.id;
    } else {
      // Create new card
      cardModalTitle.textContent = 'Create New Flashcard';
      cardFrontInput.value = '';
      cardBackInput.value = '';
      cardMemoInput.value = '';
      cardIdInput.value = '';
    }
    
    cardModal.classList.remove('hidden');
    cardFrontInput.focus();
  }
  function closeCardModal() {
    cardModal.classList.add('hidden');
    cardFrontInput.value = '';
    cardBackInput.value = '';
    cardMemoInput.value = '';
    cardIdInput.value = '';
  }
  function createCard(userId, deckId, front, back, memo) {
    // Generate a new card key
    const newCardKey = database.ref().child(`users/${userId}/decks/${deckId}/cards`).push().key;
    
    // Create the card object
    const cardData = {
      id: newCardKey,
      front: front,
      back: back,
      memo: memo || '',
      created: firebase.database.ServerValue.TIMESTAMP
    };
    
    // Save the card to the database
    database.ref(`users/${userId}/decks/${deckId}/cards/${newCardKey}`).set(cardData)
      .then(() => {
        closeCardModal();
      })
      .catch((error) => {
        console.error('Error creating card:', error);
        alert('Failed to create card. Please try again.');
      });
  }
  function updateCard(userId, deckId, cardId, front, back, memo) {
    // Update the card in the database
    database.ref(`users/${userId}/decks/${deckId}/cards/${cardId}`).update({
      front: front,
      back: back,
      memo: memo || '',
      updated: firebase.database.ServerValue.TIMESTAMP
    })
      .then(() => {
        closeCardModal();
      })
      .catch((error) => {
        console.error('Error updating card:', error);
        alert('Failed to update card. Please try again.');
      });
  }
  
  // Delete a card
  function deleteCard(userId, deckId, cardId) {
    // Delete the card from the database
    database.ref(`users/${userId}/decks/${deckId}/cards/${cardId}`).remove()
      .catch((error) => {
        console.error('Error deleting card:', error);
        alert('Failed to delete card. Please try again.');
      });
  }

//   Sharing & gett deck users
// Fungsi untuk tombol berbagi deck dan meminta deck

// Referensi ke tombol berbagi deck dan meminta deck
const sharingDeckBtn = document.getElementById('sharing-deck');
const mintaDeckBtn = document.getElementById('minta-deck');

// Event listener untuk tombol berbagi deck
sharingDeckBtn.addEventListener('click', () => {
  const audio = new Audio('/img/primary.wav');
  audio.volume = 0.5;
  audio.play();
  
  openSharingModal();
});

// Event listener untuk tombol meminta deck
mintaDeckBtn.addEventListener('click', () => {
  const audio = new Audio('/img/primary.wav');
  audio.volume = 0.5;
  audio.play();
  
  openRequestDeckModal();
});

// Fungsi untuk membuka modal berbagi deck
function openSharingModal() {
  // Periksa apakah pengguna sudah login
  const user = auth.currentUser;
  if (!user) return;
  
  // Buat modal berbagi deck
  let sharingModal = document.getElementById('sharingModal');
  
  if (!sharingModal) {
    sharingModal = document.createElement('div');
    sharingModal.id = 'sharingModal';
    sharingModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 opacity-0 transition-opacity duration-300 ease-in-out';
    
    sharingModal.innerHTML = `
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-auto transform scale-95 transition-transform duration-300 ease-in-out">
        <h2 class="text-xl font-bold mb-4">Bagikan Deck Anda</h2>
        <p class="mb-4">Berikan ID deck ini kepada teman Anda agar mereka dapat mengimpornya:</p>
        <div class="flex mb-4">
          <input type="text" id="deckShareId" class="flex-grow p-2 border border-gray-300 rounded-l" readonly value="${deckId}">
          <button id="copyDeckIdBtn" class="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700">
            Salin
          </button>
        </div>
        <div class="flex justify-end">
          <button id="closeSharingBtn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
            Tutup
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(sharingModal);
    
    // Event listener untuk tombol di modal
    document.getElementById('copyDeckIdBtn').addEventListener('click', () => {
      const deckShareId = document.getElementById('deckShareId');
      deckShareId.select();
      document.execCommand('copy');
      
      Swal.fire({
        icon: 'success',
        title: 'ID Deck Disalin',
        text: 'ID deck berhasil disalin ke clipboard',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    });
    
    document.getElementById('closeSharingBtn').addEventListener('click', () => {
      closeSharingModal();
    });
    
    // Tutup modal jika klik di luar modal
    sharingModal.addEventListener('click', (e) => {
      if (e.target === sharingModal) {
        closeSharingModal();
      }
    });
  }
  
  // Tampilkan modal dengan animasi
  sharingModal.classList.remove('opacity-0');
  sharingModal.classList.remove('hidden');
  
  // Animasi untuk konten modal
  setTimeout(() => {
    const modalContent = sharingModal.querySelector('div');
    modalContent.classList.remove('scale-95');
    modalContent.classList.add('scale-100');
  }, 10);
}

// Fungsi untuk menutup modal berbagi deck
function closeSharingModal() {
  const sharingModal = document.getElementById('sharingModal');
  if (sharingModal) {
    // Animasi fade out
    sharingModal.classList.add('opacity-0');
    
    // Animasi untuk konten modal
    const modalContent = sharingModal.querySelector('div');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    
    // Hapus modal setelah animasi selesai
    setTimeout(() => {
      sharingModal.classList.add('hidden');
    }, 300);
  }
}

// Fungsi untuk membuka modal meminta deck
function openRequestDeckModal() {
  // Periksa apakah pengguna sudah login
  const user = auth.currentUser;
  if (!user) return;
  
  // Buat modal meminta deck
  let requestModal = document.getElementById('requestDeckModal');
  
  if (!requestModal) {
    requestModal = document.createElement('div');
    requestModal.id = 'requestDeckModal';
    requestModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 opacity-0 transition-opacity duration-300 ease-in-out';
    
    requestModal.innerHTML = `
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-auto transform scale-95 transition-transform duration-300 ease-in-out">
        <h2 class="text-xl font-bold mb-4">Impor Deck</h2>
        <p class="mb-4">Masukkan ID deck yang ingin Anda impor:</p>
        <input type="text" id="requestDeckId" class="w-full p-2 border border-gray-300 rounded mb-4" placeholder="Masukkan ID deck">
        <div class="flex justify-end space-x-2">
          <button id="cancelRequestBtn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
            Batal
          </button>
          <button id="confirmRequestBtn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Impor Deck
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(requestModal);
    
    // Event listener untuk tombol di modal
    document.getElementById('cancelRequestBtn').addEventListener('click', () => {
      closeRequestDeckModal();
    });
    
    document.getElementById('confirmRequestBtn').addEventListener('click', () => {
      const requestDeckId = document.getElementById('requestDeckId').value.trim();
      if (requestDeckId) {
        importDeckById(user.uid, requestDeckId, deckId);
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'ID Deck Kosong',
          text: 'Silakan masukkan ID deck yang ingin diimpor',
          confirmButtonColor: '#3085d6'
        });
      }
    });
    
    // Tutup modal jika klik di luar modal
    requestModal.addEventListener('click', (e) => {
      if (e.target === requestModal) {
        closeRequestDeckModal();
      }
    });
  }
  
  // Tampilkan modal dengan animasi
  requestModal.classList.remove('opacity-0');
  requestModal.classList.remove('hidden');
  
  // Animasi untuk konten modal
  setTimeout(() => {
    const modalContent = requestModal.querySelector('div');
    modalContent.classList.remove('scale-95');
    modalContent.classList.add('scale-100');
    
    // Focus pada input field
    document.getElementById('requestDeckId').focus();
  }, 10);
}

// Fungsi untuk menutup modal meminta deck
function closeRequestDeckModal() {
  const requestModal = document.getElementById('requestDeckModal');
  if (requestModal) {
    // Animasi fade out
    requestModal.classList.add('opacity-0');
    
    // Animasi untuk konten modal
    const modalContent = requestModal.querySelector('div');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    
    // Hapus modal setelah animasi selesai
    setTimeout(() => {
      requestModal.classList.add('hidden');
    }, 300);
  }
}

// Fungsi untuk mengimpor deck berdasarkan ID
function importDeckById(userId, sourceDeckId, targetDeckId) {
  // Tampilkan loading
  Swal.fire({
    title: 'Memproses...',
    text: 'Sedang mengimpor deck',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
  
  // Cari pemilik deck sumber (semua pengguna)
  database.ref('users').once('value')
    .then((usersSnapshot) => {
      let foundDeck = false;
      let sourceUserId = null;
      let sourceDeckData = null;
      
      // Iterasi melalui semua pengguna
      usersSnapshot.forEach((userSnapshot) => {
        const uid = userSnapshot.key;
        const userData = userSnapshot.val();
        
        // Periksa apakah pengguna memiliki deck yang dicari
        if (userData.decks && userData.decks[sourceDeckId]) {
          foundDeck = true;
          sourceUserId = uid;
          sourceDeckData = userData.decks[sourceDeckId];
          return true; // Hentikan iterasi forEach
        }
      });
      
      if (!foundDeck) {
        throw new Error('Deck tidak ditemukan');
      }
      
      // Dapatkan kartu dari deck sumber
      return database.ref(`users/${sourceUserId}/decks/${sourceDeckId}/cards`).once('value');
    })
    .then((cardsSnapshot) => {
      if (!cardsSnapshot.exists()) {
        throw new Error('Tidak ada kartu dalam deck tersebut');
      }
      
      const cards = cardsSnapshot.val();
      const updates = {};
      
      // Persiapkan pembaruan untuk mengimpor kartu
      Object.keys(cards).forEach((cardId) => {
        const card = cards[cardId];
        
        // Generate ID baru untuk kartu di deck tujuan
        const newCardKey = database.ref().child(`users/${userId}/decks/${targetDeckId}/cards`).push().key;
        
        // Buat objek kartu baru dengan ID baru
        const newCard = {
          ...card,
          id: newCardKey,
          created: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Tambahkan kartu ke deck tujuan dengan ID baru
        updates[`users/${userId}/decks/${targetDeckId}/cards/${newCardKey}`] = newCard;
      });
      
      // Perbarui jumlah kartu di deck tujuan
      return database.ref(`users/${userId}/decks/${targetDeckId}`).once('value')
        .then((targetDeckSnapshot) => {
          if (targetDeckSnapshot.exists()) {
            const targetDeck = targetDeckSnapshot.val();
            const targetCardCount = targetDeck.cardCount || 0;
            const importCardCount = Object.keys(cards).length;
            
            // Perbarui jumlah kartu di deck tujuan
            updates[`users/${userId}/decks/${targetDeckId}/cardCount`] = targetCardCount + importCardCount;
            
            // Lakukan pembaruan sekaligus
            return database.ref().update(updates);
          }
        });
    })
    .then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Deck berhasil diimpor ke deck Anda',
        confirmButtonColor: '#3085d6'
      });
      closeRequestDeckModal();
    })
    .catch((error) => {
      console.error('Error importing deck:', error);
      Swal.fire({
        icon: 'error',
        title: 'Terjadi Kesalahan',
        text: error.message || 'Gagal mengimpor deck. Silakan coba lagi.',
        confirmButtonColor: '#3085d6'
      });
    });
}