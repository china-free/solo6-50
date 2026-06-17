import { useState, useEffect, useRef, useCallback } from 'react'
import { SoundGenerator } from './utils/soundGenerator'

const BREATH_MODES = {
  '4-7-8': {
    name: '4-7-8 呼吸法',
    desc: '助眠减压，适合睡前使用',
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0
  },
  box: {
    name: '盒式呼吸',
    desc: '提升专注力，适合工作间隙',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4
  },
  relax: {
    name: '放松呼吸',
    desc: '舒缓身心，适合日常放松',
    inhale: 5,
    hold1: 2,
    exhale: 6,
    hold2: 1
  }
}

const PHASE_MAP = {
  inhale: '吸气',
  hold1: '屏息',
  exhale: '呼气',
  hold2: '屏息'
}

const SOUND_OPTIONS = [
  { id: 'off', name: '静音' },
  { id: 'rain', name: '雨声' },
  { id: 'ocean', name: '海浪' },
  { id: 'forest', name: '森林' },
  { id: 'wind', name: '微风' }
]

const getTodayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

const loadStats = () => {
  try {
    const data = JSON.parse(localStorage.getItem('breathStats') || '{}')
    const today = getTodayKey()
    return data[today] || 0
  } catch {
    return 0
  }
}

const saveStats = (count) => {
  try {
    const data = JSON.parse(localStorage.getItem('breathStats') || '{}')
    const today = getTodayKey()
    data[today] = count
    localStorage.setItem('breathStats', JSON.stringify(data))
  } catch {}
}

