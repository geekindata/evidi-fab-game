// Language translations
const translations = {
    en: {
        welcome: "Welcome to Fabric February 2026",
        enterEmail: "Enter your email",
        emailHelp: "Returning players can jump right in. New players will complete a quick registration.",
        letsPlay: "🎮 Let's Play!",
        whatsName: "👤 What's your name?",
        namePlaceholder: "Type your name here...",
        emailPlaceholder: "your.email@example.com",
        fabricExperience: "💼 How would you describe your experience with Microsoft Fabric?",
        fabricHelp: "Don't worry, there's no wrong answer!",
        fabricNew: "New/little experience",
        fabricWorking: "Working on Fabric",
        fabricLot: "A lot of experience with Fabric",
        description: "🌟 What best describes you right now?",
        descriptionHelp: "Pick the option that feels most like you",
        descMissing: "Missing a stronger professional environment and exciting projects",
        descSupplier: "Looking for a supplier who can assist with Fabric",
        descShare: "Have a lot of Fabric experience and are happy to share experiences with you",
        descPrize: "Excited to see if I win a prize",
        canContact: "📞 Can we contact you to follow up, even if you don't win?",
        contactHelp: "We'd love to stay in touch!",
        yes: "Yes",
        no: "No",
        score: "Score",
        question: "Question",
        of: "of",
        whatIcon: "What is the name of this icon?",
        playAgain: "Play Again",
        winMessage: "🎉Congratulations!🎉\nYou got {score} out of 4 correct!\nYou are now part of the raffle!",
        loseMessage: "You got {score} out of 4 correct. Better luck next time!",
        welcomeBack: "✅ Welcome back! Starting game...",
        emailNotFound: "⚠️ Could not check your email. Please try again.",
        pleaseEnterEmail: "Please enter your email address",
        dataSaved: "✅ Data saved successfully!",
        saveError: "⚠️ Could not save your data to the database. You can still play the game!",
        pleaseFillAll: "Please fill in all fields",
        registrationWelcome: "Let's get to know you before we start playing.",
        emailFromCheck: "We'll use {email} for your registration."
    },
    nb: {
        welcome: "Velkommen til Fabric Februar 2026",
        enterEmail: "Skriv inn e-postadressen din",
        emailHelp: "Tilbakevendende spillere kan hoppe rett inn. Nye spillere vil fullføre en rask registrering.",
        letsPlay: "🎮 La oss spille!",
        whatsName: "👤 Hva heter du?",
        namePlaceholder: "Skriv navnet ditt her...",
        emailPlaceholder: "din.epost@eksempel.com",
        fabricExperience: "💼 Hvordan vil du beskrive din erfaring med Microsoft Fabric?",
        fabricHelp: "Ikke bekymre deg, det er ikke noe galt svar!",
        fabricNew: "Ny/liten erfaring",
        fabricWorking: "Jobber med Fabric",
        fabricLot: "Mye erfaring med Fabric",
        description: "🌟 Hva beskriver deg best akkurat nå?",
        descriptionHelp: "Velg alternativet som føles mest som deg",
        descMissing: "Savner et sterkere profesjonelt miljø og spennende prosjekter",
        descSupplier: "Ser etter en leverandør som kan hjelpe med Fabric",
        descShare: "Har mye Fabric-erfaring og er glade for å dele erfaringer med deg",
        descPrize: "Spent på å se om jeg vinner en premie",
        canContact: "📞 Kan vi kontakte deg for oppfølging, selv om du ikke vinner?",
        contactHelp: "Vi vil gjerne holde kontakten!",
        yes: "Ja",
        no: "Nei",
        score: "Poeng",
        question: "Spørsmål",
        of: "av",
        whatIcon: "Hva heter dette ikonet?",
        playAgain: "Spill igjen",
        winMessage: "🎉Gratulerer!🎉\nDu fikk {score} av 4 riktig!\nDu er nå med i trekningen!",
        loseMessage: "Du fikk {score} av 4 riktig. Bedre lykke neste gang!",
        welcomeBack: "✅ Velkommen tilbake! Starter spillet...",
        emailNotFound: "⚠️ Kunne ikke sjekke e-posten din. Vennligst prøv igjen.",
        pleaseEnterEmail: "Vennligst skriv inn e-postadressen din",
        dataSaved: "✅ Data lagret!",
        saveError: "⚠️ Kunne ikke lagre dataene dine til databasen. Du kan fortsatt spille spillet!",
        pleaseFillAll: "Vennligst fyll ut alle feltene",
        registrationWelcome: "La oss bli kjent før vi begynner å spille.",
        emailFromCheck: "Vi bruker {email} til din registrering."
    }
};

