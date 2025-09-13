/**
 * Certifications toggle functionality
 * Handles expand/collapse of certification categories
 */

export class CertificationsToggle {
  private group: HTMLElement | null = null;
  private button: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.group = document.querySelector('.cert-group');
    this.button = this.group?.querySelector('.cert-toggle') || null;
    
    if (!this.group || !this.button) {
      console.warn('CertificationsToggle: Required elements not found');
      return;
    }

    this.setupInitialState();
    this.bindEvents();
  }

  private setupInitialState(): void {
    if (!this.group || !this.button) return;

    // Ensure data-collapsed attribute exists
    if (!this.group.hasAttribute('data-collapsed')) {
      this.group.setAttribute('data-collapsed', 'false');
    }

    // Set initial aria-expanded state
    const isOpen = this.group.getAttribute('data-collapsed') === 'false';
    this.button.setAttribute('aria-expanded', String(isOpen));
  }

  private bindEvents(): void {
    if (!this.button || !this.group) return;

    // Prevent double binding
    if ((this.button as any).dataset.bound) {
      return;
    }
    (this.button as any).dataset.bound = '1';

    this.button.addEventListener('click', () => {
      this.toggle();
    });
  }

  private toggle(): void {
    if (!this.group || !this.button) return;

    const isCurrentlyOpen = this.group.getAttribute('data-collapsed') === 'false';
    const newState = !isCurrentlyOpen;
    
    this.group.setAttribute('data-collapsed', String(!newState));
    this.button.setAttribute('aria-expanded', String(newState));
  }

  public getState(): boolean {
    if (!this.group) return false;
    return this.group.getAttribute('data-collapsed') === 'false';
  }

  public setState(open: boolean): void {
    if (!this.group || !this.button) return;
    
    this.group.setAttribute('data-collapsed', String(!open));
    this.button.setAttribute('aria-expanded', String(open));
  }
}