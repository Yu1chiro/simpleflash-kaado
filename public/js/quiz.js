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

// Get deck ID from URL - Perbaikan route untuk mengambil deckId dengan benar
const deckId = window.location.pathname.split('/').pop();

// DOM Elements
const backBtn = document.getElementById('backBtn');
const profileBtn = document.getElementById('profileBtnNav');
const deckTitleElement = document.getElementById('deckTitle');
const deckDescriptionElement = document.getElementById('deckDescription');
const cardCountElement = document.getElementById('cardCount');
const quizStatusElement = document.getElementById('quizStatus');

const quizInfoCard = document.getElementById('quizInfoCard');
const startQuizBtn = document.getElementById('startQuizBtn');
const quizContainer = document.getElementById('quizContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const questionNumber = document.getElementById('questionNumber');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const prevQuestionBtn = document.getElementById('prevQuestionBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');

const resultsContainer = document.getElementById('resultsContainer');
const totalQuestionsElement = document.getElementById('totalQuestions');
const correctAnswersElement = document.getElementById('correctAnswers');
const wrongAnswersElement = document.getElementById('wrongAnswers');
const scorePercentageElement = document.getElementById('scorePercentage');
const scoreBar = document.getElementById('scoreBar');
const restartQuizBtn = document.getElementById('restartQuizBtn');
const backToDeckBtn = document.getElementById('backToDeckBtn');

// Quiz state variables
let cards = [];
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let quizCompleted = false;

// Audio for interactions
// function playSound() {
//     const audio = new Audio('/img/button.mp3');
//     audio.volume = 0.5;
//     audio.play();
// }
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

// Load deck information
function loadDeckInfo(userId, deckId) {
    database.ref(`users/${userId}/decks/${deckId}`).once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                alert('Deck tidak ditemukan');
                window.location.href = '/dashboard';
                return;
            }
            
            const deck = snapshot.val();
            deckTitleElement.textContent = deck.title;
            deckDescriptionElement.textContent = deck.description || 'kosong';
            cardCountElement.textContent = deck.cardCount || 0;
            cardCountElement.classList.add('text-white');
            
            // Disable start quiz button if no cards
            if (!deck.cardCount || deck.cardCount === 0) {
                startQuizBtn.disabled = true;
                startQuizBtn.classList.add('opacity-50', 'cursor-not-allowed');
                quizStatusElement.textContent = 'Tidak ada kartu';
            }
        })
        .catch((error) => {
            console.error('Error loading deck:', error);
            alert('Gagal memuat informasi deck');
        });
}

// Load cards

// Generate quiz questions from cards
// Tambahkan variabel baru untuk menyimpan data performa pengguna
let userPerformance = {};
let difficultyLevels = {
easy: 0.3,    // Bobot kesulitan rendah
medium: 0.6,  // Bobot kesulitan sedang
hard: 1.0     // Bobot kesulitan tinggi
};

// Fungsi untuk menilai tingkat kesulitan kartu berdasarkan kontennya
function assessCardDifficulty(card) {
// Implementasi sederhana - berdasarkan panjang teks
// Dalam implementasi nyata, Anda dapat menggunakan metrik lain
const frontLength = card.front.length;
const backLength = card.back.length;

if (frontLength < 15 && backLength < 15) {
return 'easy';
} else if (frontLength < 30 && backLength < 30) {
return 'medium';
} else {
return 'hard';
}
}

