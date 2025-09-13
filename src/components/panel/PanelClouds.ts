export class PanelClouds {
  private panel: HTMLElement | null
  private panelToggle: HTMLButtonElement | null
  private cloudsToggle: HTMLInputElement | null

  constructor() {
    this.panel = document.getElementById('panel')
    this.panelToggle = document.getElementById('panelToggle') as HTMLButtonElement
    this.cloudsToggle = document.getElementById('cloudsToggle') as HTMLInputElement
    this.init()
  }

  private init() {
    if (this.panelToggle && this.panel) {
      this.panelToggle.addEventListener('click', () => {
        this.panel!.classList.toggle('open')
      })
    }

    if (this.cloudsToggle) {
      this.setClouds(true)
      this.cloudsToggle.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement
        this.setClouds(target.checked)
      })
    }
  }

  private setClouds(on: boolean) {
    document.body.classList.toggle('clouds-off', !on)
    document.body.classList.toggle('clouds-on', on)
  }
}