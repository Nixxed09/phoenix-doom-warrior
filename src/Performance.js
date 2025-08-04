import * as THREE from 'three';

export const QualityPreset = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    ULTRA: 'ultra',
    CUSTOM: 'custom'
};

export class PerformanceOptimizer {
    constructor(game) {
        this.game = game;
        this.renderer = game.renderer;
        this.scene = game.scene;
        this.camera = game.camera;

        // Performance stats
        this.fps = 0;
        this.frameTime = 0;
        this.drawCalls = 0;
        this.triangles = 0;

        // Quality settings
        this.currentPreset = QualityPreset.HIGH;
        this.settings = this.getPresetSettings(QualityPreset.HIGH);

        // LOD system
        this.lodGroups = new Map();
        this.lodDistances = [10, 25, 50, 100];

        // Object pooling
        this.pools = {
            bullets: new ObjectPool(() => this.createBullet(), 100),
            casings: new ObjectPool(() => this.createCasing(), 50),
            particles: new ObjectPool(() => this.createParticle(), 500),
            decals: new ObjectPool(() => this.createDecal(), 50),
            bloodSplatters: new ObjectPool(() => this.createBloodSplatter(), 30)
        };

        // Frustum culling
        this.frustum = new THREE.Frustum();
        this.frustumMatrix = new THREE.Matrix4();
        this.visibleObjects = new Set();

        // Texture atlasing
        this.textureAtlas = null;
        this.atlasRegions = new Map();

        // Post-processing
        this.composer = null;
        this.effects = {
            bloom: null,
            motionBlur: null,
            fxaa: null
        };

        // Screen effects
        this.screenShake = {
            intensity: 0,
            duration: 0,
            offset: new THREE.Vector3()
        };

        // Dynamic lighting
        this.dynamicLights = [];
        this.maxDynamicLights = 8;

        // Shadow settings
        this.shadowMapSizes = {
            low: 512,
            medium: 1024,
            high: 2048,
            ultra: 4096
        };

        // Initialize systems
        this.init();
    }

    init() {
        // Configure renderer
        this.configureRenderer();

        // Setup post-processing
        if (this.settings.postProcessing) {
            this.setupPostProcessing();
        }

        // Create texture atlas
        this.createTextureAtlas();

        // Setup performance monitoring
        this.setupPerformanceMonitoring();
    }

    getPresetSettings(preset) {
        const presets = {
            [QualityPreset.LOW]: {
                shadows: false,
                shadowMapSize: this.shadowMapSizes.low,
                particles: false,
                postProcessing: false,
                bloom: false,
                motionBlur: false,
                antialiasing: false,
                textureQuality: 0.5,
                lodBias: -1,
                maxLights: 4,
                decals: false,
                resolutionScale: 0.75,
                fpsLimit: 30
            },
            [QualityPreset.MEDIUM]: {
                shadows: true,
                shadowMapSize: this.shadowMapSizes.medium,
                particles: true,
                postProcessing: false,
                bloom: false,
                motionBlur: false,
                antialiasing: false,
                textureQuality: 0.75,
                lodBias: 0,
                maxLights: 6,
                decals: true,
                resolutionScale: 1.0,
                fpsLimit: 60
            },
            [QualityPreset.HIGH]: {
                shadows: true,
                shadowMapSize: this.shadowMapSizes.high,
                particles: true,
                postProcessing: true,
                bloom: true,
                motionBlur: false,
                antialiasing: true,
                textureQuality: 1.0,
                lodBias: 0,
                maxLights: 8,
                decals: true,
                resolutionScale: 1.0,
                fpsLimit: 60
            },
            [QualityPreset.ULTRA]: {
                shadows: true,
                shadowMapSize: this.shadowMapSizes.ultra,
                particles: true,
                postProcessing: true,
                bloom: true,
                motionBlur: true,
                antialiasing: true,
                textureQuality: 1.0,
                lodBias: 1,
                maxLights: 16,
                decals: true,
                resolutionScale: 1.0,
                fpsLimit: 0
            }
        };

        return presets[preset] || presets[QualityPreset.HIGH];
    }

    applyPreset(preset) {
        this.currentPreset = preset;
        this.settings = this.getPresetSettings(preset);
        this.applySettings();
    }

