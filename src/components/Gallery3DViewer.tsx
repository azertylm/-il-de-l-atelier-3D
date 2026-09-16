import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { 
  Maximize2, Minimize2, Sun, Moon, Volume2, VolumeX, 
  Sparkles, Sliders, ChevronLeft, ChevronRight, Eye, 
  HelpCircle, Layers, X, RefreshCw, Check, Info, QrCode, MapPin
} from "lucide-react";

export interface GalleryArtwork {
  id: string;
  title: string;
  artist?: string;
  medium?: string;
  year?: string;
  imageSrc: string;
  description?: string;
  price?: string;
}

export type FrameStyle = "caisse-noire" | "or-brosse" | "neon-lightpainting" | "alu-minimaliste" | "sans-cadre";

export interface Gallery3DViewerProps {
  artworks: GalleryArtwork[];
  initialIndex?: number;
  isOpen?: boolean;
  onClose?: () => void;
  isKioskMode?: boolean;
  onToggleKiosk?: () => void;
  onToggleKioskMode?: () => void;
  onOpenCircuit?: () => void;
  onOpenCartels?: () => void;
  onSelectArtwork?: (index: number) => void;
  theme?: "dark-gold" | "light";
}

/**
 * Creates a high-craft 2D canvas texture fallback with gradient,
 * typography, and artistic accents to guarantee that every artwork renders immediately.
 * If the image loads asynchronously, it is drawn over this canvas.
 */
