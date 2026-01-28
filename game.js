// Game state
let currentQuestion = 0;
let score = 0;
let questions = [];
let currentQuestionData = null;
let userData = null; // Store user data after registration

// Icon data - mapping icon filenames to display names
const iconData = {
    'arrow_down_double_24_regular.svg': 'Arrow Down Double',
    'binoculars_24_regular.svg': 'Binoculars',
    'book_open_data_cloud_24_regular.svg': 'Book Open Data Cloud',
    'branch_fork_link_24_regular.svg': 'Branch Fork Link',
    'branch_fork_signal_24_regular.svg': 'Branch Fork Signal',
    'briefcase_report_24_regular.svg': 'Briefcase Report',
    'building_retail_more_link_24_regular.svg': 'Building Retail More Link',
    'calendar_month_link_24_regular.svg': 'Calendar Month Link',
    'calendar_month_person_24_regular.svg': 'Calendar Month Person',
    'calendar_month_prohibited_24_regular.svg': 'Calendar Month Prohibited',
    'calendar_month_signal_24_regular.svg': 'Calendar Month Signal',
    'copilot_24_regular.svg': 'Copilot',
    'data_bar_vertical_prohibited_24_regular.svg': 'Data Bar Vertical Prohibited',
    'data_engineering_24_regular.svg': 'Data Engineering',
    'data_factory_24_regular.svg': 'Data Factory',
    'data_science_24_regular.svg': 'Data Science',
    'data_warehouse_24_regular.svg': 'Data Warehouse',
    'database_arrow_forward_24_regular.svg': 'Database Arrow Forward',
    'database_kql_24_regular.svg': 'Database KQL',
    'database_sql_24_regular.svg': 'Database SQL',
    'database_stack_pulse_24_regular.svg': 'Database Stack Pulse',
    'databases_24_regular.svg': 'Databases',
    'diagram_branch_24_regular.svg': 'Diagram Branch',
    'diagram_branch_sync_24_regular.svg': 'Diagram Branch Sync',
    'document_multiple_checkmark_24_regular.svg': 'Document Multiple Checkmark',
    'document_one_page_multiple_text_24_regular.svg': 'Document One Page Multiple Text',
    'document_pq_24_regular.svg': 'Document PQ',
    'fabric_24_regular.svg': 'Fabric',
    'folder_table_24_regular.svg': 'Folder Table',
    'function_set_24_regular.svg': 'Function Set'
};

// Initialize game
function initGame() {
    // Get all available icons
    const availableIcons = Object.keys(iconData);
    
    // Select 3 random icons for the quiz
    const selectedIcons = [];
    while (selectedIcons.length < 3) {
        const randomIcon = availableIcons[Math.floor(Math.random() * availableIcons.length)];
        if (!selectedIcons.includes(randomIcon)) {
            selectedIcons.push(randomIcon);
        }
    }
    
    // Create questions
    questions = selectedIcons.map(icon => {
        const correctAnswer = iconData[icon];
        const wrongAnswers = Object.values(iconData)
            .filter(name => name !== correctAnswer)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        
        const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
        
        return {
            icon: icon,
            correctAnswer: correctAnswer,
            options: options
        };
    });
    
    currentQuestion = 0;
    score = 0;
    loadQuestion();
}

// Load a question
function loadQuestion() {
    if (currentQuestion >= questions.length) {
        showResult();
        return;
    }
    
    currentQuestionData = questions[currentQuestion];
    const iconPath = `icons/${currentQuestionData.icon}`;
    
    // Update UI
    document.getElementById('icon-image').src = iconPath;
    document.getElementById('icon-image').alt = currentQuestionData.correctAnswer;
    document.getElementById('question-number').textContent = currentQuestion + 1;
    document.getElementById('score').textContent = score;
    
    // Clear feedback
    const feedback = document.getElementById('feedback');
    feedback.textContent = '';
    feedback.className = 'feedback';
    
    // Generate options
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    
    currentQuestionData.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option;
        button.onclick = () => selectAnswer(option);
        optionsContainer.appendChild(button);
    });
    
    // Hide next button
    document.getElementById('next-btn').classList.add('hidden');
    
    // Enable rotate button
    document.getElementById('rotate-btn').disabled = false;
}

