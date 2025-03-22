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
  color?: string;
  size?: number;
}

// More interesting global regions with study activities
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
const latLongToVector3 = (lat: number, lng: number, radius: number) => {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  
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
          size: 0.018 // Larger size for user's location
        });
        console.log('Using browser geolocation:', position.coords.latitude, position.coords.longitude);
      }
    } catch (geoError) {
      console.log('Browser geolocation failed, falling back to IP geolocation');
      
      // Browser geolocation failed, try IP geolocation as fallback
      try {
        // Try freegeoip.app as alternative to ipapi.co
        const response = await fetch('https://api.ipgeolocation.io/ipgeo?apiKey=API_KEY');
        const data = await response.json();
        
        if (data.latitude && data.longitude) {
          users.push({
            id: 'self',
            lat: parseFloat(data.latitude),
            lng: parseFloat(data.longitude),
            timestamp: Date.now(),
            color: '#F6B17A', // Warm orange for user
            size: 0.018 // Larger size for user's location
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
          // Default to London as a fallback
          lat: 51.5074,
          lng: -0.1278,
          timestamp: Date.now(),
          color: '#F6B17A', // Warm orange for user
          size: 0.018 // Larger size for user's location
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
        size: randomInRange(0.006, 0.012)
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
    
    // Create a texture with dark blue color for the globe
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    if (context) {
      // Fill background with dark blue
      context.fillStyle = '#1a1a2e';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw subtle grid lines
      context.strokeStyle = 'rgba(112, 119, 161, 0.2)'; // #7077A1 with 0.2 opacity
      context.lineWidth = 0.8;
      
      // Grid lines (latitude)
      for (let i = 0; i <= 8; i++) {
        const y = (i * canvas.height) / 8;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.stroke();
      }
      
      // Grid lines (longitude)
      for (let i = 0; i <= 16; i++) {
        const x = (i * canvas.width) / 16;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.stroke();
      }
      
      // Create a better gradient for the continents
      const continentGradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      continentGradient.addColorStop(0, '#364075');   // Base color
      continentGradient.addColorStop(0.5, '#4e5683'); // Slightly lighter
      continentGradient.addColorStop(1, '#364075');   // Back to base
      
      context.fillStyle = continentGradient;
      
      // Draw highly detailed continents with realistic shapes

      // Set main continent fill style with gradient
      context.fillStyle = continentGradient;
      
      // North America with detailed coastlines
      context.beginPath();
      // Alaska and Arctic
      context.moveTo(150, 120);
      context.bezierCurveTo(160, 110, 170, 105, 185, 100);
      // Northern Canada & Greenland
      context.bezierCurveTo(200, 90, 220, 85, 240, 90);
      context.bezierCurveTo(260, 95, 290, 100, 310, 105);
      context.bezierCurveTo(320, 110, 330, 120, 320, 130);
      // Eastern Canada & US Atlantic Coast
      context.bezierCurveTo(310, 140, 300, 150, 290, 155);
      context.bezierCurveTo(280, 165, 270, 175, 260, 180);
      // Gulf of Mexico & Caribbean
      context.bezierCurveTo(250, 190, 240, 200, 230, 205);
      context.bezierCurveTo(220, 210, 210, 215, 195, 220);
      // Central America
      context.bezierCurveTo(200, 230, 210, 240, 225, 250);
      context.bezierCurveTo(225, 255, 235, 260, 240, 262);
      // West coasts of Mexico & US
      context.bezierCurveTo(230, 250, 215, 230, 190, 215);
      context.bezierCurveTo(180, 200, 170, 180, 165, 165);
      // Alaska Peninsula & Western Canada
      context.bezierCurveTo(160, 150, 155, 140, 150, 130);
      context.bezierCurveTo(145, 125, 148, 122, 150, 120);
      context.closePath();
      context.fill();
      
      // Add highlights and details to North America
      const naHighlight = context.createLinearGradient(170, 100, 320, 250);
      naHighlight.addColorStop(0, 'rgba(112, 119, 161, 0.2)');
      naHighlight.addColorStop(1, 'rgba(246, 177, 122, 0.05)');
      context.fillStyle = naHighlight;
      context.fill();
      
      // Great Lakes
      context.fillStyle = 'rgba(26, 26, 46, 0.7)';
      context.beginPath();
      context.arc(270, 170, 5, 0, 2 * Math.PI);
      context.fill();
      
      // Reset fill style
      context.fillStyle = continentGradient;
      
      // South America with accurate shape
      context.beginPath();
      // Panama/Colombia border
      context.moveTo(240, 262);
      // West Coast (Colombia, Ecuador, Peru, Chile)
      context.bezierCurveTo(245, 275, 250, 290, 255, 310);
      context.bezierCurveTo(260, 330, 265, 350, 270, 370);
      context.bezierCurveTo(275, 390, 280, 410, 285, 425);
      // Southern tip (Cape Horn)
      context.bezierCurveTo(290, 430, 295, 425, 300, 420);
      // East Coast (Argentina, Uruguay, Brazil)
      context.bezierCurveTo(310, 410, 320, 380, 325, 370);
      context.bezierCurveTo(330, 350, 335, 330, 332, 310);
      // Northern Brazil, Guianas, Venezuela
      context.bezierCurveTo(325, 290, 315, 280, 305, 275);
      context.bezierCurveTo(290, 270, 270, 265, 260, 260);
      context.bezierCurveTo(250, 260, 245, 260, 240, 262);
      context.closePath();
      context.fill();
      
      // Add Amazon Basin highlight
      const amazonHighlight = context.createRadialGradient(300, 320, 5, 300, 320, 60);
      amazonHighlight.addColorStop(0, 'rgba(26, 26, 46, 0.15)');
      amazonHighlight.addColorStop(1, 'rgba(26, 26, 46, 0)');
      context.fillStyle = amazonHighlight;
      context.fill();
      
      // Reset fill style
      context.fillStyle = continentGradient;
      
      // Europe with detailed shape
      context.beginPath();
      // Western Europe & Iberian Peninsula
      context.moveTo(475, 150);
      context.bezierCurveTo(480, 145, 485, 140, 490, 138);
      // UK, Scandinavia & Baltic
      context.bezierCurveTo(500, 130, 510, 120, 520, 115);
      context.bezierCurveTo(525, 110, 535, 108, 545, 110);
      // Russia & Eastern Europe
      context.bezierCurveTo(555, 115, 565, 125, 560, 135);
      context.bezierCurveTo(555, 145, 550, 155, 545, 160);
      // Mediterranean & Southern Europe
      context.bezierCurveTo(535, 165, 525, 170, 515, 175);
      context.bezierCurveTo(505, 170, 495, 165, 485, 160);
      context.bezierCurveTo(480, 155, 475, 153, 475, 150);
      context.closePath();
      context.fill();
      
      // Mediterranean Sea details
      context.strokeStyle = 'rgba(26, 26, 46, 0.4)';
      context.beginPath();
      context.moveTo(510, 175);
      context.lineTo(540, 180);
      context.stroke();
      
      // Reset fill style
      context.fillStyle = continentGradient;
      
      // Africa with more realistic outline
      context.beginPath();
      // Northwest Africa (Morocco, Western Sahara)
      context.moveTo(480, 180);
      // North Africa (Mediterranean Coast)
      context.bezierCurveTo(490, 180, 510, 185, 530, 185);
      context.bezierCurveTo(540, 185, 550, 185, 560, 190);
      // Horn of Africa (Somalia)
      context.bezierCurveTo(570, 210, 580, 230, 585, 260);
      // East Africa
      context.bezierCurveTo(580, 280, 575, 300, 570, 320);
      // Southern Africa
      context.bezierCurveTo(565, 340, 555, 355, 545, 365);
      context.bezierCurveTo(535, 370, 525, 365, 515, 360);
      // West Africa
      context.bezierCurveTo(500, 345, 490, 325, 480, 305);
      context.bezierCurveTo(475, 285, 470, 260, 475, 235);
      context.bezierCurveTo(475, 215, 478, 195, 480, 180);
      context.closePath();
      context.fill();
      
      // Add Sahara details
      const saharaGradient = context.createLinearGradient(480, 200, 560, 240);
      saharaGradient.addColorStop(0, 'rgba(246, 177, 122, 0.05)');
      saharaGradient.addColorStop(1, 'rgba(26, 26, 46, 0.05)');
      context.fillStyle = saharaGradient;
      context.fill();
      
      // Reset fill style
      context.fillStyle = continentGradient;
      
      // Asia with very detailed outline including subregions
      context.beginPath();
      // Russia & Siberia
      context.moveTo(560, 110);
      context.bezierCurveTo(580, 105, 620, 105, 660, 110);
      context.bezierCurveTo(680, 110, 700, 115, 720, 120);
      // East Asia (China, Korea, Japan)
      context.bezierCurveTo(730, 130, 745, 145, 750, 160);
      context.bezierCurveTo(748, 175, 742, 185, 735, 195);
      // Southeast Asia (Vietnam, Thailand, Malaysia)
      context.bezierCurveTo(730, 200, 725, 210, 715, 215);
      context.bezierCurveTo(705, 220, 700, 225, 695, 230);
      // India & South Asia
      context.bezierCurveTo(685, 230, 675, 225, 665, 220);
      context.bezierCurveTo(655, 215, 645, 210, 635, 205);
      // Middle East & Western Asia
      context.bezierCurveTo(620, 200, 610, 190, 600, 180);
      context.bezierCurveTo(590, 170, 580, 160, 570, 150);
      context.bezierCurveTo(565, 140, 562, 130, 560, 110);
      context.closePath();
      context.fill();
      
      // Add Himalayan mountain range detail
      context.strokeStyle = 'rgba(246, 177, 122, 0.1)';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(650, 180);
      context.bezierCurveTo(660, 175, 670, 170, 690, 175);
      context.stroke();
      
      // Add subtle highlights to Asia
      const asiaHighlight = context.createLinearGradient(560, 115, 750, 220);
      asiaHighlight.addColorStop(0, 'rgba(112, 119, 161, 0.15)');
      asiaHighlight.addColorStop(1, 'rgba(246, 177, 122, 0.1)');
      context.fillStyle = asiaHighlight;
      context.fill();
      
      // Reset fill style
      context.fillStyle = continentGradient;
      
      // Australia and Oceania with more organic shape
      context.beginPath();
      // Northwest Australia
      context.moveTo(795, 305);
      // Northern Australia
      context.bezierCurveTo(805, 295, 820, 290, 835, 295);
      // Northeast Australia (Queensland)
      context.bezierCurveTo(850, 305, 860, 320, 865, 335);
      // Southeast Australia
      context.bezierCurveTo(860, 350, 850, 365, 835, 375);
      // Southern Australia
      context.bezierCurveTo(820, 380, 805, 375, 795, 365);
      // Western Australia
      context.bezierCurveTo(790, 350, 785, 335, 790, 320);
      context.bezierCurveTo(790, 310, 792, 305, 795, 305);
      context.closePath();
      context.fill();
      
      // Add interior desert details
      const outbackGradient = context.createRadialGradient(825, 340, 10, 825, 340, 45);
      outbackGradient.addColorStop(0, 'rgba(246, 177, 122, 0.07)');
      outbackGradient.addColorStop(1, 'rgba(26, 26, 46, 0)');
      context.fillStyle = outbackGradient;
      context.fill();
      
      // Reset fill style
      context.fillStyle = continentGradient;
      
      // Indonesia/Papua New Guinea
      context.beginPath();
      context.moveTo(760, 270);
      context.bezierCurveTo(770, 265, 780, 265, 790, 270);
      context.bezierCurveTo(795, 272, 800, 275, 795, 280);
      context.bezierCurveTo(790, 282, 780, 280, 770, 278);
      context.bezierCurveTo(765, 275, 760, 273, 760, 270);
      context.closePath();
      context.fill();
      
      // New Zealand (North & South Islands)
      context.beginPath();
      context.ellipse(905, 315, 8, 3, Math.PI / 4, 0, 2 * Math.PI);
      context.fill();
      context.beginPath();
      context.ellipse(910, 325, 10, 4, Math.PI / 3, 0, 2 * Math.PI);
      context.fill();
      
      // Japan islands
      context.beginPath();
      context.moveTo(760, 160);
      context.bezierCurveTo(765, 155, 770, 150, 775, 155);
      context.bezierCurveTo(773, 160, 770, 165, 765, 170);
      context.bezierCurveTo(760, 165, 760, 162, 760, 160);
      context.fill();
      
      // Add glow effect around all continents
      context.shadowColor = 'rgba(112, 119, 161, 0.35)';
      context.shadowBlur = 20;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      
      // Draw major rivers and lakes for extra detail
      context.strokeStyle = 'rgba(26, 26, 46, 0.5)';
      context.lineWidth = 1.3;
      
      // Amazon River with tributaries
      context.beginPath();
      context.moveTo(280, 340);
      context.bezierCurveTo(290, 335, 300, 333, 310, 335);
      context.bezierCurveTo(320, 337, 330, 340, 325, 345);
      context.stroke();
      
      // Tributary
      context.beginPath();
      context.moveTo(295, 330);
      context.bezierCurveTo(298, 335, 300, 337, 305, 335);
      context.stroke();
      
      // Nile River
      context.beginPath();
      context.moveTo(530, 230);
      context.bezierCurveTo(535, 250, 538, 270, 540, 290);
      context.bezierCurveTo(541, 300, 542, 310, 540, 320);
      context.stroke();
      
      // Mississippi River
      context.beginPath();
      context.moveTo(240, 170);
      context.bezierCurveTo(238, 180, 235, 190, 230, 200);
      context.stroke();
      
      // Yangtze River
      context.beginPath();
      context.moveTo(710, 180);
      context.bezierCurveTo(700, 182, 690, 185, 680, 187);
      context.stroke();
      
      // Clear shadow for future drawing
      context.shadowColor = 'transparent';
      context.shadowBlur = 0;
    }
    
    // Convert canvas to texture
    const texture = new THREE.CanvasTexture(canvas);
    
    // Create globe material with texture
    const globeMaterial = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 5,
      transparent: true,
      opacity: 0.9
    });
    
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
            const pulseSize = user.id === 'self' ? 0.018 : user.size ? user.size : 0.01;
            const ringGeometry = new THREE.RingGeometry(pulseSize, pulseSize + 0.005, 32);
            
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
