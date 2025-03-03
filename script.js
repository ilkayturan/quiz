// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    answers.loadFromCookies();
    updateProgressBar();
    updateQuestionProgress();
    preloadImages();
});

// Preload images
const preloadedImages = new Map();

async function preloadImages() {
    const welcomeImage = document.getElementById('welcome-image');
    
    // Load welcome image
    await loadImage(welcomeImage.src).then(() => {
        welcomeImage.classList.add('loaded');
    });

    // Preload question images
    for (let i = 0; i < questions.length; i++) {
        const imageUrl = `https://picsum.photos/800/400?random=${i + 1}`;
        await loadImage(imageUrl).then(() => {
            preloadedImages.set(i, imageUrl);
        });
    }
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Start survey function
function startSurvey() {
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('question-screen').style.display = 'block';
    showQuestion(answers.currentQuestion);
}

// Update progress bar
function updateProgressBar() {
    const progress = (answers.currentQuestion / questions.length) * 100;
    document.querySelector('.progress').style.width = `${progress}%`;
}

// Update question progress indicators
function updateQuestionProgress() {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'question-progress';
    
    questions.forEach((_, index) => {
        // Add circle
        const progressItem = document.createElement('div');
        progressItem.className = 'question-progress-item';
        if (index === answers.currentQuestion) {
            progressItem.classList.add('current');
        } else if (answers.getAnswer(index)) {
            progressItem.classList.add('answered');
        }
        progressItem.textContent = index + 1;
        progressContainer.appendChild(progressItem);

        // Add line after circle (except for last item)
        if (index < questions.length - 1) {
            const line = document.createElement('div');
            line.className = 'progress-line';
            if (answers.getAnswer(index)) {
                line.classList.add('completed');
            }
            progressContainer.appendChild(line);
        }
    });

    const existingProgress = document.querySelector('.question-progress');
    if (existingProgress) {
        existingProgress.replaceWith(progressContainer);
    } else {
        document.querySelector('.question-container').prepend(progressContainer);
    }
}

// Show question function
async function showQuestion(index) {
    const question = questions[index];
    const container = document.getElementById('question-screen');
    const questionText = document.getElementById('question-text');
    const answerContainer = document.getElementById('answer-container');
    const questionImage = document.getElementById('question-image');

    // Fade out current content
    questionText.style.opacity = '0';
    answerContainer.style.opacity = '0';
    questionImage.style.opacity = '0';

    // Update question text and image
    setTimeout(async () => {
        questionText.textContent = question.question;
        
        // Use preloaded image if available
        const imageUrl = preloadedImages.get(index) || question.image;
        if (!preloadedImages.has(index)) {
            await loadImage(imageUrl);
            preloadedImages.set(index, imageUrl);
        }
        questionImage.src = imageUrl;

        // Clear previous answers
        answerContainer.innerHTML = '';

        // Create appropriate input based on question type
        switch (question.type) {
            case 'multiple-choice':
            case 'radio':
                createChoiceInput(question, answerContainer);
                break;
            case 'text':
                createTextInput(question, answerContainer);
                break;
            case 'drag-order':
                createDragOrder(question, answerContainer);
                break;
            case 'drag-select':
                createDragSelect(question, answerContainer);
                break;
            case 'fill-blanks':
                createFillBlanks(question, answerContainer);
                break;
        }

        // Fade in new content
        questionText.style.opacity = '1';
        answerContainer.style.opacity = '1';
        questionImage.style.opacity = '1';

        // Update navigation buttons
        document.getElementById('prev-btn').disabled = index === 0;
        document.getElementById('next-btn').disabled = !answers.getAnswer(index);
        updateProgressBar();
        updateQuestionProgress();
    }, 300);
}

// Create choice input (multiple-choice and radio)
function createChoiceInput(question, container) {
    const type = question.type === 'radio' ? 'radio' : 'checkbox';
    question.options.forEach((option, i) => {
        const div = document.createElement('div');
        div.className = 'answer-option';
        div.innerHTML = `
            <input type="${type}" id="option${i}" name="answer" value="${option}">
            <label for="option${i}">${option}</label>
        `;
        container.appendChild(div);

        // Check if this option was previously selected
        const savedAnswer = answers.getAnswer(answers.currentQuestion);
        if (savedAnswer) {
            const input = div.querySelector('input');
            if (type === 'radio') {
                input.checked = savedAnswer === option;
            } else {
                input.checked = savedAnswer.includes(option);
            }
        }
    });

    // Add event listeners
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            if (type === 'radio') {
                answers.setAnswer(answers.currentQuestion, input.value);
            } else {
                const selected = Array.from(inputs)
                    .filter(i => i.checked)
                    .map(i => i.value);
                answers.setAnswer(answers.currentQuestion, selected);
            }
            document.getElementById('next-btn').disabled = false;
        });
    });
}