// Modifikasi fungsi generateQuestions untuk mengimplementasikan adaptif
function generateQuestions() {
questions = [];

// Inisialisasi performa pengguna jika belum ada
if (Object.keys(userPerformance).length === 0) {
cards.forEach(card => {
    const cardId = card.id || Math.random().toString(36).substring(2, 9);
    userPerformance[cardId] = {
        attempts: 0,
        correct: 0,
        difficulty: assessCardDifficulty(card),
        lastSeen: null
    };
});
}

// Hitung skor akurasi pengguna secara keseluruhan
let totalAttempts = 0;
let totalCorrect = 0;

Object.values(userPerformance).forEach(performance => {
totalAttempts += performance.attempts;
totalCorrect += performance.correct;
});

// Tentukan tingkat akurasi pengguna (defaultnya 0.5 jika belum ada upaya)
const userAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0.5;

// Prioritaskan kartu berdasarkan akurasi pengguna
const prioritizedCards = [...cards].sort((a, b) => {
const cardIdA = a.id || Math.random().toString(36).substring(2, 9);
const cardIdB = b.id || Math.random().toString(36).substring(2, 9);

const perfA = userPerformance[cardIdA];
const perfB = userPerformance[cardIdB];

// Faktor kesulitan kartu
const difficultyFactorA = difficultyLevels[perfA.difficulty];
const difficultyFactorB = difficultyLevels[perfB.difficulty];

// Faktor akurasi (kartu yang sering salah mendapat prioritas lebih tinggi)
const accuracyFactorA = perfA.attempts > 0 ? perfA.correct / perfA.attempts : 0.5;
const accuracyFactorB = perfB.attempts > 0 ? perfB.correct / perfB.attempts : 0.5;

// Faktor frekuensi (kartu yang jarang muncul mendapat prioritas lebih tinggi)
const frequencyFactorA = perfA.attempts;
const frequencyFactorB = perfB.attempts;

// Faktor kebaruan (kartu yang belum pernah dilihat mendapat prioritas lebih tinggi)
const recencyFactorA = perfA.lastSeen ? Date.now() - perfA.lastSeen : Infinity;
const recencyFactorB = perfB.lastSeen ? Date.now() - perfB.lastSeen : Infinity;

// Hitung skor prioritas
// Jika akurasi pengguna tinggi, prioritaskan kartu yang lebih sulit
// Jika akurasi pengguna rendah, prioritaskan kartu yang lebih mudah
let priorityScoreA, priorityScoreB;

if (userAccuracy > 0.7) {  // Pengguna berkinerja baik
    // Prioritaskan kartu yang sulit dan yang jarang dijawab dengan benar
    priorityScoreA = difficultyFactorA * (1 - accuracyFactorA) * (recencyFactorA * 0.0001);
    priorityScoreB = difficultyFactorB * (1 - accuracyFactorB) * (recencyFactorB * 0.0001);
} else {  // Pengguna berkinerja kurang baik
    // Prioritaskan kartu yang lebih mudah dan yang perlu diperkuat
    priorityScoreA = (1 - difficultyFactorA) * (1 - accuracyFactorA) * (recencyFactorA * 0.0001);
    priorityScoreB = (1 - difficultyFactorB) * (1 - accuracyFactorB) * (recencyFactorB * 0.0001);
}

// Urutkan berdasarkan prioritas (prioritas tertinggi dulu)
return priorityScoreB - priorityScoreA;
});

// Pilih subset kartu untuk soal
const selectedCards = prioritizedCards.slice(0, Math.min(prioritizedCards.length, 500));

// Acak kartu yang dipilih untuk mencegah pola yang mudah ditebak
const shuffledSelectedCards = [...selectedCards].sort(() => Math.random() - 0.5);

// Buat pertanyaan dari kartu yang dipilih
shuffledSelectedCards.forEach((card, index) => {
const cardId = card.id || Math.random().toString(36).substring(2, 9);

// Catat waktu kartu dilihat
userPerformance[cardId].lastSeen = Date.now();

// Buat pertanyaan dari kartu
const question = {
    id: index,
    cardId: cardId,  // Simpan ID kartu untuk memperbarui performa nanti
    questionText: card.front,
    correctAnswer: card.back,
    options: generateOptions(card.back, cards),
    difficulty: userPerformance[cardId].difficulty
};

questions.push(question);
});

// Inisialisasi array jawaban pengguna
userAnswers = Array(questions.length).fill(null);
}

