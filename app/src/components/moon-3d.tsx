/* eslint-disable react/no-unknown-property -- props của react-three-fiber, không phải DOM */
// Mặt trăng 3D + vành đai hạt + tiểu hành tinh; chạm mặt trăng để mở vành đai.
// Chuyển từ component web "lunar-gravity-card" sang React Native (expo-gl).
import { Canvas, useFrame, useLoader } from '@react-three/fiber/native';
import { Suspense, useMemo, useRef, useState, type RefObject } from 'react';
import { type ViewStyle } from 'react-native';
import * as THREE from 'three';

const RADIUS = 2.0;
const ASTEROIDS = 75;
// Bundle texture trong app để chạy offline (nguồn: cdn.21st.dev).
const MOON_TEXTURE = require('@/assets/images/moon.jpg');

type RingState = 'hidden' | 'animating' | 'visible';
type AsteroidsRef = RefObject<Float32Array>;

function RealisticMoon({ onPress }: { onPress?: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const colorMap = useLoader(THREE.TextureLoader, MOON_TEXTURE) as THREE.Texture;

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.05;
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow onClick={onPress}>
      <sphereGeometry args={[RADIUS, 64, 64]} />
      <meshStandardMaterial map={colorMap} bumpMap={colorMap} bumpScale={0.02} roughness={0.8} metalness={0.1} />
    </mesh>
  );
}

const particlesCount = 60000;
const [ringPositions, ringColors, ringRandoms] = (() => {
  const pos = new Float32Array(particlesCount * 3);
  const col = new Float32Array(particlesCount * 3);
  const rnd = new Float32Array(particlesCount);

  for (let i = 0; i < particlesCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rDist = Math.pow(Math.random(), 1.5);
    const radius = 2.2 + rDist * 2.2;
    const thickness = 0.4 - rDist * 0.2;
    const ySpread = Math.random() + Math.random() + Math.random() - 1.5;

    pos[i * 3] = Math.cos(angle) * radius;
    pos[i * 3 + 1] = ySpread * thickness;
    pos[i * 3 + 2] = Math.sin(angle) * radius;

    const intensity = 1.0 - rDist;
    const paletteType = Math.random();
    let [r, g, b] = paletteType < 0.8 ? [0.25, 0.3, 0.35] : paletteType < 0.92 ? [0.0, 0.6, 0.8] : [0.6, 0.2, 0.8];
    r = Math.min(1, Math.max(0, r + (Math.random() - 0.5) * 0.1));
    g = Math.min(1, Math.max(0, g + (Math.random() - 0.5) * 0.1));
    b = Math.min(1, Math.max(0, b + (Math.random() - 0.5) * 0.1));
    const sparkle = Math.random() > 0.95 ? 2.5 : 1.0;

    col[i * 3] = r * intensity * sparkle;
    col[i * 3 + 1] = g * intensity * sparkle;
    col[i * 3 + 2] = b * intensity * sparkle;
    rnd[i] = Math.random();
  }
  return [pos, col, rnd];
})();

type Shader = { uniforms: Record<string, THREE.IUniform>; vertexShader: string; fragmentShader: string };

