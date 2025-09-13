export interface QualitySettings {
  quality: 'ultra' | 'high' | 'med' | 'low';
  isMobileUA: boolean;
  devMem: number;
  dpr: number;
  prefersReduced: boolean;
}

export interface SceneObject {
  type: 'neb' | 'sf' | 'gal' | 'halo';
  mat: THREE.ShaderMaterial | THREE.Material;
  uni?: {
    uTime?: { value: number };
    uMouse?: { value: THREE.Vector3 };
    uCursor?: { value: THREE.Vector2 };
    uScale?: { value: number };
    uAspect?: { value: number };
    uExposure?: { value: number };
    uSpeed?: { value: number };
    uHue?: { value: number };
    [key: string]: any;
  };
}

export interface LayoutDimensions {
  VW: number;
  VH: number;
}

export interface FlowSeed {
  x: number;
  y: number;
}

declare global {
  interface Window {
    THREE: typeof import('three');
  }
}

export {}