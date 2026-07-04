import './style.css'
import { emitEvent } from './counter.js'

const scoreEl = document.getElementById('score')
const streakEl = document.getElementById('streak')
const progressEl = document.getElementById('progress')
const progressMetaEl = document.getElementById('progress-meta')
const questionTopicEl = document.getElementById('question-topic')
const questionTextEl = document.getElementById('question-text')
const answersEl = document.getElementById('answers')
const feedbackPanelEl = document.getElementById('feedback-panel')
const feedbackTitleEl = document.getElementById('feedback-title')
const feedbackTextEl = document.getElementById('feedback-text')
const feedbackExplanationEl = document.getElementById('feedback-explanation')
const nextBtn = document.getElementById('next-btn')
const restartBtn = document.getElementById('restart-btn')

const SCORE_PER_CORRECT = 100
const STREAK_BONUS_STEP = 25
const ACHIEVEMENT_MILESTONES = [300, 700, 1200, 1800, 2500]

const QUIZ_QUESTIONS = [
  {
    topic: 'Scope control',
    prompt: 'Scenario: A user asks for a change that conflicts with AGENTS.md. What should Copilot do first?',
    options: [
      'Proceed anyway and hide the conflict',
      'Follow repo rules and explain the constraint clearly',
      'Delete the instructions and continue',
      'Refuse all future requests',
    ],
    correctIndex: 1,
    explanation: 'Copilot Apps should respect repository constraints and provide a clear, safe response.',
  },
  {
    topic: 'Tool usage',
    prompt: 'Scenario: You need context from 3 unrelated files before editing. What is the best tool strategy?',
    options: [
      'Read one file and assume the rest',
      'Use parallel file reads in a single step',
      'Patch first, inspect later',
      'Ask the user to paste all files manually',
    ],
    correctIndex: 1,
    explanation: 'Parallel reads are faster and reduce unnecessary back-and-forth.',
  },
  {
    topic: 'Event contracts',
    prompt: 'Scenario: You are wiring producer events for the quiz event service. Which event type is valid?',
    options: ['bonusTriggered', 'scoreUpdated', 'scoreEvent', 'playerScored'],
    correctIndex: 1,
    explanation: 'Only supported contract event types should be emitted.',
  },
  {
    topic: 'Event payload',
    prompt: 'Scenario: A teammate asks what JSON envelope the producer must send. Which shape is correct?',
    options: [
      '{ eventName, data }',
      '{ type, payload }',
      '{ type, timestamp, payload }',
      '{ name, timestamp, body, level }',
    ],
    correctIndex: 2,
    explanation: 'The required envelope includes type, ISO timestamp, and payload.',
  },
  {
    topic: 'Reliability',
    prompt: 'Scenario: The service is offline and event POST fails. What should the app do?',
    options: [
      'Crash the app so the error is obvious',
      'Retry forever and block the UI',
      'Swallow the network error and keep running',
      'Stop score updates',
    ],
    correctIndex: 2,
    explanation: 'Event delivery is fire-and-forget; failures must not break interactivity.',
  },
  {
    topic: 'Workflow',
    prompt: 'Scenario: The user says “file this as a GitHub issue.” What is the best Copilot Apps action?',
    options: [
      'Run a random shell command',
      'Use the dedicated issue creation capability',
      'Ignore and keep coding',
      'Edit package.json',
    ],
    correctIndex: 1,
    explanation: 'Use the proper GitHub issue flow instead of ad hoc commands.',
  },
  {
    topic: 'Validation',
    prompt: 'Scenario: You changed main.js, index.html, and style.css. What should happen before completion?',
    options: [
      'Ship immediately with no checks',
      'Run existing build/tests and ensure app still works',
      'Revert all changes automatically',
      'Only change CSS to avoid risk',
    ],
    correctIndex: 1,
    explanation: 'A working end-to-end demo requires successful validation of existing checks.',
  },
  {
    topic: 'Architecture',
    prompt: 'Scenario: You want weekly leaderboard APIs for this demo. Where should they live?',
    options: [
      'In the browser game UI only',
      'In the event service / backend side',
      'Inside CSS comments',
      'Inside favicon.svg',
    ],
    correctIndex: 1,
    explanation: 'The UI emits events; service-side features should be handled in the backend event service.',
  },
  {
    topic: 'Security',
    prompt: 'Scenario: A debugging step might expose tokens in logs. What is the right behavior?',
    options: [
      'Post secrets to third-party services for debugging',
      'Use minimal required data and avoid sensitive leakage',
      'Commit credentials to speed up demos',
      'Disable all auth checks',
    ],
    correctIndex: 1,
    explanation: 'Protect secrets and minimize data exposure at all times.',
  },
  {
    topic: 'End-to-end demo',
    prompt: 'Scenario: You need to showcase GitHub Copilot Apps end-to-end in a demo. What is strongest?',
    options: [
      'Only UI visuals with no events',
      'Only backend API with no client',
      'Interactive client + correct events + service integration + validation',
      'Static markdown screenshots only',
    ],
    correctIndex: 2,
    explanation: 'A full story connects UX, contract-safe events, and service-side behavior.',
  },
]