function ParticleRing({ ringState, asteroidsRef }: { ringState: RingState; asteroidsRef: AsteroidsRef }) {
  const pointsRef = useRef<THREE.Points>(null);
  const uniforms = useRef({
    uProgress: { value: ringState === 'visible' ? 1.0 : 0.0 },
    uAsteroids: { value: new Float32Array(ASTEROIDS * 4) },
    time: { value: 0 },
  });
  // Tái dùng mỗi frame để tránh GC giật hình trên điện thoại.
  const scratch = useMemo(() => ({ inv: new THREE.Matrix4(), v: new THREE.Vector3() }), []);

  useFrame((state, delta) => {
    const u = uniforms.current;
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= delta * 0.02;
      pointsRef.current.updateMatrix();
      scratch.inv.copy(pointsRef.current.matrix).invert();
      const src = asteroidsRef.current;
      const dst = u.uAsteroids.value;
      for (let i = 0; i < ASTEROIDS; i++) {
        scratch.v.set(src[i * 4], src[i * 4 + 1], src[i * 4 + 2]).applyMatrix4(scratch.inv);
        dst[i * 4] = scratch.v.x;
        dst[i * 4 + 1] = scratch.v.y;
        dst[i * 4 + 2] = scratch.v.z;
        dst[i * 4 + 3] = src[i * 4 + 3];
      }
    }
    u.time.value = state.clock.elapsedTime;

    if (ringState === 'animating') u.uProgress.value = Math.min(1.0, u.uProgress.value + delta * 0.35);
    else u.uProgress.value = ringState === 'visible' ? 1.0 : 0.0;
  });

  const onBeforeCompile = (shader: Shader) => {
    shader.uniforms.uProgress = uniforms.current.uProgress;
    shader.uniforms.uAsteroids = uniforms.current.uAsteroids;
    shader.uniforms.time = uniforms.current.time;

    shader.vertexShader = `
      uniform float uProgress;
      uniform vec4 uAsteroids[${ASTEROIDS}];
      uniform float time;
      attribute float aRandom;
      varying float vProgress;
      ${shader.vertexShader}
    `.replace(
      '#include <begin_vertex>',
      `
      vec3 transformed = vec3(position);

      float angle = atan(transformed.x, transformed.z);
      float normalizedAngle = abs(angle) / 3.14159265359;
      float spawnThreshold = 1.0 - normalizedAngle;

      float progressValue = (uProgress * 1.4) - spawnThreshold;
      float particleProgress = smoothstep(0.0, 0.4, progressValue);
      vProgress = particleProgress;

      transformed.y += sin(angle * 10.0 + time) * 0.05 * aRandom;

      if (uProgress > 0.5) {
        for (int i = 0; i < ${ASTEROIDS}; i++) {
          vec4 astData = uAsteroids[i];
          vec3 delta = transformed - astData.xyz;
          float dist = length(delta);
          float rad = astData.w * 2.0 + 0.15;
          if (dist < rad) {
            float force = pow((rad - dist) / rad, 2.0);
            transformed += normalize(delta) * force * 0.4;
            transformed.y += force * 0.20 * (aRandom - 0.5);
          }
        }
      }

      float swirl = (1.0 - particleProgress) * 4.0;
      float s = sin(swirl);
      float c = cos(swirl);
      transformed.xz = mat2(c, -s, s, c) * transformed.xz;

      transformed.y += (1.0 - particleProgress) * (transformed.y >= 0.0 ? 1.0 : -1.0);

      vec3 moonSurface = normalize(transformed) * 2.1;
      transformed = mix(moonSurface, transformed, particleProgress);
      `
    );

    shader.fragmentShader = `
      varying float vProgress;
      ${shader.fragmentShader}
    `.replace('#include <color_fragment>', '#include <color_fragment>\n      diffuseColor.a *= vProgress;');
  };

  return (
    <points ref={pointsRef} rotation={[-Math.PI / 2, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[ringPositions, 3]} />
        <bufferAttribute attach="attributes-color" args={[ringColors, 3]} />
        <bufferAttribute attach="attributes-aRandom" args={[ringRandoms, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.008}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        onBeforeCompile={onBeforeCompile}
      />
    </points>
  );
}

function generateAsteroids(count: number) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      angle: Math.random() * Math.PI * 2,
      baseRadius: 2.8 + Math.random() * 2.0,
      radialAmplitude: 0.5 + Math.random() * 1.5,
      radialSpeed: 0.15 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      zOffset: (Math.random() - 0.5) * 0.8,
      speed: (0.04 + Math.random() * 0.08) * (Math.random() > 0.5 ? 1 : -1),
      rx: Math.random() * Math.PI,
      ry: Math.random() * Math.PI,
      rz: Math.random() * Math.PI,
      rsx: (Math.random() - 0.5) * 0.05,
      rsy: (Math.random() - 0.5) * 0.05,
      rsz: (Math.random() - 0.5) * 0.05,
      scale: 0.02 + Math.pow(Math.random(), 4) * 0.18,
    });
  }
  return data.sort((a, b) => b.scale - a.scale);
}

function AsteroidBelt({ ringState, asteroidsRef }: { ringState: RingState; asteroidsRef: AsteroidsRef }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const colorMap = useLoader(THREE.TextureLoader, MOON_TEXTURE) as THREE.Texture;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const [asteroids] = useState(() => generateAsteroids(ASTEROIDS));
  const scaleRef = useRef(0);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const hidden = ringState === 'hidden';
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, hidden ? 0 : 1, delta * (hidden ? 5 : 2));
    mesh.visible = scaleRef.current >= 0.01;
    if (!mesh.visible) return;

    asteroids.forEach((ast, i) => {
      ast.angle += ast.speed * delta;
      ast.phase += ast.radialSpeed * delta;
      let r = ast.baseRadius + Math.sin(ast.phase) * ast.radialAmplitude;
      // Bật ra khỏi bề mặt thay vì xuyên qua mặt trăng.
      if (r < 2.15) r = 2.15 + (2.15 - r) * 0.85;

      const x = Math.cos(ast.angle) * r;
      const y = Math.sin(ast.angle) * r;
      const out = asteroidsRef.current;
      out[i * 4] = x;
      out[i * 4 + 1] = y;
      out[i * 4 + 2] = ast.zOffset;
      out[i * 4 + 3] = ast.scale;

      ast.rx += ast.rsx;
      ast.ry += ast.rsy;
      ast.rz += ast.rsz;

      dummy.position.set(x, y, ast.zOffset);
      dummy.rotation.set(ast.rx, ast.ry, ast.rz);
      dummy.scale.setScalar(ast.scale * scaleRef.current);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, ASTEROIDS]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial map={colorMap} bumpMap={colorMap} bumpScale={0.08} roughness={0.7} metalness={0.1} />
    </instancedMesh>
  );
}

export function Moon3D({ style }: { style?: ViewStyle }) {
  const [ringState, setRingState] = useState<RingState>('hidden');
  const asteroidsRef = useRef(new Float32Array(ASTEROIDS * 4));

  return (
    <Canvas style={style} shadows camera={{ position: [0, 4, 10], fov: 45 }}>
      <ambientLight intensity={0.08} />
      <directionalLight position={[8, 5, 5]} intensity={1.5} color="#ffffff" castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-5, -3, -5]} intensity={0.15} color="#4a90e2" />
      <group rotation={[Math.PI / 8, 0, 0]}>
        <Suspense fallback={null}>
          <RealisticMoon onPress={() => ringState === 'hidden' && setRingState('animating')} />
          <ParticleRing ringState={ringState} asteroidsRef={asteroidsRef} />
          <AsteroidBelt ringState={ringState} asteroidsRef={asteroidsRef} />
        </Suspense>
      </group>
    </Canvas>
  );
}