// Current language (default: English)
let currentLang = localStorage.getItem('language') || 'en';

// Simple game data - using available icons
const icons = [
    { file: '/static/icons/ai_skills_64_item.svg', name: 'AI Skills' },
    { file: '/static/icons/apps_64_item.svg', name: 'Apps' },
    { file: '/static/icons/dashboard_64_item.svg', name: 'Dashboard' },
    { file: '/static/icons/data_warehouse_64_item.svg', name: 'Data Warehouse' },
    { file: '/static/icons/dataflow_64_item.svg', name: 'Dataflow' },
    { file: '/static/icons/dataflow_gen2_64_item.svg', name: 'Dataflow Gen2' },
    { file: '/static/icons/datamart_64_item.svg', name: 'Datamart' },
    { file: '/static/icons/environment_64_item.svg', name: 'Environment' },
    { file: '/static/icons/event_house_64_item.svg', name: 'Event House' },
    { file: '/static/icons/eventstream_64_item.svg', name: 'Eventstream' },
    { file: '/static/icons/Evidi.jpg', name: 'Evidi' },
    { file: '/static/icons/Cathrine%20Wilhelmsen.jpg', name: 'Cathrine Wilhelmsen' },
    { file: '/static/icons/Erlend%20Øien.jpg', name: 'Erlend Øien' },
    { file: '/static/icons/experiments_64_item.svg', name: 'Experiments' },
    { file: '/static/icons/exploration_64_item.svg', name: 'Exploration' },
    { file: '/static/icons/function_64_item.svg', name: 'Function' },
    { file: '/static/icons/function_set_64_item.svg', name: 'Function Set' },
    { file: '/static/icons/healthcare_64_item.svg', name: 'Healthcare' },
    { file: '/static/icons/kql_database_64_item.svg', name: 'KQL Database' },
    { file: '/static/icons/kql_queryset_64_item.svg', name: 'KQL Queryset' },
    { file: '/static/icons/lakehouse_64_item.svg', name: 'Lakehouse' },
    { file: '/static/icons/model_64_item.svg', name: 'Model' },
    { file: '/static/icons/notebook_64_item.svg', name: 'Notebook' },
    { file: '/static/icons/paginated_report_64_item.svg', name: 'Paginated Report' },
    { file: '/static/icons/pipeline_64_item.svg', name: 'Pipeline' },
    { file: '/static/icons/real_time_dashboard_64_item.svg', name: 'Real Time Dashboard' },
    { file: '/static/icons/reflex_64_item.svg', name: 'Reflex' },
    { file: '/static/icons/report_64_item.svg', name: 'Report' },
    { file: '/static/icons/retail_64_item.svg', name: 'Retail' },
    { file: '/static/icons/scorecard_64_item.svg', name: 'Scorecard' },
    { file: '/static/icons/semantic_model_64_item.svg', name: 'Semantic Model' },
    { file: '/static/icons/spark_job_definition_64_item.svg', name: 'Spark Job Definition' },
    { file: '/static/icons/sql_database_64_item.svg', name: 'SQL Database' },
    { file: '/static/icons/streaming_dataflow_64_item.svg', name: 'Streaming Dataflow' },
    { file: '/static/icons/sustainability_64_item.svg', name: 'Sustainability' },
    { file: '/static/icons/variables_64_item.svg', name: 'Variables' }
];

