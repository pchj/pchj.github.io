/**
 * Card expand functionality
 * Handles interactive card expansion with keyboard support
 */

export class CardExpand {
  private cards: NodeListOf<HTMLElement>;

  constructor() {
    this.cards = document.querySelectorAll('.card[data-expand]');
    this.init();
  }

  private init(): void {
    this.cards.forEach(card => {
      this.bindCardEvents(card);
    });
  }

  private bindCardEvents(card: HTMLElement): void {
    // Click handler
    card.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Don't expand if clicking on interactive elements within card body
      if (target && target.closest && 
          target.closest('.card-body a, button, input, select, textarea')) {
        return;
      }
      
      this.toggleCard(card);
    });

    // Keyboard handler
    card.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleCard(card);
      }
    });
  }

  private toggleCard(card: HTMLElement): void {
    const isOpen = card.classList.toggle('open');
    card.setAttribute('aria-expanded', String(isOpen));
  }

  public expandCard(card: HTMLElement): void {
    card.classList.add('open');
    card.setAttribute('aria-expanded', 'true');
  }

  public collapseCard(card: HTMLElement): void {
    card.classList.remove('open');
    card.setAttribute('aria-expanded', 'false');
  }

  public getCardState(card: HTMLElement): boolean {
    return card.classList.contains('open');
  }

  public collapseAll(): void {
    this.cards.forEach(card => {
      this.collapseCard(card);
    });
  }

  public getCards(): NodeListOf<HTMLElement> {
    return this.cards;
  }
}