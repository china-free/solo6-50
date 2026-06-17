export class SoundGenerator {
  constructor() {
    this.audioContext = null
    this.masterGain = null
    this.oscillators = []
    this.noiseNode = null
    this.timers = []
    this.isPlaying = false
    this.volume = 0.3
    this.currentSound = null
  }

  init() {
    if (this.audioContext) return
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    this.masterGain = this.audioContext.createGain()
    this.masterGain.gain.value = this.volume
    this.masterGain.connect(this.audioContext.destination)
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  setVolume(vol) {
    this.volume = vol
    if (this.masterGain) {
      this.masterGain.gain.value = vol
    }
  }

  stop() {
    this.oscillators.forEach(osc => {
      try { osc.stop() } catch (e) {}
    })
    this.oscillators = []
    if (this.noiseNode) {
      try { this.noiseNode.stop() } catch (e) {}
      this.noiseNode = null
    }
    this.timers.forEach(id => clearInterval(id))
    this.timers = []
    this.isPlaying = false
    this.currentSound = null
  }

  play(soundType) {
    this.init()
    this.resume()
    this.stop()

    switch (soundType) {
      case 'rain':
        this.playRain()
        break
      case 'ocean':
        this.playOcean()
        break
      case 'forest':
        this.playForest()
        break
      case 'wind':
        this.playWind()
        break
      default:
        return
    }
    this.currentSound = soundType
    this.isPlaying = true
  }

  createNoiseBuffer() {
    const bufferSize = 2 * this.audioContext.sampleRate
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const output = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    return buffer
  }

  playRain() {
    const noise = this.audioContext.createBufferSource()
    noise.buffer = this.createNoiseBuffer()
    noise.loop = true

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1000

    const filter2 = this.audioContext.createBiquadFilter()
    filter2.type = 'lowpass'
    filter2.frequency.value = 4000

    const gain = this.audioContext.createGain()
    gain.gain.value = 0.15

    noise.connect(filter)
    filter.connect(filter2)
    filter2.connect(gain)
    gain.connect(this.masterGain)

    noise.start()
    this.noiseNode = noise

    const intervalId = setInterval(() => {
      if (!this.isPlaying || this.currentSound !== 'rain') return
      gain.gain.setValueAtTime(0.15, this.audioContext.currentTime)
      gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.5)
      gain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 1)
    }, 3000)
    this.timers.push(intervalId)
  }

  playOcean() {
    const noise = this.audioContext.createBufferSource()
    noise.buffer = this.createNoiseBuffer()
    noise.loop = true

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 500

    const gain = this.audioContext.createGain()
    gain.gain.value = 0.1

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    noise.start()
    this.noiseNode = noise

    const modulate = () => {
      if (!this.isPlaying || this.currentSound !== 'ocean') return
      const now = this.audioContext.currentTime
      gain.gain.setValueAtTime(0.05, now)
      gain.gain.linearRampToValueAtTime(0.2, now + 3)
      gain.gain.linearRampToValueAtTime(0.05, now + 6)
      filter.frequency.setValueAtTime(300, now)
      filter.frequency.linearRampToValueAtTime(800, now + 3)
      filter.frequency.linearRampToValueAtTime(300, now + 6)
    }
    modulate()
    const intervalId = setInterval(modulate, 6000)
    this.timers.push(intervalId)
  }

  playForest() {
    const noise = this.audioContext.createBufferSource()
    noise.buffer = this.createNoiseBuffer()
    noise.loop = true

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 600
    filter.Q.value = 0.5

    const gain = this.audioContext.createGain()
    gain.gain.value = 0.05

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    noise.start()
    this.noiseNode = noise

    const playBird = () => {
      if (!this.isPlaying || this.currentSound !== 'forest') return
      const osc = this.audioContext.createOscillator()
      const oscGain = this.audioContext.createGain()
      osc.type = 'sine'
      const baseFreq = 1200 + Math.random() * 800
      osc.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime)
      osc.frequency.linearRampToValueAtTime(baseFreq + 200, this.audioContext.currentTime + 0.1)
      osc.frequency.linearRampToValueAtTime(baseFreq, this.audioContext.currentTime + 0.2)
      oscGain.gain.setValueAtTime(0, this.audioContext.currentTime)
      oscGain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.05)
      oscGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3)
      osc.connect(oscGain)
      oscGain.connect(this.masterGain)
      osc.start()
      osc.stop(this.audioContext.currentTime + 0.3)
      this.oscillators.push(osc)
    }

    const intervalId = setInterval(() => {
      if (Math.random() > 0.5) playBird()
    }, 4000)
    this.timers.push(intervalId)

    const timeout1 = setTimeout(playBird, 1000)
    const timeout2 = setTimeout(playBird, 2500)
    this.timers.push(timeout1, timeout2)
  }

  playWind() {
    const noise = this.audioContext.createBufferSource()
    noise.buffer = this.createNoiseBuffer()
    noise.loop = true

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 400

    const gain = this.audioContext.createGain()
    gain.gain.value = 0.1

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    noise.start()
    this.noiseNode = noise

    const modulate = () => {
      if (!this.isPlaying || this.currentSound !== 'wind') return
      const now = this.audioContext.currentTime
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.linearRampToValueAtTime(0.18, now + 2 + Math.random() * 2)
      gain.gain.linearRampToValueAtTime(0.08, now + 4 + Math.random() * 2)
      filter.frequency.setValueAtTime(200 + Math.random() * 100, now)
      filter.frequency.linearRampToValueAtTime(500 + Math.random() * 200, now + 3)
    }
    modulate()
    const intervalId = setInterval(modulate, 5000)
    this.timers.push(intervalId)
  }
}