let score = 0;
let currentQuestion = 0;
let questions = [];
let isSubmitting = false;
let isCheckingEmail = false;
let userEmail = null; // Track user's email for saving game results

// Configuration: Set to false to hide save success/error messages
const SHOW_SAVE_MESSAGES = false;

// Translation function
function t(key, params = {}) {
    let text = translations[currentLang][key] || translations.en[key] || key;
    // Replace placeholders like {score}, {email}
    Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
    });
    return text;
}

// Confetti celebration function - continuous
let confettiInterval = null;

function triggerConfetti() {
    if (typeof confetti !== 'undefined') {
        // Clear any existing confetti interval
        if (confettiInterval) {
            clearInterval(confettiInterval);
        }
        
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        // Launch confetti continuously
        confettiInterval = setInterval(function() {
            const particleCount = 50;
            
            // Launch confetti from both sides
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);
    }
}

function stopConfetti() {
    if (confettiInterval) {
        clearInterval(confettiInterval);
        confettiInterval = null;
    }
}

// Update all UI text based on current language
function updateLanguage() {
    // Update welcome text
    const welcomeText = document.getElementById('welcome-text');
    if (welcomeText) {
        const container = document.getElementById('email-container');
        const formContainer = document.getElementById('form-container');
        if (container && !container.classList.contains('hidden')) {
            welcomeText.textContent = t('welcome');
        } else if (formContainer && !formContainer.classList.contains('hidden')) {
            welcomeText.textContent = t('registrationWelcome');
        } else {
            welcomeText.textContent = t('welcome');
        }
    }
    
    // Update email entry form
    const emailLabel = document.querySelector('#email-container label');
    if (emailLabel) emailLabel.textContent = t('enterEmail');
    
    const emailHelp = document.querySelector('#email-container .help-text');
    if (emailHelp) emailHelp.textContent = t('emailHelp');
    
    const emailPlaceholder = document.getElementById('check-email');
    if (emailPlaceholder) emailPlaceholder.placeholder = t('emailPlaceholder');
    
    // Update registration form
    const nameLabel = document.querySelector('#form-container label[for="name"], #form-container .form-group:first-child label');
    if (nameLabel && nameLabel.textContent.includes("What's your name")) {
        nameLabel.textContent = t('whatsName');
    }
    
    const nameInput = document.getElementById('name');
    if (nameInput) nameInput.placeholder = t('namePlaceholder');
    
    const regEmailLabel = document.querySelector('#form-container input[type="email"]')?.previousElementSibling;
    if (regEmailLabel && regEmailLabel.tagName === 'LABEL') {
        regEmailLabel.textContent = t('enterEmail');
    }
    
    const regEmailInput = document.getElementById('email');
    if (regEmailInput) regEmailInput.placeholder = t('emailPlaceholder');
    
    // Update all labels and text in registration form
    const labels = document.querySelectorAll('#form-container label');
    labels.forEach(label => {
        const text = label.textContent.trim();
        if (text.includes("How would you describe")) {
            label.textContent = t('fabricExperience');
        } else if (text.includes("What best describes")) {
            label.textContent = t('description');
        } else if (text.includes("Can we contact")) {
            label.textContent = t('canContact');
        }
    });
    
    const helpTexts = document.querySelectorAll('#form-container .help-text');
    helpTexts.forEach(help => {
        const text = help.textContent.trim();
        if (text.includes("Don't worry")) {
            help.textContent = t('fabricHelp');
        } else if (text.includes("Pick the option")) {
            help.textContent = t('descriptionHelp');
        } else if (text.includes("We'd love")) {
            help.textContent = t('contactHelp');
        }
    });
    
    // Update radio button labels
    const radioLabels = document.querySelectorAll('#form-container .radio-label span');
    radioLabels.forEach(span => {
        const text = span.textContent.trim();
        if (text === "New/little experience" || text === "Ny/liten erfaring") {
            span.textContent = t('fabricNew');
        } else if (text === "Working on Fabric" || text === "Jobber med Fabric") {
            span.textContent = t('fabricWorking');
        } else if (text === "A lot of experience with Fabric" || text === "Mye erfaring med Fabric") {
            span.textContent = t('fabricLot');
        } else if (text === "Missing a stronger professional environment and exciting projects" || text === "Savner et sterkere profesjonelt miljø og spennende prosjekter" || text.includes("Savner et sterkere")) {
            span.textContent = t('descMissing');
        } else if (text === "Looking for a supplier who can assist with Fabric" || text === "Ser etter en leverandør som kan hjelpe med Fabric" || text.includes("Ser etter en leverandør")) {
            span.textContent = t('descSupplier');
        } else if (text.includes("Have a lot of Fabric experience") || text.includes("Har mye Fabric-erfaring")) {
            span.textContent = t('descShare');
        } else if (text === "Excited to see if I win a prize" || text.includes("Spent på å se")) {
            span.textContent = t('descPrize');
        } else if (text === "Yes" || text === "Ja") {
            span.textContent = t('yes');
        } else if (text === "No" || text === "Nei") {
            span.textContent = t('no');
        }
    });
    
    // Update buttons
    const submitButtons = document.querySelectorAll('.submit-button span');
    submitButtons.forEach(btn => {
        if (btn.textContent.includes("Let's Play") || btn.textContent.includes("La oss spille")) {
            btn.textContent = t('letsPlay');
        }
    });
    
    const playAgainBtn = document.getElementById('play-again');
    if (playAgainBtn) playAgainBtn.textContent = t('playAgain');
    
    // Update game UI
    const scoreLabel = document.querySelector('.score');
    if (scoreLabel) {
        scoreLabel.innerHTML = `${t('score')}: <span id="score">${score}</span>/4`;
    }
    
    const questionLabel = document.querySelector('.question h2');
    if (questionLabel) {
        const qNum = document.getElementById('question-num')?.textContent || '1';
        questionLabel.innerHTML = `${t('question')} <span id="question-num">${qNum}</span> ${t('of')} 4`;
    }
    
    const whatIcon = document.querySelector('.question p');
    if (whatIcon) whatIcon.textContent = t('whatIcon');
    
    // Update language button
    const langCode = document.getElementById('lang-code');
    if (langCode) langCode.textContent = currentLang.toUpperCase();
    
    // Update active language option
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.lang === currentLang) {
            opt.classList.add('active');
        }
    });
}