// Create text input
function createTextInput(question, container) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'text-input';
    input.placeholder = question.placeholder;
    container.appendChild(input);

    // Set saved value if exists
    const savedAnswer = answers.getAnswer(answers.currentQuestion);
    if (savedAnswer) {
        input.value = savedAnswer;
    }

    // Add event listener
    input.addEventListener('input', () => {
        answers.setAnswer(answers.currentQuestion, input.value);
        document.getElementById('next-btn').disabled = !input.value.trim();
    });
}

// Create drag and drop for ordering
function createDragOrder(question, container) {
    const dragContainer = document.createElement('div');
    dragContainer.className = 'drag-container';

    const targetDiv = document.createElement('div');
    targetDiv.className = 'drag-target';

    // Initialize items
    let items = question.items;
    const savedAnswer = answers.getAnswer(answers.currentQuestion);
    if (savedAnswer) {
        items = savedAnswer;
    }

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'draggable-item';
        itemDiv.draggable = true;
        itemDiv.textContent = item;

        // Add drag events
        itemDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item);
            setTimeout(() => itemDiv.classList.add('dragging'), 0);
        });

        itemDiv.addEventListener('dragend', () => {
            itemDiv.classList.remove('dragging');
            const newOrder = Array.from(targetDiv.children).map(child => child.textContent);
            answers.setAnswer(answers.currentQuestion, newOrder);
            document.getElementById('next-btn').disabled = newOrder.length === 0;
        });

        targetDiv.appendChild(itemDiv);
    });

    // Add drop zone events
    targetDiv.addEventListener('dragover', (e) => {
        e.preventDefault();
        const dragging = container.querySelector('.dragging');
        const siblings = Array.from(targetDiv.children).filter(child => child !== dragging);
        const nextSibling = siblings.find(sibling => {
            const rect = sibling.getBoundingClientRect();
            return e.clientY < rect.top + rect.height / 2;
        });
        targetDiv.insertBefore(dragging, nextSibling);
    });

    dragContainer.appendChild(targetDiv);
    container.appendChild(dragContainer);
}

// Create drag and drop for selection
function createDragSelect(question, container) {
    const dragContainer = document.createElement('div');
    dragContainer.className = 'drag-container';

    const sourceDiv = document.createElement('div');
    sourceDiv.className = 'drag-source';
    const targetDiv = document.createElement('div');
    targetDiv.className = 'drag-target';

    // Add selection limit indicator
    const limitIndicator = document.createElement('div');
    limitIndicator.className = 'selection-limit';
    limitIndicator.textContent = `Select up to ${question.maxSelections} items`;
    dragContainer.appendChild(limitIndicator);

    // Initialize items
    const savedAnswer = answers.getAnswer(answers.currentQuestion) || [];
    
    // Create source items
    question.sourceItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'draggable-item';
        itemDiv.draggable = true;
        itemDiv.textContent = item;
        itemDiv.dataset.item = item;

        // Add drag events
        itemDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item);
            setTimeout(() => itemDiv.classList.add('dragging'), 0);
        });

        itemDiv.addEventListener('dragend', () => {
            itemDiv.classList.remove('dragging');
            updateSelectionAnswer();
        });

        sourceDiv.appendChild(itemDiv);
    });

    // Create target items from saved answer
    savedAnswer.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'draggable-item';
        itemDiv.draggable = true;
        itemDiv.textContent = item;
        itemDiv.dataset.item = item;

        // Add drag events
        itemDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item);
            setTimeout(() => itemDiv.classList.add('dragging'), 0);
        });

        itemDiv.addEventListener('dragend', () => {
            itemDiv.classList.remove('dragging');
            updateSelectionAnswer();
        });

        targetDiv.appendChild(itemDiv);
    });

    // Add drop zone events
    targetDiv.addEventListener('dragover', (e) => {
        e.preventDefault();
        const dragging = container.querySelector('.dragging');
        if (dragging && targetDiv.children.length < question.maxSelections) {
            targetDiv.classList.add('drag-over');
        }
    });

    targetDiv.addEventListener('dragleave', () => {
        targetDiv.classList.remove('drag-over');
    });

    targetDiv.addEventListener('drop', (e) => {
        e.preventDefault();
        targetDiv.classList.remove('drag-over');
        const dragging = container.querySelector('.dragging');
        if (dragging && targetDiv.children.length < question.maxSelections) {
            targetDiv.appendChild(dragging);
            updateSelectionAnswer();
        }
    });

    function updateSelectionAnswer() {
        const selectedItems = Array.from(targetDiv.children).map(item => item.textContent);
        answers.setAnswer(answers.currentQuestion, selectedItems);
        document.getElementById('next-btn').disabled = selectedItems.length === 0;
        
        // Update limit indicator
        limitIndicator.textContent = `Selected ${selectedItems.length} of ${question.maxSelections} items`;
        limitIndicator.className = `selection-limit ${selectedItems.length >= question.maxSelections ? 'limit-reached' : ''}`;
    }

    dragContainer.appendChild(sourceDiv);
    dragContainer.appendChild(targetDiv);
    container.appendChild(dragContainer);
}

