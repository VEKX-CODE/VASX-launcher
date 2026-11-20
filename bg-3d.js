// Высокотехнологичная шейдерная 3D-система частиц (GLSL + Simplex Noise + Force Field Physics)
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;

    // Сцена и Камера
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 75);

    // Рендерер с поддержкой максимального качества
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Параметры частиц: 100 000 частиц для ультра-плотной туманности
    const PARTICLE_COUNT = 100000;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const originalPositions = new Float32Array(PARTICLE_COUNT * 3);
    const randomOffsets = new Float32Array(PARTICLE_COUNT * 3);
    const scales = new Float32Array(PARTICLE_COUNT);

    // Плотное распределение по всему фону
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        
        const x = (Math.random() - 0.5) * 180;
        const y = (Math.random() - 0.5) * 100 - 5;
        const z = (Math.random() - 0.5) * 70;

        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;

        originalPositions[i3] = x;
        originalPositions[i3 + 1] = y;
        originalPositions[i3 + 2] = z;

        randomOffsets[i3] = Math.random() * Math.PI * 2;
        randomOffsets[i3 + 1] = Math.random() * Math.PI * 2;
        randomOffsets[i3 + 2] = Math.random() * Math.PI * 2;

        scales[i] = Math.random() * 1.1 + 0.6;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aOriginal', new THREE.BufferAttribute(originalPositions, 3));
    geometry.setAttribute('aOffset', new THREE.BufferAttribute(randomOffsets, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    // Шейдеры (GLSL): кастомная физика, идеальные круглые неоновые сферы с мягким свечением
    const vertexShader = `
        uniform float uTime;
        uniform float uTimeDilation; // Коэффициент замедления времени (падение скорости в 4 раза)
        uniform vec2 uMouse;
        uniform vec2 uWaveOrigin;
        uniform float uWaveProgress;
        uniform float uWaveActive;
        uniform float uWaveSpeed;
        uniform float uWavePower;
        uniform float uWaveMaxDist;
        uniform float uPixelRatio;
        
        attribute vec3 aOriginal;
        attribute vec3 aOffset;
        attribute float aScale;

        varying float vAlpha;
        varying vec3 vPosition;

        // Встроенный 3D Simplex Шум
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
        
        float snoise(vec3 v){
            const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
            const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
            vec3 i  = floor(v + dot(v, C.yyy) );
            vec3 x0 = v - i + dot(i, C.xxx) ;
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min( g.xyz, l.zxy );
            vec3 i2 = max( g.xyz, l.zxy );
            vec3 x1 = x0 - i1 + 1.0 * C.xxx;
            vec3 x2 = x0 - i2 + 2.0 * C.xxx;
            vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
            i = mod(i, 289.0 );
            vec4 p = permute( permute( permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
            float n_ = 0.142857142857;
            vec3  ns = n_ * D.wyz - D.xzx;
            vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_ );
            vec4 x = x_ *ns.x + D.yyyy;
            vec4 y = y_ *ns.x + D.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            vec4 b0 = vec4( x.xy, y.xy );
            vec4 b1 = vec4( x.zw, y.zw );
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
            vec3 p0 = vec3(a0.xy,h.x);
            vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z);
            vec3 p3 = vec3(a1.zw,h.w);
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
            vec3 pos = aOriginal;

            // Органические кинематографичные колебания
            float noise1 = snoise(vec3(pos.x * 0.03 + uTime * 0.12, pos.y * 0.03, uTime * 0.08));
            float noise2 = snoise(vec3(pos.y * 0.04, pos.z * 0.04 + uTime * 0.15, uTime * 0.05));
            pos.y += noise1 * 6.5;
            pos.z += noise2 * 8.0;

            // 1. Аккуратная воронка от движения мыши
            vec2 screenPos = vec2(pos.x, pos.y);
            float dist = distance(screenPos, uMouse);
            float maxDist = 16.0;

            if (dist < maxDist) {
                float force = (1.0 - (dist / maxDist));
                vec2 dir = normalize(screenPos - uMouse);
                pos.x += dir.x * force * 5.0;
                pos.y += dir.y * force * 5.0;
                pos.z += force * 7.0;
            }

            // 2. Плавная радиальная ударная волна от клика (разбегающееся кольцо)
            if (uWaveActive > 0.5) {
                float waveDist = distance(screenPos, uWaveOrigin);
                float ringRadius = uWaveProgress;      // Текущий радиус волны
                float ringThickness = 14.0 * uWavePower; // Толщина гребня
                float distFromRing = abs(waveDist - ringRadius);

                if (distFromRing < ringThickness) {
                    float crest = (1.0 - (distFromRing / ringThickness));
                    float fade = clamp(1.0 - (ringRadius / uWaveMaxDist), 0.0, 1.0);
                    vec2 waveDir = normalize(screenPos - uWaveOrigin);

                    // Масштабируем силу отброса в зависимости от uWavePower
                    pos.x += waveDir.x * crest * fade * (8.0 * uWavePower);
                    pos.y += waveDir.y * crest * fade * (8.0 * uWavePower);
                    pos.z += sin(crest * 3.14159) * fade * (12.0 * uWavePower);
                }
            }

            vPosition = pos;
            vAlpha = smoothstep(-40.0, 25.0, pos.z) * 0.9 + 0.2;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;

            // Расчет размера: рядом с камерой 70.0, уходящие вдаль 80.0
            float depthFactor = clamp((-mvPosition.z - 45.0) / 60.0, 0.0, 1.0);
            float currentBaseSize = mix(70.0, 80.0, depthFactor);

            gl_PointSize = (aScale * currentBaseSize * uPixelRatio) / -mvPosition.z;
        }
    `;

    const fragmentShader = `
        uniform vec3 uColor;
        varying float vAlpha;
        varying vec3 vPosition;

        void main() {
            // Идеально круглая сфера с мягким фотонным свечением (Anti-aliased glow)
            vec2 coord = gl_PointCoord - vec2(0.5);
            float dist = length(coord);

            if (dist > 0.5) discard;

            // Яркий центр (ядро) + плавный неоновый ореол
            float core = 1.0 - smoothstep(0.0, 0.18, dist);
            float glow = 1.0 - smoothstep(0.1, 0.5, dist);

            vec3 finalColor = mix(uColor, vec3(1.0, 1.0, 1.0), core * 0.65);
            float alpha = (core + glow * 0.7) * vAlpha;

            gl_FragColor = vec4(finalColor, alpha);
        }
    `;

    const uniforms = {
        uTime: { value: 0 },
        uTimeDilation: { value: 1.0 },
        uMouse: { value: new THREE.Vector2(-999, -999) },
        uWaveOrigin: { value: new THREE.Vector2(-999, -999) },
        uWaveProgress: { value: 0 },
        uWaveActive: { value: 0 },
        uWaveSpeed: { value: 0.55 },
        uWavePower: { value: 1.0 },
        uWaveMaxDist: { value: 45.0 },
        uColor: { value: new THREE.Color(0xff2a2a) },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
    };

    const shaderMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: uniforms,
        transparent: true,
        blending: THREE.AdditiveBlending, // Неоновое наложение света
        depthWrite: false
    });

    const particles = new THREE.Points(geometry, shaderMaterial);
    scene.add(particles);

    // Расчет положения курсора в 3D координатах
    const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2(-999, -999);
    const targetMouse3D = new THREE.Vector2(-999, -999);
    const currentMouse3D = new THREE.Vector2(-999, -999);

    window.addEventListener('mousemove', (e) => {
        mouseVec.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouseVec.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouseVec, camera);
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(mousePlane, intersectPoint);

        if (intersectPoint) {
            targetMouse3D.x = intersectPoint.x;
            targetMouse3D.y = intersectPoint.y;
        }
    });

    window.addEventListener('mouseleave', () => {
        targetMouse3D.set(-999, -999);
    });

    // Глобальная функция вызова мощной взрывной волны при запуске/скачивании
    window.triggerMegaWave = (clientX, clientY) => {
        const m = new THREE.Vector2(
            (clientX / window.innerWidth) * 2 - 1,
            -(clientY / window.innerHeight) * 2 + 1
        );
        raycaster.setFromCamera(m, camera);
        const hit = new THREE.Vector3();
        raycaster.ray.intersectPlane(mousePlane, hit);

        if (hit) {
            uniforms.uWaveOrigin.value.set(hit.x, hit.y);
            uniforms.uWaveProgress.value = 0.0;
            uniforms.uWaveActive.value = 1.0;
            uniforms.uWaveSpeed.value = 1.6;     // Чуть помедленнее, чтобы взрыв читался глазом
            uniforms.uWavePower.value = 7.5;     // ОЧЕНЬ мощная сила - разносит далеко!
            uniforms.uWaveMaxDist.value = 160.0; // Проходит через всё пространство
            uniforms.uTimeDilation.value = 0.25; // Скорость падает ровно в 4 раза (эффект замедления времени)
        }
    };

    // Обычный клик по фону (плавная маленькая волна)
    window.addEventListener('pointerdown', (e) => {
        if (e.target && e.target.closest('button, select, input, .game-card')) return;

        mouseVec.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouseVec.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouseVec, camera);
        const hit = new THREE.Vector3();
        raycaster.ray.intersectPlane(mousePlane, hit);

        if (hit) {
            uniforms.uWaveOrigin.value.set(hit.x, hit.y);
            uniforms.uWaveProgress.value = 0.0;
            uniforms.uWaveActive.value = 1.0;
            uniforms.uWaveSpeed.value = 0.55;   // Спокойная скорость
            uniforms.uWavePower.value = 1.0;    // Базовая сила
            uniforms.uWaveMaxDist.value = 45.0; // Локальный радиус
        }
    });

    // Ресайз
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    });

    // Функция смены цвета под выбранную игру
    window.setBgAccentColor = (hexColor) => {
        uniforms.uColor.value.set(hexColor);
    };

    // Анимационный цикл
    const clock = new THREE.Clock();
    let virtualTime = 0;

    function render() {
        requestAnimationFrame(render);

        const delta = clock.getDelta();
        
        // Плавное возвращение скорости к 1.0 на основе РЕАЛЬНОГО ВРЕМЕНИ (delta),
        // а не кадров, чтобы скорость была одинаковой на 60Hz, 100Hz, 144Hz и 240Hz!
        if (uniforms.uTimeDilation.value < 1.0) {
            // Медленный разгон за ~4.5 секунды независимо от герцовки монитора
            uniforms.uTimeDilation.value += delta * 0.17; 
            if (uniforms.uTimeDilation.value > 1.0) uniforms.uTimeDilation.value = 1.0;
        }

        // Время течет с учетом замедления
        virtualTime += delta * uniforms.uTimeDilation.value;
        uniforms.uTime.value = virtualTime;

        // Расширение ударной волны тоже привязано к delta (секундам), а не кадрам
        if (uniforms.uWaveActive.value > 0.5) {
            uniforms.uWaveProgress.value += uniforms.uWaveSpeed.value * (delta * 60.0);
            if (uniforms.uWaveProgress.value > uniforms.uWaveMaxDist.value) {
                uniforms.uWaveActive.value = 0.0;
                uniforms.uWaveProgress.value = 0.0;
            }
        }

        // Плавная интерполяция движения курсора мыши
        currentMouse3D.x += (targetMouse3D.x - currentMouse3D.x) * 0.12;
        currentMouse3D.y += (targetMouse3D.y - currentMouse3D.y) * 0.12;
        uniforms.uMouse.value.copy(currentMouse3D);

        // Легкое покачивание камеры
        camera.position.x = Math.sin(virtualTime * 0.2) * 2.5;
        camera.position.y = Math.cos(virtualTime * 0.15) * 1.5;

        renderer.render(scene, camera);
    }

    render();
});
