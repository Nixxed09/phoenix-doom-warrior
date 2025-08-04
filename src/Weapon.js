import * as THREE from 'three';

export const AmmoType = {
    NONE: 'none',
    BULLETS: 'bullets',
    SHELLS: 'shells',
    ROCKETS: 'rockets',
    CELLS: 'cells'
};

export const WeaponType = {
    FIST: 'fist',
    PISTOL: 'pistol',
    SHOTGUN: 'shotgun',
    CHAINGUN: 'chaingun',
    ROCKET_LAUNCHER: 'rocket_launcher',
    PLASMA_GUN: 'plasma_gun',
    BFG9000: 'bfg9000'
};

export class Weapon {
    constructor(type, damage, fireRate, maxAmmo, ammoType = AmmoType.BULLETS) {
        this.type = type;
        this.damage = damage;
        this.fireRate = fireRate;
        this.maxAmmo = maxAmmo;
        this.ammo = maxAmmo;
        this.ammoType = ammoType;
        this.lastShotTime = 0;
        this.reloading = false;
        this.switching = false;
        this.switchTime = 0.5;

        this.mesh = null;
        this.muzzleFlash = null;
        this.flashLight = null;

        this.position = new THREE.Vector3(0.3, -0.3, -0.5);
        this.rotation = new THREE.Vector3(0, 0, 0);
        this.scale = new THREE.Vector3(1, 1, 1);

        this.recoilAmount = 0;
        this.recoilSpeed = 10;
        this.recoilRecovery = 5;
        this.maxRecoil = 0.1;

        this.bobAmount = 0;
        this.bobSpeed = 0;
        this.bobPhase = 0;

        this.properties = this.getWeaponProperties();
        this.createWeaponModel();
        this.createMuzzleFlash();
    }

    getWeaponProperties() {
        const props = {
            [WeaponType.FIST]: {
                spread: 0,
                range: 2,
                projectileSpeed: 0,
                infiniteAmmo: true,
                melee: true,
                recoil: 0.05,
                muzzleFlashSize: 0,
                muzzleFlashDuration: 0,
                switchTime: 0.3
            },
            [WeaponType.PISTOL]: {
                spread: 0.02,
                range: 100,
                projectileSpeed: 500,
                infiniteAmmo: true,
                melee: false,
                recoil: 0.05,
                muzzleFlashSize: 0.3,
                muzzleFlashDuration: 0.05,
                switchTime: 0.4
            },
            [WeaponType.SHOTGUN]: {
                spread: 0.15,
                range: 30,
                projectileSpeed: 300,
                pellets: 8,
                infiniteAmmo: false,
                melee: false,
                recoil: 0.15,
                muzzleFlashSize: 0.5,
                muzzleFlashDuration: 0.1,
                switchTime: 0.6
            },
            [WeaponType.CHAINGUN]: {
                spread: 0.05,
                range: 80,
                projectileSpeed: 600,
                infiniteAmmo: false,
                melee: false,
                recoil: 0.03,
                muzzleFlashSize: 0.4,
                muzzleFlashDuration: 0.03,
                spinupTime: 0.5,
                switchTime: 0.7
            },
            [WeaponType.ROCKET_LAUNCHER]: {
                spread: 0,
                range: 200,
                projectileSpeed: 25,
                infiniteAmmo: false,
                melee: false,
                explosive: true,
                explosionRadius: 5,
                recoil: 0.2,
                muzzleFlashSize: 0.6,
                muzzleFlashDuration: 0.15,
                switchTime: 0.8
            },
            [WeaponType.PLASMA_GUN]: {
                spread: 0.03,
                range: 150,
                projectileSpeed: 40,
                infiniteAmmo: false,
                melee: false,
                projectile: 'plasma',
                recoil: 0.08,
                muzzleFlashSize: 0.4,
                muzzleFlashDuration: 0.05,
                muzzleFlashColor: 0x00ffff,
                switchTime: 0.6
            },
            [WeaponType.BFG9000]: {
                spread: 0,
                range: 300,
                projectileSpeed: 20,
                infiniteAmmo: false,
                melee: false,
                projectile: 'bfg',
                chargeTime: 0.5,
                ammoPerShot: 40,
                recoil: 0.3,
                muzzleFlashSize: 1.0,
                muzzleFlashDuration: 0.3,
                muzzleFlashColor: 0x00ff00,
                switchTime: 1.0
            }
        };

        return props[this.type] || props[WeaponType.PISTOL];
    }

    createWeaponModel() {
        const group = new THREE.Group();

        switch (this.type) {
            case WeaponType.FIST:
                this.createFistModel(group);
                break;
            case WeaponType.PISTOL:
                this.createPistolModel(group);
                break;
            case WeaponType.SHOTGUN:
                this.createShotgunModel(group);
                break;
            case WeaponType.CHAINGUN:
                this.createChaingunModel(group);
                break;
            case WeaponType.ROCKET_LAUNCHER:
                this.createRocketLauncherModel(group);
                break;
            case WeaponType.PLASMA_GUN:
                this.createPlasmaGunModel(group);
                break;
            case WeaponType.BFG9000:
                this.createBFG9000Model(group);
                break;
        }

        group.position.copy(this.position);
        group.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
        group.scale.copy(this.scale);

        this.mesh = group;
    }

