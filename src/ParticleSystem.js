import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene, maxParticles = 1000) {
        this.scene = scene;
        this.maxParticles = maxParticles;
        this.particles = [];
        this.activeParticles = [];

        // Particle types
        this.particleTypes = {
            smoke: { texture: null, size: 1.0, gravity: -1, drag: 0.98 },
            fire: { texture: null, size: 0.5, gravity: 2, drag: 0.95 },
            spark: { texture: null, size: 0.2, gravity: -9.8, drag: 0.99 },
            blood: { texture: null, size: 0.3, gravity: -9.8, drag: 0.97 },
            dust: { texture: null, size: 0.4, gravity: -2, drag: 0.99 },
            debris: { texture: null, size: 0.5, gravity: -9.8, drag: 0.98 },
            shell: { texture: null, size: 0.1, gravity: -9.8, drag: 0.95 },
            gib: { texture: null, size: 0.8, gravity: -9.8, drag: 0.96 }
        };

        // Create particle textures
        this.createParticleTextures();

        // Initialize particle pool
        this.initializeParticlePool();
    }

    createParticleTextures() {
        // Create procedural textures for each particle type
        Object.keys(this.particleTypes).forEach(type => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');

            switch (type) {
                case 'smoke':
                    this.drawSmokeTexture(ctx);
                    break;
                case 'fire':
                    this.drawFireTexture(ctx);
                    break;
                case 'spark':
                    this.drawSparkTexture(ctx);
                    break;
                case 'blood':
                    this.drawBloodTexture(ctx);
                    break;
                case 'dust':
                    this.drawDustTexture(ctx);
                    break;
                case 'debris':
                    this.drawDebrisTexture(ctx);
                    break;
                case 'shell':
                    this.drawShellTexture(ctx);
                    break;
                case 'gib':
                    this.drawGibTexture(ctx);
                    break;
            }

            this.particleTypes[type].texture = new THREE.CanvasTexture(canvas);
        });
    }

    drawSmokeTexture(ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(128, 128, 128, 0.8)');
        gradient.addColorStop(0.5, 'rgba(64, 64, 64, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
    }

    drawFireTexture(ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 0, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 128, 0, 0.8)');
        gradient.addColorStop(0.6, 'rgba(255, 0, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
    }

    drawSparkTexture(ctx) {
        ctx.fillStyle = 'rgba(255, 255, 200, 1)';
        ctx.fillRect(30, 30, 4, 4);
    }

    drawBloodTexture(ctx) {
        ctx.fillStyle = 'rgba(139, 0, 0, 0.9)';
        ctx.beginPath();
        ctx.arc(32, 32, 20, 0, Math.PI * 2);
        ctx.fill();

        // Add some variation
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(
                32 + (Math.random() - 0.5) * 20,
                32 + (Math.random() - 0.5) * 20,
                Math.random() * 10 + 5,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }

    drawDustTexture(ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(150, 130, 100, 0.6)');
        gradient.addColorStop(1, 'rgba(100, 80, 50, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
    }

    drawDebrisTexture(ctx) {
        ctx.fillStyle = 'rgba(100, 100, 100, 1)';
        ctx.fillRect(28, 28, 8, 8);
    }

    drawShellTexture(ctx) {
        ctx.fillStyle = 'rgba(255, 215, 0, 1)';
        ctx.fillRect(30, 26, 4, 12);
    }

    drawGibTexture(ctx) {
        ctx.fillStyle = 'rgba(200, 50, 50, 1)';
        ctx.beginPath();
        ctx.moveTo(32, 20);
        ctx.lineTo(40, 35);
        ctx.lineTo(32, 44);
        ctx.lineTo(24, 35);
        ctx.closePath();
        ctx.fill();
    }

    initializeParticlePool() {
        for (let i = 0; i < this.maxParticles; i++) {
            const geometry = new THREE.PlaneGeometry(1, 1);
            const material = new THREE.MeshBasicMaterial({
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });

            const particle = new THREE.Mesh(geometry, material);
            particle.visible = false;

            // Particle state
            particle.userData = {
                velocity: new THREE.Vector3(),
                acceleration: new THREE.Vector3(),
                lifespan: 0,
                age: 0,
                type: 'smoke',
                size: 1,
                rotation: 0,
                rotationSpeed: 0,
                color: new THREE.Color(1, 1, 1),
                opacity: 1,
                fadeIn: 0,
                fadeOut: 0
            };

            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    spawn(position, type, count, options = {}) {
        for (let i = 0; i < count; i++) {
            const particle = this.getParticle();
            if (!particle) break;

            const particleType = this.particleTypes[type];
            if (!particleType) continue;

            // Set particle properties
            particle.position.copy(position);
            particle.position.add(
                new THREE.Vector3(
                    (Math.random() - 0.5) * (options.spread || 0),
                    (Math.random() - 0.5) * (options.spread || 0),
                    (Math.random() - 0.5) * (options.spread || 0)
                )
            );

            // Set velocity
            const velocity = options.velocity || new THREE.Vector3();
            particle.userData.velocity.copy(velocity);
            particle.userData.velocity.add(
                new THREE.Vector3(
                    (Math.random() - 0.5) * (options.velocitySpread || 1),
                    (Math.random() - 0.5) * (options.velocitySpread || 1),
                    (Math.random() - 0.5) * (options.velocitySpread || 1)
                )
            );

            // Set acceleration (gravity)
            particle.userData.acceleration.set(0, particleType.gravity, 0);

            // Set appearance
            particle.material.map = particleType.texture;
            particle.material.color = options.color || new THREE.Color(1, 1, 1);
            particle.material.opacity = options.opacity || 1;
            particle.material.blending =
                options.blending ||
                (type === 'fire' || type === 'spark'
                    ? THREE.AdditiveBlending
                    : THREE.NormalBlending);

            // Set size
            const size =
                particleType.size *
                (options.sizeMultiplier || 1) *
                (1 + (Math.random() - 0.5) * (options.sizeVariation || 0.2));
            particle.scale.set(size, size, 1);

            // Set lifespan
            particle.userData.lifespan = options.lifespan || 1;
            particle.userData.age = 0;
            particle.userData.type = type;
            particle.userData.size = size;
            particle.userData.drag = particleType.drag;
            particle.userData.fadeIn = options.fadeIn || 0;
            particle.userData.fadeOut = options.fadeOut || 0.3;

            // Rotation
            particle.userData.rotation = Math.random() * Math.PI * 2;
            particle.userData.rotationSpeed = (Math.random() - 0.5) * 5;
            particle.rotation.z = particle.userData.rotation;

            // Make visible and add to active list
            particle.visible = true;
            this.activeParticles.push(particle);
        }
    }

    getParticle() {
        for (const particle of this.particles) {
            if (!particle.visible) {
                return particle;
            }
        }
        return null;
    }

    update(deltaTime, camera) {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            const data = particle.userData;

            // Update age
            data.age += deltaTime;

            // Check if particle should die
            if (data.age >= data.lifespan) {
                particle.visible = false;
                this.activeParticles.splice(i, 1);
                continue;
            }

            // Update physics
            data.velocity.add(data.acceleration.clone().multiplyScalar(deltaTime));
            data.velocity.multiplyScalar(data.drag);
            particle.position.add(data.velocity.clone().multiplyScalar(deltaTime));

            // Update rotation
            data.rotation += data.rotationSpeed * deltaTime;
            particle.rotation.z = data.rotation;

            // Update opacity (fade in/out)
            const ageRatio = data.age / data.lifespan;
            let opacity = 1;

            if (ageRatio < data.fadeIn) {
                opacity = ageRatio / data.fadeIn;
            } else if (ageRatio > 1 - data.fadeOut) {
                opacity = (1 - ageRatio) / data.fadeOut;
            }

            particle.material.opacity = opacity * data.opacity;

            // Special behavior per type
            switch (data.type) {
                case 'fire':
                    // Fire rises and changes color
                    data.velocity.y += deltaTime * 2;
                    particle.material.color.setRGB(1, 1 - ageRatio * 0.5, 1 - ageRatio);
                    break;

                case 'smoke':
                    // Smoke expands
                    const scale = data.size * (1 + ageRatio * 2);
                    particle.scale.set(scale, scale, 1);
                    break;

                case 'spark':
                    // Sparks fade to red
                    particle.material.color.setRGB(1, 1 - ageRatio * 0.8, 1 - ageRatio);
                    break;

                case 'blood':
                    // Blood darkens
                    const darkness = 1 - ageRatio * 0.5;
                    particle.material.color.setRGB(darkness * 0.5, 0, 0);
                    break;
            }

            // Billboard particles to face camera
            particle.lookAt(camera.position);
        }
    }

    // Specific effect methods
    spawnMuzzleFlash(position, direction) {
        // Spawn fire particles
        this.spawn(position, 'fire', 10, {
            velocity: direction.clone().multiplyScalar(10),
            velocitySpread: 2,
            lifespan: 0.1,
            sizeMultiplier: 0.5,
            fadeOut: 0.5
        });

        // Spawn sparks
        this.spawn(position, 'spark', 20, {
            velocity: direction.clone().multiplyScalar(20),
            velocitySpread: 5,
            lifespan: 0.3,
            sizeMultiplier: 0.5
        });

        // Spawn smoke
        this.spawn(position, 'smoke', 3, {
            velocity: direction.clone().multiplyScalar(2),
            velocitySpread: 1,
            lifespan: 1,
            opacity: 0.3,
            fadeIn: 0.1,
            fadeOut: 0.5
        });
    }

    spawnExplosion(position, size = 1) {
        // Fire burst
        this.spawn(position, 'fire', 30 * size, {
            velocitySpread: 10 * size,
            lifespan: 0.5,
            sizeMultiplier: size,
            fadeOut: 0.3
        });

        // Sparks
        this.spawn(position, 'spark', 50 * size, {
            velocitySpread: 20 * size,
            lifespan: 1,
            sizeMultiplier: size * 0.5
        });

        // Smoke
        this.spawn(position, 'smoke', 20 * size, {
            velocity: new THREE.Vector3(0, 5, 0),
            velocitySpread: 5 * size,
            lifespan: 3,
            sizeMultiplier: size * 2,
            opacity: 0.5,
            fadeIn: 0.1,
            fadeOut: 0.5
        });

        // Debris
        this.spawn(position, 'debris', 10 * size, {
            velocitySpread: 15 * size,
            lifespan: 2,
            sizeMultiplier: size
        });
    }

    spawnBloodSplatter(position, direction) {
        this.spawn(position, 'blood', 20, {
            velocity: direction.clone().multiplyScalar(5),
            velocitySpread: 3,
            lifespan: 2,
            sizeMultiplier: 0.5,
            sizeVariation: 0.5
        });
    }

    spawnShellCasing(position, direction) {
        this.spawn(position, 'shell', 1, {
            velocity: new THREE.Vector3(
                direction.x * 3 + (Math.random() - 0.5) * 2,
                5,
                direction.z * 3 + (Math.random() - 0.5) * 2
            ),
            lifespan: 3,
            fadeOut: 0.1
        });
    }

    spawnGibs(position, count = 5) {
        this.spawn(position, 'gib', count, {
            velocitySpread: 10,
            lifespan: 3,
            sizeVariation: 0.5
        });

        // Also spawn blood
        this.spawnBloodSplatter(position, new THREE.Vector3(0, 1, 0));
    }

    spawnDustPuff(position) {
        this.spawn(position, 'dust', 10, {
            velocity: new THREE.Vector3(0, 1, 0),
            velocitySpread: 1,
            lifespan: 1.5,
            opacity: 0.5,
            fadeIn: 0.1,
            fadeOut: 0.5
        });
    }

    clear() {
        this.activeParticles.forEach(particle => {
            particle.visible = false;
        });
        this.activeParticles = [];
    }

    setEnabled(enabled) {
        if (!enabled) {
            this.clear();
        }
    }
}