// Language switcher functionality
document.addEventListener('DOMContentLoaded', function() {
    const langToggle = document.getElementById('lang-toggle');
    const langMenu = document.getElementById('lang-menu');
    
    // Toggle language menu
    if (langToggle) {
        langToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            langMenu.classList.toggle('hidden');
        });
    }
    
    // Select language
    document.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', function() {
            currentLang = this.dataset.lang;
            localStorage.setItem('language', currentLang);
            document.documentElement.lang = currentLang;
            updateLanguage();
            langMenu.classList.add('hidden');
        });
    });
    
    // Set initial language attribute
    document.documentElement.lang = currentLang;
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!langToggle.contains(e.target) && !langMenu.contains(e.target)) {
            langMenu.classList.add('hidden');
        }
    });
    
    // Initialize language on page load
    updateLanguage();
    
    // Rotate question button
    const rotateButton = document.getElementById('rotate-question');
    if (rotateButton) {
        rotateButton.addEventListener('click', function(e) {
            e.preventDefault();
            rotateQuestion();
        });
    }
});

// Initialize game
function initGame() {
    // Find Evidi icon
    const evidiIcon = icons.find(i => i.name === 'Evidi');
    const erlendIcon = icons.find(i => i.name === 'Erlend Øien');
    const cathrineIcon = icons.find(i => i.name === 'Cathrine Wilhelmsen');
    
    // Debug: Check if icons are found
    if (!erlendIcon) {
        console.warn('Erlend Øien icon not found in icons array');
    }
    if (!cathrineIcon) {
        console.warn('Cathrine Wilhelmsen icon not found in icons array');
    }
    
    // Pick 2 random icons (excluding Evidi, Erlend, and Cathrine)
    const selected = [];
    const availableIcons = icons.filter(i => 
        i.name !== 'Evidi' && 
        i.name !== 'Erlend Øien' && 
        i.name !== 'Cathrine Wilhelmsen'
    );
    while (selected.length < 2) {
        const random = availableIcons[Math.floor(Math.random() * availableIcons.length)];
        if (!selected.includes(random)) {
            selected.push(random);
        }
    }
    
    // Create questions for first 2 icons
    questions = selected.map(icon => {
        const wrong = icons.filter(i => 
            i.name !== icon.name && 
            i.name !== 'Evidi' && 
            i.name !== 'Erlend Øien' && 
            i.name !== 'Cathrine Wilhelmsen'
        )
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        const options = [icon.name, ...wrong.map(i => i.name)]
            .sort(() => Math.random() - 0.5);
        return { icon, options, correct: icon.name };
    });
    
    // Question 3: Either Erlend or Cathrine (randomly chosen)
    // Ensure both icons exist before random selection
    const thirdQuestionOptions = [];
    if (erlendIcon) thirdQuestionOptions.push(erlendIcon);
    if (cathrineIcon) thirdQuestionOptions.push(cathrineIcon);
    
    if (thirdQuestionOptions.length > 0) {
        const thirdQuestionIcon = thirdQuestionOptions[Math.floor(Math.random() * thirdQuestionOptions.length)];
        const wrong = icons.filter(i => 
            i.name !== thirdQuestionIcon.name && 
            i.name !== 'Evidi'
        )
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        const options = [thirdQuestionIcon.name, ...wrong.map(i => i.name)]
            .sort(() => Math.random() - 0.5);
        questions.push({
            icon: thirdQuestionIcon,
            options,
            correct: thirdQuestionIcon.name
        });
    }
    
    // Add Evidi as the 4th question with all 4 options as "Evidi"
    if (evidiIcon) {
        questions.push({
            icon: evidiIcon,
            options: ['Evidi', 'Evidi', 'Evidi', 'Evidi'],
            correct: 'Evidi'
        });
    }
    
    currentQuestion = 0;
    score = 0;
    showQuestion();
}

