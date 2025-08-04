import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { Level } from './Level.js';
import { UI } from './UI.js';
import { Audio } from './Audio.js';
import { Weapon } from './Weapon.js';

export const GameState = {
    MENU: 'MENU',
    LOADING: 'LOADING',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
    VICTORY: 'VICTORY'
};

export class Game {
    constructor() {
        this.state = GameState.LOADING;
        this.previousState = null;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        this.player = null;
        this.enemies = [];
        this.level = null;
        this.ui = null;
        this.audio = null;

        this.currentLevel = 1;
        this.maxLevel = 5;
        this.score = 0;
        this.highScore = 0;

        this.assets = {
            textures: {},
            models: {},
            sounds: {},
            loaded: 0,
            total: 0
        };

        this.performance = {
            fps: 60,
            frameTime: 0,
            lastTime: 0,
            frames: 0,
            lastFpsUpdate: 0
        };

        this.settings = {
            graphics: 'high',
            soundVolume: 0.7,
            musicVolume: 0.5,
            mouseSensitivity: 1.0,
            fov: 75
        };

        this.deltaTime = 0;
        this.accumulator = 0;
        this.fixedTimeStep = 1 / 60;
        this.maxAccumulator = 0.2;
    }

    async init() {
        console.log('Game init started...');
        console.log('Loading settings...');
        this.loadSettings();
        console.log('Setting up renderer...');
        this.setupRenderer();
        console.log('Setting up scene...');
        this.setupScene();
        this.setupLighting();
        this.setupSkybox();
        console.log('Creating UI...');
        this.ui = new UI(this);

        console.log('Loading assets...');
        await this.loadAssets();

        console.log('Creating player...');
        this.player = new Player(this.camera, this.scene);
        console.log('Creating level...');
        this.level = new Level(this.scene);
        this.audio = new Audio();

        this.audio.setMasterVolume(this.settings.soundVolume);
        this.audio.setMusicVolume(this.settings.musicVolume);

        this.setupEventListeners();

        console.log('Starting new game...');
        // Skip menu and start game immediately
        this.startNewGame();

        console.log('Starting game loop...');
        this.gameLoop();
        console.log('Game init completed!');
    }

