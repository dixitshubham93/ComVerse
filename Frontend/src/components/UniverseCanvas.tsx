import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ReactNode, useRef, useImperativeHandle, forwardRef } from 'react';

interface UniverseCanvasProps {
  children: ReactNode;
}

export interface UniverseCanvasRef {
  animateToTarget: (targetPosition: [number, number, number], fromSearch: boolean) => void;
  cancelAnimation: () => void;
}

function CameraController({ 
  controlsRef 
}: { 
  controlsRef: React.RefObject<any>;
}) {
  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={true}
      enablePan={false}
      enableRotate={true}
      autoRotate={true}
      autoRotateSpeed={0.5}
      minDistance={8}
      maxDistance={30}
      zoomSpeed={0.8}
    />
  );
}

export const UniverseCanvas = forwardRef<UniverseCanvasRef, UniverseCanvasProps>(
  ({ children }, ref) => {
    const controlsRef = useRef<any>(null);
    const animationRef = useRef<number | null>(null);

    useImperativeHandle(ref, () => ({
      animateToTarget: async (targetPosition: [number, number, number], fromSearch: boolean) => {
        if (!controlsRef.current) return;

        const controls = controlsRef.current;
        const camera = controls.object;
        
        // Lock controls
        controls.enabled = false;
        controls.autoRotate = false;

        // If from search, do 3-spin rotation first
        if (fromSearch) {
          const spinDuration = 1800; // 1.8s
          const slowdownDuration = 800; // 0.8s
          const startTime = Date.now();
          const rotationsPerSecond = 3 / 1.8; // Define outside so it's accessible in slowdown phase

          await new Promise<void>((resolve) => {
            const animate = () => {
              const elapsed = Date.now() - startTime;
              
              if (elapsed < spinDuration) {
                // 3 rotations in 1.8s = linear fast rotation
                controls.autoRotateSpeed = rotationsPerSecond * 360 / 60; // Convert to degrees per frame at 60fps
                controls.autoRotate = true;
                controls.update();
                animationRef.current = requestAnimationFrame(animate);
              } else if (elapsed < spinDuration + slowdownDuration) {
                // Slow down with easeOutCubic
                const slowdownProgress = (elapsed - spinDuration) / slowdownDuration;
                const easeOut = 1 - Math.pow(1 - slowdownProgress, 3);
                const currentSpeed = (rotationsPerSecond * 360 / 60) * (1 - easeOut);
                controls.autoRotateSpeed = Math.max(currentSpeed, 0);
                controls.update();
                animationRef.current = requestAnimationFrame(animate);
              } else {
                controls.autoRotate = false;
                resolve();
              }
            };
            animate();
          });
        }

        // Camera travel to target
        const startPos = camera.position.clone();
        const targetCameraPos = targetPosition.map((v, i) => v + [0, 0, 8][i]) as [number, number, number];
        const travelDuration = 900; // 0.9s
        const startTime = Date.now();

        await new Promise<void>((resolve) => {
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / travelDuration, 1);
            
            // easeOutCubic
            const eased = 1 - Math.pow(1 - progress, 3);
            
            camera.position.x = startPos.x + (targetCameraPos[0] - startPos.x) * eased;
            camera.position.y = startPos.y + (targetCameraPos[1] - startPos.y) * eased;
            camera.position.z = startPos.z + (targetCameraPos[2] - startPos.z) * eased;
            
            controls.target.set(targetPosition[0], targetPosition[1], targetPosition[2]);
            controls.update();

            if (progress < 1) {
              animationRef.current = requestAnimationFrame(animate);
            } else {
              resolve();
            }
          };
          animate();
        });

        // Wait for highlight animation
        await new Promise(resolve => setTimeout(resolve, 350));

        // Re-enable controls
        controls.enabled = true;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
      },

      cancelAnimation: () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
          controlsRef.current.autoRotate = true;
          controlsRef.current.autoRotateSpeed = 0.5;
        }
      }
    }));

    return (
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        {/* Ambient light for overall scene lighting */}
        <ambientLight intensity={0.3} />
        
        {/* Point light for highlights */}
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        
        {/* Main content */}
        {children}
        
        {/* Camera controls */}
        <CameraController 
          controlsRef={controlsRef}
        />
      </Canvas>
    );
  }
);