// Show question
function showQuestion() {
    if (currentQuestion >= questions.length) {
        showResult();
        return;
    }
    
    const q = questions[currentQuestion];
    document.getElementById('icon').src = q.icon.file;
    document.getElementById('question-num').textContent = currentQuestion + 1;
    document.getElementById('score').textContent = score;
    
    // Hide rotate button only on question 4 (Evidi)
    const rotateButton = document.getElementById('rotate-question');
    if (rotateButton) {
        if (currentQuestion === 3) {
            rotateButton.style.display = 'none';
        } else {
            rotateButton.style.display = 'flex';
        }
    }
    
    // Show presentation info for Erlend Øien or Cathrine Wilhelmsen
    const presentationInfo = document.getElementById('presentation-info');
    if (q.icon.name === 'Erlend Øien') {
        presentationInfo.innerHTML = `
            <div class="presentation-details">
                <strong>Erlend Øien</strong><br>
                is presenting on<br>
                <strong>Excel: Schrödinger's metadata database</strong><br>
                Room 1<br>
                4:00 pm - 4:45 pm
            </div>
        `;
        presentationInfo.classList.remove('hidden');
    } else if (q.icon.name === 'Cathrine Wilhelmsen') {
        presentationInfo.innerHTML = `
            <div class="presentation-details">
                <strong>Cathrine Wilhelmsen</strong><br>
                Data & Analytics Principal Consultant,<br>
                Evidi<br>
                Tech Lead & Microsoft MVP
            </div>
        `;
        presentationInfo.classList.remove('hidden');
    } else {
        presentationInfo.classList.add('hidden');
    }
    
    // Update question label with translation
    const questionLabel = document.querySelector('.question h2');
    if (questionLabel) {
        questionLabel.innerHTML = `${t('question')} <span id="question-num">${currentQuestion + 1}</span> ${t('of')} 4`;
    }
    
    // Update score label with translation
    const scoreLabel = document.querySelector('.score');
    if (scoreLabel) {
        scoreLabel.innerHTML = `${t('score')}: <span id="score">${score}</span>/4`;
    }
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    
    q.options.forEach(option => {
        const btn = document.createElement('div');
        btn.className = 'option';
        btn.textContent = option;
        btn.onclick = () => selectAnswer(option);
        optionsDiv.appendChild(btn);
    });
}