// Modifikasi fungsi selectOption untuk memperbarui performa pengguna
function selectOption(option) {
// Dapatkan pertanyaan saat ini
const currentQuestion = questions[currentQuestionIndex];
const cardId = currentQuestion.cardId;
// Periksa apakah jawaban benar atau salah
if (option === currentQuestion.correctAnswer) {
// Mainkan suara klik standar untuk jawaban benar
playSound('optionClick');
} else {
// Mainkan suara jawaban salah
playSound('wrongAnswer');
}
// Simpan jawaban pengguna
userAnswers[currentQuestionIndex] = option;

// Perbarui data performa
userPerformance[cardId].attempts += 1;

// Periksa apakah jawaban benar
if (option === currentQuestion.correctAnswer) {
userPerformance[cardId].correct += 1;
}

// Tampilkan gaya benar/salah
showQuestion(currentQuestionIndex);

// Aktifkan tombol berikutnya
nextQuestionBtn.disabled = false;
nextQuestionBtn.classList.remove('opacity-50', 'cursor-not-allowed');

// Periksa apakah semua pertanyaan telah dijawab
if (!userAnswers.includes(null)) {
quizCompleted = true;
quizStatusElement.textContent = 'Selesai';
}
}

// Modifikasi fungsi showResults untuk menyimpan data performa di penyimpanan lokal
function showResults() {
// Simpan data performa pengguna di localStorage untuk penggunaan berikutnya
localStorage.setItem(`quiz_performance_${deckId}`, JSON.stringify(userPerformance));

// Kode hasil lainnya tetap sama
// ...
quizContainer.classList.add('hidden');
resultsContainer.classList.remove('hidden');
resultsContainer.classList.add('animate__fadeIn');

// Hitung hasil
const totalQuestions = questions.length;
let correctCount = 0;

questions.forEach((question, index) => {
if (userAnswers[index] === question.correctAnswer) {
    correctCount++;
}
});

const wrongCount = totalQuestions - correctCount;
const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

// Perbarui UI hasil
totalQuestionsElement.textContent = totalQuestions;
correctAnswersElement.textContent = correctCount;
wrongAnswersElement.textContent = wrongCount;
scorePercentageElement.textContent = `${scorePercentage}%`;
scoreBar.style.width = `${scorePercentage}%`;

// Atur warna bar skor berdasarkan skor
if (scorePercentage >= 80) {
scoreBar.classList.remove('bg-red-600', 'bg-yellow-600');
scoreBar.classList.add('bg-green-600');
} else if (scorePercentage >= 60) {
scoreBar.classList.remove('bg-red-600', 'bg-green-600');
scoreBar.classList.add('bg-yellow-600');
} else {
scoreBar.classList.remove('bg-green-600', 'bg-yellow-600');
scoreBar.classList.add('bg-red-600');
}

// Atur status kuis
quizStatusElement.textContent = 'Selesai';
}

// Modifikasi loadCards untuk memuat data performa sebelumnya
function loadCards(userId, deckId) {
database.ref(`users/${userId}/decks/${deckId}/cards`).once('value')
.then((snapshot) => {
    if (!snapshot.exists()) {
        cards = [];
        return;
    }
    
    cards = [];
    snapshot.forEach((cardSnapshot) => {
        const card = cardSnapshot.val();
        card.id = cardSnapshot.key; // Simpan ID kartu untuk referensi
        cards.push(card);
    });
    
    cardCountElement.textContent = cards.length;
    
    if (cards.length > 0) {
        quizStatusElement.textContent = 'Start Now';
        quizStatusElement.classList.add('text-white', 'px-1', 'py-1', 'rounded-lg', 'bg-green-600')
        startQuizBtn.disabled = false;
        startQuizBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        
        // Coba muat data performa sebelumnya dari localStorage
        const savedPerformance = localStorage.getItem(`quiz_performance_${deckId}`);
        if (savedPerformance) {
            userPerformance = JSON.parse(savedPerformance);
            
            // Pastikan semua kartu memiliki catatan performa
            cards.forEach(card => {
                if (!userPerformance[card.id]) {
                    userPerformance[card.id] = {
                        attempts: 0,
                        correct: 0,
                        difficulty: assessCardDifficulty(card),
                        lastSeen: null
                    };
                }
            });
        }
    }
})
.catch((error) => {
    console.error('Error loading cards:', error);
    alert('Gagal memuat kartu');
});
}

