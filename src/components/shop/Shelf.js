import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// A wall shelf under a reading lamp, with the books standing face out. Units are inches, so
// every book is its real trim size and spine thickness. Hover lifts a book off the wall;
// clicking takes it off the shelf, and clicking it again turns it over to the back cover.

const W = 5.5;
const H = 8.5;
const LEAN = 0.11; // radians the books rest back against the wall
const GAP = 0.9;

// A colour token from the page's CSS (`--canvas: r g b`).
const token = (name) => {
  const [r, g, b] = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim().split(/\s+/).map(Number);
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
};

const useThemeColor = (name) => {
  const [color, setColor] = useState(() => token(name));
  useEffect(() => {
    const observer = new MutationObserver(() => setColor(token(name)));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => observer.disconnect();
  }, [name]);
  return color;
};

const canvasTexture = (w, h, draw) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

// Walnut, drawn rather than downloaded: long grain lines with a little wander.
const woodTexture = () =>
  canvasTexture(2048, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#6b4a33');
    g.addColorStop(1, '#4e3424');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i += 1) {
      const y = Math.random() * h;
      ctx.strokeStyle = `rgba(${Math.random() < 0.5 ? '30,18,10' : '140,100,70'},${0.08 + Math.random() * 0.14})`;
      ctx.lineWidth = 0.6 + Math.random() * 1.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 64) ctx.lineTo(x, y + Math.sin(x / (180 + i * 3) + i) * 3);
      ctx.stroke();
    }
  });

// The lamp's warm pool of light on the wall.
const glowTexture = () =>
  canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,214,170,1)');
    g.addColorStop(0.55, 'rgba(255,200,150,0.35)');
    g.addColorStop(1, 'rgba(255,200,150,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

// Page edges: cream paper with the faint lines of a few hundred leaves.
const pagesTexture = (rotate) => {
  const t = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#efe7d6';
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 2) {
      ctx.fillStyle = `rgba(120,100,70,${0.05 + Math.random() * 0.1})`;
      ctx.fillRect(x, 0, 1, h);
    }
  });
  if (rotate) {
    t.center.set(0.5, 0.5);
    t.rotation = Math.PI / 2;
  }
  return t;
};

const Book = ({ book, x, selected, hovered, flipped, onHover, onSelect, edgeSide, edgeTop }) => {
  const [front, back, spine] = useLoader(THREE.TextureLoader, [
    `/store/${book.slug}/front.jpg`,
    `/store/${book.slug}/back.jpg`,
    `/store/${book.slug}/spine.jpg`,
  ]);
  const gl = useThree((s) => s.gl);
  const depth = book.spineIn;

  // Box faces: +x fore-edge, -x spine, +y top, -y bottom, +z front cover, -z back cover.
  const materials = useMemo(() => {
    [front, back, spine].forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = gl.capabilities.getMaxAnisotropy();
    });
    const cover = (map) => new THREE.MeshStandardMaterial({ map, roughness: 0.62, metalness: 0 });
    const paper = (map) => new THREE.MeshStandardMaterial({ map, roughness: 0.95, metalness: 0 });
    return [paper(edgeSide), cover(spine), paper(edgeTop), paper(edgeTop), cover(front), cover(back)];
  }, [front, back, spine, edgeSide, edgeTop, gl]);

  const pivot = useRef();
  const now = useRef({ x, lift: 0, lean: LEAN, z: 0, turn: 0 });

  useFrame((_, dt) => {
    const goal = selected
      ? { x: 0, lift: 1.1, lean: 0, z: 6.2, turn: flipped ? Math.PI : 0 }
      : hovered
        ? { x, lift: 0.35, lean: LEAN * 0.45, z: 0.5, turn: 0 }
        : { x, lift: 0, lean: LEAN, z: 0, turn: 0 };
    const k = 1 - Math.pow(0.002, Math.min(dt, 0.05));
    const s = now.current;
    Object.keys(goal).forEach((key) => {
      s[key] += (goal[key] - s[key]) * k;
    });
    // Resting books stand on their bottom edge, leaning back; a lifted book turns about its middle.
    pivot.current.position.set(s.x, s.lift, H * Math.sin(LEAN) + depth / 2 + 0.06 + s.z);
    pivot.current.rotation.set(-s.lean, s.turn, 0);
  });

  return (
    <group ref={pivot}>
      <mesh
        position={[0, H / 2, 0]}
        material={materials}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(book.slug);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(book.slug);
        }}
      >
        <boxGeometry args={[W, H, depth]} />
      </mesh>
    </group>
  );
};