// Rotate to a new question
function rotateQuestion() {
    if (currentQuestion >= questions.length) return;
    
    // Don't allow rotating the 4th question (Evidi)
    if (currentQuestion === 3) {
        return;
    }
    
    // Special handling for question 3: rotate between Erlend and Cathrine
    if (currentQuestion === 2) {
        const erlendIcon = icons.find(i => i.name === 'Erlend Øien');
        const cathrineIcon = icons.find(i => i.name === 'Cathrine Wilhelmsen');
        const currentIcon = questions[currentQuestion].icon;
        
        // Switch to the other one
        const newIcon = currentIcon.name === 'Erlend Øien' ? cathrineIcon : erlendIcon;
        
        if (newIcon) {
            const wrong = icons.filter(i => 
                i.name !== newIcon.name && 
                i.name !== 'Evidi'
            )
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);
            const options = [newIcon.name, ...wrong.map(i => i.name)]
                .sort(() => Math.random() - 0.5);
            
            questions[currentQuestion] = { icon: newIcon, options, correct: newIcon.name };
            showQuestion();
        }
        return;
    }
    
    // Get icons already used in other questions (to avoid duplicates)
    const usedIcons = questions
        .map((q, idx) => idx !== currentQuestion ? q.icon.name : null)
        .filter(name => name !== null);
    
    // Pick a new random icon that's not already used (excluding Evidi, Erlend, and Cathrine)
    const availableIcons = icons.filter(i => 
        !usedIcons.includes(i.name) && 
        i.name !== 'Evidi' && 
        i.name !== 'Erlend Øien' && 
        i.name !== 'Cathrine Wilhelmsen'
    );
    
    if (availableIcons.length === 0) {
        // If all icons are used, allow any icon except Evidi, Erlend, and Cathrine
        const allowedIcons = icons.filter(i => 
            i.name !== 'Evidi' && 
            i.name !== 'Erlend Øien' && 
            i.name !== 'Cathrine Wilhelmsen'
        );
        const newIcon = allowedIcons[Math.floor(Math.random() * allowedIcons.length)];
        const wrong = icons.filter(i => 
            i.name !== newIcon.name && 
            i.name !== 'Evidi' && 
            i.name !== 'Erlend Øien' && 
            i.name !== 'Cathrine Wilhelmsen'
        )
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        const options = [newIcon.name, ...wrong.map(i => i.name)]
            .sort(() => Math.random() - 0.5);
        
        questions[currentQuestion] = { icon: newIcon, options, correct: newIcon.name };
    } else {
        const newIcon = availableIcons[Math.floor(Math.random() * availableIcons.length)];
        const wrong = icons.filter(i => 
            i.name !== newIcon.name && 
            i.name !== 'Evidi' && 
            i.name !== 'Erlend Øien' && 
            i.name !== 'Cathrine Wilhelmsen'
        )
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        const options = [newIcon.name, ...wrong.map(i => i.name)]
            .sort(() => Math.random() - 0.5);
        
        questions[currentQuestion] = { icon: newIcon, options, correct: newIcon.name };
    }
    
    showQuestion();
}

