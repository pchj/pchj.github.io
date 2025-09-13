/**
 * Panel and clouds toggle functionality
 * Handles galaxy controls panel and clouds visibility
 */

export class PanelClouds {
  private panel: HTMLElement | null = null;
  private panelToggle: HTMLElement | null = null;
  private cloudsToggle: HTMLInputElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.panel = document.getElementById('panel');
    this.panelToggle = document.getElementById('panelToggle');
    this.cloudsToggle = document.getElementById('cloudsToggle') as HTMLInputElement;

    this.bindPanelEvents();
    this.bindCloudsEvents();
    this.setupInitialCloudsState();
  }

  private bindPanelEvents(): void {
    if (!this.panelToggle || !this.panel) {
      console.warn('PanelClouds: Panel toggle elements not found');
      return;
    }

    this.panelToggle.addEventListener('click', () => {
      this.togglePanel();
    });
  }

  private bindCloudsEvents(): void {
    if (!this.cloudsToggle) {
      console.warn('PanelClouds: Clouds toggle element not found');
      return;
    }

    this.cloudsToggle.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      this.setClouds(target.checked);
    });
  }

  private setupInitialCloudsState(): void {
    // Set initial clouds state to on
    this.setClouds(true);
    if (this.cloudsToggle) {
      this.cloudsToggle.checked = true;
    }
  }

  private togglePanel(): void {
    if (!this.panel) return;
    this.panel.classList.toggle('open');
  }

  private setClouds(enabled: boolean): void {
    document.body.classList.toggle('clouds-off', !enabled);
    document.body.classList.toggle('clouds-on', enabled);
  }

  public openPanel(): void {
    if (this.panel) {
      this.panel.classList.add('open');
    }
  }

  public closePanel(): void {
    if (this.panel) {
      this.panel.classList.remove('open');
    }
  }

  public isPanelOpen(): boolean {
    return this.panel?.classList.contains('open') ?? false;
  }

  public enableClouds(): void {
    this.setClouds(true);
    if (this.cloudsToggle) {
      this.cloudsToggle.checked = true;
    }
  }

  public disableClouds(): void {
    this.setClouds(false);
    if (this.cloudsToggle) {
      this.cloudsToggle.checked = false;
    }
  }

  public areCloudsEnabled(): boolean {
    return this.cloudsToggle?.checked ?? false;
  }
}