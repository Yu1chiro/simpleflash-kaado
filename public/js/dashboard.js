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

// DOM Elements
const userNameElement = document.getElementById('userName');
const userPhotoElement = document.getElementById('userPhoto');
const logoutBtn = document.getElementById('logoutBtn');
const newDeckBtn = document.getElementById('newDeckBtn');
const newDeckModal = document.getElementById('newDeckModal');
const cancelDeckBtn = document.getElementById('cancelDeckBtn');
const saveDeckBtn = document.getElementById('saveDeckBtn');
const deckTitleInput = document.getElementById('deckTitle');
const deckDescriptionInput = document.getElementById('deckDescription');
const deckListElement = document.getElementById('deckList');
const studyIcon = document.getElementById('studyBtn');
const jisho = document.getElementById('jisho');
const profileBtn = document.getElementById('profileBtn');
// Tambahkan di bagian DOM Elements
const editDeckModal = document.getElementById('editDeckModal');
const editDeckTitleInput = document.getElementById('editDeckTitle');
const editDeckDescriptionInput = document.getElementById('editDeckDescription');
const cancelEditDeckBtn = document.getElementById('cancelEditDeckBtn');
const saveEditDeckBtn = document.getElementById('saveEditDeckBtn');

// Variabel untuk melacak apakah data sudah di-load
let decksLoaded = false;

// Check authentication state
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    userNameElement.textContent = user.displayName || 'User';
    userPhotoElement.src = user.photoURL || 'https://api.dicebear.com/6.x/initials/svg?seed=' + user.displayName;
    
    // Load user's decks
    loadDecks(user.uid);
  } else {
    // User is signed out, redirect to login
    window.location.href = '/';
  }
});

// Logout function
logoutBtn.addEventListener('click', () => {
  auth.signOut()
    .then(() => {
        const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();
      window.location.href = '/';
    })
    .catch((error) => {
      console.error('Error signing out:', error);
    });
});

// Show new deck modal
newDeckBtn.addEventListener('click', () => {
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();

  newDeckModal.classList.remove('hidden');
  deckTitleInput.focus();
});

// Hide new deck modal
cancelDeckBtn.addEventListener('click', () => {
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();

  newDeckModal.classList.add('hidden');
  clearDeckForm();
});

// Close modal when clicking outside
newDeckModal.addEventListener('click', (e) => {
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();

  if (e.target === newDeckModal) {
    newDeckModal.classList.add('hidden');
    clearDeckForm();
  }
});

// Save new deck
saveDeckBtn.addEventListener('click', () => {
  const user = auth.currentUser;
  const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();

  if (!user) return;
  
  const title = deckTitleInput.value.trim();
  const description = deckDescriptionInput.value.trim();
  
  if (!title) {
    alert('Please enter a deck title');
    return;
  }
  
  // Generate a new deck key
  const newDeckKey = database.ref().child(`users/${user.uid}/decks`).push().key;
  
  // Create the deck object
  const deckData = {
    id: newDeckKey,
    title: title,
    description: description,
    created: firebase.database.ServerValue.TIMESTAMP,
    cardCount: 0
  };
  
  // Save the deck to the database
  database.ref(`users/${user.uid}/decks/${newDeckKey}`).set(deckData)
    .then(() => {
      newDeckModal.classList.add('hidden');
      clearDeckForm();
      // Tidak perlu menambahkan deck secara manual atau me-refresh halaman
      // karena 'value' listener di loadDecks() akan menanganinya
    })
    .catch((error) => {
      console.error('Error creating deck:', error);
      alert('Failed to create deck. Please try again.');
    });
});

// Clear deck form
function clearDeckForm() {
  deckTitleInput.value = '';
  deckDescriptionInput.value = '';
}

// Load user's decks

