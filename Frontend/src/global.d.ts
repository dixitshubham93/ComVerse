// react-three-fiber.d.ts  (or global.d.ts)
// Place at project root or src/ directory.

import { OrbitControlsProps } from "@react-three/drei";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Core R3F elements
      primitive: any;
      group: any;
      mesh: any;
      object3D: any;

      // Lights
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      directionalLight: any;

      // Drei / Three elements (components)
      Sphere: any;
      Plane: any;
      Html: any;
      Environment: any;
      OrbitControls: OrbitControlsProps;

      // Materials
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshPhongMaterial: any;

      // Cameras
      perspectiveCamera: any;
      orthographicCamera: any;
    }
  }
}

export {};
