/**
 * DOM controls binding for sliders and inputs
 * Handles exposure, mass, and speed control interactions
 */

export interface ControlCallbacks {
  onExposureChange: (value: number) => void;
  onMassChange: (value: number) => void;
  onSpeedChange: (value: number) => void;
}

export class Controls {
  private exposureSlider: HTMLInputElement | null = null;
  private massSlider: HTMLInputElement | null = null;
  private speedSlider: HTMLInputElement | null = null;
  private callbacks: Partial<ControlCallbacks> = {};

  constructor(callbacks: Partial<ControlCallbacks> = {}) {
    this.callbacks = callbacks;
    this.init();
  }

  private init(): void {
    this.exposureSlider = document.getElementById('exposure') as HTMLInputElement;
    this.massSlider = document.getElementById('mass') as HTMLInputElement;
    this.speedSlider = document.getElementById('speed') as HTMLInputElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    if (this.exposureSlider) {
      this.exposureSlider.addEventListener('input', () => {
        const value = parseFloat(this.exposureSlider!.value);
        if (this.callbacks.onExposureChange) {
          this.callbacks.onExposureChange(value);
        }
      });
    }

    if (this.massSlider) {
      this.massSlider.addEventListener('input', () => {
        const value = parseFloat(this.massSlider!.value);
        if (this.callbacks.onMassChange) {
          this.callbacks.onMassChange(value);
        }
      });
    }

    if (this.speedSlider) {
      this.speedSlider.addEventListener('input', () => {
        const value = parseFloat(this.speedSlider!.value);
        if (this.callbacks.onSpeedChange) {
          this.callbacks.onSpeedChange(value);
        }
      });
    }
  }

  public setExposure(value: number): void {
    if (this.exposureSlider) {
      this.exposureSlider.value = value.toString();
    }
  }

  public setMass(value: number): void {
    if (this.massSlider) {
      this.massSlider.value = value.toString();
    }
  }

  public setSpeed(value: number): void {
    if (this.speedSlider) {
      this.speedSlider.value = value.toString();
    }
  }

  public getExposure(): number {
    return this.exposureSlider ? parseFloat(this.exposureSlider.value) : 0.9;
  }

  public getMass(): number {
    return this.massSlider ? parseFloat(this.massSlider.value) : 0.7;
  }

  public getSpeed(): number {
    return this.speedSlider ? parseFloat(this.speedSlider.value) : 0.58;
  }

  public updateCallbacks(callbacks: Partial<ControlCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}