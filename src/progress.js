const KEY = 'daemoncore-academy-intro-go-v1'
export const emptyProgress = () => ({ version: 2, completed: [], bookmarks: [], notes: {}, attempts: {}, lastLesson: 'welcome-to-go', xp: 0, streak: 0, lastStudyDate: null, onboarded: false, learnerName: '', dailyGoal: 1, startedAt: new Date().toISOString() })
export function loadProgress() { try { const data = JSON.parse(localStorage.getItem(KEY)); return data && Array.isArray(data.completed) ? { ...emptyProgress(), ...data } : emptyProgress() } catch { return emptyProgress() } }
export function saveProgress(value) { try { localStorage.setItem(KEY, JSON.stringify(value)) } catch { /* A full storage area must never prevent learning. */ } }
export function clearProgress() { localStorage.removeItem(KEY) }
export function exportProgress(value) { return JSON.stringify({ ...value, exportedAt: new Date().toISOString() }, null, 2) }
