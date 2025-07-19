// Test script to create a question set for the Response Portal
// Run this in your browser console on your site

// Create a test question set
const questionSet = {
  title: "Software Engineer Follow-up Questions",
  questions: [
    {
      text: "Describe a challenging technical problem you solved recently and walk me through your approach.",
      order: 1
    },
    {
      text: "How do you stay current with new technologies and programming trends?",
      order: 2
    },
    {
      text: "Tell me about a time when you had to debug a complex issue. What tools and strategies did you use?",
      order: 3
    }
  ],
  createdBy: "test-recruiter@company.com",
  expiresInHours: 48
};

// Import the ResponsePortalManager (you'll need to do this in your app)
// For testing, you can create the question set manually:

const token = 'resp_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
const id = 'qs_' + Math.random().toString(36).substr(2, 9);

const testQuestionSet = {
  id,
  token,
  title: questionSet.title,
  questions: questionSet.questions.map((q, index) => ({
    id: `q_${index}_${Math.random().toString(36).substr(2, 6)}`,
    text: q.text,
    order: q.order
  })),
  createdBy: questionSet.createdBy,
  createdAt: Date.now(),
  expiresAt: Date.now() + (48 * 60 * 60 * 1000), // 48 hours
  isActive: true
};

// Store it in localStorage
const existingSets = JSON.parse(localStorage.getItem('realcv_question_sets') || '[]');
const updatedSets = [...existingSets, testQuestionSet];
localStorage.setItem('realcv_question_sets', JSON.stringify(updatedSets));

console.log('✅ Test question set created!');
console.log('🔗 Candidate URL:', `${window.location.origin}/respond/${token}`);
console.log('📋 Token:', token);

// Copy URL to clipboard if available
if (navigator.clipboard) {
  navigator.clipboard.writeText(`${window.location.origin}/respond/${token}`);
  console.log('📋 URL copied to clipboard!');
}