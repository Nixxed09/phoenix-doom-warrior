import * as THREE from 'three';
import nipplejs from 'nipplejs';
import { Weapon } from './Weapon.js';

export class Player {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;

        this.position = new THREE.Vector3(0, 1.6, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);

        this.height = 1.6;
        this.crouchHeight = 0.8;
        this.currentHeight = this.height;
        this.radius = 0.3;
        this.stepHeight = 0.3;

        this.moveSpeed = 10;
        this.sprintMultiplier = 1.5;
        this.crouchMultiplier = 0.5;
        this.jumpSpeed = 10;
        this.gravity = 25;

        this.moveAcceleration = 50;
        this.friction = 10;
        this.airFriction = 2;

        this.health = 100;
        this.maxHealth = 100;
        this.armor = 0;
        this.maxArmor = 100;
        this.score = 0;

        this.isOnGround = false;
        this.isCrouching = false;
        this.isSprinting = false;
        this.isJumping = false;
        this.canJump = true;

        this.bobPhase = 0;
        this.bobAmount = 0;
        this.targetBobAmount = 0;
        this.bobSpeed = 8;
        this.bobIntensity = 0.05;

        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            crouch: false,
            sprint: false
        };

        this.mouse = {
            sensitivity: 1.0,
            invertY: false,
            smoothing: 0.1
        };

        this.pitch = 0;
        this.yaw = 0;
        this.targetPitch = 0;
        this.targetYaw = 0;

        this.weapons = {
            pistol: new Weapon('pistol', 25, 0.3, 50),
            shotgun: new Weapon('shotgun', 60, 1.0, 20),
            chaingun: new Weapon('chaingun', 15, 0.1, 200)
        };

        this.currentWeapon = this.weapons.pistol;
        this.weapon = this.currentWeapon;
        this.isShooting = false;

        this.godMode = false;
        this.noclip = false;

        this.touchControls = {
            enabled: false,
            joystick: null,
            lookZone: null,
            lookStartX: 0,
            lookStartY: 0,
            lookSensitivity: 0.005
        };

        this.collisionRays = [];
        this.setupCollisionRays();

        this.enabled = false;
        this.setupControls();
        this.detectMobile();
    }

    setupControls() {
        document.addEventListener('keydown', e => this.onKeyDown(e));
        document.addEventListener('keyup', e => this.onKeyUp(e));
        document.addEventListener('mousemove', e => this.onMouseMove(e));
        document.addEventListener('mousedown', e => this.onMouseDown(e));
        document.addEventListener('mouseup', e => this.onMouseUp(e));
        document.addEventListener('wheel', e => this.onMouseWheel(e));

        document.addEventListener('pointerlockchange', () => {
            this.enabled = document.pointerLockElement === document.body;
        });

        document.addEventListener('click', () => {
            if (!this.enabled && !this.touchControls.enabled) {
                document.body.requestPointerLock();
            }
        });
    }

    setupCollisionRays() {
        const directions = [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, -1),
            new THREE.Vector3(1, 0, 1).normalize(),
            new THREE.Vector3(-1, 0, 1).normalize(),
            new THREE.Vector3(1, 0, -1).normalize(),
            new THREE.Vector3(-1, 0, -1).normalize()
        ];

        directions.forEach(dir => {
            this.collisionRays.push(new THREE.Raycaster(this.position, dir, 0, this.radius));
        });

        this.groundRay = new THREE.Raycaster(
            this.position,
            new THREE.Vector3(0, -1, 0),
            0,
            this.currentHeight + 0.1
        );
    }

    detectMobile() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );

        if (isMobile || 'ontouchstart' in window) {
            this.setupTouchControls();
        }
    }

    setupTouchControls() {
        this.touchControls.enabled = true;

        const joystickContainer = document.createElement('div');
        joystickContainer.style.position = 'fixed';
        joystickContainer.style.bottom = '50px';
        joystickContainer.style.left = '50px';
        joystickContainer.style.width = '150px';
        joystickContainer.style.height = '150px';
        joystickContainer.style.zIndex = '1000';
        document.body.appendChild(joystickContainer);

        this.touchControls.joystick = nipplejs.create({
            zone: joystickContainer,
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'white',
            size: 150
        });

        this.touchControls.joystick.on('move', (evt, data) => {
            const force = Math.min(data.force, 1);
            const angle = data.angle.radian;

            this.keys.forward = false;
            this.keys.backward = false;
            this.keys.left = false;
            this.keys.right = false;

            if (force > 0.3) {
                const x = Math.cos(angle) * force;
                const y = Math.sin(angle) * force;

                if (y > 0.5) this.keys.forward = true;
                if (y < -0.5) this.keys.backward = true;
                if (x > 0.5) this.keys.right = true;
                if (x < -0.5) this.keys.left = true;

                this.keys.sprint = force > 0.8;
            }
        });

        this.touchControls.joystick.on('end', () => {
            this.keys.forward = false;
            this.keys.backward = false;
            this.keys.left = false;
            this.keys.right = false;
            this.keys.sprint = false;
        });

        const lookZone = document.createElement('div');
        lookZone.style.position = 'fixed';
        lookZone.style.top = '0';
        lookZone.style.right = '0';
        lookZone.style.width = '50%';
        lookZone.style.height = '100%';
        lookZone.style.zIndex = '999';
        document.body.appendChild(lookZone);

        this.touchControls.lookZone = lookZone;

        lookZone.addEventListener('touchstart', e => {
            const touch = e.touches[0];
            this.touchControls.lookStartX = touch.clientX;
            this.touchControls.lookStartY = touch.clientY;
        });

        lookZone.addEventListener('touchmove', e => {
            e.preventDefault();
            const touch = e.touches[0];
            const deltaX = touch.clientX - this.touchControls.lookStartX;
            const deltaY = touch.clientY - this.touchControls.lookStartY;

            this.targetYaw -= deltaX * this.touchControls.lookSensitivity;
            this.targetPitch -=
                deltaY * this.touchControls.lookSensitivity * (this.mouse.invertY ? -1 : 1);
            this.targetPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetPitch));

            this.touchControls.lookStartX = touch.clientX;
            this.touchControls.lookStartY = touch.clientY;
        });

        const fireButton = document.createElement('button');
        fireButton.style.position = 'fixed';
        fireButton.style.bottom = '50px';
        fireButton.style.right = '50px';
        fireButton.style.width = '80px';
        fireButton.style.height = '80px';
        fireButton.style.borderRadius = '50%';
        fireButton.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        fireButton.style.border = '2px solid white';
        fireButton.style.zIndex = '1000';
        fireButton.textContent = 'FIRE';
        fireButton.style.color = 'white';
        fireButton.style.fontSize = '16px';
        fireButton.style.fontWeight = 'bold';
        document.body.appendChild(fireButton);

        fireButton.addEventListener('touchstart', () => (this.isShooting = true));
        fireButton.addEventListener('touchend', () => (this.isShooting = false));

        const jumpButton = document.createElement('button');
        jumpButton.style.position = 'fixed';
        jumpButton.style.bottom = '150px';
        jumpButton.style.right = '50px';
        jumpButton.style.width = '60px';
        jumpButton.style.height = '60px';
        jumpButton.style.borderRadius = '50%';
        jumpButton.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
        jumpButton.style.border = '2px solid white';
        jumpButton.style.zIndex = '1000';
        jumpButton.textContent = 'JUMP';
        jumpButton.style.color = 'white';
        jumpButton.style.fontSize = '14px';
        document.body.appendChild(jumpButton);

        jumpButton.addEventListener('touchstart', () => (this.keys.jump = true));
        jumpButton.addEventListener('touchend', () => (this.keys.jump = false));
    }

    onKeyDown(event) {
        if (!this.enabled) return;

        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.jump = true;
                break;
            case 'ControlLeft':
            case 'KeyC':
                this.keys.crouch = true;
                break;
            case 'ShiftLeft':
                this.keys.sprint = true;
                break;
            case 'Digit1':
                this.switchWeapon('pistol');
                break;
            case 'Digit2':
                this.switchWeapon('shotgun');
                break;
            case 'Digit3':
                this.switchWeapon('chaingun');
                break;
            case 'KeyR':
                this.weapon.reload();
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.jump = false;
                break;
            case 'ControlLeft':
            case 'KeyC':
                this.keys.crouch = false;
                break;
            case 'ShiftLeft':
                this.keys.sprint = false;
                break;
        }
    }

    onMouseMove(event) {
        if (!this.enabled || this.touchControls.enabled) return;

        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        this.targetYaw -= movementX * this.mouse.sensitivity * 0.002;
        this.targetPitch -=
            movementY * this.mouse.sensitivity * 0.002 * (this.mouse.invertY ? -1 : 1);
        this.targetPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetPitch));
    }

    onMouseDown(event) {
        if (!this.enabled || this.touchControls.enabled) return;

        if (event.button === 0) {
            this.isShooting = true;
        } else if (event.button === 2) {
            this.weapon.altFire?.();
        }
    }

    onMouseUp(event) {
        if (event.button === 0) {
            this.isShooting = false;
        }
    }

    onMouseWheel(event) {
        if (!this.enabled) return;

        const weapons = Object.keys(this.weapons);
        const currentIndex = weapons.indexOf(this.weapon.type);
        const newIndex =
            (currentIndex + (event.deltaY > 0 ? 1 : -1) + weapons.length) % weapons.length;
        this.switchWeapon(weapons[newIndex]);
    }

    enable() {
        if (!this.touchControls.enabled) {
            document.body.requestPointerLock();
        }
        this.enabled = true;
    }

    disable() {
        if (!this.touchControls.enabled) {
            document.exitPointerLock();
        }
        this.enabled = false;
    }

    update(deltaTime) {
        if (!this.enabled) return;

        this.updateRotation(deltaTime);
        this.updateMovement(deltaTime);
        this.updatePhysics(deltaTime);
        this.updateCameraBob(deltaTime);
        this.updateCrouch(deltaTime);

        this.weapon.update(deltaTime);
    }

    updateRotation(deltaTime) {
        const smoothing = 1 - Math.pow(this.mouse.smoothing, deltaTime * 60);
        this.yaw += (this.targetYaw - this.yaw) * smoothing;
        this.pitch += (this.targetPitch - this.pitch) * smoothing;

        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.y = this.yaw;
        euler.x = this.pitch;
        this.camera.quaternion.setFromEuler(euler);
    }

    updateMovement(deltaTime) {
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);

        this.camera.getWorldDirection(forward);

        if (this.noclip) {
            // In noclip mode, allow full 3D movement
            forward.normalize();
        } else {
            // Normal movement - keep on horizontal plane
            forward.y = 0;
            forward.normalize();
        }

        right.crossVectors(forward, up);

        const inputVector = new THREE.Vector3();

        if (this.keys.forward) inputVector.add(forward);
        if (this.keys.backward) inputVector.sub(forward);
        if (this.keys.left) inputVector.sub(right);
        if (this.keys.right) inputVector.add(right);

        // In noclip mode, use jump/crouch for vertical movement
        if (this.noclip) {
            if (this.keys.jump) inputVector.add(up);
            if (this.keys.crouch) inputVector.sub(up);
        }

        if (inputVector.length() > 0) {
            inputVector.normalize();

            let speed = this.moveSpeed;
            if (this.noclip) {
                speed *= 2; // Faster movement in noclip
            } else {
                if (this.isCrouching) speed *= this.crouchMultiplier;
                else if (this.keys.sprint && this.keys.forward) speed *= this.sprintMultiplier;
            }

            this.acceleration = inputVector.multiplyScalar(this.moveAcceleration);

            this.targetBobAmount = this.noclip
                ? 0
                : this.isCrouching
                  ? 0.5
                  : this.keys.sprint
                    ? 1.5
                    : 1;
        } else {
            this.acceleration.set(0, 0, 0);
            this.targetBobAmount = 0;
        }

        // Normal jumping only in non-noclip mode
        if (
            !this.noclip &&
            this.keys.jump &&
            this.isOnGround &&
            this.canJump &&
            !this.isCrouching
        ) {
            this.velocity.y = this.jumpSpeed;
            this.isJumping = true;
            this.canJump = false;
        }

        if (!this.keys.jump) {
            this.canJump = true;
        }
    }

    updatePhysics(deltaTime) {
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));

        if (this.noclip) {
            // In noclip mode, apply simple friction to all axes
            const frictionForce = 1 - this.friction * deltaTime;
            this.velocity.multiplyScalar(frictionForce);
        } else {
            // Normal physics
            const horizontalVelocity = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
            const speed = horizontalVelocity.length();

            if (speed > 0) {
                const maxSpeed = this.isCrouching
                    ? this.moveSpeed * this.crouchMultiplier
                    : this.keys.sprint
                      ? this.moveSpeed * this.sprintMultiplier
                      : this.moveSpeed;

                if (speed > maxSpeed) {
                    horizontalVelocity.normalize().multiplyScalar(maxSpeed);
                    this.velocity.x = horizontalVelocity.x;
                    this.velocity.z = horizontalVelocity.z;
                }
            }

            // Apply gravity only in normal mode
            this.velocity.y -= this.gravity * deltaTime;

            const friction = this.isOnGround ? this.friction : this.airFriction;
            const frictionForce = 1 - friction * deltaTime;
            this.velocity.x *= frictionForce;
            this.velocity.z *= frictionForce;
        }

        const nextPosition = this.position
            .clone()
            .add(this.velocity.clone().multiplyScalar(deltaTime));

        this.checkCollisions(nextPosition, deltaTime);

        this.position.copy(nextPosition);
        this.camera.position.copy(this.position);
        this.camera.position.y = this.position.y + this.currentHeight - this.height;
    }

    checkCollisions(nextPosition, deltaTime) {
        if (this.noclip) return;
        this.collisionRays.forEach(ray => {
            ray.ray.origin.copy(nextPosition);
            ray.ray.origin.y = nextPosition.y - this.currentHeight + this.radius;
        });

        let collided = false;

        this.collisionRays.forEach(ray => {
            const intersects = ray.intersectObjects(this.scene.children, true);

            if (intersects.length > 0 && intersects[0].distance < this.radius) {
                const normal = intersects[0].face.normal.clone();
                normal.transformDirection(intersects[0].object.matrixWorld);

                const penetration = this.radius - intersects[0].distance;
                nextPosition.add(normal.multiplyScalar(penetration));

                const velocityDot = this.velocity.dot(normal);
                if (velocityDot < 0) {
                    this.velocity.sub(normal.multiplyScalar(velocityDot));
                }

                collided = true;
            }
        });

        this.groundRay.ray.origin.copy(nextPosition);
        this.groundRay.ray.origin.y = nextPosition.y;
        const groundIntersects = this.groundRay.intersectObjects(this.scene.children, true);

        if (groundIntersects.length > 0) {
            const groundY = groundIntersects[0].point.y;
            const playerBottom = nextPosition.y - this.currentHeight;

            if (playerBottom < groundY && this.velocity.y <= 0) {
                const stepUp = groundY - playerBottom;

                if (stepUp < this.stepHeight) {
                    nextPosition.y += stepUp;
                    this.velocity.y = 0;
                    this.isOnGround = true;
                    this.isJumping = false;
                } else if (this.velocity.y < 0) {
                    nextPosition.y = groundY + this.currentHeight;
                    this.velocity.y = 0;
                    this.isOnGround = true;
                    this.isJumping = false;
                }
            } else if (playerBottom > groundY + 0.1) {
                this.isOnGround = false;
            }
        } else {
            this.isOnGround = false;
        }

        if (nextPosition.y < this.currentHeight) {
            nextPosition.y = this.currentHeight;
            this.velocity.y = 0;
            this.isOnGround = true;
            this.isJumping = false;
        }
    }

    updateCameraBob(deltaTime) {
        this.bobAmount += (this.targetBobAmount - this.bobAmount) * deltaTime * 5;

        if (this.bobAmount > 0.1 && this.isOnGround && !this.isJumping) {
            this.bobPhase += this.bobSpeed * deltaTime * (this.keys.sprint ? 1.5 : 1);

            const bobX = Math.sin(this.bobPhase) * this.bobAmount * this.bobIntensity;
            const bobY = Math.abs(Math.cos(this.bobPhase * 2)) * this.bobAmount * this.bobIntensity;

            this.camera.position.x = this.position.x + bobX * 0.5;
            this.camera.position.y = this.position.y + this.currentHeight - this.height + bobY;
        }
    }

    updateCrouch(deltaTime) {
        const targetHeight = this.keys.crouch ? this.crouchHeight : this.height;
        const heightDiff = targetHeight - this.currentHeight;

        if (Math.abs(heightDiff) > 0.01) {
            this.currentHeight += heightDiff * deltaTime * 10;

            if (heightDiff > 0) {
                const headRoom = this.checkHeadRoom();
                if (!headRoom) {
                    this.currentHeight = this.crouchHeight;
                }
            }
        }

        this.isCrouching = this.currentHeight < this.height - 0.1;
    }

    checkHeadRoom() {
        const upRay = new THREE.Raycaster(
            this.position,
            new THREE.Vector3(0, 1, 0),
            0,
            this.height - this.currentHeight + 0.1
        );

        const intersects = upRay.intersectObjects(this.scene.children, true);
        return intersects.length === 0;
    }

    getPosition() {
        return this.position.clone();
    }

    setPosition(position) {
        this.position.copy(position);
        this.camera.position.copy(position);
        this.velocity.set(0, 0, 0);
    }

    takeDamage(amount) {
        if (this.godMode) return;

        if (this.armor > 0) {
            const armorDamage = Math.min(this.armor, amount * 0.6);
            this.armor -= armorDamage;
            amount -= armorDamage;
        }

        this.health -= amount;
        this.health = Math.max(0, this.health);

        const knockback = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() * 2,
            (Math.random() - 0.5) * 2
        );
        this.velocity.add(knockback);
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    addArmor(amount) {
        this.armor = Math.min(this.maxArmor, this.armor + amount);
    }

    addAmmo(weaponType, amount) {
        if (this.weapons[weaponType]) {
            this.weapons[weaponType].addAmmo(amount);
        }
    }

    getAmmo() {
        return this.currentWeapon.ammo;
    }

    switchWeapon(weaponType) {
        if (this.weapons[weaponType] && this.weapons[weaponType] !== this.currentWeapon) {
            this.currentWeapon = this.weapons[weaponType];
            this.weapon = this.currentWeapon;
        }
    }

    addScore(points) {
        this.score += points;
    }

    giveAllWeapons() {
        const allWeapons = {
            fist: new Weapon('fist', 20, 0.5, Infinity),
            pistol: new Weapon('pistol', 25, 0.3, 200),
            shotgun: new Weapon('shotgun', 60, 1.0, 50),
            chaingun: new Weapon('chaingun', 15, 0.1, 300),
            rocket_launcher: new Weapon('rocket_launcher', 100, 1.5, 20),
            plasma_gun: new Weapon('plasma_gun', 35, 0.2, 100),
            bfg9000: new Weapon('bfg9000', 500, 3.0, 10)
        };

        this.weapons = { ...this.weapons, ...allWeapons };

        Object.values(this.weapons).forEach(weapon => {
            weapon.ammo = weapon.maxAmmo;
        });
    }

    reset() {
        this.position.set(0, 1.6, 0);
        this.velocity.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);

        this.health = this.maxHealth;
        this.armor = 0;
        this.score = 0;

        this.pitch = 0;
        this.yaw = 0;
        this.targetPitch = 0;
        this.targetYaw = 0;

        this.currentHeight = this.height;
        this.isCrouching = false;
        this.isOnGround = true;
        this.isJumping = false;

        this.currentWeapon = this.weapons.pistol;
        this.weapon = this.currentWeapon;

        Object.values(this.weapons).forEach(weapon => weapon.reset());
    }

    setMouseSensitivity(sensitivity) {
        this.mouse.sensitivity = Math.max(0.1, Math.min(2.0, sensitivity));
    }

    setInvertY(invert) {
        this.mouse.invertY = invert;
    }

    cleanup() {
        if (this.touchControls.joystick) {
            this.touchControls.joystick.destroy();
        }

        const touchElements = [
            this.touchControls.lookZone,
            document.querySelector('button[textContent="FIRE"]'),
            document.querySelector('button[textContent="JUMP"]')
        ];

        touchElements.forEach(el => el?.remove());
    }
}
