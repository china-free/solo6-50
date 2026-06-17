const STORAGE_KEYS = {
  SESSIONS: 'breathSessions',
  DAILY_GOAL: 'breathDailyGoal',
  GOAL_CYCLES: 'breathGoalCycles'
}

export const getDateKey = (date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export const formatDuration = (seconds) => {
  if (seconds < 60) return `${Math.round(seconds)}秒`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return secs > 0 ? `${mins}分${secs}秒` : `${mins}分钟`
}

export const formatTime = (timestamp) => {
  const d = new Date(timestamp)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const loadAllSessions = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]')
  } catch {
    return []
  }
}

const saveAllSessions = (sessions) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions))
  } catch {}
}

export const saveSession = (session) => {
  const sessions = loadAllSessions()
  sessions.push({
    id: Date.now(),
    ...session
  })
  if (sessions.length > 500) {
    sessions.splice(0, sessions.length - 500)
  }
  saveAllSessions(sessions)
}

export const getTodaySessions = () => {
  const today = getDateKey()
  return loadAllSessions().filter(s => getDateKey(new Date(s.startTime)) === today)
}

export const getTodayStats = () => {
  const sessions = getTodaySessions()
  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
  const totalCycles = sessions.reduce((sum, s) => sum + (s.cycles || 0), 0)
  const totalSessions = sessions.length

  const modeCounts = {}
  sessions.forEach(s => {
    modeCounts[s.mode] = (modeCounts[s.mode] || 0) + 1
  })
  const favoriteMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  return {
    totalSessions,
    totalDuration,
    totalCycles,
    favoriteMode,
    sessions
  }
}

export const getWeekStats = () => {
  const all = loadAllSessions()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const weekSessions = all.filter(s => new Date(s.startTime) >= weekAgo)
  const dailyData = {}

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = getDateKey(d)
    dailyData[key] = {
      date: d,
      label: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()],
      cycles: 0,
      duration: 0,
      sessions: 0
    }
  }

  weekSessions.forEach(s => {
    const key = getDateKey(new Date(s.startTime))
    if (dailyData[key]) {
      dailyData[key].cycles += s.cycles || 0
      dailyData[key].duration += s.duration || 0
      dailyData[key].sessions += 1
    }
  })

  return {
    dailyData: Object.values(dailyData),
    totalCycles: weekSessions.reduce((sum, s) => sum + (s.cycles || 0), 0),
    totalDuration: weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
    totalSessions: weekSessions.length
  }
}

export const getDailyGoal = () => {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEYS.DAILY_GOAL)) || 10
  } catch {
    return 10
  }
}

export const setDailyGoal = (goal) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_GOAL, String(Math.max(1, Math.min(100, goal))))
  } catch {}
}

export const getGoalCycles = () => {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEYS.GOAL_CYCLES)) || 5
  } catch {
    return 5
  }
}

export const setGoalCycles = (cycles) => {
  try {
    localStorage.setItem(STORAGE_KEYS.GOAL_CYCLES, String(Math.max(1, Math.min(50, cycles))))
  } catch {}
}
