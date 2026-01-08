declare module 'simple-peer';

declare module '@react-three/drei' {
  export interface OrbitControlsProps {
    [key: string]: any;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      primitive: any;
      group: any;
      mesh: any;
      object3D: any;
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      directionalLight: any;
      Sphere: any;
      Plane: any;
      Html: any;
      Environment: any;
      OrbitControls: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshPhongMaterial: any;
      perspectiveCamera: any;
      orthographicCamera: any;
    }
  }
}

export {};
