// Simple game data - using available icons
const icons = [
    { file: '/static/icons/copilot_24_regular.svg', name: 'Copilot' },
    { file: '/static/icons/data_factory_24_regular.svg', name: 'Data Factory' },
    { file: '/static/icons/data_warehouse_24_regular.svg', name: 'Data Warehouse' },
    { file: '/static/icons/database_sql_24_regular.svg', name: 'Database SQL' },
    { file: '/static/icons/fabric_24_regular.svg', name: 'Fabric' },
    { file: '/static/icons/data_engineering_24_regular.svg', name: 'Data Engineering' },
    { file: '/static/icons/data_science_24_regular.svg', name: 'Data Science' }
];

let score = 0;
let currentQuestion = 0;
let questions = [];
let userName = '';
let userEmail = '';

// Initialize game
function initGame() {
    // Pick 3 random icons
    const selected = [];
    while (selected.length < 3) {
        const random = icons[Math.floor(Math.random() * icons.length)];
        if (!selected.includes(random)) {
            selected.push(random);
        }
    }
    
    // Create questions
    questions = selected.map(icon => {
        const wrong = icons.filter(i => i.name !== icon.name)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        const options = [icon.name, ...wrong.map(i => i.name)]
            .sort(() => Math.random() - 0.5);
        return { icon, options, correct: icon.name };
    });
    
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
    
    setTimeout(() => {
        currentQuestion++;
        showQuestion();
    }, 1500);
}

// Show result
function showResult() {
    document.getElementById('question').classList.add('hidden');
    document.getElementById('options').classList.add('hidden');
    document.getElementById('result').classList.remove('hidden');
    
    const resultText = document.getElementById('result-text');
    if (score === 3) {
        resultText.textContent = '🎉 Perfect! You got all 3 correct!';
    } else {
        resultText.textContent = `You got ${score} out of 3 correct.`;
    }
}

// Form submission
document.getElementById('user-form').onsubmit = async function(e) {
    e.preventDefault();
    
    userName = document.getElementById('name').value.trim();
    userEmail = document.getElementById('email').value.trim();
    const fabricExperience = document.querySelector('input[name="fabricExperience"]:checked')?.value || '';
    const description = document.querySelector('input[name="description"]:checked')?.value || '';
    const canContact = document.querySelector('input[name="canContact"]:checked')?.value || '';
    const errorDiv = document.getElementById('error-message');
    
    // Validate all fields
    if (!userName || !userEmail || !fabricExperience || !description || !canContact) {
        errorDiv.textContent = 'Please fill in all fields';
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
        
        // Success - show success message
        const result = await response.json();
        errorDiv.textContent = '✅ Data saved successfully!';
        errorDiv.className = 'success-message';
        errorDiv.style.display = 'block';
        
        // Wait a moment to show success, then start game
        setTimeout(() => {
            document.getElementById('form-container').classList.add('hidden');
            document.getElementById('game-container').classList.remove('hidden');
            initGame();
        }, 1500);
        
        return; // Exit early on success
    } catch (error) {
        // Show error message prominently
        errorDiv.textContent = '⚠️ Could not save your data to the database. You can still play the game!';
        errorDiv.className = 'error-message';
        errorDiv.style.display = 'block';
        console.log('Error saving:', error);
        
        // Still allow game to start after showing error
        setTimeout(() => {
            document.getElementById('form-container').classList.add('hidden');
            document.getElementById('game-container').classList.remove('hidden');
            initGame();
        }, 2000);
        
        return; // Exit early on error
    }
};

// Play again
document.getElementById('play-again').onclick = function() {
    document.getElementById('result').classList.add('hidden');
    document.getElementById('question').classList.remove('hidden');
    document.getElementById('options').classList.remove('hidden');
    initGame();
};
