declare global {
  interface Navigator {
    deviceMemory?: number
  }
}

export interface QualitySettings {
  quality: 'ultra' | 'high' | 'med' | 'low'
  isMobileUA: boolean
  devMem: number
  dpr: number
  prefersReduced: boolean
}

export class Settings {
  private settings: QualitySettings
  private qSel: HTMLSelectElement | null

  constructor() {
    const qsParam = new URLSearchParams(location.search).get('q')
    const isMobileUA = /Mobi|Android/i.test(navigator.userAgent || '')
    const devMem = navigator.deviceMemory || 4
    const dpr = window.devicePixelRatio || 1
    const wantUltra = qsParam === 'ultra' || (!isMobileUA && devMem >= 8 && dpr >= 1.5)
    
    this.settings = {
      quality: (qsParam as any) || (wantUltra ? 'ultra' : (isMobileUA || devMem <= 4 ? 'med' : 'high')),
      isMobileUA,
      devMem,
      dpr,
      prefersReduced: matchMedia('(prefers-reduced-motion: reduce)').matches
    }

    this.qSel = document.getElementById('quality') as HTMLSelectElement
    if (qsParam && this.qSel) {
      this.qSel.value = qsParam
    }
  }

  get quality() {
    return this.settings.quality
  }

  set quality(value: QualitySettings['quality']) {
    this.settings.quality = value
  }

  get isMobileUA() {
    return this.settings.isMobileUA
  }

  get devMem() {
    return this.settings.devMem
  }

  get dpr() {
    return this.settings.dpr
  }

  get prefersReduced() {
    return this.settings.prefersReduced
  }

  clampRatio(): number {
    return (this.settings.quality === 'high' || this.settings.quality === 'ultra') 
      ? Math.min(this.settings.dpr, 2) 
      : 1
  }

  onQualityChange(callback: () => void) {
    if (this.qSel) {
      this.qSel.addEventListener('change', () => {
        const wantUltra = !this.settings.isMobileUA && this.settings.devMem >= 8 && this.settings.dpr >= 1.5
        this.quality = this.qSel!.value === 'auto' 
          ? (wantUltra ? 'ultra' : (this.settings.isMobileUA || this.settings.devMem <= 4 ? 'med' : 'high'))
          : this.qSel!.value as QualitySettings['quality']
        callback()
      })
    }
  }
}