const Bookend = ({ x }) => (
  <mesh position={[x, 2.3, 1.6]} castShadow receiveShadow>
    <boxGeometry args={[0.14, 4.6, 3.6]} />
    <meshStandardMaterial color="#b0915f" roughness={0.45} metalness={0.25} />
  </mesh>
);

// Keep the whole shelf in frame at any width, and let the pointer move the eye a little.
const Rig = () => {
  const { camera, size, pointer } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const aspect = size.width / size.height;
    const half = Math.tan((camera.fov * Math.PI) / 360);
    const dist = Math.max(24, 9.8 / (half * aspect), 7.8 / half);
    target.set(pointer.x * 1.4, 5.2 + pointer.y * 0.6, dist);
    camera.position.lerp(target, 0.06);
    camera.lookAt(0, 4.3, 0);
  });
  return null;
};

const Scene = ({ books, selected, flipped, onSelect }) => {
  const [hovered, setHovered] = useState(null);
  const wall = useThemeColor('canvas');
  const dark = wall.getHSL({ h: 0, s: 0, l: 0 }).l < 0.2;
  const wood = useMemo(woodTexture, []);
  const glow = useMemo(glowTexture, []);
  const edgeSide = useMemo(() => pagesTexture(false), []);
  const edgeTop = useMemo(() => pagesTexture(true), []);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered]);

  const span = books.length * W + (books.length - 1) * GAP;
  return (
    <>
      <Rig />
      <hemisphereLight args={['#fff4e6', '#2a2118', 0.55]} />
      <spotLight
        position={[-8, 19, 15]}
        angle={0.62}
        penumbra={0.9}
        intensity={2.6}
        decay={0}
        color="#ffe2bf"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[10, 6, 14]} intensity={0.35} color="#dfe8ff" />

      {/* the wall is the page itself: its exact colour, with only the shadows and the lamp's glow on it */}
      <mesh position={[0, 8, 0]} onClick={() => onSelect(null)}>
        <planeGeometry args={[140, 70]} />
        <meshBasicMaterial color={wall} toneMapped={false} />
      </mesh>
      <mesh position={[0, 8, 0.01]} receiveShadow>
        <planeGeometry args={[140, 70]} />
        <shadowMaterial opacity={dark ? 0.6 : 0.16} />
      </mesh>
      <mesh position={[-1.5, 6.5, 0.02]}>
        <planeGeometry args={[38, 26]} />
        <meshBasicMaterial
          map={glow}
          transparent
          depthWrite={false}
          toneMapped={false}
          opacity={dark ? 0.32 : 0.2}
          blending={dark ? THREE.AdditiveBlending : THREE.NormalBlending}
        />
      </mesh>

      <mesh position={[0, -0.42, 3.5]} receiveShadow castShadow onClick={() => onSelect(null)}>
        <boxGeometry args={[span + 9, 0.84, 7]} />
        <meshStandardMaterial map={wood} roughness={0.7} metalness={0} />
      </mesh>

      {books.map((book, i) => (
        <Book
          key={book.slug}
          book={book}
          x={-span / 2 + W / 2 + i * (W + GAP)}
          selected={selected === book.slug}
          hovered={hovered === book.slug && selected !== book.slug}
          flipped={flipped}
          onHover={setHovered}
          onSelect={(slug) => onSelect(slug, true)}
          edgeSide={edgeSide}
          edgeTop={edgeTop}
        />
      ))}
      <Bookend x={-span / 2 - 0.5} />
      <Bookend x={span / 2 + 0.5} />
    </>
  );
};

const Shelf = ({ books, selected, flipped, onSelect, className = '' }) => (
  <div className={`shelf-fade ${className}`} aria-hidden="true">
    <Canvas
      shadows={{ type: THREE.PCFSoftShadowMap }}
      dpr={[1, 1.75]}
      camera={{ fov: 30, position: [0, 5.2, 30], near: 0.5, far: 200 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <Scene books={books} selected={selected} flipped={flipped} onSelect={onSelect} />
      </Suspense>
    </Canvas>
  </div>
);

export default Shelf;
