function emitEvent(type, payload) {
  fetch('http://localhost:3001/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, timestamp: new Date().toISOString(), payload }),
  }).catch(() => {})
}

const ACHIEVEMENTS = [10, 50, 100]

export function setupCounter(element) {
  let counter = 0
  const setCounter = (count) => {
    counter = count
    element.innerHTML = `count is ${counter}`
    emitEvent('scoreUpdated', { score: counter })
    if (ACHIEVEMENTS.includes(counter)) {
      emitEvent('achievementTriggered', { score: counter, achievement: `Reached ${counter}` })
    }
  }

  element.addEventListener('click', () => setCounter(counter + 1))
  setCounter(0)
}