// Create fill in the blanks
function createFillBlanks(question, container) {
    const textParts = question.text.split(/{{|}}/);
    const div = document.createElement('div');
    div.className = 'fill-blanks';

    textParts.forEach((part, i) => {
        if (i % 2 === 0) {
            div.appendChild(document.createTextNode(part));
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'text-input';
            input.placeholder = question.blanks[(i - 1) / 2];
            
            // Set saved value if exists
            const savedAnswer = answers.getAnswer(answers.currentQuestion);
            if (savedAnswer && savedAnswer[(i - 1) / 2]) {
                input.value = savedAnswer[(i - 1) / 2];
            }

            div.appendChild(input);
        }
    });

    container.appendChild(div);

    // Add event listeners to all inputs
    const inputs = div.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const values = Array.from(inputs).map(input => input.value.trim());
            answers.setAnswer(answers.currentQuestion, values);
            document.getElementById('next-btn').disabled = values.some(v => !v);
        });
    });
}

// Navigation functions
function previousQuestion() {
    if (answers.currentQuestion > 0) {
        answers.currentQuestion--;
        showQuestion(answers.currentQuestion);
    }
}

function nextQuestion() {
    if (answers.currentQuestion < questions.length - 1) {
        answers.currentQuestion++;
        showQuestion(answers.currentQuestion);
    } else {
        showResults();
    }
}

// Show results
function showResults() {
    document.getElementById('question-screen').style.display = 'none';
    document.getElementById('results-screen').style.display = 'block';
    
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '';

    questions.forEach((question, index) => {
        const answer = answers.getAnswer(index);
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        let answerText = '';
        if (Array.isArray(answer)) {
            answerText = answer.join(', ');
        } else if (typeof answer === 'string') {
            answerText = answer;
        }

        resultItem.innerHTML = `
            <h3>Question ${index + 1}: ${question.question}</h3>
            <p><strong>Your Answer:</strong> ${answerText}</p>
        `;
        resultsContainer.appendChild(resultItem);
    });
}

// Download results as PDF
function downloadResults() {
    const element = document.getElementById('results-container');
    const opt = {
        margin: 1,
        filename: 'survey-results.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
}

function createMultipleChoice(question, index) {
    const container = document.createElement('div');
    question.options.forEach((option, optionIndex) => {
        const div = document.createElement('div');
        div.className = 'answer-option';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `option-${index}-${optionIndex}`;
        input.name = `question-${index}`;
        
        const label = document.createElement('label');
        label.htmlFor = `option-${index}-${optionIndex}`;
        label.textContent = option;
        
        div.appendChild(input);
        div.appendChild(label);
        container.appendChild(div);
    });
    return container;
}

function createRadioChoice(question, index) {
    const container = document.createElement('div');
    question.options.forEach((option, optionIndex) => {
        const div = document.createElement('div');
        div.className = 'answer-option';
        
        const input = document.createElement('input');
        input.type = 'radio';
        input.id = `option-${index}-${optionIndex}`;
        input.name = `question-${index}`;
        
        const label = document.createElement('label');
        label.htmlFor = `option-${index}-${optionIndex}`;
        label.textContent = option;
        
        div.appendChild(input);
        div.appendChild(label);
        container.appendChild(div);
    });
    return container;
}

// Go back to start
function goToStart() {
    // Reset answers
    answers.currentQuestion = 0;
    answers.responses = new Array(questions.length).fill(null);
    
    // Clear cookies
    questions.forEach((_, index) => {
        document.cookie = `quiz_response_${index}=; max-age=0`;
    });
    
    // Hide results screen and show welcome screen
    document.getElementById('results-screen').style.display = 'none';
    document.getElementById('welcome-screen').style.display = 'block';
    
    // Reset progress
    document.querySelector('.progress').style.width = '0%';
}

// Add transition styles to the first elements that need them
const transitionStyles = `
    #question-text, #answer-container, #question-image {
        transition: opacity 0.3s ease;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = transitionStyles;
document.head.appendChild(styleSheet);
