/**
 * Layout management for canvas sizing and viewport tracking
 * Handles window resizing and coordinate transformations
 */

export class Layout {
  private VW: number = 0;
  private VH: number = 0;
  private glCanvas: HTMLCanvasElement | null = null;
  private fieldCanvas: HTMLCanvasElement | null = null;
  private gridCanvas: HTMLCanvasElement | null = null;
  private fieldContext: CanvasRenderingContext2D | null = null;
  private gridContext: CanvasRenderingContext2D | null = null;
  
  private resizeCallbacks: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init(): void {
    this.glCanvas = document.getElementById('gl') as HTMLCanvasElement;
    this.fieldCanvas = document.getElementById('field') as HTMLCanvasElement;
    this.gridCanvas = document.getElementById('grid') as HTMLCanvasElement;

    if (!this.glCanvas || !this.fieldCanvas || !this.gridCanvas) {
      console.error('Layout: Required canvas elements not found');
      return;
    }

    this.fieldContext = this.fieldCanvas.getContext('2d');
    this.gridContext = this.gridCanvas.getContext('2d');

    this.cacheSize();
    this.bindResizeEvents();
  }

  private bindResizeEvents(): void {
    addEventListener('resize', () => {
      this.cacheSize();
      this.size2D();
      this.notifyResizeCallbacks();
    }, { passive: true });

    // Also setup ResizeObserver for the GL canvas
    if (this.glCanvas) {
      const resizeObserver = new ResizeObserver(() => {
        this.cacheSize();
        this.size2D();
        this.notifyResizeCallbacks();
      });
      resizeObserver.observe(this.glCanvas);
    }
  }

  private cacheSize(): void {
    if (!this.glCanvas) return;
    
    const rect = this.glCanvas.getBoundingClientRect();
    this.VW = rect.width | 0;
    this.VH = rect.height | 0;
  }

  private notifyResizeCallbacks(): void {
    this.resizeCallbacks.forEach(callback => callback());
  }

  public size2D(pixelRatio: number = 1): void {
    if (!this.fieldCanvas || !this.gridCanvas || !this.fieldContext || !this.gridContext) return;

    const pr = pixelRatio;
    
    // Update field canvas
    this.fieldCanvas.width = this.VW * pr;
    this.fieldCanvas.height = this.VH * pr;
    this.fieldContext.setTransform(pr, 0, 0, pr, 0, 0);
    
    // Update grid canvas
    this.gridCanvas.width = this.VW * pr;
    this.gridCanvas.height = this.VH * pr;
    this.gridContext.setTransform(pr, 0, 0, pr, 0, 0);
  }

  public getViewportSize(): { width: number; height: number } {
    return { width: this.VW, height: this.VH };
  }

  public getAspectRatio(): number {
    return (this.VW || 1) / (this.VH || 1);
  }

  public getFieldContext(): CanvasRenderingContext2D | null {
    return this.fieldContext;
  }

  public getGridContext(): CanvasRenderingContext2D | null {
    return this.gridContext;
  }

  public onResize(callback: () => void): void {
    this.resizeCallbacks.push(callback);
  }

  public removeResizeCallback(callback: () => void): void {
    const index = this.resizeCallbacks.indexOf(callback);
    if (index > -1) {
      this.resizeCallbacks.splice(index, 1);
    }
  }

  // Helper method to get current viewport dimensions
  public get width(): number {
    return this.VW;
  }

  public get height(): number {
    return this.VH;
  }
}