// Generate options for a question (one correct, three incorrect)
function generateOptions(correctAnswer, allCards) {
    // Get 3 random incorrect options from other cards
    const incorrectOptions = allCards
        .filter(card => card.back !== correctAnswer)
        .map(card => card.back)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    
    // Combine correct and incorrect options
    const options = [correctAnswer, ...incorrectOptions];
    
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
}

// Start the quiz
function startQuiz() {
    playSound('navigation');
    
    // Generate questions
    generateQuestions();
    
    if (questions.length === 0) {
        alert('Tidak ada pertanyaan yang dapat dibuat dari kartu ini');
        return;
    }
    
    // Hide info card, show quiz container
    quizInfoCard.classList.add('hidden');
    quizContainer.classList.remove('hidden');
    quizContainer.classList.add('animate__fadeIn');
    
    // Set quiz status
    quizStatusElement.textContent = 'Active';
    
    // Show first question
    showQuestion(0);
    
    // Update navigation buttons
    updateNavigationButtons();
}

// Show a question
function showQuestion(index) {
    const question = questions[index];
    
    // Update question number and text
    questionNumber.textContent = `Pertanyaan ${index + 1} dari ${questions.length}`;
    questionText.textContent = question.questionText;
    
    // Clear options container
    optionsContainer.innerHTML = '';
    
    // Add options
    question.options.forEach((option, optIndex) => {
        const optionButton = document.createElement('button');
        optionButton.className = 'option-btn w-full text-left p-4 border rounded-lg focus:outline-none transition';
        
        // Check if this option has been selected
        const userAnswer = userAnswers[currentQuestionIndex];
        
        if (userAnswer === option) {
            // User selected this option
            if (option === question.correctAnswer) {
                // Correct answer
                optionButton.className += ' bg-green-100 border-green-300 text-green-800';
            } else {
                // Wrong answer
                optionButton.className += ' bg-red-100 border-red-300 text-red-800';
            }
        } else if (userAnswer !== null && option === question.correctAnswer) {
            // Highlight correct answer if user answered wrong
            optionButton.className += ' bg-green-100 border-green-300 text-green-800';
        } else {
            // Default styling
            optionButton.className += ' bg-gray-50 border-gray-200 hover:bg-gray-100';
        }
        
        optionButton.textContent = option;
        
        // Add click event
        optionButton.addEventListener('click', () => selectOption(option));
        
        optionsContainer.appendChild(optionButton);
    });
    
    // Update progress
    updateProgress();
}

// Select an option

// 
// Go to previous question
function prevQuestion() {
    playSound('navigation');
    
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion(currentQuestionIndex);
        updateNavigationButtons();
    }
}

// Go to next question
function nextQuestion() {
    playSound('navigation');
    
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        showQuestion(currentQuestionIndex);
        updateNavigationButtons();
    } else if (quizCompleted) {
        // Show results if quiz is completed
        showResults();
    }
}