    setupRenderer() {
        const canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: this.settings.graphics !== 'low',
            powerPreference: 'high-performance'
        });

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = this.settings.graphics !== 'low';
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        this.camera = new THREE.PerspectiveCamera(
            this.settings.fov,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.02);

        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
    }

    setupLighting() {
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = this.settings.graphics !== 'low';
        directionalLight.shadow.camera.left = -30;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.top = 30;
        directionalLight.shadow.camera.bottom = -30;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.mapSize.width = this.settings.graphics === 'high' ? 4096 : 2048;
        directionalLight.shadow.mapSize.height = this.settings.graphics === 'high' ? 4096 : 2048;
        directionalLight.shadow.bias = -0.0005;
        this.scene.add(directionalLight);

        const hemiLight = new THREE.HemisphereLight(0x8888ff, 0x442222, 0.2);
        this.scene.add(hemiLight);
    }

    setupSkybox() {
        const loader = new THREE.CubeTextureLoader();
        const textureCube = this.createProceduralSkybox();
        this.scene.background = textureCube;
    }

    createProceduralSkybox() {
        const size = 512;
        const data = new Uint8Array(size * size * 3);

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const idx = (i * size + j) * 3;
                const y = i / size;

                const r = Math.floor(10 + y * 20);
                const g = Math.floor(5 + y * 10);
                const b = Math.floor(20 + y * 30);

                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
            }
        }

        const texture = new THREE.DataTexture(data, size, size, THREE.RGBFormat);
        texture.needsUpdate = true;

        const materials = [];
        for (let i = 0; i < 6; i++) {
            materials.push(
                new THREE.MeshBasicMaterial({
                    map: texture.clone(),
                    side: THREE.BackSide
                })
            );
        }

        const skyboxGeo = new THREE.BoxGeometry(1000, 1000, 1000);
        const skybox = new THREE.Mesh(skyboxGeo, materials);
        this.scene.add(skybox);

        return null;
    }

    async loadAssets() {
        this.ui.showLoadingProgress(0);
        
        // Create fallback textures immediately
        this.assets.textures = {
            wall: this.createFallbackTexture('wall'),
            floor: this.createFallbackTexture('floor'),
            ceiling: this.createFallbackTexture('ceiling')
        };
        
        this.assets.models = {
            enemy: null,
            weapon_pistol: null
        };
        
        this.ui.showLoadingProgress(1);
        this.ui.hideLoading();
    }

    createFallbackTexture(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        switch (type) {
            case 'wall':
                ctx.fillStyle = '#444';
                ctx.fillRect(0, 0, 256, 256);
                ctx.strokeStyle = '#333';
                for (let i = 0; i < 8; i++) {
                    ctx.beginPath();
                    ctx.moveTo(0, i * 32);
                    ctx.lineTo(256, i * 32);
                    ctx.stroke();
                }
                break;
            case 'floor':
                ctx.fillStyle = '#222';
                ctx.fillRect(0, 0, 256, 256);
                break;
            case 'ceiling':
                ctx.fillStyle = '#111';
                ctx.fillRect(0, 0, 256, 256);
                break;
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                if (this.state === GameState.PLAYING) {
                    this.setState(GameState.PAUSED);
                } else if (this.state === GameState.PAUSED) {
                    this.setState(GameState.PLAYING);
                }
            }

            if (e.key === 'F1') {
                this.ui.toggleDebugInfo();
            }

            if (this.state === GameState.PLAYING) {
                switch (e.key.toLowerCase()) {
                    case 'g':
                        this.player.godMode = !this.player.godMode;
                        this.ui.showMessage(`God Mode: ${this.player.godMode ? 'ON' : 'OFF'}`);
                        break;
                    case 'v':
                        this.player.noclip = !this.player.noclip;
                        this.ui.showMessage(`Noclip: ${this.player.noclip ? 'ON' : 'OFF'}`);
                        break;
                    case 'b':
                        this.player.giveAllWeapons();
                        this.ui.showMessage('All weapons given!');
                        break;
                    case 'n':
                        this.spawnEnemyAtCrosshair();
                        break;
                }
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state === GameState.PLAYING) {
                this.setState(GameState.PAUSED);
            }
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setState(newState) {
        this.previousState = this.state;
        this.state = newState;

        switch (newState) {
            case GameState.MENU:
                this.ui.showMenu();
                this.player?.disable();
                break;

            case GameState.PLAYING:
                this.ui.hideMenu();
                this.ui.showHUD();
                this.player.enable();
                if (this.previousState === GameState.MENU) {
                    this.startNewGame();
                }
                break;

            case GameState.PAUSED:
                this.ui.showMenu(true);
                this.player.disable();
                break;

            case GameState.GAME_OVER:
                this.ui.showGameOver();
                this.player.disable();
                this.saveHighScore();
                break;

            case GameState.VICTORY:
                this.ui.showVictory();
                this.player.disable();
                this.saveHighScore();
                break;
        }
    }

    startNewGame() {
        this.currentLevel = 1;
        this.score = 0;
        this.player.reset();
        this.player.giveAllWeapons();
        this.player.health = 100;
        this.player.armor = 100;
        this.player.godMode = true; // Start with god mode enabled
        this.player.noclip = false;
        this.loadLevel(this.currentLevel);
        this.audio.playMusic('ambient');
        this.setState(GameState.PLAYING);
    }

    spawnEnemyAtCrosshair() {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

        const intersects = raycaster.intersectObjects(
            [...this.level.geometry.floors, ...this.level.geometry.walls],
            false
        );

        if (intersects.length > 0) {
            const spawnPoint = intersects[0].point.clone();
            spawnPoint.y += 1;

            const enemyTypes = ['zombie', 'imp', 'demon', 'cacodemon', 'hell_knight'];
            const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

            const enemy = new Enemy(randomType, spawnPoint, this.scene);
            this.enemies.push(enemy);

            this.ui.showMessage(`Spawned ${randomType} enemy!`);
        }
    }

    loadLevel(levelNumber) {
        this.clearLevel();
        this.level.loadLevel(levelNumber);
        this.spawnEnemies(levelNumber);
        this.player.setPosition(this.level.getSpawnPoint());
    }

    clearLevel() {
        this.enemies.forEach(enemy => enemy.remove());
        this.enemies = [];
    }

    spawnEnemies(levelNumber) {
        // Spawn exactly 5 enemies for testing
        const enemyCount = 5;
        const spawnRadius = 15;

        for (let i = 0; i < enemyCount; i++) {
            const angle = (i / enemyCount) * Math.PI * 2;
            const distance = 8 + Math.random() * spawnRadius;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;

            const enemy = new Enemy(this.scene, x, z);
            enemy.health = 50; // Fixed health for testing
            enemy.damage = 10; // Fixed damage for testing
            this.enemies.push(enemy);
        }
    }

    nextLevel() {
        this.currentLevel++;
        this.score += 1000;

        if (this.currentLevel > this.maxLevel) {
            this.setState(GameState.VICTORY);
        } else {
            this.loadLevel(this.currentLevel);
            this.ui.showMessage(`Level ${this.currentLevel}`, 3000);
        }
    }

    update(deltaTime) {
        if (this.state !== GameState.PLAYING) return;

        this.player.update(deltaTime);
        this.updateEnemies(deltaTime);
        this.checkCollisions();

        if (this.player.isShooting) {
            this.handleShooting();
            this.player.isShooting = false;
        }

        if (this.player.health <= 0) {
            this.setState(GameState.GAME_OVER);
        }

        if (this.enemies.length === 0) {
            this.nextLevel();
        }

        this.level.updatePickups(deltaTime);
    }

    updateEnemies(deltaTime) {
        const playerPos = this.player.getPosition();

        this.enemies = this.enemies.filter(enemy => {
            if (!enemy.isAlive()) {
                enemy.remove();
                this.score += 100;
                this.ui.updateScore(this.score);
                return false;
            }

            enemy.update(deltaTime, playerPos, this.level.walls);

            if (enemy.canSeePlayer(playerPos, this.level.walls)) {
                enemy.attack(playerPos);
            }

            return true;
        });
    }

    checkCollisions() {
        const playerPos = this.player.getPosition();
        const playerRadius = 0.5;

        this.level.walls.forEach(wall => {
            const wallBounds = new THREE.Box3().setFromObject(wall);
            const playerSphere = new THREE.Sphere(playerPos, playerRadius);

            if (wallBounds.intersectsSphere(playerSphere)) {
                const closestPoint = new THREE.Vector3();
                wallBounds.clampPoint(playerPos, closestPoint);
                const direction = playerPos.clone().sub(closestPoint).normalize();
                const distance = playerPos.distanceTo(closestPoint);

                if (distance < playerRadius) {
                    const pushDistance = playerRadius - distance;
                    playerPos.add(direction.multiplyScalar(pushDistance));
                    this.player.setPosition(playerPos);
                }
            }
        });

        this.enemies.forEach(enemy => {
            const distance = playerPos.distanceTo(enemy.getPosition());
            if (distance < 1.5) {
                const damage = enemy.getMeleeDamage();
                if (damage > 0) {
                    this.player.takeDamage(damage);
                    this.ui.updateHealth(this.player.health);
                    this.ui.flash('#ff0000', 200);
                    this.audio.playSound('hurt');
                }
            }
        });

        this.level.pickups = this.level.pickups.filter(pickup => {
            const distance = playerPos.distanceTo(pickup.position);
            if (distance < 1) {
                this.handlePickup(pickup);
                pickup.parent.remove(pickup);
                return false;
            }
            return true;
        });
    }

    handlePickup(pickup) {
        const type = pickup.userData.type;

        switch (type) {
            case 'health':
                this.player.heal(25);
                this.ui.updateHealth(this.player.health);
                this.audio.playSound('pickup');
                break;
            case 'armor':
                this.player.addArmor(25);
                this.ui.updateArmor(this.player.armor);
                this.audio.playSound('pickup');
                break;
            case 'ammo':
                this.player.addAmmo(this.player.currentWeapon.type, 20);
                this.ui.updateAmmo(this.player.getAmmo());
                this.audio.playSound('pickup');
                break;
        }
    }

    handleShooting() {
        if (!this.player.weapon.canShoot()) return;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

        const intersects = raycaster.intersectObjects([
            ...this.enemies.map(e => e.mesh),
            ...this.level.walls
        ]);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const enemy = this.enemies.find(e => e.mesh === hit.object);

            if (enemy) {
                enemy.takeDamage(this.player.weapon.damage);
                this.createBloodEffect(hit.point);

                if (!enemy.isAlive()) {
                    this.score += 100;
                    this.ui.updateScore(this.score);
                }
            } else {
                this.createBulletHole(hit.point, hit.face.normal);
            }
        }

        this.player.weapon.shoot();
        this.ui.updateAmmo(this.player.getAmmo());
        this.ui.updateWeapon(this.player.weapon.type);
        this.audio.playSound(this.player.weapon.type);
    }

    createBloodEffect(position) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const blood = new THREE.Mesh(geometry, material);
        blood.position.copy(position);
        this.scene.add(blood);

        const particles = [];
        for (let i = 0; i < 10; i++) {
            const particle = blood.clone();
            particle.scale.set(0.05, 0.05, 0.05);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
            this.scene.add(particle);
            particles.push(particle);
        }

        let time = 0;
        const animate = () => {
            time += 0.016;
            if (time > 1) {
                this.scene.remove(blood);
                particles.forEach(p => this.scene.remove(p));
                return;
            }

            particles.forEach(p => {
                p.position.add(p.velocity.clone().multiplyScalar(0.016));
                p.velocity.y -= 9.8 * 0.016;
                p.material.opacity = 1 - time;
            });

            requestAnimationFrame(animate);
        };
        animate();
    }

    createBulletHole(position, normal) {
        const geometry = new THREE.PlaneGeometry(0.2, 0.2);
        const material = new THREE.MeshBasicMaterial({
            color: 0x111111,
            side: THREE.DoubleSide
        });
        const bulletHole = new THREE.Mesh(geometry, material);
        bulletHole.position.copy(position);
        bulletHole.position.add(normal.multiplyScalar(0.01));
        bulletHole.lookAt(position.clone().add(normal));
        this.scene.add(bulletHole);

        setTimeout(() => {
            this.scene.remove(bulletHole);
        }, 30000);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    updatePerformance() {
        const now = performance.now();
        this.performance.frames++;

        if (now >= this.performance.lastFpsUpdate + 1000) {
            this.performance.fps = Math.round(
                (this.performance.frames * 1000) / (now - this.performance.lastFpsUpdate)
            );
            this.performance.lastFpsUpdate = now;
            this.performance.frames = 0;

            if (this.ui) {
                this.ui.updateFPS(this.performance.fps);
            }
        }
    }

    gameLoop(currentTime = 0) {
        requestAnimationFrame(time => this.gameLoop(time));

        this.deltaTime = Math.min(
            (currentTime - this.performance.lastTime) / 1000,
            this.maxAccumulator
        );
        this.performance.lastTime = currentTime;

        this.accumulator += this.deltaTime;

        while (this.accumulator >= this.fixedTimeStep) {
            this.update(this.fixedTimeStep);
            this.accumulator -= this.fixedTimeStep;
        }

        this.render();
        this.updatePerformance();
    }

    saveSettings() {
        localStorage.setItem('phoenixDoomSettings', JSON.stringify(this.settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('phoenixDoomSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('phoenixDoomHighScore', this.highScore.toString());
        }
    }

    loadHighScore() {
        const saved = localStorage.getItem('phoenixDoomHighScore');
        if (saved) {
            this.highScore = parseInt(saved) || 0;
        }
    }

    saveGame() {
        const saveData = {
            level: this.currentLevel,
            score: this.score,
            playerHealth: this.player.health,
            playerArmor: this.player.armor,
            playerAmmo: this.player.getAmmo(),
            timestamp: Date.now()
        };
        localStorage.setItem('phoenixDoomSave', JSON.stringify(saveData));
    }

    loadGame() {
        const saved = localStorage.getItem('phoenixDoomSave');
        if (saved) {
            const saveData = JSON.parse(saved);
            this.currentLevel = saveData.level;
            this.score = saveData.score;
            this.loadLevel(this.currentLevel);
            this.player.health = saveData.playerHealth;
            this.player.armor = saveData.playerArmor;
            this.setState(GameState.PLAYING);
            return true;
        }
        return false;
    }
}
