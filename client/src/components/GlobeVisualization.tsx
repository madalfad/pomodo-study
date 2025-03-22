import { FC, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { motion } from "framer-motion";

interface ActiveUser {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
}

const GlobeVisualization: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const sceneRef = useRef<{ 
    scene?: THREE.Scene, 
    renderer?: THREE.WebGLRenderer, 
    camera?: THREE.PerspectiveCamera, 
    globe?: THREE.Mesh, 
    controls?: OrbitControls 
  }>({});
  const markersRef = useRef<Array<THREE.Mesh>>([]);
  const animationFrameRef = useRef<number>();

  // Generate simulated user data for the globe
  const generateRandomUsers = (): ActiveUser[] => {
    const users: ActiveUser[] = [];
    const count = Math.floor(Math.random() * 500) + 1000; // 1000-1500 users
    setActiveUsers(count);
    
    for (let i = 0; i < 25; i++) { // We'll only show 25 dots for performance
      users.push({
        id: `user-${i}`,
        lat: (Math.random() * 180) - 90, // -90 to 90
        lng: (Math.random() * 360) - 180, // -180 to 180
        timestamp: Date.now()
      });
    }
    return users;
  };

  // Convert lat/long to 3D position on a sphere
  const latLongToVector3 = (lat: number, lon: number, radius: number) => {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z);
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 3;
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.07;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    
    // Create Earth
    const radius = 1;
    const segments = 50;
    const globeGeometry = new THREE.SphereGeometry(radius, segments, segments);
    
    // Earth material with subtle glow
    const globeMaterial = new THREE.MeshBasicMaterial({
      color: 0x2D3250,
      transparent: true,
      opacity: 0.8
    });
    
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe as any);
    
    // Add a glow effect
    const glowGeometry = new THREE.SphereGeometry(radius * 1.01, segments, segments);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x7077A1,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowMesh as any);
    
    // Grid for reference
    const gridHelper = new THREE.GridHelper(2 * radius, 10, 0x7077A1, 0x7077A1);
    gridHelper.position.y = -radius - 0.1;
    scene.add(gridHelper as any);
    
    // Store references for cleanup and animation
    sceneRef.current = { scene, renderer, camera, globe, controls };
    
    // Animation loop
    const animate = () => {
      if (sceneRef.current.controls) {
        sceneRef.current.controls.update();
      }
      if (sceneRef.current.renderer && sceneRef.current.scene && sceneRef.current.camera) {
        sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Update markers on interval
    const updateMarkers = () => {
      const users = generateRandomUsers();
      
      // Clear existing markers
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => scene.remove(marker as any));
        markersRef.current = [];
      }
      
      // Add new markers
      users.forEach(user => {
        const position = latLongToVector3(user.lat, user.lng, radius + 0.01);
        
        const markerGeometry = new THREE.SphereGeometry(0.01, 8, 8);
        const markerMaterial = new THREE.MeshBasicMaterial({
          color: 0xF6B17A,
          transparent: true,
          opacity: 0.8
        });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(position.x, position.y, position.z);
        scene.add(marker as any);
        markersRef.current.push(marker);
      });
    };
    
    updateMarkers();
    const intervalId = setInterval(updateMarkers, 10000);
    
    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current.camera || !sceneRef.current.renderer) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      sceneRef.current.camera.aspect = width / height;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && sceneRef.current.renderer) {
        containerRef.current.removeChild(sceneRef.current.renderer.domElement);
      }
      
      // Clean up Three.js resources
      markersRef.current.forEach(marker => {
        marker.geometry.dispose();
        (marker.material as THREE.Material).dispose();
      });
      
      if (sceneRef.current.globe) {
        sceneRef.current.globe.geometry.dispose();
        (sceneRef.current.globe.material as THREE.Material).dispose();
      }
      
      if (sceneRef.current.scene) {
        sceneRef.current.scene.clear();
      }
      
      if (sceneRef.current.controls) {
        sceneRef.current.controls.dispose();
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="shadow-lg bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <h2 className="text-xl font-poppins font-semibold mb-5 text-amber-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Focus Community
          </h2>
          
          <div ref={containerRef} className="globe-container h-[250px] w-full relative rounded-lg overflow-hidden bg-gray-900">
            {/* Three.js will render here */}
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-400 font-workSans">
            <p>
              <span className="font-semibold text-amber-400">{activeUsers.toLocaleString()}</span> people focusing worldwide right now
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GlobeVisualization;