function createArtworkCanvasTexture(art: GalleryArtwork, index: number): { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture } {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // 1. Background dark museum atmosphere
    const grad = ctx.createLinearGradient(0, 0, 1024, 768);
    grad.addColorStop(0, "#0a0a0d");
    grad.addColorStop(0.5, "#141318");
    grad.addColorStop(1, "#08080a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 768);

    // 2. Luminous art accents (light-painting or brush swirl background)
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = index % 2 === 0 ? "#c9a84c" : "#e67e22";
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(512 + (i - 2) * 60, 384, 180 + i * 40, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Elegant Gold inner border
    ctx.strokeStyle = "rgba(201, 168, 76, 0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 964, 708);
    ctx.strokeRect(45, 45, 934, 678);

    // 4. Central card plaque
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(120, 260, 784, 248);
    ctx.strokeStyle = "#c9a84c";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(120, 260, 784, 248);

    // 5. Typography
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(`« ${art.title || "Œuvre Contemporaine"} »`, 512, 330);

    ctx.fillStyle = "#c9a84c";
    ctx.font = "italic 22px sans-serif";
    ctx.fillText(art.artist || "L'Atelier", 512, 380);

    ctx.fillStyle = "#a0a0a0";
    ctx.font = "17px sans-serif";
    ctx.fillText(`${art.medium || "Technique Mixte"} • ${art.year || "2026"}`, 512, 430);

    if (art.price) {
      ctx.fillStyle = "#55efc4";
      ctx.font = "bold 18px monospace";
      ctx.fillText(art.price, 512, 470);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;

  // Asynchronous image loading with CORS support
  if (art.imageSrc && !art.imageSrc.startsWith("data:image/svg") && art.imageSrc.length > 20) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = art.imageSrc;
    img.onload = () => {
      if (ctx) {
        // Draw image covering the canvas
        ctx.clearRect(0, 0, 1024, 768);
        ctx.drawImage(img, 0, 0, 1024, 768);
        // Subtle edge vignette
        const gradVig = ctx.createRadialGradient(512, 384, 250, 512, 384, 600);
        gradVig.addColorStop(0, "rgba(0,0,0,0)");
        gradVig.addColorStop(1, "rgba(0,0,0,0.5)");
        ctx.fillStyle = gradVig;
        ctx.fillRect(0, 0, 1024, 768);
        texture.needsUpdate = true;
      }
    };
    img.onerror = () => {
      // Fallback is already drawn! Nothing breaks.
      console.info("Using procedural canvas for 3D artwork:", art.title);
    };
  }

  return { canvas, texture };
}

export default function Gallery3DViewer({
  artworks,
  initialIndex = 0,
  isOpen = true,
  onClose,
  isKioskMode = false,
  onToggleKiosk,
  onOpenCircuit,
  onOpenCartels,
  onSelectArtwork,
  theme = "dark-gold"
}: Gallery3DViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [frameStyle, setFrameStyle] = useState<FrameStyle>("neon-lightpainting");
  const [ambientLevel, setAmbientLevel] = useState<number>(0.25);
  const [spotIntensity, setSpotIntensity] = useState<number>(3.2);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [showInfoPanel, setShowInfoPanel] = useState<boolean>(true);
  const [showLightingMenu, setShowLightingMenu] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // References for Three.js internals
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const spotLightRef = useRef<THREE.SpotLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const glowLightRef = useRef<THREE.PointLight | null>(null);
  const artworkGroupsRef = useRef<THREE.Group[]>([]);
  const targetCameraXRef = useRef<number>(0);
  const currentCameraXRef = useRef<number>(0);

  // Orbit control state
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraRotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraZoomRef = useRef<number>(4.2);

  const SPACING = 4.8; // Distance between artworks along the wall

  const safeArtworks: GalleryArtwork[] = artworks && artworks.length > 0 ? artworks : [
    {
      id: "sample_1",
      title: "Symphonie Lumineuse",
      artist: "L'Atelier",
      medium: "Light Painting & Chiaroscuro",
      year: "2026",
      imageSrc: "",
      description: "Exploration des contrastes purs et des sillages lumineux dans l'obscurité contemporaine."
    }
  ];

  const activeArtwork = safeArtworks[currentIndex] || safeArtworks[0];

  // Sync index if initialIndex changes
  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < safeArtworks.length) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, safeArtworks.length]);

  // Audio Guide with SpeechSynthesis
  const handleToggleAudio = () => {
    if (!window.speechSynthesis) return;

    if (isAudioPlaying) {
      window.speechSynthesis.cancel();
      setIsAudioPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const text = `${activeArtwork.title}. Une œuvre de ${activeArtwork.artist || "l'artiste"}. ${activeArtwork.medium || ""}. ${activeArtwork.description || "Cette composition explore les contrastes subtils, les trajectoires d'énergie lumineuse et les résonances chromatiques dans un écrin d'obscurité contemporain."}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsAudioPlaying(false);
      utterance.onerror = () => setIsAudioPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsAudioPlaying(true);
    }
  };

  // Switch artwork left/right
  const handlePrevious = useCallback(() => {
    if (safeArtworks.length <= 1) return;
    const nextIdx = currentIndex > 0 ? currentIndex - 1 : safeArtworks.length - 1;
    setCurrentIndex(nextIdx);
    if (onSelectArtwork) onSelectArtwork(nextIdx);
  }, [currentIndex, safeArtworks.length, onSelectArtwork]);

  const handleNext = useCallback(() => {
    if (safeArtworks.length <= 1) return;
    const nextIdx = currentIndex < safeArtworks.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(nextIdx);
    if (onSelectArtwork) onSelectArtwork(nextIdx);
  }, [currentIndex, safeArtworks.length, onSelectArtwork]);

  const handleSelectSpecific = (idx: number) => {
    if (idx >= 0 && idx < safeArtworks.length) {
      setCurrentIndex(idx);
      if (onSelectArtwork) onSelectArtwork(idx);
    }
  };

  // Toggle browser fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape" && onClose) {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        onClose();
      } else if (e.key.toLowerCase() === "f") {
        handleToggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevious, handleNext, onClose]);

  // Update target camera X smoothly when currentIndex changes
  useEffect(() => {
    targetCameraXRef.current = currentIndex * SPACING;
    // Softly center rotation
    cameraRotationRef.current.y *= 0.3;
    cameraRotationRef.current.x *= 0.3;
  }, [currentIndex, SPACING]);

  // Helper to build 3D frames
  function createFrameMesh(width: number, height: number, style: FrameStyle): THREE.Group {
    const frameGroup = new THREE.Group();
    frameGroup.name = "frameMeshGroup";
    const depth = style === "caisse-noire" ? 0.12 : 0.05;
    const border = style === "sans-cadre" ? 0.01 : (style === "alu-minimaliste" ? 0.03 : 0.08);

    let mat: THREE.Material;

    if (style === "or-brosse") {
      mat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.85,
        roughness: 0.25
      });
    } else if (style === "neon-lightpainting") {
      mat = new THREE.MeshStandardMaterial({
        color: 0x111111,
        emissive: 0xffaa33,
        emissiveIntensity: 0.55,
        roughness: 0.3
      });
    } else if (style === "alu-minimaliste") {
      mat = new THREE.MeshStandardMaterial({
        color: 0xdddddd,
        metalness: 0.9,
        roughness: 0.15
      });
    } else if (style === "caisse-noire") {
      mat = new THREE.MeshStandardMaterial({
        color: 0x141414,
        roughness: 0.7,
        metalness: 0.1
      });
    } else {
      mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    }

    if (style !== "sans-cadre") {
      // Top bar
      const topGeo = new THREE.BoxGeometry(width + border * 2, border, depth);
      const topMesh = new THREE.Mesh(topGeo, mat);
      topMesh.position.set(0, height / 2 + border / 2, depth / 2);
      frameGroup.add(topMesh);

      // Bottom bar
      const bottomMesh = new THREE.Mesh(topGeo, mat);
      bottomMesh.position.set(0, -height / 2 - border / 2, depth / 2);
      frameGroup.add(bottomMesh);

      // Left bar
      const sideGeo = new THREE.BoxGeometry(border, height, depth);
      const leftMesh = new THREE.Mesh(sideGeo, mat);
      leftMesh.position.set(-width / 2 - border / 2, 0, depth / 2);
      frameGroup.add(leftMesh);

      // Right bar
      const rightMesh = new THREE.Mesh(sideGeo, mat);
      rightMesh.position.set(width / 2 + border / 2, 0, depth / 2);
      frameGroup.add(rightMesh);
    }

    return frameGroup;
  }

  // Update frames when frameStyle changes
  useEffect(() => {
    artworkGroupsRef.current.forEach((group) => {
      const existingFrame = group.getObjectByName("frameMeshGroup");
      if (existingFrame) {
        group.remove(existingFrame);
      }
      const newFrame = createFrameMesh(2.6, 1.95, frameStyle);
      group.add(newFrame);
    });
  }, [frameStyle]);

  // Update lighting in real time
  useEffect(() => {
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = ambientLevel;
    }
  }, [ambientLevel]);

  useEffect(() => {
    if (spotLightRef.current) {
      spotLightRef.current.intensity = spotIntensity;
    }
  }, [spotIntensity]);

  // Three.js Scene Setup & Initialization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060608);
    scene.fog = new THREE.FogExp2(0x060608, 0.035);

    // Guaranteed sizing
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 2. Camera
    const aspect = width / Math.max(height, 1);
    const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 120);
    camera.position.set(0, 0.2, 4.2);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambient = new THREE.AmbientLight(0xffffff, ambientLevel);
    scene.add(ambient);
    ambientLightRef.current = ambient;

    // Dynamic Focused Spotlight on the selected artwork
    const spot = new THREE.SpotLight(0xfffaee, spotIntensity, 30, Math.PI / 4.2, 0.45, 1.1);
    spot.position.set(0, 3.8, 3.5);
    spot.castShadow = true;
    spot.shadow.mapSize.width = 1024;
    spot.shadow.mapSize.height = 1024;
    spot.shadow.bias = -0.001;
    scene.add(spot);
    spotLightRef.current = spot;

    // Glow accent for warm light painting illumination
    const glow = new THREE.PointLight(0xffa726, 1.6, 7, 1.4);
    glow.position.set(0, 0.2, 0.3);
    scene.add(glow);
    glowLightRef.current = glow;

    // 5. Floor (Dark Polished Museum Concrete / Glossy Parquet)
    const galleryLength = Math.max(100, safeArtworks.length * SPACING + 40);
    const floorGeo = new THREE.PlaneGeometry(galleryLength, 50);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0c0c0e,
      roughness: 0.18,
      metalness: 0.8
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.8;
    floor.receiveShadow = true;
    scene.add(floor);

    // Subtle Perspective Grid on Floor
    const gridHelper = new THREE.GridHelper(galleryLength, Math.round(galleryLength / 2), 0x242426, 0x121214);
    gridHelper.position.y = -1.79;
    scene.add(gridHelper);

    // 6. Gallery Back Wall
    const wallGeo = new THREE.PlaneGeometry(galleryLength, 20);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x111114,
      roughness: 0.9,
      metalness: 0.05
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.z = -0.08;
    wall.position.y = 2;
    wall.receiveShadow = true;
    scene.add(wall);

    // Baseboard Plinth Moulding along the wall
    const plinthGeo = new THREE.BoxGeometry(galleryLength, 0.18, 0.09);
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 0.4 });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.set(0, -1.71, 0);
    scene.add(plinth);

    // 7. Artworks on the wall
    const artworkGroups: THREE.Group[] = [];
    const canvasWidth = 2.6;
    const canvasHeight = 1.95;

    safeArtworks.forEach((art, idx) => {
      const group = new THREE.Group();
      // Exact absolute positioning: artwork idx is at idx * SPACING
      group.position.x = idx * SPACING;
      group.position.y = 0.2;
      group.position.z = 0;
      group.userData = { index: idx, artwork: art };

      // High-Craft Canvas Texture (Procedural + Async Image Overlay)
      const { texture } = createArtworkCanvasTexture(art, idx);

      const canvasGeo = new THREE.PlaneGeometry(canvasWidth, canvasHeight);
      const canvasMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.28,
        metalness: 0.05
      });
      const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
      canvasMesh.position.z = 0.02;
      canvasMesh.castShadow = true;
      canvasMesh.receiveShadow = true;
      canvasMesh.userData = { index: idx };
      group.add(canvasMesh);

      // Frame Mesh
      const frameGroup = createFrameMesh(canvasWidth, canvasHeight, frameStyle);
      group.add(frameGroup);

      // 3D Wall Cartel Plaque beside the artwork
      const cartelGeo = new THREE.PlaneGeometry(0.55, 0.3);
      const cartelMat = new THREE.MeshStandardMaterial({
        color: 0x161618,
        roughness: 0.35,
        metalness: 0.4
      });
      const cartelMesh = new THREE.Mesh(cartelGeo, cartelMat);
      cartelMesh.position.set(canvasWidth / 2 + 0.48, -canvasHeight / 2 + 0.2, 0.01);
      group.add(cartelMesh);

      scene.add(group);
      artworkGroups.push(group);
    });

    artworkGroupsRef.current = artworkGroups;

    // 8. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera interpolation towards target artwork position
      currentCameraXRef.current += (targetCameraXRef.current - currentCameraXRef.current) * 0.085;

      if (cameraRef.current) {
        cameraRef.current.position.x = currentCameraXRef.current + Math.sin(cameraRotationRef.current.y) * cameraZoomRef.current;
        cameraRef.current.position.z = Math.cos(cameraRotationRef.current.y) * cameraZoomRef.current;
        cameraRef.current.position.y = 0.2 + cameraRotationRef.current.x * 2.2;
        cameraRef.current.lookAt(currentCameraXRef.current, 0.2, 0);
      }

      // Spotlight follows the active artwork center
      if (spotLightRef.current) {
        spotLightRef.current.position.x = currentCameraXRef.current;
        spotLightRef.current.target.position.set(currentCameraXRef.current, 0.2, 0);
        spotLightRef.current.target.updateMatrixWorld();
      }

      if (glowLightRef.current) {
        glowLightRef.current.position.x = currentCameraXRef.current;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 10. Mouse / Drag Events for Orbiting
    const domElement = renderer.domElement;

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePosRef.current.x;
      const deltaY = e.clientY - previousMousePosRef.current.y;

      cameraRotationRef.current.y -= deltaX * 0.005;
      cameraRotationRef.current.x -= deltaY * 0.003;

      // Constrain rotation to always keep artwork facing viewer
      cameraRotationRef.current.y = Math.max(-0.42, Math.min(0.42, cameraRotationRef.current.y));
      cameraRotationRef.current.x = Math.max(-0.25, Math.min(0.25, cameraRotationRef.current.x));

      previousMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraZoomRef.current = Math.max(2.2, Math.min(6.2, cameraZoomRef.current + e.deltaY * 0.003));
    };

    // Raycasting click to jump to clicked artwork
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      const rect = domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        let parent: THREE.Object3D | null = hit.object;
        while (parent && parent !== scene) {
          if (parent.userData && typeof parent.userData.index === "number") {
            handleSelectSpecific(parent.userData.index);
            return;
          }
          parent = parent.parent;
        }
      }
    };

    domElement.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    domElement.addEventListener("wheel", handleWheel, { passive: false });
    domElement.addEventListener("click", handleClick);

    // Touch Support
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosRef.current.x;
      const deltaY = e.touches[0].clientY - previousMousePosRef.current.y;

      cameraRotationRef.current.y -= deltaX * 0.006;
      cameraRotationRef.current.x -= deltaY * 0.004;

      cameraRotationRef.current.y = Math.max(-0.42, Math.min(0.42, cameraRotationRef.current.y));
      cameraRotationRef.current.x = Math.max(-0.25, Math.min(0.25, cameraRotationRef.current.x));

      previousMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    domElement.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      domElement.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      domElement.removeEventListener("wheel", handleWheel);
      domElement.removeEventListener("click", handleClick);
      domElement.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [safeArtworks]);

  if (isOpen === false) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#060608] flex flex-col select-none overflow-hidden animate-fadeIn text-white font-sans">
      
      {/* Top Header Controls Bar */}
      <header className="h-16 px-4 sm:px-6 bg-black/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between gap-4 z-20 shrink-0">
        
        {/* Left: Gallery Badge & Active Artwork Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#c9a84c] animate-pulse shrink-0 shadow-[0_0_8px_#c9a84c]" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a84c] font-bold truncate">
                Galerie 3D Immersive
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 bg-white/10 text-neutral-300 border border-white/15 shrink-0">
                {currentIndex + 1} / {safeArtworks.length}
              </span>
            </div>
            <h2 className="text-white font-serif font-light text-sm sm:text-base tracking-wide truncate">
              {activeArtwork.title} <span className="text-neutral-400 text-xs font-sans">• {activeArtwork.artist || "L'Atelier"}</span>
            </h2>
          </div>
        </div>

        {/* Center / Right: Frame Style, Lighting & Controls */}
        <div className="flex items-center gap-2">

          {/* Frame Style Quick Switcher (Desktop) */}
          <div className="hidden lg:flex items-center gap-1 bg-neutral-900/90 p-1 border border-white/10 text-[11px] font-mono">
            <span className="text-neutral-400 px-2 uppercase text-[9px]">Cadre:</span>
            {(["neon-lightpainting", "caisse-noire", "or-brosse", "alu-minimaliste", "sans-cadre"] as FrameStyle[]).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setFrameStyle(style)}
                className={`px-2 py-1 transition-all cursor-pointer ${
                  frameStyle === style 
                    ? "bg-[#c9a84c] text-black font-bold shadow-sm" 
                    : "text-neutral-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {style === "neon-lightpainting" && "Néon"}
                {style === "caisse-noire" && "Caisse Noire"}
                {style === "or-brosse" && "Or Brossé"}
                {style === "alu-minimaliste" && "Alu"}
                {style === "sans-cadre" && "Sans Cadre"}
              </button>
            ))}
          </div>

          {/* Lighting Menu Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLightingMenu(!showLightingMenu)}
              className={`p-2 border transition-colors cursor-pointer ${
                showLightingMenu ? "bg-[#c9a84c] text-black border-[#c9a84c]" : "bg-black/60 text-white border-white/20 hover:border-[#c9a84c]"
              }`}
              title="Ajuster l'éclairage et les spots"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Lighting Dropdown Popover */}
            {showLightingMenu && (
              <div className="absolute right-0 top-12 w-64 bg-neutral-950 border border-white/20 p-4 shadow-2xl z-30 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#c9a84c]">
                    Éclairage Scénographique
                  </span>
                  <button onClick={() => setShowLightingMenu(false)} className="text-neutral-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-neutral-400">Spotlight Focalisé</span>
                    <span className="text-[#c9a84c] font-bold">{spotIntensity.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="6.0"
                    step="0.2"
                    value={spotIntensity}
                    onChange={(e) => setSpotIntensity(parseFloat(e.target.value))}
                    className="w-full accent-[#c9a84c] cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-neutral-400">Ambiance Sombre</span>
                    <span className="text-[#c9a84c] font-bold">{ambientLevel.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.8"
                    step="0.05"
                    value={ambientLevel}
                    onChange={(e) => setAmbientLevel(parseFloat(e.target.value))}
                    className="w-full accent-[#c9a84c] cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Audio Guide Narration */}
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`flex items-center gap-1.5 px-3 py-2 border text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              isAudioPlaying 
                ? "bg-amber-400 text-black border-amber-300 animate-pulse shadow-[0_0_12px_rgba(201,168,76,0.5)]" 
                : "bg-black/60 text-[#c9a84c] border-white/20 hover:border-[#c9a84c]"
            }`}
            title="Écouter le cartel audio commenté par l'IA"
          >
            {isAudioPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isAudioPlaying ? "Arrêter" : "Audioguide"}</span>
          </button>

          {/* Cartels & QR Link */}
          {onOpenCartels && (
            <button
              type="button"
              onClick={onOpenCartels}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 border border-white/20 text-neutral-300 hover:text-white hover:border-[#c9a84c] text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
              title="Cartels muraux d'exposition et QR codes de vente"
            >
              <QrCode className="w-3.5 h-3.5 text-[#c9a84c]" />
              <span className="hidden md:inline">Cartels & QR</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-2 bg-black/60 text-white border border-white/20 hover:border-[#c9a84c] transition-colors cursor-pointer"
            title="Plein écran (Touche F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Gallery Button */}
          {onClose && (
            <button
              type="button"
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                onClose();
              }}
              className="flex items-center gap-1 px-3 py-2 bg-neutral-900 hover:bg-rose-950 border border-white/20 hover:border-rose-500 text-neutral-200 hover:text-white text-xs font-mono font-bold uppercase transition-all cursor-pointer"
              title="Fermer la galerie 3D (Échap)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          )}
        </div>
      </header>

      {/* Main 3D Canvas Area */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        
        {/* WebGL Canvas */}
        <div 
          ref={containerRef} 
          className="w-full h-full cursor-grab active:cursor-grabbing"
          title="Glissez avec la souris pour orienter le regard, molette pour zoomer, cliquez sur une œuvre pour vous approcher"
        />

        {/* Large Navigation Chevrons */}
        <button
          type="button"
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-14 bg-black/70 hover:bg-[#c9a84c] text-white hover:text-black border border-white/20 hover:border-[#c9a84c] transition-all flex items-center justify-center cursor-pointer backdrop-blur-sm shadow-xl group"
          title="Œuvre précédente (Touche Flèche Gauche)"
        >
          <ChevronLeft className="w-7 h-7 transition-transform group-hover:-translate-x-1" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-14 bg-black/70 hover:bg-[#c9a84c] text-white hover:text-black border border-white/20 hover:border-[#c9a84c] transition-all flex items-center justify-center cursor-pointer backdrop-blur-sm shadow-xl group"
          title="Œuvre suivante (Touche Flèche Droite)"
        >
          <ChevronRight className="w-7 h-7 transition-transform group-hover:translate-x-1" />
        </button>

        {/* Floating Cartel Plaque (Collapsible) */}
        {showInfoPanel && (
          <div className="absolute left-6 bottom-24 max-w-md bg-black/85 backdrop-blur-md border border-[#c9a84c]/50 p-4 shadow-2xl z-20 animate-fadeIn pointer-events-auto">
            <div className="flex items-start justify-between gap-3 mb-2 border-b border-white/10 pb-2">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#c9a84c] block">
                  Cartel d'Exposition
                </span>
                <h3 className="text-white font-serif font-bold text-base leading-tight">
                  {activeArtwork.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoPanel(false)}
                className="text-neutral-400 hover:text-white p-1"
                title="Masquer le cartel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-neutral-300">
              <p className="font-medium text-[#c9a84c]">{activeArtwork.artist || "Artiste de l'Atelier"}</p>
              <p className="italic text-neutral-400">{activeArtwork.medium || "Technique Mixte"} ({activeArtwork.year || "2026"})</p>
              {activeArtwork.price && (
                <p className="font-mono text-emerald-400 font-bold">Prix d'acquisition : {activeArtwork.price}</p>
              )}
              {activeArtwork.description && (
                <p className="text-[11px] leading-relaxed text-neutral-300 pt-1 border-t border-white/10">
                  {activeArtwork.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Toggle Cartel Button if hidden */}
        {!showInfoPanel && (
          <button
            type="button"
            onClick={() => setShowInfoPanel(true)}
            className="absolute left-6 bottom-24 z-20 px-3 py-1.5 bg-black/80 hover:bg-[#c9a84c] text-white hover:text-black border border-[#c9a84c]/40 text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Voir Cartel</span>
          </button>
        )}
      </div>

      {/* Bottom Thumbnails Navigation Strip */}
      <footer className="h-20 bg-black/95 border-t border-white/10 px-4 sm:px-6 flex items-center justify-between gap-4 z-20 shrink-0">
        
        {/* Left: Quick Instructions */}
        <div className="hidden md:flex flex-col text-[10px] font-mono text-neutral-400 shrink-0">
          <span className="text-[#c9a84c] font-bold">NAVIGATION LIBRE</span>
          <span>Flèches Clavier ← → • Clic sur tableau pour zoomer</span>
        </div>

        {/* Center: Scrollable Thumbnails */}
        <div className="flex-1 flex items-center justify-center gap-2 overflow-x-auto py-2 px-2 no-scrollbar max-w-4xl">
          {safeArtworks.map((art, idx) => (
            <button
              key={art.id || idx}
              type="button"
              onClick={() => handleSelectSpecific(idx)}
              className={`relative h-14 w-20 shrink-0 border-2 overflow-hidden transition-all duration-300 cursor-pointer ${
                currentIndex === idx
                  ? "border-[#c9a84c] scale-105 shadow-[0_0_12px_rgba(201,168,76,0.6)]"
                  : "border-white/15 opacity-60 hover:opacity-100 hover:border-white/40"
              }`}
              title={`${idx + 1}. ${art.title}`}
            >
              {art.imageSrc ? (
                <img
                  src={art.imageSrc}
                  alt={art.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-[9px] font-mono text-neutral-400 p-1 text-center">
                  {art.title.slice(0, 10)}
                </div>
              )}
              <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono bg-black/80 text-[#c9a84c] px-1">
                {idx + 1}
              </span>
            </button>
          ))}
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenCircuit && (
            <button
              type="button"
              onClick={onOpenCircuit}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 border border-white/20 hover:border-[#c9a84c] text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Ouvrir le parcours nocturne géolocalisé"
            >
              <MapPin className="w-3.5 h-3.5 text-[#c9a84c]" />
              <span className="hidden sm:inline">Parcours Urbain</span>
            </button>
          )}
        </div>
      </footer>

    </div>
  );
}
