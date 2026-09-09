// Son de papier procédural (WebAudio) — aucun fichier audio à charger.
// Un bruit filtré avec balayage de fréquence imite le frottement d'une page.

export class PaperSound {
  constructor() {
    this.ctx = null
    this.noiseBuffer = null
    this.enabled = localStorage.getItem('hydelis-sound') !== 'off'
    this.ready = false
  }

  // À appeler depuis un geste utilisateur (obligatoire sur mobile).
  unlock() {
    if (this.ready) {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume()
      return
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      this.ctx = new AC()
      const sr = this.ctx.sampleRate
      const len = Math.floor(sr * 0.5)
      this.noiseBuffer = this.ctx.createBuffer(1, len, sr)
      const data = this.noiseBuffer.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
      this.ready = true
      if (this.ctx.state === 'suspended') this.ctx.resume()
    } catch {
      this.ready = false
    }
  }

  setEnabled(on) {
    this.enabled = on
    localStorage.setItem('hydelis-sound', on ? 'on' : 'off')
  }

  get blocked() {
    return !this.ctx || this.ctx.state !== 'running'
  }

  // strength 0..1 — la couverture fait un son plus feutré et plus fort.
  flip(strength = 0.6, stiff = false) {
    if (!this.enabled || !this.ready || !this.ctx) return
    if (this.ctx.state !== 'running') return
    const t0 = this.ctx.currentTime
    const dur = stiff ? 0.34 : 0.22 + strength * 0.08

    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.playbackRate.value = stiff ? 0.7 : 0.95 + Math.random() * 0.25

    const bp = this.ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = stiff ? 0.8 : 1.4
    bp.frequency.setValueAtTime(stiff ? 420 : 750, t0)
    bp.frequency.exponentialRampToValueAtTime(stiff ? 900 : 2600, t0 + dur * 0.55)
    bp.frequency.exponentialRampToValueAtTime(stiff ? 380 : 900, t0 + dur)

    const gain = this.ctx.createGain()
    const peak = (stiff ? 0.16 : 0.11) * (0.55 + 0.45 * strength)
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)

    src.connect(bp).connect(gain).connect(this.ctx.destination)
    src.start(t0)
    src.stop(t0 + dur + 0.05)
  }
}
