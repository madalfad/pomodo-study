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

  // Generate user data from IP geolocation
  const fetchUserLocations = async (): Promise<ActiveUser[]> => {
    try {
      // First get client's own IP location
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const users: ActiveUser[] = [];
      const count = Math.floor(Math.random() * 500) + 1000; // Keep the count display as before
      setActiveUsers(count);
      
      // Add user's own location if available
      if (data.latitude && data.longitude) {
        users.push({
          id: 'self',
          lat: data.latitude,
          lng: data.longitude,
          timestamp: Date.now()
        });
      }
      
      // Pre-defined major city coordinates to add realistic study locations
      const majorCities = [
        { lat: 40.7128, lng: -74.0060 }, // New York
        { lat: 51.5074, lng: -0.1278 }, // London
        { lat: 48.8566, lng: 2.3522 }, // Paris
        { lat: 35.6762, lng: 139.6503 }, // Tokyo
        { lat: 22.3193, lng: 114.1694 }, // Hong Kong
        { lat: 19.0760, lng: 72.8777 }, // Mumbai
        { lat: -33.8688, lng: 151.2093 }, // Sydney
        { lat: -23.5505, lng: -46.6333 }, // São Paulo
        { lat: 37.7749, lng: -122.4194 }, // San Francisco
        { lat: 55.7558, lng: 37.6173 }, // Moscow
        { lat: 52.5200, lng: 13.4050 }, // Berlin
        { lat: 41.9028, lng: 12.4964 }, // Rome
        { lat: 31.2304, lng: 121.4737 }, // Shanghai
        { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
        { lat: 37.5665, lng: 126.9780 }, // Seoul
        { lat: 25.2048, lng: 55.2708 }, // Dubai
        { lat: 1.3521, lng: 103.8198 }, // Singapore
        { lat: 59.3293, lng: 18.0686 }, // Stockholm
        { lat: 30.0444, lng: 31.2357 }, // Cairo
        { lat: -6.2088, lng: 106.8456 }, // Jakarta
      ];
      
      // Add 24 major cities to make it 25 total points
      for (let i = 0; i < Math.min(24, majorCities.length); i++) {
        const city = majorCities[i];
        users.push({
          id: `city-${i}`,
          lat: city.lat,
          lng: city.lng,
          timestamp: Date.now()
        });
      }
      
      return users;
    } catch (error) {
      console.error('Error fetching location data:', error);
      
      // Fallback to random data if IP geolocation fails
      const users: ActiveUser[] = [];
      for (let i = 0; i < 25; i++) {
        users.push({
          id: `user-${i}`,
          lat: (Math.random() * 180) - 90,
          lng: (Math.random() * 360) - 180,
          timestamp: Date.now()
        });
      }
      return users;
    }
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
    
    // Add country outlines - Use THREE.Object3D as a generic container
    const countryLines = new THREE.Object3D();
    
    // Simplified country boundaries as latitude/longitude line segments
    const countries = [
      // North America outline
      [
        [49, -125], [49, -95], [49, -65], 
        [25, -80], [25, -100], [32, -120], [49, -125]
      ],
      // South America outline
      [
        [10, -80], [0, -50], [-20, -40], 
        [-50, -70], [-40, -75], [10, -80]
      ],
      // Europe outline
      [
        [55, -10], [60, 20], [55, 40], 
        [45, 10], [36, -5], [55, -10]
      ],
      // Africa outline
      [
        [30, -10], [30, 50], [0, 45], 
        [-30, 30], [-35, 15], [0, -10], [30, -10]
      ],
      // Asia outline
      [
        [60, 40], [60, 140], [35, 140], 
        [20, 100], [10, 70], [30, 50], [60, 40]
      ],
      // Australia outline
      [
        [-20, 115], [-20, 145], [-35, 150], 
        [-35, 115], [-20, 115]
      ],
    ];
    
    countries.forEach(country => {
      const vertices = [];
      
      // Convert country outline points to vectors and create lines between them
      for (let i = 0; i < country.length; i++) {
        const [lat, lng] = country[i];
        const point = latLongToVector3(lat, lng, radius + 0.002);
        vertices.push(point.x, point.y, point.z);
      }
      
      // Use the basic built-in geometry and line
      const geometry = new THREE.BufferGeometry();
      
      // Cast to any to work around TypeScript limitations
      (geometry as any).setAttribute('position', new THREE.BufferAttribute(
        new Float32Array(vertices), 3
      ));
      
      const material = new THREE.MeshBasicMaterial({
        color: 0x7077A1,
        transparent: true,
        opacity: 0.5,
        wireframe: true
      });
      
      // Create a mesh with the line geometry
      const line = new THREE.Mesh(geometry, material);
      countryLines.add(line);
    });
    
    scene.add(countryLines);
    
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
    const updateMarkers = async () => {
      const users = await fetchUserLocations();
      
      // Clear existing markers
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => scene.remove(marker as any));
        markersRef.current = [];
      }
      
      // Add new markers
      users.forEach(user => {
        const position = latLongToVector3(user.lat, user.lng, radius + 0.01);
        
        // Make user's own marker slightly larger and different color
        const isOwnLocation = user.id === 'self';
        const markerSize = isOwnLocation ? 0.015 : 0.01;
        const markerColor = isOwnLocation ? 0xF6B17A : 0xF7F7F7;
        
        const markerGeometry = new THREE.SphereGeometry(markerSize, 8, 8);
        const markerMaterial = new THREE.MeshBasicMaterial({
          color: markerColor,
          transparent: true,
          opacity: isOwnLocation ? 0.9 : 0.7
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
