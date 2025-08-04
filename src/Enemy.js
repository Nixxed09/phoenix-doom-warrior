import * as THREE from 'three';

export const EnemyType = {
    ZOMBIE: 'zombie',
    IMP: 'imp',
    DEMON: 'demon',
    CACODEMON: 'cacodemon',
    HELL_KNIGHT: 'hell_knight'
};

export class Enemy {
    constructor(scene, x, z, type = EnemyType.ZOMBIE) {
        this.scene = scene;
        this.type = type;
        this.position = new THREE.Vector3(x, 0, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = 0;

        this.state = 'idle';
        this.alertLevel = 0;
        this.target = null;
        this.lastKnownPlayerPos = null;
        this.path = [];
        this.pathIndex = 0;
        this.pathfindingCooldown = 0;

        this.attackCooldown = 0;
        this.strafeCooldown = 0;
        this.strafeDirection = 1;

        this.properties = this.getEnemyProperties();
        this.health = this.properties.health;
        this.maxHealth = this.properties.health;

        this.sprite = null;
        this.healthBar = null;
        this.projectiles = [];

        this.animationFrame = 0;
        this.animationTimer = 0;
        this.deathTimer = 0;
        this.painTimer = 0;
        this.gibbed = false;

        this.nearbyEnemies = [];
        this.alertCooldown = 0;

        this.createSprite();
        this.createHealthBar();
        this.setInitialPosition();
    }

    getEnemyProperties() {
        const props = {
            [EnemyType.ZOMBIE]: {
                health: 20,
                speed: 2,
                damage: 5,
                attackRate: 1.5,
                attackRange: 2,
                sightRange: 15,
                height: 2,
                width: 1,
                color: 0x666633,
                projectile: false,
                flying: false,
                alertRadius: 10,
                dropChance: 0.3,
                gibThreshold: -10
            },
            [EnemyType.IMP]: {
                health: 60,
                speed: 4,
                damage: 10,
                attackRate: 2,
                attackRange: 20,
                sightRange: 25,
                height: 2,
                width: 1,
                color: 0xaa4444,
                projectile: 'fireball',
                projectileSpeed: 15,
                projectileColor: 0xff6600,
                flying: false,
                alertRadius: 15,
                dropChance: 0.4,
                gibThreshold: -20
            },
            [EnemyType.DEMON]: {
                health: 150,
                speed: 10,
                damage: 20,
                attackRate: 0.8,
                attackRange: 3,
                sightRange: 30,
                height: 2,
                width: 1.5,
                color: 0xff0066,
                projectile: false,
                flying: false,
                chargeSpeed: 15,
                alertRadius: 20,
                dropChance: 0.5,
                gibThreshold: -30
            },
            [EnemyType.CACODEMON]: {
                health: 400,
                speed: 3,
                damage: 15,
                attackRate: 2.5,
                attackRange: 25,
                sightRange: 35,
                height: 2.5,
                width: 2.5,
                color: 0x0066ff,
                projectile: 'lightning',
                projectileSpeed: 20,
                projectileColor: 0x00ffff,
                flying: true,
                flyHeight: 3,
                alertRadius: 25,
                dropChance: 0.6,
                gibThreshold: -50
            },
            [EnemyType.HELL_KNIGHT]: {
                health: 500,
                speed: 5,
                damage: 25,
                attackRate: 1.5,
                attackRange: 30,
                sightRange: 40,
                height: 3,
                width: 1.5,
                color: 0x994400,
                projectile: 'plasma',
                projectileSpeed: 25,
                projectileColor: 0x00ff00,
                flying: false,
                alertRadius: 30,
                dropChance: 0.7,
                gibThreshold: -75
            }
        };

        return props[this.type] || props[EnemyType.ZOMBIE];
    }

    createSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        this.drawEnemySprite(ctx);

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;

        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });

        this.sprite = new THREE.Sprite(spriteMaterial);
        this.sprite.scale.set(this.properties.width, this.properties.height, 1);
        this.sprite.position.copy(this.position);
        this.scene.add(this.sprite);

        this.sprite.userData = { enemy: this };
    }

    drawEnemySprite(ctx) {
        ctx.clearRect(0, 0, 128, 128);

        const color = this.properties.color;
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;

        switch (this.type) {
            case EnemyType.ZOMBIE:
                this.drawZombie(ctx, r, g, b);
                break;
            case EnemyType.IMP:
                this.drawImp(ctx, r, g, b);
                break;
            case EnemyType.DEMON:
                this.drawDemon(ctx, r, g, b);
                break;
            case EnemyType.CACODEMON:
                this.drawCacodemon(ctx, r, g, b);
                break;
            case EnemyType.HELL_KNIGHT:
                this.drawHellKnight(ctx, r, g, b);
                break;
        }
    }

    drawZombie(ctx, r, g, b) {
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(48, 20, 32, 60);
        ctx.fillRect(40, 80, 48, 20);

        ctx.fillStyle = '#333';
        ctx.fillRect(52, 30, 8, 8);
        ctx.fillRect(68, 30, 8, 8);

        ctx.fillStyle = '#111';
        ctx.fillRect(56, 50, 16, 4);

        ctx.fillStyle = `rgb(${r * 0.7}, ${g * 0.7}, ${b * 0.7})`;
        ctx.fillRect(35, 40, 15, 30);
        ctx.fillRect(78, 40, 15, 30);
        ctx.fillRect(45, 85, 15, 30);
        ctx.fillRect(68, 85, 15, 30);
    }

    drawImp(ctx, r, g, b) {
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.arc(64, 50, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff0';
        ctx.fillRect(50, 40, 10, 10);
        ctx.fillRect(68, 40, 10, 10);

        ctx.fillStyle = '#000';
        ctx.fillRect(54, 60, 20, 5);

        ctx.fillStyle = `rgb(${r * 0.8}, ${g * 0.8}, ${b * 0.8})`;
        ctx.fillRect(30, 70, 20, 40);
        ctx.fillRect(78, 70, 20, 40);

        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.moveTo(50, 20);
        ctx.lineTo(45, 10);
        ctx.lineTo(55, 10);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(78, 20);
        ctx.lineTo(73, 10);
        ctx.lineTo(83, 10);
        ctx.fill();
    }

    drawDemon(ctx, r, g, b) {
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(30, 40, 68, 50);
        ctx.beginPath();
        ctx.arc(64, 40, 34, 0, Math.PI, true);
        ctx.fill();

        ctx.fillStyle = '#ff0';
        ctx.fillRect(40, 30, 15, 15);
        ctx.fillRect(73, 30, 15, 15);

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(45, 70);
        ctx.lineTo(40, 60);
        ctx.lineTo(50, 60);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(83, 70);
        ctx.lineTo(78, 60);
        ctx.lineTo(88, 60);
        ctx.fill();

        ctx.fillStyle = `rgb(${r * 0.6}, ${g * 0.6}, ${b * 0.6})`;
        ctx.fillRect(25, 85, 25, 25);
        ctx.fillRect(78, 85, 25, 25);
    }

    drawCacodemon(ctx, r, g, b) {
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.arc(64, 64, 50, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(64, 50, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(64, 50, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(64, 50, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = 64 + Math.cos(angle) * 40;
            const y = 64 + Math.sin(angle) * 40;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 5, y - 10);
            ctx.lineTo(x + 5, y - 10);
            ctx.fill();
        }
    }

    drawHellKnight(ctx, r, g, b) {
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(40, 20, 48, 80);
        ctx.fillRect(30, 30, 68, 60);

        ctx.fillStyle = '#f00';
        ctx.fillRect(45, 35, 12, 12);
        ctx.fillRect(71, 35, 12, 12);

        ctx.fillStyle = '#000';
        ctx.fillRect(50, 60, 28, 8);

        ctx.fillStyle = `rgb(${r * 1.2}, ${g * 1.2}, ${b * 1.2})`;
        ctx.fillRect(20, 40, 25, 40);
        ctx.fillRect(83, 40, 25, 40);

        ctx.fillStyle = '#666';
        ctx.fillRect(38, 95, 20, 25);
        ctx.fillRect(70, 95, 20, 25);

        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.moveTo(40, 15);
        ctx.lineTo(35, 5);
        ctx.lineTo(45, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(88, 15);
        ctx.lineTo(83, 5);
        ctx.lineTo(93, 5);
        ctx.fill();
    }

    createHealthBar() {
        const barGeometry = new THREE.PlaneGeometry(1, 0.1);
        const barMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide
        });

        this.healthBar = new THREE.Mesh(barGeometry, barMaterial);
        this.healthBar.position.set(0, this.properties.height * 0.6, 0);
        this.sprite.add(this.healthBar);

        const bgGeometry = new THREE.PlaneGeometry(1.1, 0.15);
        const bgMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide
        });

        const healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
        healthBarBg.position.set(0, this.properties.height * 0.6, -0.01);
        this.sprite.add(healthBarBg);
    }

    setInitialPosition() {
        if (this.properties.flying) {
            this.position.y = this.properties.flyHeight;
        } else {
            this.position.y = this.properties.height / 2;
        }
        this.sprite.position.copy(this.position);
    }

    update(deltaTime, playerPosition, walls, allEnemies = []) {
        if (this.health <= 0) {
            this.updateDeath(deltaTime);
            return;
        }

        if (this.painTimer > 0) {
            this.painTimer -= deltaTime;
        }

        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        this.strafeCooldown = Math.max(0, this.strafeCooldown - deltaTime);
        this.pathfindingCooldown = Math.max(0, this.pathfindingCooldown - deltaTime);
        this.alertCooldown = Math.max(0, this.alertCooldown - deltaTime);

        this.nearbyEnemies = allEnemies.filter(
            e =>
                e !== this &&
                e.isAlive() &&
                this.position.distanceTo(e.position) < this.properties.alertRadius
        );

        this.updateAI(deltaTime, playerPosition, walls);
        this.updateMovement(deltaTime, walls);
        this.updateAnimation(deltaTime);
        this.updateProjectiles(deltaTime);

        this.sprite.position.copy(this.position);

        if (this.healthBar) {
            const healthPercent = this.health / this.maxHealth;
            this.healthBar.scale.x = healthPercent;
            this.healthBar.position.x = (healthPercent - 1) * 0.5;

            if (healthPercent > 0.6) {
                this.healthBar.material.color.setHex(0x00ff00);
            } else if (healthPercent > 0.3) {
                this.healthBar.material.color.setHex(0xffff00);
            } else {
                this.healthBar.material.color.setHex(0xff0000);
            }
        }
    }

    updateAI(deltaTime, playerPosition, walls) {
        const distanceToPlayer = this.position.distanceTo(playerPosition);
        const canSee = this.canSeePlayer(playerPosition, walls);

        if (canSee && distanceToPlayer < this.properties.sightRange) {
            if (this.state !== 'alert' && this.state !== 'attack') {
                this.onAlert(playerPosition);
            }
            this.lastKnownPlayerPos = playerPosition.clone();
            this.alertLevel = 1;

            if (distanceToPlayer < this.properties.attackRange) {
                this.state = 'attack';
            } else {
                this.state = 'chase';
            }
        } else if (this.alertLevel > 0) {
            this.alertLevel -= deltaTime * 0.2;

            if (this.lastKnownPlayerPos) {
                this.state = 'search';
            } else if (this.alertLevel <= 0) {
                this.state = 'idle';
            }
        } else {
            this.state = 'idle';
        }

        switch (this.state) {
            case 'idle':
                this.patrol(deltaTime);
                break;
            case 'chase':
                this.chasePlayer(deltaTime, playerPosition, walls);
                break;
            case 'attack':
                this.attackPlayer(deltaTime, playerPosition);
                break;
            case 'search':
                this.searchForPlayer(deltaTime);
                break;
        }
    }

    onAlert(playerPosition) {
        if (this.alertCooldown <= 0 && this.nearbyEnemies.length > 0) {
            this.alertCooldown = 2;
            this.nearbyEnemies.forEach(enemy => {
                if (enemy.state === 'idle') {
                    enemy.lastKnownPlayerPos = playerPosition.clone();
                    enemy.alertLevel = 0.5;
                    enemy.state = 'search';
                }
            });
        }
    }

    patrol(deltaTime) {
        if (!this.patrolTarget || this.position.distanceTo(this.patrolTarget) < 2) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * 10;
            this.patrolTarget = new THREE.Vector3(
                this.position.x + Math.cos(angle) * distance,
                this.position.y,
                this.position.z + Math.sin(angle) * distance
            );
        }

        const direction = this.patrolTarget.clone().sub(this.position).normalize();
        this.velocity.add(direction.multiplyScalar(this.properties.speed * 0.3 * deltaTime));
    }

    chasePlayer(deltaTime, playerPosition, walls) {
        if (this.type === EnemyType.DEMON && this.position.distanceTo(playerPosition) < 10) {
            const direction = playerPosition.clone().sub(this.position).normalize();
            this.velocity.add(direction.multiplyScalar(this.properties.chargeSpeed * deltaTime));
        } else {
            if (this.pathfindingCooldown <= 0) {
                this.pathfindingCooldown = 0.5;
                this.calculatePath(playerPosition, walls);
            }

            if (this.path.length > 0) {
                this.followPath(deltaTime);
            } else {
                const direction = playerPosition.clone().sub(this.position).normalize();
                this.velocity.add(direction.multiplyScalar(this.properties.speed * deltaTime));
            }
        }

        if (this.strafeCooldown <= 0 && Math.random() < 0.3) {
            this.strafeCooldown = 1;
            this.strafeDirection *= -1;
        }

        const strafeVector = new THREE.Vector3(
            playerPosition.z - this.position.z,
            0,
            -(playerPosition.x - this.position.x)
        ).normalize();

        this.velocity.add(
            strafeVector.multiplyScalar(
                this.strafeDirection * this.properties.speed * 0.5 * deltaTime
            )
        );
    }

    calculatePath(target, walls) {
        this.path = [target.clone()];
        this.pathIndex = 0;
    }

    followPath(deltaTime) {
        if (this.pathIndex >= this.path.length) return;

        const target = this.path[this.pathIndex];
        const distance = this.position.distanceTo(target);

        if (distance < 1) {
            this.pathIndex++;
        } else {
            const direction = target.clone().sub(this.position).normalize();
            this.velocity.add(direction.multiplyScalar(this.properties.speed * deltaTime));
        }
    }

    attackPlayer(deltaTime, playerPosition) {
        const direction = playerPosition.clone().sub(this.position).normalize();
        this.rotation = Math.atan2(direction.x, direction.z);

        if (this.attackCooldown <= 0) {
            this.attackCooldown = this.properties.attackRate;

            if (this.properties.projectile) {
                this.fireProjectile(playerPosition);
            } else {
                this.performMeleeAttack();
            }
        }

        if (this.position.distanceTo(playerPosition) > this.properties.attackRange * 0.8) {
            const moveDir = direction.clone();
            this.velocity.add(moveDir.multiplyScalar(this.properties.speed * 0.5 * deltaTime));
        }
    }

    fireProjectile(targetPosition) {
        const projectile = this.createProjectile();
        const direction = targetPosition.clone().sub(this.position).normalize();

        projectile.position.copy(this.position);
        projectile.position.y += this.properties.height * 0.3;
        projectile.velocity = direction.multiplyScalar(this.properties.projectileSpeed);

        this.scene.add(projectile);
        this.projectiles.push(projectile);
    }

    createProjectile() {
        let geometry, material;

        switch (this.properties.projectile) {
            case 'fireball':
                geometry = new THREE.SphereGeometry(0.2, 8, 8);
                material = new THREE.MeshBasicMaterial({
                    color: this.properties.projectileColor,
                    emissive: this.properties.projectileColor,
                    emissiveIntensity: 1
                });
                break;
            case 'lightning':
                geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
                material = new THREE.MeshBasicMaterial({
                    color: this.properties.projectileColor,
                    emissive: this.properties.projectileColor,
                    emissiveIntensity: 1
                });
                break;
            case 'plasma':
                geometry = new THREE.SphereGeometry(0.3, 16, 16);
                material = new THREE.MeshBasicMaterial({
                    color: this.properties.projectileColor,
                    emissive: this.properties.projectileColor,
                    emissiveIntensity: 1,
                    transparent: true,
                    opacity: 0.8
                });
                break;
            default:
                geometry = new THREE.SphereGeometry(0.2, 8, 8);
                material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        }

        const projectile = new THREE.Mesh(geometry, material);
        projectile.userData = {
            damage: this.properties.damage,
            owner: this
        };

        return projectile;
    }

    performMeleeAttack() {
        this.animationFrame = 'attack';
        this.animationTimer = 0.3;
    }

    searchForPlayer(deltaTime) {
        if (this.lastKnownPlayerPos) {
            const distance = this.position.distanceTo(this.lastKnownPlayerPos);

            if (distance < 2) {
                this.lastKnownPlayerPos = null;
                this.state = 'idle';
            } else {
                const direction = this.lastKnownPlayerPos.clone().sub(this.position).normalize();
                this.velocity.add(
                    direction.multiplyScalar(this.properties.speed * 0.7 * deltaTime)
                );
            }
        }
    }

    updateMovement(deltaTime, walls) {
        if (!this.properties.flying) {
            this.velocity.y = 0;
        } else {
            const targetHeight = this.properties.flyHeight + Math.sin(Date.now() * 0.001) * 0.5;
            const heightDiff = targetHeight - this.position.y;
            this.velocity.y += heightDiff * deltaTime * 2;
        }

        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        this.velocity.multiplyScalar(0.9);

        this.avoidWalls(walls);

        if (this.velocity.length() > 0.1) {
            const direction = new THREE.Vector2(this.velocity.x, this.velocity.z).normalize();
            this.rotation = Math.atan2(direction.x, direction.y);
        }
    }

    avoidWalls(walls) {
        const avoidDistance = 2;
        const avoidForce = 10;

        walls.forEach(wall => {
            const wallBounds = new THREE.Box3().setFromObject(wall);
            const closestPoint = new THREE.Vector3();
            wallBounds.clampPoint(this.position, closestPoint);

            const distance = this.position.distanceTo(closestPoint);

            if (distance < avoidDistance) {
                const avoidDirection = this.position.clone().sub(closestPoint).normalize();
                const strength = (avoidDistance - distance) / avoidDistance;
                this.position.add(avoidDirection.multiplyScalar(strength * 0.1));
                this.velocity.add(avoidDirection.multiplyScalar(avoidForce * strength));
            }
        });
    }

    updateAnimation(deltaTime) {
        this.animationTimer -= deltaTime;

        if (this.animationTimer <= 0) {
            this.animationTimer = 0.1;

            if (this.state === 'idle') {
                this.animationFrame = (this.animationFrame + 1) % 2;
            } else if (this.velocity.length() > 0.5) {
                this.animationFrame = (this.animationFrame + 1) % 4;
            }

            this.updateSprite();
        }
    }

    updateSprite() {
        const canvas = this.sprite.material.map.image;
        const ctx = canvas.getContext('2d');

        if (this.painTimer > 0) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(0, 0, 128, 128);
        } else {
            this.drawEnemySprite(ctx);
        }

        this.sprite.material.map.needsUpdate = true;
    }

    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.position.add(projectile.velocity.clone().multiplyScalar(deltaTime));

            if (projectile.position.distanceTo(this.position) > 50) {
                this.scene.remove(projectile);
                this.projectiles.splice(i, 1);
            }
        }
    }

    updateDeath(deltaTime) {
        this.deathTimer += deltaTime;

        if (this.gibbed) {
            this.createGibs();
            this.remove();
        } else {
            if (this.deathTimer < 0.5) {
                this.sprite.material.opacity = 1 - this.deathTimer * 2;
                this.sprite.scale.y *= 0.95;
            } else {
                this.dropItems();
                this.remove();
            }
        }
    }

    canSeePlayer(playerPosition, walls) {
        const direction = playerPosition.clone().sub(this.position).normalize();
        const distance = this.position.distanceTo(playerPosition);

        const raycaster = new THREE.Raycaster(this.position, direction);
        const intersects = raycaster.intersectObjects(walls);

        return intersects.length === 0 || intersects[0].distance > distance;
    }

    takeDamage(amount, explosive = false) {
        this.health -= amount;
        this.painTimer = 0.2;

        if (this.health <= 0) {
            if (explosive || this.health < this.properties.gibThreshold) {
                this.gibbed = true;
            }
            this.die();
        } else {
            this.updateSprite();
        }
    }

    die() {
        this.state = 'dead';
        this.velocity.set(0, 0, 0);
    }

    createGibs() {
        for (let i = 0; i < 5; i++) {
            const gibGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const gibMaterial = new THREE.MeshPhongMaterial({
                color: 0xff0000
            });

            const gib = new THREE.Mesh(gibGeometry, gibMaterial);
            gib.position.copy(this.position);
            gib.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 10,
                (Math.random() - 0.5) * 10
            );

            this.scene.add(gib);

            let gibTime = 0;
            const animateGib = () => {
                gibTime += 0.016;
                if (gibTime > 2) {
                    this.scene.remove(gib);
                    return;
                }

                gib.position.add(gib.velocity.clone().multiplyScalar(0.016));
                gib.velocity.y -= 20 * 0.016;
                gib.rotation.x += 0.1;
                gib.rotation.y += 0.15;

                requestAnimationFrame(animateGib);
            };
            animateGib();
        }
    }

    dropItems() {
        if (Math.random() < this.properties.dropChance) {
            const dropTypes = ['health', 'ammo', 'armor'];
            const dropType = dropTypes[Math.floor(Math.random() * dropTypes.length)];

            let geometry, material, color;

            switch (dropType) {
                case 'health':
                    color = 0x00ff00;
                    break;
                case 'ammo':
                    color = 0xffff00;
                    break;
                case 'armor':
                    color = 0x0080ff;
                    break;
            }

            geometry = new THREE.SphereGeometry(0.3, 16, 16);
            material = new THREE.MeshPhongMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.5
            });

            const pickup = new THREE.Mesh(geometry, material);
            pickup.position.copy(this.position);
            pickup.position.y = 0.5;
            pickup.userData = { type: dropType };

            this.scene.add(pickup);
        }
    }

    isAlive() {
        return this.health > 0;
    }

    getPosition() {
        return this.position.clone();
    }

    getMeleeDamage() {
        if (this.attackCooldown <= 0 && !this.properties.projectile) {
            return this.properties.damage;
        }
        return 0;
    }

    remove() {
        if (this.sprite && this.sprite.parent) {
            this.scene.remove(this.sprite);
        }

        this.projectiles.forEach(projectile => {
            this.scene.remove(projectile);
        });
        this.projectiles = [];
    }
}