    createFistModel(group) {
        const armGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.15);
        const armMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
        const arm = new THREE.Mesh(armGeometry, armMaterial);
        arm.position.set(0, -0.2, 0);
        group.add(arm);

        const handGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const handMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
        const hand = new THREE.Mesh(handGeometry, handMaterial);
        hand.position.set(0, -0.4, 0);
        group.add(hand);
    }

    createPistolModel(group) {
        const bodyGeometry = new THREE.BoxGeometry(0.05, 0.15, 0.3);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);

        const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
        const barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.set(0, 0.05, -0.25);
        group.add(barrel);

        const gripGeometry = new THREE.BoxGeometry(0.04, 0.1, 0.08);
        const gripMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
        const grip = new THREE.Mesh(gripGeometry, gripMaterial);
        grip.position.set(0, -0.1, 0.05);
        group.add(grip);
    }

    createShotgunModel(group) {
        const bodyGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.6);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);

        const barrel1Geometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
        const barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        const barrel1 = new THREE.Mesh(barrel1Geometry, barrelMaterial);
        barrel1.rotation.z = Math.PI / 2;
        barrel1.position.set(0, 0.03, -0.4);
        group.add(barrel1);

        const barrel2 = barrel1.clone();
        barrel2.position.set(0, -0.03, -0.4);
        group.add(barrel2);

        const stockGeometry = new THREE.BoxGeometry(0.06, 0.12, 0.3);
        const stockMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.set(0, -0.05, 0.35);
        group.add(stock);
    }

    createChaingunModel(group) {
        const bodyGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.z = Math.PI / 2;
        group.add(body);

        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const barrelGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6);
            const barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
            const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
            barrel.rotation.z = Math.PI / 2;
            barrel.position.set(0, Math.sin(angle) * 0.05, -0.3 + Math.cos(angle) * 0.05);
            group.add(barrel);
        }

        const handleGeometry = new THREE.BoxGeometry(0.05, 0.15, 0.05);
        const handleMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(0, -0.12, 0.1);
        group.add(handle);
    }

    createRocketLauncherModel(group) {
        const tubeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
        const tubeMaterial = new THREE.MeshPhongMaterial({ color: 0x2f4f2f });
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        tube.rotation.z = Math.PI / 2;
        group.add(tube);

        const frontGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.1, 8);
        const frontMaterial = new THREE.MeshPhongMaterial({ color: 0x3f5f3f });
        const front = new THREE.Mesh(frontGeometry, frontMaterial);
        front.rotation.z = Math.PI / 2;
        front.position.set(0, 0, -0.35);
        group.add(front);

        const gripGeometry = new THREE.BoxGeometry(0.05, 0.12, 0.05);
        const gripMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        const grip = new THREE.Mesh(gripGeometry, gripMaterial);
        grip.position.set(0, -0.1, 0);
        group.add(grip);

        const sightGeometry = new THREE.BoxGeometry(0.03, 0.05, 0.1);
        const sightMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        const sight = new THREE.Mesh(sightGeometry, sightMaterial);
        sight.position.set(0, 0.1, -0.1);
        group.add(sight);
    }

    createPlasmaGunModel(group) {
        const bodyGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.4);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a2e,
            emissive: 0x0f3460,
            emissiveIntensity: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);

        const barrelGeometry = new THREE.CylinderGeometry(0.04, 0.06, 0.3, 6);
        const barrelMaterial = new THREE.MeshPhongMaterial({
            color: 0x16213e,
            emissive: 0x00ffff,
            emissiveIntensity: 0.1
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.set(0, 0, -0.3);
        group.add(barrel);

        const coilGeometry = new THREE.TorusGeometry(0.06, 0.01, 8, 16);
        const coilMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5
        });
        for (let i = 0; i < 3; i++) {
            const coil = new THREE.Mesh(coilGeometry, coilMaterial);
            coil.position.set(0, 0, -0.2 - i * 0.08);
            group.add(coil);
        }
    }

    createBFG9000Model(group) {
        const bodyGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            emissive: 0x00ff00,
            emissiveIntensity: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);

        const barrelGeometry = new THREE.CylinderGeometry(0.08, 0.12, 0.4, 8);
        const barrelMaterial = new THREE.MeshPhongMaterial({
            color: 0x2a2a2a,
            emissive: 0x00ff00,
            emissiveIntensity: 0.2
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.set(0, 0, -0.3);
        group.add(barrel);

        const energyGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const energyMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.8
        });
        const energy = new THREE.Mesh(energyGeometry, energyMaterial);
        energy.position.set(0, 0, -0.5);
        group.add(energy);

        const handleGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.08);
        const handleMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(0, -0.15, 0.1);
        group.add(handle);
    }

    createMuzzleFlash() {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: this.properties.muzzleFlashColor || 0xffff00,
            transparent: true,
            opacity: 0
        });

        this.muzzleFlash = new THREE.Mesh(geometry, material);
        this.muzzleFlash.scale.set(
            this.properties.muzzleFlashSize,
            this.properties.muzzleFlashSize,
            this.properties.muzzleFlashSize * 2
        );

        this.flashLight = new THREE.PointLight(this.properties.muzzleFlashColor || 0xffff00, 0, 5);

        if (this.mesh) {
            this.mesh.add(this.muzzleFlash);
            this.mesh.add(this.flashLight);

            const flashOffset = this.getMuzzleOffset();
            this.muzzleFlash.position.copy(flashOffset);
            this.flashLight.position.copy(flashOffset);
        }
    }

    getMuzzleOffset() {
        const offsets = {
            [WeaponType.FIST]: new THREE.Vector3(0, -0.4, 0),
            [WeaponType.PISTOL]: new THREE.Vector3(0, 0.05, -0.35),
            [WeaponType.SHOTGUN]: new THREE.Vector3(0, 0, -0.65),
            [WeaponType.CHAINGUN]: new THREE.Vector3(0, 0, -0.5),
            [WeaponType.ROCKET_LAUNCHER]: new THREE.Vector3(0, 0, -0.6),
            [WeaponType.PLASMA_GUN]: new THREE.Vector3(0, 0, -0.45),
            [WeaponType.BFG9000]: new THREE.Vector3(0, 0, -0.5)
        };

        return offsets[this.type] || new THREE.Vector3(0, 0, -0.5);
    }

    canShoot() {
        const currentTime = Date.now() / 1000;
        const timeSinceLastShot = currentTime - this.lastShotTime;

        if (this.switching) return false;
        if (this.reloading) return false;
        if (timeSinceLastShot < this.fireRate) return false;

        if (!this.properties.infiniteAmmo) {
            const ammoPerShot = this.properties.ammoPerShot || 1;
            if (this.ammo < ammoPerShot) return false;
        }

        return true;
    }

    shoot() {
        if (!this.canShoot()) return false;

        this.lastShotTime = Date.now() / 1000;

        if (!this.properties.infiniteAmmo) {
            const ammoPerShot = this.properties.ammoPerShot || 1;
            this.ammo -= ammoPerShot;
        }

        this.recoilAmount = this.properties.recoil || this.maxRecoil;
        this.triggerMuzzleFlash();

        return true;
    }

    triggerMuzzleFlash() {
        if (!this.muzzleFlash || this.properties.muzzleFlashSize === 0) return;

        this.muzzleFlash.material.opacity = 1;
        this.flashLight.intensity = 2;

        const duration = this.properties.muzzleFlashDuration * 1000;

        setTimeout(() => {
            this.muzzleFlash.material.opacity = 0;
            this.flashLight.intensity = 0;
        }, duration);
    }

    reload() {
        if (this.reloading || this.ammo === this.maxAmmo || this.properties.infiniteAmmo) return;

        this.reloading = true;

        setTimeout(() => {
            this.reloading = false;
        }, this.reloadTime * 1000);
    }

    switchTo() {
        this.switching = true;
        this.switchTime = this.properties.switchTime || 0.5;

        if (this.mesh) {
            this.mesh.position.y = -1;
        }

        setTimeout(() => {
            this.switching = false;
        }, this.switchTime * 1000);
    }

    update(deltaTime, isMoving = false, moveSpeed = 0) {
        if (!this.mesh) return;

        if (this.switching) {
            const switchProgress = 1 - this.switchTime / (this.properties.switchTime || 0.5);
            this.mesh.position.y = this.position.y - 1 + switchProgress;
        } else {
            if (this.recoilAmount > 0) {
                this.recoilAmount -= this.recoilRecovery * deltaTime;
                this.recoilAmount = Math.max(0, this.recoilAmount);
            }

            const recoilOffset = new THREE.Vector3(0, 0, this.recoilAmount);

            if (isMoving) {
                this.bobPhase += moveSpeed * this.bobSpeed * deltaTime;
                const bobX = Math.sin(this.bobPhase) * 0.02;
                const bobY = Math.abs(Math.cos(this.bobPhase * 2)) * 0.01;
                this.mesh.position.x = this.position.x + bobX;
                this.mesh.position.y = this.position.y + bobY;
            } else {
                this.mesh.position.x = this.position.x;
                this.mesh.position.y = this.position.y;
            }

            this.mesh.position.z = this.position.z + recoilOffset.z;

            if (this.type === WeaponType.CHAINGUN && this.properties.spinupTime) {
                const barrels = this.mesh.children.filter((child, index) => index > 0 && index < 7);
                barrels.forEach(barrel => {
                    if (this.lastShotTime > Date.now() / 1000 - 1) {
                        barrel.rotation.x += deltaTime * 20;
                    }
                });
            }
        }
    }

    addAmmo(amount) {
        this.ammo = Math.min(this.maxAmmo, this.ammo + amount);
    }

    getAmmoType() {
        return this.ammoType;
    }

    reset() {
        this.ammo = this.maxAmmo;
        this.reloading = false;
        this.switching = false;
        this.lastShotTime = 0;
        this.recoilAmount = 0;
    }

    dispose() {
        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
    }
}
