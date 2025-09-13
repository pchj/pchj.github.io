export class CertificationsToggle {
  private group: HTMLElement | null
  private btn: HTMLButtonElement | null

  constructor() {
    this.group = document.querySelector('.cert-group')
    this.btn = this.group?.querySelector('.cert-toggle') as HTMLButtonElement | null
    this.init()
  }

  private init() {
    if (!this.group || !this.btn) return

    if (!this.group.hasAttribute('data-collapsed')) {
      this.group.setAttribute('data-collapsed', 'false')
    }
    
    this.btn.setAttribute('aria-expanded', String(this.group.getAttribute('data-collapsed') === 'false'))

    if (!this.btn.dataset.bound) {
      this.btn.dataset.bound = '1'
      this.btn.addEventListener('click', () => this.toggle())
    }
  }

  private toggle() {
    if (!this.group || !this.btn) return
    
    const open = this.group.getAttribute('data-collapsed') === 'false'
    this.group.setAttribute('data-collapsed', String(!open))
    this.btn.setAttribute('aria-expanded', String(!open))
  }
}