// Update navigation buttons
function updateNavigationButtons() {
    // Prev button
    if (currentQuestionIndex === 0) {
        prevQuestionBtn.disabled = true;
        prevQuestionBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        prevQuestionBtn.disabled = false;
        prevQuestionBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    
    // Next button
    if (currentQuestionIndex === questions.length - 1) {
        nextQuestionBtn.textContent = 'Selesai';
        
        // Disable if user hasn't answered
        if (userAnswers[currentQuestionIndex] === null || !quizCompleted) {
            nextQuestionBtn.disabled = true;
            nextQuestionBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            nextQuestionBtn.disabled = false;
            nextQuestionBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    } else {
        nextQuestionBtn.textContent = 'Selanjutnya';
        
        // Disable if user hasn't answered
        if (userAnswers[currentQuestionIndex] === null) {
            nextQuestionBtn.disabled = true;
            nextQuestionBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            nextQuestionBtn.disabled = false;
            nextQuestionBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

// Update progress indicators
function updateProgress() {
    // Count answered questions
    const answeredCount = userAnswers.filter(answer => answer !== null).length;
    
    // Update progress text
    progressText.textContent = `${answeredCount}/${questions.length}`;
    
    // Update progress bar
    const progressPercentage = (answeredCount / questions.length) * 100;
    progressBar.style.width = `${progressPercentage}%`;
}

// Show quiz results
function showResults() {
    localStorage.setItem(`quiz_performance_${deckId}`, JSON.stringify(userPerformance));

    // Hide quiz container, show results container
    quizContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    resultsContainer.classList.add('animate__fadeIn');
    
    // Calculate results
    const totalQuestions = questions.length;
    let correctCount = 0;
    
    questions.forEach((question, index) => {
        if (userAnswers[index] === question.correctAnswer) {
            correctCount++;
        }
    });
    
    const wrongCount = totalQuestions - correctCount;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    
    // Update results UI
    totalQuestionsElement.textContent = totalQuestions;
    correctAnswersElement.textContent = correctCount;
    wrongAnswersElement.textContent = wrongCount;
    scorePercentageElement.textContent = `${scorePercentage}%`;
    scoreBar.style.width = `${scorePercentage}%`;
    
    // Set score bar color based on score
    if (scorePercentage >= 80) {
        scoreBar.classList.remove('bg-red-600', 'bg-yellow-600');
        scoreBar.classList.add('bg-green-600');
    } else if (scorePercentage >= 60) {
        scoreBar.classList.remove('bg-red-600', 'bg-green-600');
        scoreBar.classList.add('bg-yellow-600');
    } else {
        scoreBar.classList.remove('bg-green-600', 'bg-yellow-600');
        scoreBar.classList.add('bg-red-600');
    }
    
    // Set quiz status
    quizStatusElement.textContent = 'Selesai';
}

// Restart the quiz
function restartQuiz() {
    playSound('navigation');
    
    // Reset quiz state
    currentQuestionIndex = 0;
    userAnswers = Array(questions.length).fill(null);
    quizCompleted = false;
    
    // Hide results container, show quiz container
    resultsContainer.classList.add('hidden');
    quizContainer.classList.remove('hidden');
    
    // Generate new questions
    generateQuestions();
    
    // Show first question
    showQuestion(0);
    
    // Update navigation buttons
    updateNavigationButtons();
    
    // Set quiz status
    quizStatusElement.textContent = 'Active';
}

// Event Listeners
backBtn.addEventListener('click', () => {
    playSound();
    window.location.href = `/deck/${deckId}`; // Mengubah route kembali ke deck sesuai dengan route aplikasi Anda
});

profileBtn.addEventListener('click', () => {
    playSound();
    window.location.href = '/user-info.html';
});

startQuizBtn.addEventListener('click', startQuiz);
prevQuestionBtn.addEventListener('click', prevQuestion);
nextQuestionBtn.addEventListener('click', nextQuestion);
restartQuizBtn.addEventListener('click', restartQuiz);

backToDeckBtn.addEventListener('click', () => {
    playSound();
    window.location.href = `/deck/${deckId}`; // Mengubah route kembali ke deck sesuai dengan route aplikasi Anda
});
