// Firebase Configuration
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
const database = firebase.database();

// Statistics & Quiz State
let quizStats = {
    correct: 0,
    wrong: 0,
    totalQuestions: 0,
    currentQuestion: 0,
    timerInterval: null,
    timeLeft: 30,
    allAnswers: [] // Store all possible answers from all cards
};

// DOM Elements
const elements = {
    questionContent: document.getElementById('question-content'),
    loadingText: document.getElementById('loading-text'),
    questionNumber: document.getElementById('question-number'),
    question: document.getElementById('question'),
    answerInput: document.getElementById('answerInput'),
    submitButton: document.getElementById('submitAnswer'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    correctCount: document.getElementById('correct-count'),
    wrongCount: document.getElementById('wrong-count'),
    score: document.getElementById('score'),
    timer: document.getElementById('timer'),
    hintButton: document.getElementById('hintButton'),
    fillBlankContainer: document.getElementById('fill-blank-container'),
    multipleChoiceContainer: document.getElementById('multiple-choice-container'),
    choices: document.getElementById('choices'),
    questionType: document.getElementById('question-type')
};

// Start timer for each question
function startTimer() {
    clearInterval(quizStats.timerInterval);
    quizStats.timeLeft = 30;
    updateTimer();
    
    quizStats.timerInterval = setInterval(() => {
        quizStats.timeLeft--;
        updateTimer();
        
        if (quizStats.timeLeft <= 0) {
            clearInterval(quizStats.timerInterval);
            handleTimeUp();
        }
    }, 1000);
}
function initializeAudioEffects() {
// Audio untuk pilihan ganda (audio yang sudah ada)
const optionClickSound = new Audio('/img/true.mp3');
optionClickSound.volume = 0.5;

// Audio untuk tombol navigasi (selanjutnya/sebelumnya)
const navigationSound = new Audio('/img/button.mp3');
navigationSound.volume = 0.5;

// Audio untuk jawaban salah
const wrongAnswerSound = new Audio('/img/false.mp3');
wrongAnswerSound.volume = 0.5;

return {
optionClick: optionClickSound,
navigation: navigationSound,
wrongAnswer: wrongAnswerSound
};
}

// Inisialisasi efek suara
const audioEffects = initializeAudioEffects();
function playSound(type = 'optionClick') {
if (audioEffects[type]) {
audioEffects[type].play();
}
}
// Update timer display
function updateTimer() {
    const minutes = Math.floor(quizStats.timeLeft / 60);
    const seconds = quizStats.timeLeft % 60;
    elements.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Change color based on time left
    if (quizStats.timeLeft <= 10) {
        elements.timer.classList.add('text-red-600');
    } else {
        elements.timer.classList.remove('text-red-600');
    }
}

// Handle time up
function handleTimeUp() {
    const currentCard = quizStats.cards[quizStats.currentQuestion];
    
    Swal.fire({
        title: 'Waktu Habis!',
        html: `Jawaban yang benar adalah: <strong>${currentCard.back}</strong>`,
        icon: 'warning',
        confirmButtonText: 'Lanjutkan'
    }).then(() => {
        quizStats.wrong++;
        updateStats();
        nextQuestion();
    });
}

// Update quiz statistics display
function updateStats() {
    elements.correctCount.textContent = quizStats.correct;
    elements.wrongCount.textContent = quizStats.wrong;
    
    // Calculate score correctly (avoid division by zero)
    const answeredQuestions = quizStats.correct + quizStats.wrong;
    const scoreValue = answeredQuestions > 0 
        ? Math.round((quizStats.correct / answeredQuestions) * 100) 
        : 0;
    
    elements.score.textContent = scoreValue;
    // Clear the answer input field
    elements.answerInput.value = '';

    // Update progress
    const progressPercent = (quizStats.currentQuestion / quizStats.totalQuestions) * 100;
    elements.progressBar.style.width = `${progressPercent}%`;
    elements.progressText.textContent = `${quizStats.currentQuestion}/${quizStats.totalQuestions}`;
}

// Add event listener for Enter key on answer input
function setupInputListener() {
    elements.answerInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            checkAnswer();
        }
    });
}