    applySettings() {
        // Update renderer
        this.renderer.shadowMap.enabled = this.settings.shadows;
        this.renderer.antialias = this.settings.antialiasing;

        // Update shadow map size
        if (this.renderer.shadowMap.enabled) {
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            const lights = this.scene.children.filter(child => child.isLight && child.castShadow);
            lights.forEach(light => {
                if (light.shadow && light.shadow.map) {
                    light.shadow.map.setSize(
                        this.settings.shadowMapSize,
                        this.settings.shadowMapSize
                    );
                }
            });
        }

        // Update resolution
        const width = window.innerWidth * this.settings.resolutionScale;
        const height = window.innerHeight * this.settings.resolutionScale;
        this.renderer.setSize(width, height);
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';

        // Update post-processing
        if (this.composer) {
            this.effects.bloom.enabled = this.settings.bloom;
            this.effects.motionBlur.enabled = this.settings.motionBlur;
            this.effects.fxaa.enabled = this.settings.antialiasing;
        }

        // Update LOD bias
        this.updateLODBias(this.settings.lodBias);
    }

    configureRenderer() {
        this.renderer.shadowMap.enabled = this.settings.shadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Enable logarithmic depth buffer for better z-fighting prevention
        this.renderer.logarithmicDepthBuffer = true;
    }

    setupPostProcessing() {
        // Import post-processing components
        import('three/examples/jsm/postprocessing/EffectComposer.js').then(({ EffectComposer }) => {
            import('three/examples/jsm/postprocessing/RenderPass.js').then(({ RenderPass }) => {
                import('three/examples/jsm/postprocessing/UnrealBloomPass.js').then(
                    ({ UnrealBloomPass }) => {
                        import('three/examples/jsm/postprocessing/ShaderPass.js').then(
                            ({ ShaderPass }) => {
                                import('three/examples/jsm/shaders/FXAAShader.js').then(
                                    ({ FXAAShader }) => {
                                        // Create composer
                                        this.composer = new EffectComposer(this.renderer);

                                        // Add render pass
                                        const renderPass = new RenderPass(this.scene, this.camera);
                                        this.composer.addPass(renderPass);

                                        // Add bloom
                                        this.effects.bloom = new UnrealBloomPass(
                                            new THREE.Vector2(
                                                window.innerWidth,
                                                window.innerHeight
                                            ),
                                            0.5, // strength
                                            0.4, // radius
                                            0.85 // threshold
                                        );
                                        this.composer.addPass(this.effects.bloom);

                                        // Add FXAA
                                        this.effects.fxaa = new ShaderPass(FXAAShader);
                                        this.effects.fxaa.uniforms['resolution'].value.set(
                                            1 / window.innerWidth,
                                            1 / window.innerHeight
                                        );
                                        this.composer.addPass(this.effects.fxaa);

                                        // Motion blur would be added here
                                    }
                                );
                            }
                        );
                    }
                );
            });
        });
    }

    createTextureAtlas() {
        // Create a texture atlas for common textures
        const atlasSize = 2048;
        const canvas = document.createElement('canvas');
        canvas.width = atlasSize;
        canvas.height = atlasSize;
        const ctx = canvas.getContext('2d');

        // Define regions for different texture types
        const regions = [
            { name: 'wall1', x: 0, y: 0, width: 256, height: 256 },
            { name: 'wall2', x: 256, y: 0, width: 256, height: 256 },
            { name: 'floor1', x: 512, y: 0, width: 256, height: 256 },
            { name: 'ceil1', x: 768, y: 0, width: 256, height: 256 },
            { name: 'blood1', x: 0, y: 256, width: 128, height: 128 },
            { name: 'blood2', x: 128, y: 256, width: 128, height: 128 },
            { name: 'scorch', x: 256, y: 256, width: 128, height: 128 }
        ];

        // Store region data
        regions.forEach(region => {
            this.atlasRegions.set(region.name, {
                uv: new THREE.Vector4(
                    region.x / atlasSize,
                    region.y / atlasSize,
                    (region.x + region.width) / atlasSize,
                    (region.y + region.height) / atlasSize
                )
            });
        });

        // Generate procedural textures
        this.generateProceduralTextures(ctx, regions);

        // Create Three.js texture
        this.textureAtlas = new THREE.CanvasTexture(canvas);
        this.textureAtlas.minFilter = THREE.LinearMipmapLinearFilter;
        this.textureAtlas.magFilter = THREE.LinearFilter;
        this.textureAtlas.generateMipmaps = true;
    }

    generateProceduralTextures(ctx, regions) {
        regions.forEach(region => {
            ctx.save();
            ctx.translate(region.x, region.y);

            switch (region.name) {
                case 'wall1':
                case 'wall2':
                    this.drawBrickTexture(ctx, region.width, region.height);
                    break;
                case 'floor1':
                    this.drawFloorTexture(ctx, region.width, region.height);
                    break;
                case 'ceil1':
                    this.drawCeilingTexture(ctx, region.width, region.height);
                    break;
                case 'blood1':
                case 'blood2':
                    this.drawBloodTexture(ctx, region.width, region.height);
                    break;
                case 'scorch':
                    this.drawScorchTexture(ctx, region.width, region.height);
                    break;
            }

            ctx.restore();
        });
    }

