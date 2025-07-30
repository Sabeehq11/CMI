import { adminDb } from '../lib/firebase/admin'

async function initializeFirebase() {
  console.log('Initializing Firebase with sample data...')

  try {
    // Add sample rubric
    const rubricRef = await adminDb.collection('rubrics').add({
      name: 'Basic English Conversation',
      language: 'en',
      criteria: [
        {
          name: 'Accuracy',
          weight: 0.3,
          description: 'Grammar, vocabulary, and pronunciation correctness',
          levels: [
            { score: 100, description: 'Near-native accuracy with minimal errors' },
            { score: 80, description: 'Good accuracy with occasional minor errors' },
            { score: 60, description: 'Generally accurate with some noticeable errors' },
            { score: 40, description: 'Frequent errors but message is understandable' },
            { score: 20, description: 'Many errors that impede understanding' }
          ]
        },
        {
          name: 'Fluency',
          weight: 0.3,
          description: 'Speech flow, pace, and natural expression',
          levels: [
            { score: 100, description: 'Natural, smooth flow like a native speaker' },
            { score: 80, description: 'Generally fluent with minor hesitations' },
            { score: 60, description: 'Some pauses and hesitations but maintains flow' },
            { score: 40, description: 'Frequent pauses and slow speech' },
            { score: 20, description: 'Very hesitant and fragmented speech' }
          ]
        },
        {
          name: 'Content',
          weight: 0.4,
          description: 'Relevance, depth, and coherence of responses',
          levels: [
            { score: 100, description: 'Highly relevant, detailed, and well-organized' },
            { score: 80, description: 'Relevant and coherent with good detail' },
            { score: 60, description: 'Generally relevant with adequate detail' },
            { score: 40, description: 'Basic relevance but lacks detail' },
            { score: 20, description: 'Minimal relevance or very limited content' }
          ]
        }
      ],
      createdAt: new Date()
    })

    console.log('Sample rubric created:', rubricRef.id)

    // Add sample questions
    const questions = [
      {
        topic: 'Daily Life',
        language: 'en',
        difficulty: 'beginner',
        questionText: 'Can you describe your typical morning routine?',
        createdAt: new Date()
      },
      {
        topic: 'Daily Life',
        language: 'en',
        difficulty: 'intermediate',
        questionText: 'How has your daily routine changed over the past year, and what caused these changes?',
        createdAt: new Date()
      },
      {
        topic: 'Work/Study',
        language: 'en',
        difficulty: 'beginner',
        questionText: 'What do you study or what is your job?',
        createdAt: new Date()
      },
      {
        topic: 'Work/Study',
        language: 'en',
        difficulty: 'intermediate',
        questionText: 'What are the main challenges you face in your work or studies?',
        createdAt: new Date()
      },
      {
        topic: 'Future Plans',
        language: 'en',
        difficulty: 'advanced',
        questionText: 'Where do you see yourself professionally in five years, and what steps are you taking to achieve those goals?',
        createdAt: new Date()
      }
    ]

    for (const question of questions) {
      const questionRef = await adminDb.collection('questions').add(question)
      console.log('Sample question created:', questionRef.id)
    }

    console.log('✅ Firebase initialization complete!')
    console.log('You can now use the CMI application with Firebase backend.')

  } catch (error) {
    console.error('❌ Error initializing Firebase:', error)
    process.exit(1)
  }
}

// Run the initialization
initializeFirebase().then(() => {
  process.exit(0)
}) 