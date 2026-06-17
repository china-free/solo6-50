import { useMemo } from 'react'
import { formatDuration, formatTime } from '../utils/stats'

const MODE_NAMES = {
  '4-7-8': '4-7-8 呼吸法',
  box: '盒式呼吸',
  relax: '放松呼吸',
  custom: '自定义'
}

export default function StatsPanel({
  todayStats,
  weekStats,
  dailyGoal,
  goalCycles,
  onDailyGoalChange,
  onGoalCyclesChange,
  onClose
}) {
  const goalProgress = useMemo(() => {
    if (dailyGoal <= 0) return 100
    return Math.min(100, (todayStats.totalCycles / dailyGoal) * 100)
  }, [todayStats.totalCycles, dailyGoal])

  const maxWeekCycles = useMemo(() => {
    return Math.max(1, ...weekStats.dailyData.map(d => d.cycles))
  }, [weekStats])

  return (
    <div className="stats-panel">
      <div className="stats-panel-header">
        <h2>📊 练习统计</h2>
        <button className="close-sidebar" onClick={onClose}>✕</button>
      </div>

      <div className="stats-section">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-card-value">{todayStats.totalSessions}</div>
            <div className="stat-card-label">今日练习次数</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value">{formatDuration(todayStats.totalDuration)}</div>
            <div className="stat-card-label">今日总时长</div>
          </div>
          <div className="stat-card highlight">
            <div className="stat-card-value">{todayStats.totalCycles}</div>
            <div className="stat-card-label">今日呼吸循环</div>
          </div>
        </div>

        <div className="goal-progress">
          <div className="goal-header">
            <span>🎯 每日目标</span>
            <span className="goal-text">{todayStats.totalCycles} / {dailyGoal} 次</span>
          </div>
          <div className="goal-bar">
            <div
              className="goal-bar-fill"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <div className="goal-controls">
            <span className="goal-controls-label">目标循环数</span>
            <div className="goal-controls-buttons">
              <button onClick={() => onDailyGoalChange(-1)}>−</button>
              <span>{dailyGoal}</span>
              <button onClick={() => onDailyGoalChange(1)}>+</button>
            </div>
          </div>
        </div>

        {todayStats.favoriteMode && (
          <div className="favorite-mode">
            <span className="favorite-mode-icon">💜</span>
            <span className="favorite-mode-text">
              今日常用模式：<strong>{MODE_NAMES[todayStats.favoriteMode] || todayStats.favoriteMode}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="stats-section">
        <h3 className="stats-section-title">本周趋势</h3>
        <div className="week-chart">
          {weekStats.dailyData.map((d, idx) => {
            const height = (d.cycles / maxWeekCycles) * 100
            return (
              <div key={idx} className="week-bar-wrapper">
                <div className="week-bar-value">{d.cycles > 0 ? d.cycles : ''}</div>
                <div
                  className="week-bar"
                  style={{ height: `${Math.max(4, height)}%` }}
                />
                <div className="week-bar-label">{d.label}</div>
              </div>
            )
          })}
        </div>
        <div className="week-summary">
          <span>本周共 {weekStats.totalSessions} 次</span>
          <span>{formatDuration(weekStats.totalDuration)}</span>
          <span>{weekStats.totalCycles} 循环</span>
        </div>
      </div>

      <div className="stats-section">
        <h3 className="stats-section-title">⏱️ 单次目标</h3>
        <div className="session-goal">
          <span className="session-goal-label">每次练习目标循环数</span>
          <div className="goal-controls-buttons">
            <button onClick={() => onGoalCyclesChange(-1)}>−</button>
            <span>{goalCycles}</span>
            <button onClick={() => onGoalCyclesChange(1)}>+</button>
          </div>
        </div>
        <div className="session-goal-hint">
          达到目标后会有提示，帮助你保持练习节奏
        </div>
      </div>

      <div className="stats-section">
        <h3 className="stats-section-title">📝 今日记录</h3>
        {todayStats.sessions.length === 0 ? (
          <div className="empty-sessions">
            还没有练习记录，开始第一次呼吸练习吧！
          </div>
        ) : (
          <div className="session-list">
            {[...todayStats.sessions].reverse().map((session) => (
              <div key={session.id} className="session-item">
                <div className="session-icon">
                  {session.cycles >= goalCycles ? '✅' : '🌿'}
                </div>
                <div className="session-info">
                  <div className="session-mode">
                    {MODE_NAMES[session.mode] || session.mode}
                    {session.cycles >= goalCycles && (
                      <span className="session-badge">达标</span>
                    )}
                  </div>
                  <div className="session-meta">
                    <span>{formatTime(session.startTime)}</span>
                    <span>·</span>
                    <span>{formatDuration(session.duration)}</span>
                    <span>·</span>
                    <span>{session.cycles} 循环</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