// Wait for DOM to load
window.addEventListener('DOMContentLoaded', () => {
    setupInputListener();
    
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            const userId = user.uid;
            const deckId = new URLSearchParams(window.location.search).get('deckId') || 
                          window.location.pathname.split('/').pop();
            
            // Load all cards first to collect all possible answers
            loadAllCardsForAnswers(userId, deckId);
        } else {
            hideLoading();
            Swal.fire({
                title: 'Login Diperlukan',
                text: 'Anda harus login terlebih dahulu untuk mengakses quiz.',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
        }
    });
});

// Load all cards first to collect all possible answers
function loadAllCardsForAnswers(userId, deckId) {
    database.ref(`users/${userId}/decks`).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                quizStats.allAnswers = [];
                
                // Iterate through all decks and cards to collect answers
                snapshot.forEach((deckSnapshot) => {
                    const deck = deckSnapshot.val();
                    if (deck.cards) {
                        Object.values(deck.cards).forEach(card => {
                            if (card.back) {
                                quizStats.allAnswers.push(card.back);
                            }
                        });
                    }
                });
                
                // Now load the specific deck for the quiz
                loadQuiz(userId, deckId);
            } else {
                hideLoading();
                Swal.fire({
                    title: 'Data Tidak Ditemukan',
                    text: 'Maaf, data kartu tidak ditemukan.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        })
        .catch((error) => {
            console.error("Error loading all cards:", error);
            hideLoading();
            Swal.fire({
                title: 'Error',
                text: 'Terjadi kesalahan saat memuat data kartu.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });
}

// Hide loading animation and show question content
function hideLoading() {
    elements.loadingText.classList.add('hidden');
    elements.questionContent.classList.remove('hidden');
    document.querySelector('.animate-pulse').classList.add('hidden');
}

// Load quiz from Firebase
function loadQuiz(userId, deckId) {
    database.ref(`users/${userId}/decks/${deckId}/cards`).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                hideLoading();
                
                // Get cards and prepare them for quiz
                const cards = [];
                snapshot.forEach((childSnapshot) => {
                    const card = childSnapshot.val();
                    
                    cards.push({
                        id: childSnapshot.key,
                        front: card.front,
                        back: card.back,
                        front: card.front || '',
                        created: card.created
                    });
                });
                
                if (cards.length === 0) {
                    Swal.fire({
                        title: 'Kartu Kosong',
                        text: 'Deck ini tidak memiliki kartu.',
                        icon: 'warning',
                        confirmButtonText: 'OK'
                    });
                    return;
                }
                
                quizStats.totalQuestions = cards.length;
                startQuiz(cards);
            } else {
                hideLoading();
                Swal.fire({
                    title: 'Deck Tidak Ditemukan',
                    text: 'Maaf, data quiz tidak ditemukan.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        })
        .catch((error) => {
            console.error("Error loading quiz:", error);
            hideLoading();
            Swal.fire({
                title: 'Error',
                text: 'Terjadi kesalahan saat memuat quiz.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });
}

// Process cards for fill-in-the-blank format
function processCardForFillBlank(card) {
    // Check if card.back has at least 3 characters to make a proper blank
    if (card.back.length < 3) {
        // For very short words, we'll show just the first character
        return {
            question: card.back.charAt(0) + "**",
            answer: card.back.substring(1)
        };
    } else {
        // For longer words, we'll show first 1-2 characters and blank out the rest
        const showLength = Math.max(2, Math.floor(card.back.length * 0.3));
        const prefix = card.back.substring(0, showLength);
        const answer = card.back.substring(showLength);
        
        return {
            question: prefix + "**",
            answer: answer
        };
    }
}

// Generate a hint for the answer
function generateHint(answer, front) {
    // If there's a front, use it as a hint
    if (front && front.trim() !== '') {
        return front;
    }
    
    // Otherwise generate a basic hint
    if (answer.length <= 3) {
        return `Jawaban terdiri dari ${answer.length} karakter`;
    } else {
        return `Jawaban diakhiri dengan "${answer[answer.length-1]}" dan terdiri dari ${answer.length} karakter`;
    }
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Start the quiz with the prepared cards
function startQuiz(cards) {
    // Shuffle the cards
    quizStats.cards = shuffleArray([...cards]);
    
    // Process cards for fill-in-the-blank format
    quizStats.cards.forEach(card => {
        const processed = processCardForFillBlank(card);
        card.questionText = processed.question;
        card.answerText = processed.answer;
        card.hint = generateHint(card.back, card.front);
    });
    
    showQuestion();
    
    // Handle submit button clicks
    elements.submitButton.addEventListener('click', checkAnswer);
    
    // Handle hint button clicks
    elements.hintButton.addEventListener('click', showHint);
}

// Show current question
function showQuestion() {
    if (quizStats.currentQuestion < quizStats.totalQuestions) {
        const currentCard = quizStats.cards[quizStats.currentQuestion];
        
        // Update question number and text
        elements.questionNumber.textContent = quizStats.currentQuestion + 1;
        elements.question.textContent = `Lengkapi kata berikut: ${currentCard.questionText}`;
        
        // Show fill-in-the-blank container, hide multiple choice
        elements.fillBlankContainer.classList.remove('hidden');
        elements.multipleChoiceContainer.classList.add('hidden');
        
        // Clear previous answer
        elements.answerInput.value = '';
        elements.answerInput.focus();
        
        // Start timer for this question
        startTimer();
    } else {
      playSound('navigation');
        // Quiz complete
        clearInterval(quizStats.timerInterval);
        
        const scoreValue = quizStats.totalQuestions > 0 
            ? Math.round((quizStats.correct / quizStats.totalQuestions) * 100)
            : 0;
        
        Swal.fire({
            title: 'Quiz Selesai!',
            html: `
                <div class="text-left">
                    <p class="mb-2">Jawaban Benar: <strong class="text-green-600">${quizStats.correct}</strong></p>
                    <p class="mb-2">Jawaban Salah: <strong class="text-red-600">${quizStats.wrong}</strong></p>
                    <p class="mb-2">Skor Akhir: <strong class="text-blue-600">${scoreValue}%</strong></p>
                </div>
            `,
            icon: 'success',
            confirmButtonText: 'Selesai'
            
        });
    }
}

// Check the user's answer
function checkAnswer() {
  playSound('navigation');
    clearInterval(quizStats.timerInterval);
    
    const currentCard = quizStats.cards[quizStats.currentQuestion];
    const userAnswer = elements.answerInput.value.trim();
    
    if (!userAnswer) {
        Swal.fire({
            title: 'Masukkan Jawaban',
            text: 'Silakan masukkan jawaban Anda terlebih dahulu.',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
        startTimer(); // Restart timer
        return;
    }
    
    // Check if answer is correct (case insensitive)
    const expectedAnswer = currentCard.answerText.toLowerCase();
    const isCorrect = userAnswer.toLowerCase() === expectedAnswer;
    
    if (isCorrect) {
      playSound('optionClick');
        quizStats.correct++;
        Swal.fire({
            title: 'Benar!',
            html: `Kata lengkapnya adalah: <strong>${currentCard.back}</strong>`,
            icon: 'success',
            confirmButtonText: 'Lanjutkan'
        }).then(() => {
            nextQuestion();
        });
    } else {
      playSound('wrongAnswer');
        quizStats.wrong++;
        Swal.fire({
            title: 'Salah',
            html: `Jawaban yang benar adalah: <strong>${currentCard.back}</strong>`,
            icon: 'error',
            confirmButtonText: 'Lanjutkan'
        }).then(() => {
            nextQuestion();
        });
    }
    
    updateStats();
}

// Show hint for current question
function showHint() {
  playSound('navigation');
    const currentCard = quizStats.cards[quizStats.currentQuestion];
    Swal.fire({
        title: 'Petunjuk',
        text: currentCard.hint,
        icon: 'info',
        confirmButtonText: 'OK'
    });
}

// Move to next question
function nextQuestion() {
  playSound('navigation');
    quizStats.currentQuestion++;
    showQuestion();
}