// Fungsi untuk menampilkan modal edit
function showEditDeckModal(deck) {
    const audio = new Audio('/img/primary.wav');
    audio.volume = 0.5;
    audio.play();
  
    editDeckTitleInput.value = deck.title;
    editDeckDescriptionInput.value = deck.description || '';
    editDeckModal.classList.remove('hidden');
    editDeckModal.dataset.deckId = deck.id;
  }
  
  // Fungsi untuk menyimpan perubahan deck
  function saveEditDeck() {
    const user = auth.currentUser;
    const deckId = editDeckModal.dataset.deckId;
    
    const newTitle = editDeckTitleInput.value.trim();
    const newDescription = editDeckDescriptionInput.value.trim();
    
    if (!newTitle) {
      alert('Please enter a deck title');
      return;
    }
    
    database.ref(`users/${user.uid}/decks/${deckId}`).update({
      title: newTitle,
      description: newDescription
    })
    .then(() => {
      editDeckModal.classList.add('hidden');
      showAlert('success');
    })
    .catch((error) => {
      console.error('Error updating deck:', error);
      showAlert('error');
    });
  }
  
  // Tambahkan event listener untuk tombol edit pada setiap deck
  function addEditButtonListeners() {
    document.querySelectorAll('.edit-deck-btn').forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        const deckId = this.getAttribute('data-id');
        
        // Ambil data deck dari Firebase
        const user = auth.currentUser;
        database.ref(`users/${user.uid}/decks/${deckId}`).once('value')
          .then((snapshot) => {
            const deck = snapshot.val();
            showEditDeckModal(deck);
          })
          .catch((error) => {
            console.error('Error fetching deck data:', error);
            showAlert('error');
          });
      });
    });
  }
  
  // Tambahkan event listener untuk modal edit
  cancelEditDeckBtn.addEventListener('click', () => {
    const audio = new Audio('/img/primary.wav');
    audio.volume = 0.5;
    audio.play();
    editDeckModal.classList.add('hidden');
  });
  
  saveEditDeckBtn.addEventListener('click', () => {
    const audio = new Audio('/img/primary.wav');
    audio.volume = 0.5;
    audio.play();
    saveEditDeck();
  });
  
  // Panggil fungsi ini setelah decks di-load
  function loadDecks(uid) {
    database.ref(`users/${uid}/decks`).on('value', (snapshot) => {
      deckListElement.innerHTML = '';
      
      if (!snapshot.exists()) {
        // No decks found
        deckListElement.innerHTML = `
          <div class="col-span-full text-center py-8">
            <p class="text-gray-500">You don't have any decks yet.</p>
            <p class="text-gray-500 mt-2">Click "New Deck" to create your first flashcard deck!</p>
          </div>
        `;
        return;
      }
      
      snapshot.forEach((deckSnapshot) => {
        const deck = deckSnapshot.val();
        addDeckToList(deck);
      });
      
      // Tambahkan event listener untuk tombol edit setelah decks di-load
      addEditButtonListeners();
      
      decksLoaded = true;
    });
  }
// Fungsi untuk menampilkan alert
function showAlert(type) {
    hideAlert();
    const alertBox = type === 'success' ? document.getElementById('successAlert') : document.getElementById('errorAlert');
    alertBox.classList.remove('hidden');

    if (type === 'success') {
        setTimeout(() => {
            hideAlert();
        }, 1000); // Alert sukses hilang setelah 1 detik
    }
}

// Fungsi untuk menyembunyikan alert
function hideAlert() {
    document.getElementById('successAlert').classList.add('hidden');
    document.getElementById('errorAlert').classList.add('hidden');
}


function showConfirmModal(deckId) {
    const modal = document.getElementById('confirmModal');
    modal.classList.remove('hidden');

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.onclick = function () {
        deleteDeckConfirmed(deckId);
    };
}

function hideConfirmModal() {
    const modal = document.getElementById('confirmModal');
    modal.classList.add('hidden');
}

function deleteDeck(deckId) {
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();

    const user = auth.currentUser;

    if (!user) {
        showAlert('error');
        return;
    }

    showConfirmModal(deckId);
}

function deleteDeckConfirmed(deckId) {
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();

    const user = auth.currentUser;

    if (!user) {
        showAlert('error');
        hideConfirmModal();
        return;
    }

    database.ref(`users/${user.uid}/decks/${deckId}`).remove()
        .then(() => {
            hideConfirmModal();
            showAlert('success');
        })
        .catch((error) => {
            console.error('Error deleting deck:', error);
            hideConfirmModal();
            showAlert('error');
        });
}