    drawBrickTexture(ctx, width, height) {
        ctx.fillStyle = '#444';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;

        const brickHeight = 32;
        const brickWidth = 64;

        for (let y = 0; y < height; y += brickHeight) {
            const offset = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
            for (let x = -brickWidth; x < width + brickWidth; x += brickWidth) {
                ctx.strokeRect(x + offset, y, brickWidth, brickHeight);
            }
        }
    }

    drawFloorTexture(ctx, width, height) {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, width, height);

        // Add some noise
        for (let i = 0; i < 1000; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
            ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
        }
    }

    drawCeilingTexture(ctx, width, height) {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, width, height);
    }

    drawBloodTexture(ctx, width, height) {
        ctx.fillStyle = 'rgba(139, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, width / 3, 0, Math.PI * 2);
        ctx.fill();

        // Add splatter
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 10 + 5,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }

    drawScorchTexture(ctx, width, height) {
        const gradient = ctx.createRadialGradient(
            width / 2,
            height / 2,
            0,
            width / 2,
            height / 2,
            width / 2
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        gradient.addColorStop(0.5, 'rgba(50, 50, 50, 0.5)');
        gradient.addColorStop(1, 'rgba(100, 100, 100, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    // LOD System
    createLODGroup(highDetail, mediumDetail, lowDetail, veryLowDetail) {
        const lod = new THREE.LOD();

        if (highDetail) lod.addLevel(highDetail, this.lodDistances[0]);
        if (mediumDetail) lod.addLevel(mediumDetail, this.lodDistances[1]);
        if (lowDetail) lod.addLevel(lowDetail, this.lodDistances[2]);
        if (veryLowDetail) lod.addLevel(veryLowDetail, this.lodDistances[3]);

        return lod;
    }

    updateLODBias(bias) {
        // Adjust LOD distances based on quality setting
        const baseDist = [10, 25, 50, 100];
        this.lodDistances = baseDist.map(d => d * Math.pow(2, bias));

        // Update existing LOD groups
        this.lodGroups.forEach(lod => {
            lod.levels.forEach((level, i) => {
                level.distance = this.lodDistances[i];
            });
        });
    }

    // Frustum Culling
    updateFrustum() {
        this.frustumMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.frustumMatrix);

        // Update visible objects
        this.visibleObjects.clear();

        this.scene.traverse(object => {
            if (object.isMesh && object.visible) {
                if (this.frustum.intersectsObject(object)) {
                    this.visibleObjects.add(object);
                } else {
                    object.visible = false;
                }
            }
        });

        // Re-enable visible objects
        this.visibleObjects.forEach(object => {
            object.visible = true;
        });
    }

    // Object Pooling
    createBullet() {
        const geometry = new THREE.SphereGeometry(0.05, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 1
        });
        const bullet = new THREE.Mesh(geometry, material);
        bullet.visible = false;
        this.scene.add(bullet);
        return bullet;
    }

    createCasing() {
        const geometry = new THREE.CylinderGeometry(0.02, 0.02, 0.05, 6);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            metalness: 0.8,
            roughness: 0.2
        });
        const casing = new THREE.Mesh(geometry, material);
        casing.visible = false;
        this.scene.add(casing);
        return casing;
    }

    createParticle() {
        const geometry = new THREE.PlaneGeometry(0.1, 0.1);
        const material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });
        const particle = new THREE.Mesh(geometry, material);
        particle.visible = false;
        this.scene.add(particle);
        return particle;
    }

    createDecal() {
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const decal = new THREE.Mesh(geometry, material);
        decal.visible = false;
        this.scene.add(decal);
        return decal;
    }

    createBloodSplatter() {
        const decal = this.createDecal();
        decal.material = decal.material.clone();
        decal.material.map = this.textureAtlas;

        const region = this.atlasRegions.get('blood1');
        if (region) {
            decal.material.map.offset.set(region.uv.x, region.uv.y);
            decal.material.map.repeat.set(region.uv.z - region.uv.x, region.uv.w - region.uv.y);
        }

        return decal;
    }

    // Visual Effects
    spawnMuzzleFlash(position, direction) {
        if (!this.settings.particles) return;

        // Create dynamic light
        if (this.dynamicLights.length < this.settings.maxLights) {
            const light = new THREE.PointLight(0xffff00, 2, 10);
            light.position.copy(position);
            this.scene.add(light);
            this.dynamicLights.push(light);

            // Remove light after flash
            setTimeout(() => {
                this.scene.remove(light);
                const index = this.dynamicLights.indexOf(light);
                if (index > -1) this.dynamicLights.splice(index, 1);
            }, 100);
        }

        // Spawn particles
        for (let i = 0; i < 5; i++) {
            const particle = this.pools.particles.get();
            if (particle) {
                particle.position.copy(position);
                particle.visible = true;

                // Animate particle
                const velocity = direction
                    .clone()
                    .add(
                        new THREE.Vector3(
                            (Math.random() - 0.5) * 0.5,
                            (Math.random() - 0.5) * 0.5,
                            (Math.random() - 0.5) * 0.5
                        )
                    );

                this.animateParticle(particle, velocity, 0.5);
            }
        }
    }

    animateParticle(particle, velocity, lifetime) {
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed > lifetime) {
                particle.visible = false;
                this.pools.particles.release(particle);
                return;
            }

            particle.position.add(velocity.clone().multiplyScalar(0.016));
            velocity.y -= 9.8 * 0.016; // Gravity
            particle.material.opacity = 1 - elapsed / lifetime;

            requestAnimationFrame(animate);
        };
        animate();
    }

    spawnBloodSplatter(position, normal) {
        if (!this.settings.decals) return;

        const splatter = this.pools.bloodSplatters.get();
        if (splatter) {
            splatter.position.copy(position);
            splatter.position.add(normal.clone().multiplyScalar(0.01));
            splatter.lookAt(position.clone().add(normal));
            splatter.scale.set(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, 1);
            splatter.visible = true;

            // Fade out over time
            setTimeout(() => {
                splatter.visible = false;
                this.pools.bloodSplatters.release(splatter);
            }, 30000); // 30 seconds
        }
    }

    addScreenShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
    }

    updateScreenShake(deltaTime) {
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;

            const shake = this.screenShake.intensity * (this.screenShake.duration / 1);
            this.screenShake.offset.set(
                (Math.random() - 0.5) * shake,
                (Math.random() - 0.5) * shake,
                (Math.random() - 0.5) * shake * 0.1
            );

            // Apply to camera
            if (this.camera) {
                this.camera.position.add(this.screenShake.offset);
            }
        } else {
            this.screenShake.intensity = 0;
            this.screenShake.offset.set(0, 0, 0);
        }
    }

    // Performance Monitoring
    setupPerformanceMonitoring() {
        // Override renderer info
        const info = this.renderer.info;

        setInterval(() => {
            this.drawCalls = info.render.calls;
            this.triangles = info.render.triangles;
        }, 100);
    }

    update(deltaTime) {
        // Update frustum culling
        if (this.settings.frustumCulling !== false) {
            this.updateFrustum();
        }

        // Update screen shake
        this.updateScreenShake(deltaTime);

        // Update LODs
        this.lodGroups.forEach(lod => {
            lod.update(this.camera);
        });

        // FPS limiting
        if (this.settings.fpsLimit > 0) {
            const targetFrameTime = 1000 / this.settings.fpsLimit;
            if (this.frameTime < targetFrameTime) {
                // Skip frame to maintain target FPS
                return false;
            }
        }

        return true;
    }

    render() {
        if (this.composer && this.settings.postProcessing) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    resize() {
        const width = window.innerWidth * this.settings.resolutionScale;
        const height = window.innerHeight * this.settings.resolutionScale;

        this.renderer.setSize(width, height);

        if (this.composer) {
            this.composer.setSize(width, height);

            if (this.effects.fxaa) {
                this.effects.fxaa.uniforms['resolution'].value.set(1 / width, 1 / height);
            }
        }
    }

    getStats() {
        return {
            fps: this.fps,
            drawCalls: this.drawCalls,
            triangles: this.triangles,
            visibleObjects: this.visibleObjects.size
        };
    }
}

// Object Pool implementation
class ObjectPool {
    constructor(createFn, size = 10) {
        this.createFn = createFn;
        this.available = [];
        this.inUse = new Set();

        // Pre-create objects
        for (let i = 0; i < size; i++) {
            this.available.push(createFn());
        }
    }

    get() {
        let obj;

        if (this.available.length > 0) {
            obj = this.available.pop();
        } else {
            obj = this.createFn();
        }

        this.inUse.add(obj);
        return obj;
    }

    release(obj) {
        if (this.inUse.has(obj)) {
            this.inUse.delete(obj);
            this.available.push(obj);
        }
    }

    releaseAll() {
        this.inUse.forEach(obj => {
            this.available.push(obj);
        });
        this.inUse.clear();
    }
}