// Rotate/change current question
function rotateQuestion() {
    if (currentQuestion >= questions.length) {
        return;
    }
    
    const availableIcons = Object.keys(iconData);
    const usedIcons = questions.map(q => q.icon);
    
    // Get icons not already used in the quiz
    const availableForRotation = availableIcons.filter(icon => !usedIcons.includes(icon));
    
    if (availableForRotation.length === 0) {
        // If all icons are used, allow reusing any icon except the current one
        const currentIcon = questions[currentQuestion].icon;
        const newIcon = availableIcons.filter(icon => icon !== currentIcon)[
            Math.floor(Math.random() * (availableIcons.length - 1))
        ];
        
        // Create new question with the new icon
        const correctAnswer = iconData[newIcon];
        const wrongAnswers = Object.values(iconData)
            .filter(name => name !== correctAnswer)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        
        const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
        
        questions[currentQuestion] = {
            icon: newIcon,
            correctAnswer: correctAnswer,
            options: options
        };
    } else {
        // Use an icon that hasn't been used yet
        const newIcon = availableForRotation[
            Math.floor(Math.random() * availableForRotation.length)
        ];
        
        // Create new question with the new icon
        const correctAnswer = iconData[newIcon];
        const wrongAnswers = Object.values(iconData)
            .filter(name => name !== correctAnswer)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        
        const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
        
        questions[currentQuestion] = {
            icon: newIcon,
            correctAnswer: correctAnswer,
            options: options
        };
    }
    
    // Reload the current question
    loadQuestion();
}

// Handle answer selection
function selectAnswer(selectedAnswer) {
    const buttons = document.querySelectorAll('.option-btn');
    const feedback = document.getElementById('feedback');
    const isCorrect = selectedAnswer === currentQuestionData.correctAnswer;
    
    // Disable all buttons
    buttons.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === currentQuestionData.correctAnswer) {
            btn.classList.add('correct');
        } else if (btn.textContent === selectedAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    // Disable rotate button
    document.getElementById('rotate-btn').disabled = true;
    
    // Show feedback
    if (isCorrect) {
        score++;
        feedback.textContent = '✓ Correct! Well done!';
        feedback.className = 'feedback correct';
    } else {
        feedback.textContent = `✗ Wrong! The correct answer is "${currentQuestionData.correctAnswer}"`;
        feedback.className = 'feedback incorrect';
    }
    
    // Update score
    document.getElementById('score').textContent = score;
    
    // Show next button
    document.getElementById('next-btn').classList.remove('hidden');
}

// Move to next question
function nextQuestion() {
    currentQuestion++;
    loadQuestion();
}

// Show result screen
function showResult() {
    document.getElementById('quiz-container').classList.add('hidden');
    const resultScreen = document.getElementById('result-screen');
    resultScreen.classList.remove('hidden');
    
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    
    if (score === 3) {
        resultTitle.textContent = '🎉 Congratulations!';
        resultMessage.textContent = `You got all ${score} questions correct! You're a Fabric Icons expert!`;
    } else if (score >= 2) {
        resultTitle.textContent = '👍 Great Job!';
        resultMessage.textContent = `You got ${score} out of 3 questions correct! Almost perfect!`;
    } else {
        resultTitle.textContent = '💪 Keep Trying!';
        resultMessage.textContent = `You got ${score} out of 3 questions correct. Practice makes perfect!`;
    }
}

// Restart game
function restartGame() {
    document.getElementById('quiz-container').classList.remove('hidden');
    document.getElementById('result-screen').classList.add('hidden');
    initGame();
}

// Event listeners
document.getElementById('next-btn').addEventListener('click', nextQuestion);
document.getElementById('restart-btn').addEventListener('click', restartGame);
document.getElementById('rotate-btn').addEventListener('click', rotateQuestion);

// Handle logo fallback
const logoImg = document.getElementById('evidi-logo-img');
const logoText = document.getElementById('evidi-logo-text');

if (logoImg) {
    logoImg.addEventListener('error', function() {
        logoImg.classList.add('hide');
        logoText.classList.add('show');
    });
    
    // Check if image loads successfully
    logoImg.addEventListener('load', function() {
        logoText.classList.remove('show');
    });
}

// Submit user data to Azure Function
async function submitUserData(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn');
    const errorDiv = document.getElementById('form-error');
    const form = document.getElementById('user-form');
    
    // Get form data
    const formData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        fabricExperience: document.querySelector('input[name="fabricExperience"]:checked')?.value || '',
        description: document.querySelector('input[name="description"]:checked')?.value || '',
        canContact: document.querySelector('input[name="canContact"]:checked')?.value || ''
    };
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    errorDiv.textContent = '';
    
    try {
        // Call Azure Function API
        // In production, replace with your Azure Function URL
        const apiUrl = '/api/SaveUserData'; // Azure Static Web Apps automatically routes to Functions
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Store user data
        userData = formData;
        
        // Hide form and show game
        document.getElementById('registration-form').classList.add('hidden');
        document.getElementById('game-wrapper').classList.remove('hidden');
        
        // Start the game
        initGame();
        
    } catch (error) {
        console.error('Error submitting data:', error);
        errorDiv.textContent = 'Failed to submit. You can still play, but your data won\'t be saved.';
        
        // Allow user to continue anyway
        setTimeout(() => {
            userData = formData; // Store locally anyway
            document.getElementById('registration-form').classList.add('hidden');
            document.getElementById('game-wrapper').classList.remove('hidden');
            initGame();
        }, 2000);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Start Game';
    }
}

// Game starts after form submission (see submitUserData function)