// Add deck to the list
function addDeckToList(deck) {
  const deckElement = document.createElement('div');
  deckElement.className = 'bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition animate__animated animate__fadeIn';
  deckElement.dataset.deckId = deck.id;
  
  // Generate a random gradient for the deck
  const gradients = [
      'from-rose-400 to-pink-500',         // Pink lembut ke pink klasik
      'from-sky-500 to-indigo-500',        // Biru langit ke ungu muda
      'from-emerald-400 to-teal-500',      // Hijau lembut ke teal
      'from-slate-500 to-gray-700',        // Abu-abu netral ke gelap
      'from-amber-400 to-orange-500',      // Kuning ke oranye hangat
      'from-cyan-500 to-blue-600',         // Cyan ke biru tua
      'from-purple-400 to-violet-500',     // Ungu pastel ke violet
      'from-lime-400 to-green-600',        // Hijau muda ke hijau tua
  ];
  
  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
  const dateCreated = new Date(deck.created).toLocaleDateString();
  
  deckElement.innerHTML = `
    <div class="deck-main cursor-pointer h-24 bg-gradient-to-r ${randomGradient} p-4 flex items-end">
      <h3 class="text-xl font-bold text-white">${deck.title}</h3>
    </div>
    <div class="p-4">
      <p class="text-gray-600 text-sm mb-3">${deck.description || 'No description'}</p>
      <div class="flex justify-between items-center">
        <span class="text-xs text-gray-500">${deck.cardCount || 0} cards • Created ${dateCreated}</span>
        <div class="flex space-x-2">
          <button class="edit-deck-btn text-gray-600 hover:text-blue-600" data-id="${deck.id}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button class="play-deck-btn bg-gradient-to-r from-blue-500 to-purple-600 text-white p-1 rounded-full hover:from-blue-600 hover:to-purple-700" data-id="${deck.id}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button class="delete-deck-btn text-white p-1 rounded-full bg-red-500" data-id="${deck.id}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
  
  deckListElement.appendChild(deckElement);
  
  // Add event listeners for deck navigation
  deckElement.querySelector('.deck-main').addEventListener('click', () => {
    window.location.href = `/deck/${deck.id}`;
  });

// Route
  
  const profileBtn = document.getElementById('profileBtn');
  profileBtn.addEventListener('click', () => {
    window.location.href = '/user-info.html';
  });
  jisho.addEventListener('click', () => {
    window.location.href = '/jisho/jisho.html';
  });
  
 
  // Add event listener for edit button
//   const editButton = deckElement.querySelector('.edit-deck-btn');
//   editButton.addEventListener('click', function(e) {
//     e.stopPropagation();
//     window.location.href = `/deck/${this.getAttribute('data-id')}`;
//   });

  // Add event listener for play button
  const playButton = deckElement.querySelector('.play-deck-btn');
  playButton.addEventListener('click', function(e) {
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();

    e.stopPropagation();
    window.location.href = `/flashcard/${this.getAttribute('data-id')}`;
  });

  // Add event listener for delete button
  const deleteButton = deckElement.querySelector('.delete-deck-btn');
  deleteButton.addEventListener('click', function(e) {
    const audio = new Audio('/img/primary.wav'); // Ganti dengan nama file audio kamu
audio.volume = 0.5; // Set volume ke 50%
audio.play();

    e.stopPropagation();
    e.preventDefault();
    const deckId = this.getAttribute('data-id');
    deleteDeck(deckId);
  });
}

// Event listener untuk study icon
if (studyIcon) {
  studyIcon.addEventListener('click', () => {
    const user = auth.currentUser;
    if (user) {
      // Redirect ke deck pertama atau halaman studi umum
      database.ref(`users/${user.uid}/decks`).limitToFirst(1).once('value', (snapshot) => {
        if (snapshot.exists()) {
          const firstDeck = Object.values(snapshot.val())[0];
          window.location.href = `/deck/${firstDeck.id}`;
        } else {
          alert('Anda belum memiliki deck. Buat deck terlebih dahulu!');
        }
      });
    }
  });
}

// Ambil elemen textarea
const deckTitle = document.getElementById('deckTitle');
const deckDescription = document.getElementById('deckDescription');

// Tambahkan event listener untuk textarea Front
deckTitle.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // Mencegah enter membuat baris baru
    deckDescription.focus(); // Pindah fokus ke textarea Back
  }
});