// Select answer
function selectAnswer(selected) {
    const q = questions[currentQuestion];
    const options = document.querySelectorAll('.option');
    
    options.forEach(opt => {
        opt.onclick = null;
        if (opt.textContent === q.correct) {
            opt.classList.add('correct');
        } else if (opt.textContent === selected && selected !== q.correct) {
            opt.classList.add('wrong');
        }
    });
    
    if (selected === q.correct) {
        score++;
    }
    
    // Update score display immediately
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = score;
    }
    const scoreLabel = document.querySelector('.score');
    if (scoreLabel) {
        scoreLabel.innerHTML = `${t('score')}: <span id="score">${score}</span>/4`;
    }
    
    setTimeout(() => {
        currentQuestion++;
        showQuestion();
    }, 1500);
}

// Show result
async function showResult() {
    // Hide question and options immediately
    const questionDiv = document.querySelector('.question');
    const optionsDiv = document.getElementById('options');
    const iconElement = document.getElementById('icon');
    
    if (questionDiv) questionDiv.classList.add('hidden');
    if (optionsDiv) optionsDiv.classList.add('hidden');
    if (iconElement) iconElement.style.display = 'none';
    
    // Update score display one final time
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = score;
    }
    
    const scoreLabel = document.querySelector('.score');
    if (scoreLabel) {
        scoreLabel.innerHTML = `${t('score')}: <span id="score">${score}</span>/4`;
    }
    
    // Show result div
    const resultDiv = document.getElementById('result');
    if (resultDiv) resultDiv.classList.remove('hidden');
    
    const resultText = document.getElementById('result-text');
    if (resultText) {
        if (score >= 3) {
            resultText.innerHTML = t('winMessage', { score: score }).replace(/\n/g, '<br>');
            // Trigger confetti celebration
            triggerConfetti();
        } else {
            resultText.textContent = t('loseMessage', { score: score });
        }
    }
    
    // Save game result to database
    if (userEmail) {
        try {
            const response = await fetch('/api/save-game-result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    score: score
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`Game result saved: Score=${score}, Qualified=${result.qualifiedForRaffle}`);
            } else {
                const error = await response.json();
                console.warn(`Failed to save game result: ${error.error || 'Unknown error'}`);
                // Don't show error to user - game already completed
            }
        } catch (error) {
            console.warn(`Error saving game result: ${error.message}`);
            // Don't show error to user - game already completed
        }
    }
}

// Form submission
document.getElementById('user-form').onsubmit = async function(e) {
    e.preventDefault();
    
    // Prevent double-clicking
    if (isSubmitting) {
        return;
    }
    
    isSubmitting = true;
    const submitButton = document.querySelector('.submit-button');
    submitButton.disabled = true;
    
    const userName = document.getElementById('name').value.trim();
    userEmail = document.getElementById('email').value.trim(); // Set global userEmail
    const fabricExperience = document.querySelector('input[name="fabricExperience"]:checked')?.value || '';
    const description = document.querySelector('input[name="description"]:checked')?.value || '';
    const canContact = document.querySelector('input[name="canContact"]:checked')?.value || '';
    const errorDiv = document.getElementById('error-message');
    
    // Validate all fields
    if (!userName || !userEmail || !fabricExperience || !description || !canContact) {
        errorDiv.textContent = t('pleaseFillAll');
        errorDiv.className = 'error-message';
        errorDiv.style.display = 'block';
        isSubmitting = false;
        submitButton.disabled = false;
        return;
    }
    
    // Save to database
    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: userName,
                email: userEmail,
                fabricExperience: fabricExperience,
                description: description,
                canContact: canContact
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save');
        }
        
        // Success - show success message if enabled
        await response.json();
        // userEmail is already set from the form
        if (SHOW_SAVE_MESSAGES) {
            errorDiv.textContent = t('dataSaved');
            errorDiv.className = 'success-message';
            errorDiv.style.display = 'block';
        }
        
        // Wait a moment to show success (if enabled), then start game
        setTimeout(() => {
            document.getElementById('form-container').classList.add('hidden');
            document.getElementById('game-container').classList.remove('hidden');
            initGame();
        }, SHOW_SAVE_MESSAGES ? 1500 : 0);
        
        return; // Exit early on success
    } catch (error) {
        // Show error message prominently if enabled
        if (SHOW_SAVE_MESSAGES) {
            errorDiv.textContent = t('saveError');
            errorDiv.className = 'error-message';
            errorDiv.style.display = 'block';
        }
        console.log('Error saving:', error);
        
        // Still allow game to start after showing error (if enabled)
        setTimeout(() => {
            document.getElementById('form-container').classList.add('hidden');
            document.getElementById('game-container').classList.remove('hidden');
            initGame();
        }, SHOW_SAVE_MESSAGES ? 2000 : 0);
        
        // Note: We don't reset isSubmitting here since the form will be hidden anyway
        return; // Exit early on error
    }
};

