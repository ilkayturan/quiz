const questions = [
    {
        type: 'multiple-choice',
        question: 'What is your preferred way of learning?',
        image: 'https://picsum.photos/600/300?random=1',
        options: [
            'Visual (images, diagrams)',
            'Auditory (listening, discussing)',
            'Reading/Writing',
            'Kinesthetic (hands-on practice)'
        ]
    },
    {
        type: 'radio',
        question: 'How many hours do you spend learning each day?',
        image: 'https://picsum.photos/600/300?random=2',
        options: [
            'Less than 1 hour',
            '1-2 hours',
            '2-4 hours',
            'More than 4 hours'
        ]
    },
    {
        type: 'text',
        question: 'What specific skills would you like to develop?',
        image: 'https://picsum.photos/600/300?random=3',
        placeholder: 'Enter your answer here...'
    },
    {
        type: 'drag-drop',
        question: 'Order these learning methods from most effective (top) to least effective (bottom) for you:',
        image: 'https://picsum.photos/600/300?random=4',
        items: [
            'Practice exercises',
            'Video tutorials',
            'Reading documentation',
            'Group discussions'
        ]
    },
    {
        type: 'fill-blanks',
        question: 'Complete the following sentence:',
        image: 'https://picsum.photos/600/300?random=5',
        text: 'I learn best when I study in the {{time}} at {{place}} while {{activity}}.',
        blanks: ['time', 'place', 'activity']
    }
];

// Store to track answers
const answers = {
    currentQuestion: 0,
    responses: new Array(questions.length).fill(null),
    setAnswer: function(index, answer) {
        this.responses[index] = answer;
        // Save to cookie
        document.cookie = `quiz_response_${index}=${JSON.stringify(answer)}; max-age=86400`;
    },
    getAnswer: function(index) {
        return this.responses[index];
    },
    loadFromCookies: function() {
        document.cookie.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name.startsWith('quiz_response_')) {
                const index = parseInt(name.replace('quiz_response_', ''));
                try {
                    this.responses[index] = JSON.parse(value);
                } catch (e) {
                    console.error('Error parsing cookie:', e);
                }
            }
        });
    }
};
