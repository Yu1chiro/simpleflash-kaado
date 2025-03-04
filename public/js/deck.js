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
  const playBlank = document.getElementById('playblank');
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

  // Back button
  backBtn.addEventListener('click', () => {
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
    audio.volume = 0.5; // Set volume ke 50%
    audio.play();
    
    window.location.href = '/dashboard';
  });
  
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