// Email check form submission
document.getElementById('email-form').onsubmit = async function(e) {
    e.preventDefault();
    
    // Prevent double-clicking
    if (isCheckingEmail) {
        return;
    }
    
    isCheckingEmail = true;
    const submitButton = document.querySelector('#email-form .submit-button');
    submitButton.disabled = true;
    
    const email = document.getElementById('check-email').value.trim();
    const errorDiv = document.getElementById('email-error-message');
    
    // Validate email
    if (!email) {
        errorDiv.textContent = t('pleaseEnterEmail');
        errorDiv.className = 'error-message';
        errorDiv.style.display = 'block';
        isCheckingEmail = false;
        submitButton.disabled = false;
        return;
    }
    
    // Check if email exists
    try {
        const response = await fetch('/api/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to check email');
        }
        
        const result = await response.json();
        
        if (result.exists) {
            // Email exists - go directly to game
            userEmail = email; // Store email for game result saving
            errorDiv.textContent = t('welcomeBack');
            errorDiv.className = 'success-message';
            errorDiv.style.display = 'block';
            
            setTimeout(() => {
                document.getElementById('email-container').classList.add('hidden');
                document.getElementById('game-container').classList.remove('hidden');
                initGame();
            }, 1000);
        } else {
            // Email doesn't exist - show registration form
            userEmail = email; // Store email for game result saving
            document.getElementById('email').value = email;
            document.getElementById('email-from-check').textContent = t('emailFromCheck', { email: email });
            document.getElementById('email-from-check').style.display = 'block';
            document.getElementById('welcome-text').textContent = t('registrationWelcome');
            
            document.getElementById('email-container').classList.add('hidden');
            document.getElementById('form-container').classList.remove('hidden');
            isCheckingEmail = false;
            submitButton.disabled = false;
        }
        
    } catch (error) {
        errorDiv.textContent = t('emailNotFound');
        errorDiv.className = 'error-message';
        errorDiv.style.display = 'block';
        console.log('Error checking email:', error);
        isCheckingEmail = false;
        submitButton.disabled = false;
    }
};

// Play again - return to email entry
document.getElementById('play-again').onclick = function() {
    // Stop confetti when playing again
    stopConfetti();
    
    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('result').classList.add('hidden');
    const questionDiv = document.querySelector('.question');
    if (questionDiv) questionDiv.classList.remove('hidden');
    const optionsDiv = document.getElementById('options');
    if (optionsDiv) optionsDiv.classList.remove('hidden');
    const iconElement = document.getElementById('icon');
    if (iconElement) iconElement.style.display = '';
    document.getElementById('email-container').classList.remove('hidden');
    document.getElementById('check-email').value = '';
    document.getElementById('email-error-message').style.display = 'none';
    
    // Reset form state
    isCheckingEmail = false;
    isSubmitting = false;
    
    // Re-enable the submit button
    const submitButton = document.querySelector('#email-form .submit-button');
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.style.opacity = '1';
        submitButton.style.cursor = 'pointer';
    }
    
    updateLanguage();
};
