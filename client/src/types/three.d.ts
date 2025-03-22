declare module 'three' {
  export class Object3D {
    position: Vector3;
    add(object: Object3D): this;
    remove(object: Object3D): this;
  }
  
  export class Scene extends Object3D {
    clear(): this;
  }
  
  export class WebGLRenderer {
    constructor(options?: any);
    setSize(width: number, height: number): void;
    domElement: HTMLCanvasElement;
    render(scene: Scene, camera: Camera): void;
  }
  export class PerspectiveCamera {
    constructor(fov: number, aspect: number, near: number, far: number);
    position: Vector3;
    aspect: number;
    updateProjectionMatrix(): void;
  }
  export class Camera {
    position: Vector3;
  }
  export class Mesh extends Object3D {
    constructor(geometry: BufferGeometry, material: Material | Material[]);
    geometry: BufferGeometry;
    material: Material | Material[];
  }
  export class BufferGeometry {
    dispose(): void;
  }
  export class Material {
    dispose(): void;
    transparent?: boolean;
    opacity?: number;
    color?: any;
    side?: any;
  }
  export class MeshBasicMaterial extends Material {
    constructor(parameters?: any);
  }
  export class SphereGeometry extends BufferGeometry {
    constructor(radius: number, widthSegments: number, heightSegments: number);
  }
  export class GridHelper extends Object3D {
    constructor(size: number, divisions: number, color1?: any, color2?: any);
  }
  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): this;
  }
  export const BackSide: any;
}

declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera } from 'three';
  
  export class OrbitControls {
    constructor(camera: Camera, domElement: HTMLElement);
    enableDamping: boolean;
    dampingFactor: number;
    rotateSpeed: number;
    enableZoom: boolean;
    enablePan: boolean;
    autoRotate: boolean;
    autoRotateSpeed: number;
    update(): void;
    dispose(): void;
  }
}