import { FC, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { motion } from "framer-motion";
import earthMap from "@/assets/images/earth-map.svg";

interface ActiveUser {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
  color?: string;
  size?: number;
}

// Study regions around the world
const studyRegions = [
  { id: 'major-1', lat: 40.7128, lng: -74.0060 }, // New York
  { id: 'major-2', lat: 51.5074, lng: -0.1278 }, // London
  { id: 'major-3', lat: 48.8566, lng: 2.3522 }, // Paris
  { id: 'major-4', lat: 35.6762, lng: 139.6503 }, // Tokyo
  { id: 'major-5', lat: 22.3193, lng: 114.1694 }, // Hong Kong
  { id: 'major-6', lat: -33.8688, lng: 151.2093 }, // Sydney
  { id: 'major-7', lat: 37.7749, lng: -122.4194 }, // San Francisco
  { id: 'major-8', lat: 55.7558, lng: 37.6173 }, // Moscow
  { id: 'major-9', lat: 52.5200, lng: 13.4050 }, // Berlin
  { id: 'major-10', lat: 31.2304, lng: 121.4737 }, // Shanghai
  { id: 'major-11', lat: 37.5665, lng: 126.9780 }, // Seoul
  { id: 'major-12', lat: 1.3521, lng: 103.8198 }, // Singapore
  { id: 'major-13', lat: -6.2088, lng: 106.8456 }, // Jakarta
  { id: 'major-14', lat: 25.2048, lng: 55.2708 }, // Dubai
  { id: 'major-15', lat: 19.0760, lng: 72.8777 }, // Mumbai
  { id: 'major-16', lat: -23.5505, lng: -46.6333 }, // São Paulo
  { id: 'major-17', lat: 41.9028, lng: 12.4964 }, // Rome
  { id: 'major-18', lat: -34.6037, lng: -58.3816 }, // Buenos Aires
  { id: 'major-19', lat: 59.3293, lng: 18.0686 }, // Stockholm
  { id: 'major-20', lat: 30.0444, lng: 31.2357 }, // Cairo
];

// Helper function for random values
const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Convert lat/long to 3D position on a sphere
// Adjusted for better mapping with the provided SVG
const latLongToVector3 = (lat: number, lng: number, radius: number) => {
  // For equirectangular map projection, adjust phi calculation
  // SVG is 1280x688, so we need to adjust for aspect ratio
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  
  // Standard formula for converting spherical coordinates to cartesian
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
};

const GlobeVisualization: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeRef = useRef<THREE.Mesh | null>(null);
  const markersRef = useRef<THREE.Mesh[]>([]);
  const animationFrameRef = useRef<number>();
  const pulsesRef = useRef<{mesh: THREE.Mesh, maxScale: number, speed: number}[]>([]);

  // Generate user data
  const fetchUserLocations = async (): Promise<ActiveUser[]> => {
    // Create users array that will hold all our points
    const users: ActiveUser[] = [];
    
    // Random number between 1000-1500 for active users count display
    const count = Math.floor(Math.random() * 500) + 1000;
    setActiveUsers(count);
    
    // First try native browser geolocation API for most accurate results
    try {
      // Use browser's geolocation API directly, without permissions check
      // (browser will handle permission UI if needed)
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve, 
          reject, 
          {
            timeout: 5000,
            enableHighAccuracy: true,
            maximumAge: 60000 // 1 minute
          }
        );
      });
      
      // If we got coordinates, add user at their real location
      if (position?.coords) {
        users.push({
          id: 'self',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          color: '#F6B17A', // Warm orange for user
          size: 0.025 // Larger size for user's location
        });
        console.log('Using browser geolocation:', position.coords.latitude, position.coords.longitude);
      }
    } catch (geoError) {
      console.log('Browser geolocation failed, falling back to IP geolocation');
      
      // Browser geolocation failed, try IP geolocation as fallback
      try {
        // Try ipapi.co for geolocation 
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.latitude && data.longitude) {
          users.push({
            id: 'self',
            lat: parseFloat(data.latitude),
            lng: parseFloat(data.longitude),
            timestamp: Date.now(),
            color: '#F6B17A', // Warm orange for user
            size: 0.025 // Larger size for user's location
          });
          console.log('Using IP geolocation:', data.latitude, data.longitude);
        } else {
          throw new Error('IP geolocation did not return coordinates');
        }
      } catch (ipError) {
        console.log('All geolocation methods failed, using default location');
        
        // All geolocation attempts failed, use default
        users.push({
          id: 'self',
          // Default to San Francisco as a fallback
          lat: 37.7749,
          lng: -122.4194,
          timestamp: Date.now(),
          color: '#F6B17A', // Warm orange for user
          size: 0.025 // Larger size for user's location
        });
      }
    }
    
    // Add major study regions as active points
    studyRegions.forEach((region, i) => {
      users.push({
        id: region.id,
        lat: region.lat,
        lng: region.lng,
        timestamp: Date.now(),
        color: i % 4 === 0 ? '#F7F7F7' : // White
               i % 4 === 1 ? '#7077A1' : // Muted purple
               i % 4 === 2 ? '#4e5683' : // Darker purple
               '#324d7a',                 // Deep blue
        size: randomInRange(0.01, 0.018)
      });
    });
    
    return users;
  };

  // Initialize and setup the globe
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Get container dimensions
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // Setup scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Setup camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.z = 3;
    cameraRef.current = camera;
    
    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true // Enable transparency
    });
    renderer.setSize(width, height);
    
    // Append the renderer to the DOM
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create the globe sphere
    const radius = 1;
    const segments = 64;
    const globeGeometry = new THREE.SphereGeometry(radius, segments, segments);
    
    // Create canvas for texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Create a new image element
    const earthImage = new Image();
    earthImage.src = earthMap;
    
    // Create material with a basic blue color until image loads
    const globeMaterial = new THREE.MeshBasicMaterial({
      color: 0x364075, 
      transparent: true,
      opacity: 0.9
    });
    
    // When image loads, update the texture
    earthImage.onload = () => {
      if (ctx) {
        ctx.drawImage(earthImage, 0, 0, canvas.width, canvas.height);
        const texture = new THREE.CanvasTexture(canvas);
        // Apply the texture to the existing material
        if (globeRef.current) {
          (globeRef.current.material as THREE.MeshBasicMaterial).map = texture;
          (globeRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
        }
      }
    };
    
    // Create the globe mesh
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);
    globeRef.current = globe;
    
    // Add a glow effect
    const glowGeometry = new THREE.SphereGeometry(radius * 1.02, segments, segments);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x7077A1,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowMesh);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    
    // Add directional light for highlights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add point light for warm glow
    const pointLight = new THREE.PointLight(0xF6B17A, 0.8);
    pointLight.position.set(2, 1, 1);
    scene.add(pointLight);
    
    // Setup orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.1;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    
    // Animation function to update markers and render
    const animate = () => {
      // Update pulsing rings
      pulsesRef.current.forEach(pulse => {
        // Get current scale
        const scale = pulse.mesh.scale.x;
        
        // Increase scale
        const newScale = scale + pulse.speed * 0.01;
        
        // If reached max scale, reset to 1
        if (newScale > pulse.maxScale) {
          pulse.mesh.scale.set(1, 1, 1);
        } else {
          pulse.mesh.scale.set(newScale, newScale, newScale);
          
          // Fade out as it expands
          if (pulse.mesh.material instanceof THREE.Material) {
            pulse.mesh.material.opacity = 1 - ((newScale - 1) / (pulse.maxScale - 1));
          }
        }
      });
      
      controls.update();
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Function to update markers
    const updateMarkers = async () => {
      try {
        // Get user locations
        const users = await fetchUserLocations();
        
        // Remove old markers
        markersRef.current.forEach(marker => {
          scene.remove(marker);
          if (marker.geometry) marker.geometry.dispose();
          if (marker.material instanceof THREE.Material) marker.material.dispose();
        });
        markersRef.current = [];
        
        // Clear old pulses
        pulsesRef.current.forEach(pulse => {
          scene.remove(pulse.mesh);
          if (pulse.mesh.geometry) pulse.mesh.geometry.dispose();
          if (pulse.mesh.material instanceof THREE.Material) pulse.mesh.material.dispose();
        });
        pulsesRef.current = [];
        
        // Add new markers for each user
        users.forEach((user, index) => {
          // Calculate position on globe
          const position = latLongToVector3(user.lat, user.lng, radius);
          
          // Create marker
          const markerGeometry = new THREE.SphereGeometry(user.size || 0.01, 16, 16);
          const markerMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(user.color || '#ffffff'),
            transparent: true,
            opacity: 0.9
          });
          
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.copy(position);
          scene.add(marker);
          markersRef.current.push(marker);
          
          // Add pulsing ring effect for some markers (e.g., user's own location and random ones)
          if (user.id === 'self' || index % 3 === 0) {
            const pulseSize = user.id === 'self' ? 0.025 : user.size ? user.size : 0.015;
            const ringGeometry = new THREE.RingGeometry(pulseSize, pulseSize + 0.006, 32);
            
            // Adjust the ring geometry to be perpendicular to the marker position
            ringGeometry.lookAt(new THREE.Vector3(0, 0, 0));
            
            // Create a material for the ring
            const ringMaterial = new THREE.MeshBasicMaterial({
              color: new THREE.Color(user.color || '#ffffff'),
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.7
            });
            
            // Create the ring mesh
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.copy(position);
            
            // Set initial scale to 1
            ring.scale.set(1, 1, 1);
            
            // Add ring to scene
            scene.add(ring);
            
            // Add to pulses ref for animation
            pulsesRef.current.push({
              mesh: ring,
              maxScale: user.id === 'self' ? 2.5 : randomInRange(1.5, 2),
              speed: user.id === 'self' ? 0.04 : randomInRange(0.02, 0.035)
            });
          }
        });
      } catch (error) {
        console.error('Error updating markers:', error);
      }
    };
    
    // Initial update and start interval
    updateMarkers();
    const intervalId = setInterval(updateMarkers, 30000); // Update every 30 seconds
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose of Three.js resources
      if (globeRef.current) {
        if (globeRef.current.geometry) globeRef.current.geometry.dispose();
        if (globeRef.current.material instanceof THREE.Material) {
          globeRef.current.material.dispose();
        }
      }
      
      markersRef.current.forEach(marker => {
        if (marker.geometry) marker.geometry.dispose();
        if (marker.material instanceof THREE.Material) marker.material.dispose();
      });
      
      pulsesRef.current.forEach(pulse => {
        if (pulse.mesh.geometry) pulse.mesh.geometry.dispose();
        if (pulse.mesh.material instanceof THREE.Material) pulse.mesh.material.dispose();
        
      });
      
      if (controls) controls.dispose();
      if (rendererRef.current) rendererRef.current.dispose();
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
          
          <div 
            ref={containerRef} 
            className="globe-container relative h-[300px] w-full rounded-lg overflow-hidden bg-gray-900 shadow-inner"
            style={{ 
              background: 'radial-gradient(circle at center, #2D3250 0%, #1a1a2e 70%)',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)' 
            }}
          >
            {/* Three.js globe will render here */}
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
