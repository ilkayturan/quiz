// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    answers.loadFromCookies();
    updateProgressBar();
});

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

// Show question function
function showQuestion(index) {
    const question = questions[index];
    const container = document.getElementById('question-screen');
    const questionText = document.getElementById('question-text');
    const answerContainer = document.getElementById('answer-container');
    const questionImage = document.getElementById('question-image');

    // Update question text and image
    questionText.textContent = question.question;
    questionImage.src = question.image;

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
        case 'drag-drop':
            createDragDrop(question, answerContainer);
            break;
        case 'fill-blanks':
            createFillBlanks(question, answerContainer);
            break;
    }

    // Update navigation buttons
    document.getElementById('prev-btn').disabled = index === 0;
    document.getElementById('next-btn').disabled = !answers.getAnswer(index);
    updateProgressBar();
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

// Create drag and drop
function createDragDrop(question, container) {
    const dragContainer = document.createElement('div');
    dragContainer.className = 'drag-container';

    const sourceDiv = document.createElement('div');
    sourceDiv.className = 'drag-source';
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
