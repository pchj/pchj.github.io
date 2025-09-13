import { LayoutDimensions } from '../types/global.d'

export class Layout {
  private dimensions: LayoutDimensions = { VW: 0, VH: 0 }
  private gl: HTMLCanvasElement
  private field: HTMLCanvasElement
  private grid: HTMLCanvasElement
  private fctx: CanvasRenderingContext2D
  private gctx: CanvasRenderingContext2D

  constructor() {
    this.gl = document.getElementById('gl') as HTMLCanvasElement
    this.field = document.getElementById('field') as HTMLCanvasElement
    this.grid = document.getElementById('grid') as HTMLCanvasElement
    this.fctx = this.field.getContext('2d')!
    this.gctx = this.grid.getContext('2d')!
    
    this.cacheSize()
    addEventListener('resize', () => this.cacheSize(), { passive: true })
  }

  private cacheSize() {
    const r = this.gl.getBoundingClientRect()
    this.dimensions.VW = r.width | 0
    this.dimensions.VH = r.height | 0
  }

  get VW() {
    return this.dimensions.VW
  }

  get VH() {
    return this.dimensions.VH
  }

  get fieldContext() {
    return this.fctx
  }

  get gridContext() {
    return this.gctx
  }

  get glCanvas() {
    return this.gl
  }

  get fieldCanvas() {
    return this.field
  }

  get gridCanvas() {
    return this.grid
  }

  size2D(clampRatio: () => number) {
    const pr = clampRatio()
    this.field.width = this.VW * pr
    this.field.height = this.VH * pr
    this.fctx.setTransform(pr, 0, 0, pr, 0, 0)
    
    this.grid.width = this.VW * pr
    this.grid.height = this.VH * pr
    this.gctx.setTransform(pr, 0, 0, pr, 0, 0)
  }
}