/**
 * Quality settings and auto-detection logic
 * Manages rendering quality based on device capabilities and user preferences
 */

export type QualityLevel = 'low' | 'med' | 'high' | 'ultra' | 'auto';

export interface QualitySettings {
  quality: QualityLevel;
  starCount: number;
  backgroundStars: number;
  haloParticles: number;
  gridStep: number;
  flowSteps: number;
  seedCount: number;
  pixelRatio: number;
  timeScale: number;
}

export class Settings {
  private currentQuality: QualityLevel = 'auto';
  private qualitySelect: HTMLSelectElement | null = null;
  private starCountElement: HTMLElement | null = null;
  private onQualityChangeCallback: ((settings: QualitySettings) => void) | null = null;

  // Device capability detection
  private readonly isMobileUA: boolean;
  private readonly deviceMemory: number;
  private readonly devicePixelRatio: number;
  private readonly prefersReduced: boolean;
  private readonly urlQuality: QualityLevel | null;

  constructor() {
    // Initialize device detection
    this.isMobileUA = /Mobi|Android/i.test(navigator.userAgent || '');
    this.deviceMemory = (navigator as any).deviceMemory || 4;
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Check URL parameter
    const qsParam = new URLSearchParams(location.search).get('q');
    this.urlQuality = this.isValidQuality(qsParam) ? qsParam as QualityLevel : null;

    this.init();
  }

  private init(): void {
    this.qualitySelect = document.getElementById('quality') as HTMLSelectElement;
    this.starCountElement = document.getElementById('starCount');

    this.currentQuality = this.determineAutoQuality();
    this.setupQualitySelect();
    this.bindEvents();
  }

  private isValidQuality(value: string | null): boolean {
    return value !== null && ['low', 'med', 'high', 'ultra', 'auto'].includes(value);
  }

  private determineAutoQuality(): QualityLevel {
    // Use URL parameter if provided
    if (this.urlQuality && this.urlQuality !== 'auto') {
      return this.urlQuality;
    }

    // Auto-detect based on device capabilities
    const wantUltra = (!this.isMobileUA && this.deviceMemory >= 8 && this.devicePixelRatio >= 1.5);
    
    if (wantUltra) return 'ultra';
    if (this.isMobileUA || this.deviceMemory <= 4) return 'med';
    return 'high';
  }

  private setupQualitySelect(): void {
    if (this.qualitySelect && this.urlQuality) {
      this.qualitySelect.value = this.urlQuality;
    }
  }

  private bindEvents(): void {
    if (!this.qualitySelect) return;

    this.qualitySelect.addEventListener('change', () => {
      const selectedValue = this.qualitySelect!.value as QualityLevel;
      this.setQuality(selectedValue);
    });
  }

  private clampPixelRatio(): number {
    return (this.currentQuality === 'high' || this.currentQuality === 'ultra') 
      ? Math.min(this.devicePixelRatio, 2) 
      : 1;
  }

  public setQuality(quality: QualityLevel): void {
    if (quality === 'auto') {
      this.currentQuality = this.determineAutoQuality();
    } else {
      this.currentQuality = quality;
    }

    const settings = this.getQualitySettings();
    
    // Update star count display
    if (this.starCountElement) {
      this.starCountElement.textContent = settings.starCount.toLocaleString();
    }

    // Trigger quality change callback
    if (this.onQualityChangeCallback) {
      this.onQualityChangeCallback(settings);
    }
  }

  public getQualitySettings(): QualitySettings {
    const quality = this.currentQuality;
    
    // Reduce values for reduced motion preference
    const motionMultiplier = this.prefersReduced ? 0.5 : 1;
    
    const settings: Record<QualityLevel, Omit<QualitySettings, 'quality'>> = {
      low: {
        starCount: Math.floor(8000 * motionMultiplier),
        backgroundStars: Math.floor(2800 * motionMultiplier),
        haloParticles: Math.floor(160 * motionMultiplier),
        gridStep: 50,
        flowSteps: 44,
        seedCount: Math.floor(54 * motionMultiplier),
        pixelRatio: 1,
        timeScale: 0.48
      },
      med: {
        starCount: Math.floor(13000 * motionMultiplier),
        backgroundStars: Math.floor(2800 * motionMultiplier),
        haloParticles: Math.floor(160 * motionMultiplier),
        gridStep: 50,
        flowSteps: 44,
        seedCount: Math.floor(54 * motionMultiplier),
        pixelRatio: 1,
        timeScale: 0.48
      },
      high: {
        starCount: Math.floor(32000 * motionMultiplier),
        backgroundStars: Math.floor(16000 * motionMultiplier),
        haloParticles: Math.floor(320 * motionMultiplier),
        gridStep: 40,
        flowSteps: 64,
        seedCount: Math.floor(80 * motionMultiplier),
        pixelRatio: this.clampPixelRatio(),
        timeScale: 0.58
      },
      ultra: {
        starCount: Math.floor(50000 * motionMultiplier),
        backgroundStars: Math.floor(24000 * motionMultiplier),
        haloParticles: Math.floor(520 * motionMultiplier),
        gridStep: 36,
        flowSteps: 80,
        seedCount: Math.floor(100 * motionMultiplier),
        pixelRatio: this.clampPixelRatio(),
        timeScale: 0.68
      },
      auto: {
        starCount: 0, // This should never be used directly
        backgroundStars: 0,
        haloParticles: 0,
        gridStep: 50,
        flowSteps: 44,
        seedCount: 0,
        pixelRatio: 1,
        timeScale: 0.48
      }
    };

    return {
      quality,
      ...settings[quality]
    };
  }

  public getCurrentQuality(): QualityLevel {
    return this.currentQuality;
  }

  public onQualityChange(callback: (settings: QualitySettings) => void): void {
    this.onQualityChangeCallback = callback;
  }

  public getDeviceInfo() {
    return {
      isMobileUA: this.isMobileUA,
      deviceMemory: this.deviceMemory,
      devicePixelRatio: this.devicePixelRatio,
      prefersReduced: this.prefersReduced,
      urlQuality: this.urlQuality
    };
  }
}