function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 6,
    size: 2 + Math.random() * 4
  }))

  return (
    <div className="particles">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`
          }}
        />
      ))}
    </div>
  )
}

export default function App() {
  const [selectedMode, setSelectedMode] = useState('4-7-8')
  const [customDurations, setCustomDurations] = useState({
    inhale: 4, hold1: 7, exhale: 8, hold2: 0
  })
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentPhase, setCurrentPhase] = useState('inhale')
  const [remainingTime, setRemainingTime] = useState(4)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [todayCycles, setTodayCycles] = useState(0)
  const [selectedSound, setSelectedSound] = useState('off')
  const [volume, setVolume] = useState(0.3)
  const [cyclePhase, setCyclePhase] = useState(0)

  const soundGeneratorRef = useRef(null)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const pausedTimeRef = useRef(0)

  useEffect(() => {
    setTodayCycles(loadStats())
  }, [])

  useEffect(() => {
    const mode = BREATH_MODES[selectedMode]
    if (mode) {
      setCustomDurations({
        inhale: mode.inhale,
        hold1: mode.hold1,
        exhale: mode.exhale,
        hold2: mode.hold2
      })
    }
  }, [selectedMode])

  useEffect(() => {
    if (!soundGeneratorRef.current) {
      soundGeneratorRef.current = new SoundGenerator()
    }
    return () => {
      if (soundGeneratorRef.current) {
        soundGeneratorRef.current.stop()
      }
    }
  }, [])

  useEffect(() => {
    if (soundGeneratorRef.current) {
      soundGeneratorRef.current.setVolume(volume)
    }
  }, [volume])

  useEffect(() => {
    if (selectedSound === 'off') {
      if (soundGeneratorRef.current) {
        soundGeneratorRef.current.stop()
      }
    } else {
      if (soundGeneratorRef.current) {
        soundGeneratorRef.current.play(selectedSound)
      }
    }
  }, [selectedSound])

  const advanceCycle = useCallback(() => {
    setTodayCycles(prev => {
      const next = prev + 1
      saveStats(next)
      return next
    })
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startPhase = useCallback((phase, initialRemaining = null) => {
    clearTimer()
    const duration = customDurations[phase] || 0
    
    if (duration <= 0) {
      const phases = ['inhale', 'hold1', 'exhale', 'hold2']
      const currentIdx = phases.indexOf(phase)
      if (currentIdx < phases.length - 1) {
        startPhase(phases[currentIdx + 1])
      } else {
        advanceCycle()
        startPhase('inhale')
      }
      return
    }

    setCurrentPhase(phase)
    setCyclePhase(['inhale', 'hold1', 'exhale', 'hold2'].indexOf(phase))
    const remaining = initialRemaining !== null ? initialRemaining : duration
    setRemainingTime(remaining)
    startTimeRef.current = Date.now()

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const newRemaining = Math.max(0, duration - elapsed)
      setRemainingTime(newRemaining)

      if (newRemaining <= 0) {
        clearTimer()
        const phases = ['inhale', 'hold1', 'exhale', 'hold2']
        const currentIdx = phases.indexOf(phase)
        if (currentIdx < phases.length - 1) {
          startPhase(phases[currentIdx + 1])
        } else {
          advanceCycle()
          startPhase('inhale')
        }
      }
    }, 100)
  }, [customDurations, clearTimer, advanceCycle])

  const handleStart = () => {
    if (soundGeneratorRef.current) {
      soundGeneratorRef.current.resume()
    }
    if (isPaused) {
      setIsPaused(false)
      startPhase(currentPhase, remainingTime)
    } else {
      setIsRunning(true)
      startPhase('inhale')
    }
  }

  const handleStop = () => {
    clearTimer()
    setIsRunning(false)
    setIsPaused(false)
    setCurrentPhase('inhale')
    setRemainingTime(customDurations.inhale || 4)
    setCyclePhase(0)
  }

  const handlePause = () => {
    clearTimer()
    setIsPaused(true)
  }

  const handleToggleFullscreen = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.toggleFullscreen()
      setIsFullscreen(result)
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  const updateDuration = (key, delta) => {
    setCustomDurations(prev => ({
      ...prev,
      [key]: Math.max(0, Math.min(30, prev[key] + delta))
    }))
  }

  const getCircleScale = () => {
    if (!isRunning && !isPaused) return 1
    const duration = customDurations[currentPhase] || 1
    const progress = 1 - (remainingTime / duration)

    switch (currentPhase) {
      case 'inhale':
        return 1 + progress * 0.7
      case 'exhale':
        return 1.7 - progress * 0.7
      case 'hold1':
        return 1.7
      case 'hold2':
        return 1
      default:
        return 1
    }
  }

  const getTransitionDuration = () => {
    if (currentPhase === 'inhale' || currentPhase === 'exhale') {
      return `${customDurations[currentPhase] || 1}s`
    }
    return '0.3s'
  }

  const circleClass = currentPhase === 'hold1' || currentPhase === 'hold2' 
    ? 'breath-circle hold' 
    : currentPhase === 'exhale' 
      ? 'breath-circle exhale' 
      : 'breath-circle'

  return (
    <div className={`app ${isFullscreen ? 'fullscreen' : ''}`}>
      <Particles />

      <div className="header">
        <h1>🌿 呼吸减压</h1>
        <div className="stats">
          <div className="stat-item">
            <span>今日完成</span>
            <span className="stat-value">{todayCycles}</span>
            <span>次</span>
          </div>
          <button
            className={`icon-btn ${isFullscreen ? 'active' : ''}`}
            onClick={handleToggleFullscreen}
            title={isFullscreen ? '退出全屏' : '全屏模式'}
          >
            {isFullscreen ? '✕' : '⛶'}
          </button>
          <button
            className={`icon-btn ${settingsOpen ? 'active' : ''}`}
            onClick={() => setSettingsOpen(!settingsOpen)}
            title="设置"
          >
            ⚙
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="breath-container">
          <div className="breath-circle-wrapper">
            <div className="ring ring-1" />
            <div className="ring ring-2" />
            <div
              className={circleClass}
              style={{
                transform: `scale(${getCircleScale()})`,
                transitionDuration: isRunning && !isPaused ? getTransitionDuration() : '0.3s'
              }}
            >
              <div className="phase-text">
                {isRunning || isPaused ? PHASE_MAP[currentPhase] : '准备开始'}
              </div>
              <div className="timer-text">
                {Math.ceil(remainingTime)}
              </div>
            </div>
          </div>

          <div className="cycle-indicator">
            {['inhale', 'hold1', 'exhale', 'hold2'].map((p, idx) => (
              <div
                key={p}
                className={`cycle-dot ${(isRunning || isPaused) && cyclePhase === idx ? 'active' : ''}`}
              />
            ))}
          </div>

          <div className="controls">
            {!isRunning || isPaused ? (
              <button className="primary-btn" onClick={handleStart}>
                {isPaused ? '继续' : '开始练习'}
              </button>
            ) : (
              <>
                <button className="secondary-btn" onClick={handlePause}>
                  暂停
                </button>
                <button className="primary-btn stop" onClick={handleStop}>
                  结束
                </button>
              </>
            )}
          </div>
        </div>

        <div className="instruction">
          跟随圆圈的节奏深呼吸，让身心慢慢放松下来
        </div>
      </div>

      <div className={`sidebar ${settingsOpen ? 'open' : ''}`}>
        <button className="close-sidebar" onClick={() => setSettingsOpen(false)}>
          ✕
        </button>

        <h2>呼吸模式</h2>
        <div className="settings-group">
          <div className="mode-options">
            {Object.entries(BREATH_MODES).map(([key, mode]) => (
              <div
                key={key}
                className={`mode-option ${selectedMode === key ? 'active' : ''}`}
                onClick={() => setSelectedMode(key)}
              >
                <div className="mode-name">{mode.name}</div>
                <div className="mode-desc">{mode.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <h2>自定义时长</h2>
        <div className="settings-group">
          <div className="duration-inputs">
            {[
              { key: 'inhale', label: '吸气' },
              { key: 'hold1', label: '屏息 (吸气后)' },
              { key: 'exhale', label: '呼气' },
              { key: 'hold2', label: '屏息 (呼气后)' }
            ].map(({ key, label }) => (
              <div key={key} className="duration-row">
                <span className="duration-label">{label}</span>
                <div className="duration-control">
                  <button
                    className="duration-btn"
                    onClick={() => updateDuration(key, -1)}
                  >
                    −
                  </button>
                  <span className="duration-value">{customDurations[key]}s</span>
                  <button
                    className="duration-btn"
                    onClick={() => updateDuration(key, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <h2>背景音效</h2>
        <div className="settings-group">
          <label className="settings-label">选择音效</label>
          <div className="sound-options">
            {SOUND_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={`sound-option ${selectedSound === opt.id ? 'active' : ''} ${opt.id === 'off' ? 'off' : ''}`}
                onClick={() => setSelectedSound(opt.id)}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </div>

        {selectedSound !== 'off' && (
          <div className="settings-group">
            <label className="settings-label">音量</label>
            <div className="volume-control">
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>🔈</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="volume-slider"
              />
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>🔊</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
