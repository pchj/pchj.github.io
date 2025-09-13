export class CardExpand {
  constructor() {
    this.init()
  }

  private init() {
    document.querySelectorAll('.card[data-expand]').forEach(card => {
      const cardElement = card as HTMLElement
      
      cardElement.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        if (target && target.closest && target.closest('.card-body a, button, input, select, textarea')) {
          return
        }
        this.toggleCard(cardElement)
      })

      cardElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          this.toggleCard(cardElement)
        }
      })
    })
  }

  private toggleCard(el: HTMLElement) {
    const open = el.classList.toggle('open')
    el.setAttribute('aria-expanded', String(open))
  }
}