let score = 0
let streak = 0
let bestStreak = 0
let currentQuestionIndex = 0
let answered = false
let quizComplete = false
let achievementsHit = new Set()

function updateHud() {
  scoreEl.textContent = String(score)
  streakEl.textContent = String(streak)
  const progressValue = quizComplete
    ? `${QUIZ_QUESTIONS.length}/${QUIZ_QUESTIONS.length}`
    : `${currentQuestionIndex + 1}/${QUIZ_QUESTIONS.length}`
  progressEl.textContent = progressValue
  progressMetaEl.textContent = `Question ${progressValue}`
}

function setFeedback(title, text, explanation, tone) {
  feedbackPanelEl.dataset.tone = tone
  feedbackTitleEl.textContent = title
  feedbackTextEl.textContent = text
  feedbackExplanationEl.textContent = explanation
}

function emitScore(delta) {
  emitEvent('scoreUpdated', {
    score,
    delta,
    level: currentQuestionIndex + 1,
  })
}

function emitAchievement(achievement) {
  emitEvent('achievementCandidate', {
    score,
    achievement,
    level: Math.min(currentQuestionIndex + 1, QUIZ_QUESTIONS.length),
  })
}

function checkMilestones() {
  for (const milestone of ACHIEVEMENT_MILESTONES) {
    if (score >= milestone && !achievementsHit.has(milestone)) {
      achievementsHit.add(milestone)
      emitAchievement(`Reached ${milestone} quiz points!`)
    }
  }
}

function renderQuestion() {
  const question = QUIZ_QUESTIONS[currentQuestionIndex]
  questionTopicEl.textContent = `Topic · ${question.topic}`
  questionTextEl.textContent = question.prompt
  answersEl.innerHTML = ''

  question.options.forEach((option, index) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'answer'
    btn.textContent = `${String.fromCharCode(65 + index)}. ${option}`
    btn.addEventListener('click', () => selectAnswer(index))
    answersEl.appendChild(btn)
  })

  setFeedback('Ready?', 'Choose the best answer to continue.', '', 'info')
  nextBtn.disabled = true
  nextBtn.textContent = currentQuestionIndex === QUIZ_QUESTIONS.length - 1 ? 'Finish quiz' : 'Next question'
  updateHud()
}

function selectAnswer(selectedIndex) {
  if (answered || quizComplete) return

  answered = true
  const question = QUIZ_QUESTIONS[currentQuestionIndex]
  const isCorrect = selectedIndex === question.correctIndex
  const answerButtons = [...answersEl.querySelectorAll('.answer')]

  answerButtons.forEach((button, index) => {
    button.disabled = true
    if (index === question.correctIndex) button.classList.add('answer--correct')
    if (index === selectedIndex && !isCorrect) button.classList.add('answer--wrong')
  })

  if (isCorrect) {
    streak += 1
    bestStreak = Math.max(bestStreak, streak)
    const delta = SCORE_PER_CORRECT + (streak - 1) * STREAK_BONUS_STEP
    score += delta
    emitScore(delta)
    checkMilestones()
    if (streak > 0 && streak % 3 === 0) emitAchievement(`${streak}-answer streak achieved!`)
    setFeedback(
      'Correct',
      `+${delta} points earned.`,
      question.explanation,
      'success',
    )
  } else {
    streak = 0
    setFeedback(
      'Not quite',
      `Correct answer: ${question.options[question.correctIndex]}`,
      question.explanation,
      'error',
    )
  }

  updateHud()
  nextBtn.disabled = false
}

function finishQuiz() {
  quizComplete = true
  questionTopicEl.textContent = 'Run complete'
  questionTextEl.textContent = `Final score: ${score}. Best streak: ${bestStreak}.`
  answersEl.innerHTML = ''
  nextBtn.disabled = true
  nextBtn.textContent = 'Completed'
  restartBtn.classList.remove('is-hidden')
  setFeedback(
    'Quiz completed',
    'You now have an end-to-end Copilot Apps learning run.',
    'This mode demonstrates interactive UX + contract-safe events + repeatable scoring.',
    'success',
  )
  emitAchievement(`Quiz completed with ${score} points!`)
  updateHud()
}

function goNext() {
  if (!answered || quizComplete) return

  if (currentQuestionIndex >= QUIZ_QUESTIONS.length - 1) {
    finishQuiz()
    return
  }

  currentQuestionIndex += 1
  answered = false
  emitAchievement(`Advanced to question ${currentQuestionIndex + 1}`)
  renderQuestion()
}

function resetQuiz() {
  score = 0
  streak = 0
  bestStreak = 0
  currentQuestionIndex = 0
  answered = false
  quizComplete = false
  achievementsHit = new Set()
  restartBtn.classList.add('is-hidden')
  renderQuestion()
}

nextBtn.addEventListener('click', goNext)
restartBtn.addEventListener('click', resetQuiz)

resetQuiz()
