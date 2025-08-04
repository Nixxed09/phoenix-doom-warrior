import { Howl, Howler } from 'howler';

export class Audio {
    constructor() {
        // Volume settings
        this.masterVolume = 0.7;
        this.musicVolume = 0.5;
        this.soundVolume = 0.8;

        // Howler global settings
        Howler.volume(this.masterVolume);
        Howler.orientation(0, 0, -1, 0, 1, 0);

        // Sound libraries
        this.sounds = {};
        this.music = {};
        this.ambientSounds = {};

        // Music state
        this.currentMusic = null;
        this.musicState = 'calm'; // calm, combat, victory
        this.combatTimer = 0;

        // 3D audio settings
        this.listenerPosition = { x: 0, y: 0, z: 0 };
        this.listenerRotation = 0;

        // Reverb zones
        this.reverbZones = [];

        // Audio context for procedural sounds
        this.audioContext = null;
        this.initAudioContext();

        // Create all sounds
        this.createSounds();
        this.createMusic();
        this.createAmbientSounds();
    }

    initAudioContext() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();

            // Resume context on user interaction
            document.addEventListener(
                'click',
                () => {
                    if (this.audioContext.state === 'suspended') {
                        this.audioContext.resume();
                    }
                },
                { once: true }
            );
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    createSounds() {
        // Weapon sounds
        this.sounds.weapons = {
            // Pistol
            pistolFire: this.createProceduralSound(() => this.generateGunshot(200, 0.1)),
            pistolReload: this.createProceduralSound(() => this.generateReload(0.5)),

            // Shotgun
            shotgunFire: this.createProceduralSound(() => this.generateShotgun()),
            shotgunReload: this.createProceduralSound(() => this.generateReload(1.0)),
            shotgunPump: this.createProceduralSound(() => this.generatePump()),

            // Chaingun
            chaingunFire: this.createProceduralSound(() => this.generateGunshot(300, 0.05)),
            chaingunSpin: this.createProceduralSound(() => this.generateSpin()),

            // Rocket Launcher
            rocketFire: this.createProceduralSound(() => this.generateRocket()),
            rocketExplode: this.createProceduralSound(() => this.generateExplosion()),

            // Plasma Gun
            plasmaFire: this.createProceduralSound(() => this.generatePlasma()),
            plasmaCharge: this.createProceduralSound(() => this.generateCharge()),

            // BFG
            bfgCharge: this.createProceduralSound(() => this.generateBFGCharge()),
            bfgFire: this.createProceduralSound(() => this.generateBFGFire()),

            // Generic
            weaponSwitch: this.createProceduralSound(() => this.generateWeaponSwitch()),
            noAmmo: this.createProceduralSound(() => this.generateClick())
        };

        // Enemy sounds
        this.sounds.enemies = {
            // Zombie
            zombieIdle: this.createProceduralSound(() => this.generateMonsterGrowl(100)),
            zombieAlert: this.createProceduralSound(() => this.generateMonsterAlert(150)),
            zombieAttack: this.createProceduralSound(() => this.generateMeleeAttack()),
            zombiePain: this.createProceduralSound(() => this.generateMonsterPain(120)),
            zombieDeath: this.createProceduralSound(() => this.generateMonsterDeath(100)),

            // Imp
            impIdle: this.createProceduralSound(() => this.generateMonsterGrowl(300)),
            impAlert: this.createProceduralSound(() => this.generateMonsterAlert(400)),
            impFireball: this.createProceduralSound(() => this.generateFireball()),
            impPain: this.createProceduralSound(() => this.generateMonsterPain(350)),
            impDeath: this.createProceduralSound(() => this.generateMonsterDeath(300)),

            // Demon
            demonIdle: this.createProceduralSound(() => this.generateMonsterGrowl(50)),
            demonAlert: this.createProceduralSound(() => this.generateMonsterAlert(80)),
            demonBite: this.createProceduralSound(() => this.generateBite()),
            demonPain: this.createProceduralSound(() => this.generateMonsterPain(60)),
            demonDeath: this.createProceduralSound(() => this.generateMonsterDeath(50)),

            // Cacodemon
            cacoIdle: this.createProceduralSound(() => this.generateFloatingMonster(200)),
            cacoAlert: this.createProceduralSound(() => this.generateMonsterAlert(250)),
            cacoLightning: this.createProceduralSound(() => this.generateLightning()),
            cacoPain: this.createProceduralSound(() => this.generateMonsterPain(200)),
            cacoDeath: this.createProceduralSound(() => this.generateMonsterDeath(180)),

            // Hell Knight
            knightIdle: this.createProceduralSound(() => this.generateMonsterGrowl(80)),
            knightAlert: this.createProceduralSound(() => this.generateMonsterAlert(100)),
            knightPlasma: this.createProceduralSound(() => this.generateEnemyPlasma()),
            knightPain: this.createProceduralSound(() => this.generateMonsterPain(90)),
            knightDeath: this.createProceduralSound(() => this.generateMonsterDeath(70))
        };

        // Player sounds
        this.sounds.player = {
            hurt: this.createProceduralSound(() => this.generatePlayerHurt()),
            death: this.createProceduralSound(() => this.generatePlayerDeath()),
            jump: this.createProceduralSound(() => this.generateJump()),
            land: this.createProceduralSound(() => this.generateLand()),
            footstep: this.createProceduralSound(() => this.generateFootstep()),
            footstepMetal: this.createProceduralSound(() => this.generateFootstepMetal())
        };

        // UI sounds
        this.sounds.ui = {
            menuSelect: this.createProceduralSound(() => this.generateMenuSelect()),
            menuMove: this.createProceduralSound(() => this.generateMenuMove()),
            menuBack: this.createProceduralSound(() => this.generateMenuBack()),
            pickup: this.createProceduralSound(() => this.generatePickup()),
            healthPickup: this.createProceduralSound(() => this.generateHealthPickup()),
            armorPickup: this.createProceduralSound(() => this.generateArmorPickup()),
            ammoPickup: this.createProceduralSound(() => this.generateAmmoPickup()),
            weaponPickup: this.createProceduralSound(() => this.generateWeaponPickup()),
            keyPickup: this.createProceduralSound(() => this.generateKeyPickup()),
            secretFound: this.createProceduralSound(() => this.generateSecret())
        };

        // Environmental sounds
        this.sounds.environment = {
            doorOpen: this.createProceduralSound(() => this.generateDoorOpen()),
            doorClose: this.createProceduralSound(() => this.generateDoorClose()),
            elevatorStart: this.createProceduralSound(() => this.generateElevatorStart()),
            elevatorStop: this.createProceduralSound(() => this.generateElevatorStop()),
            teleport: this.createProceduralSound(() => this.generateTeleport()),
            explosion: this.createProceduralSound(() => this.generateExplosion()),
            barrelExplode: this.createProceduralSound(() => this.generateBarrelExplosion())
        };
    }

    createMusic() {
        // Dynamic music tracks
        this.music.menu = this.createProceduralMusic('menu');
        this.music.calm = this.createProceduralMusic('calm');
        this.music.combat = this.createProceduralMusic('combat');
        this.music.victory = this.createProceduralMusic('victory');
        this.music.boss = this.createProceduralMusic('boss');
    }

    createAmbientSounds() {
        // Ambient environmental sounds
        this.ambientSounds.machinery = this.createLoopingSound(() => this.generateMachinery());
        this.ambientSounds.wind = this.createLoopingSound(() => this.generateWind());
        this.ambientSounds.lava = this.createLoopingSound(() => this.generateLava());
        this.ambientSounds.water = this.createLoopingSound(() => this.generateWater());
        this.ambientSounds.electricity = this.createLoopingSound(() => this.generateElectricity());
    }

    // Helper to create procedural sound with Howler
    createProceduralSound(generator) {
        if (!this.audioContext) return null;

        return () => {
            const audioData = generator();
            if (!audioData) return null;

            // Convert procedural audio to base64 data URL
            const wav = this.audioBufferToWav(audioData.buffer);
            const blob = new Blob([wav], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);

            const sound = new Howl({
                src: [url],
                volume: audioData.volume || 1.0,
                rate: audioData.rate || 1.0
            });

            // Clean up URL after loading
            sound.once('load', () => URL.revokeObjectURL(url));

            return sound;
        };
    }

    createLoopingSound(generator) {
        const soundGen = this.createProceduralSound(generator);
        return () => {
            const sound = soundGen();
            if (sound) {
                sound.loop(true);
            }
            return sound;
        };
    }

    createProceduralMusic(type) {
        // Create longer procedural music tracks
        return () => {
            const sound = new Howl({
                src: [''], // Placeholder - would generate procedural music
                volume: this.musicVolume,
                loop: true,
                html5: true
            });
            return sound;
        };
    }

    // Audio buffer to WAV converter
    audioBufferToWav(buffer) {
        const length = buffer.length * buffer.numberOfChannels * 2 + 44;
        const arrayBuffer = new ArrayBuffer(length);
        const view = new DataView(arrayBuffer);
        const channels = [];
        let offset = 0;
        let pos = 0;

        // Write WAV header
        const setUint16 = data => {
            view.setUint16(pos, data, true);
            pos += 2;
        };

        const setUint32 = data => {
            view.setUint32(pos, data, true);
            pos += 4;
        };

        // RIFF chunk descriptor
        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8);
        setUint32(0x45564157); // "WAVE"

        // FMT sub-chunk
        setUint32(0x20746d66); // "fmt "
        setUint32(16);
        setUint16(1); // PCM
        setUint16(buffer.numberOfChannels);
        setUint32(buffer.sampleRate);
        setUint32(buffer.sampleRate * buffer.numberOfChannels * 2);
        setUint16(buffer.numberOfChannels * 2);
        setUint16(16);

        // Data sub-chunk
        setUint32(0x61746164); // "data"
        setUint32(length - pos - 4);

        // Write interleaved PCM samples
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        while (pos < length) {
            for (let i = 0; i < buffer.numberOfChannels; i++) {
                const sample = Math.max(-1, Math.min(1, channels[i][offset]));
                view.setInt16(pos, sample * 0x7fff, true);
                pos += 2;
            }
            offset++;
        }

        return arrayBuffer;
    }

    // Procedural sound generators
    generateGunshot(frequency, duration) {
        if (!this.audioContext) return null;

        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 10);
            const freq = frequency * Math.exp(-t * 5);
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope;
            data[i] += (Math.random() - 0.5) * 0.3 * envelope;
        }

        return { buffer, volume: 0.8 };
    }

    generateShotgun() {
        if (!this.audioContext) return null;

        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        // Multiple frequency components
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 8);

            data[i] = 0;
            // Add multiple frequency components
            for (let f = 0; f < 5; f++) {
                const freq = 100 + f * 50;
                data[i] += Math.sin(2 * Math.PI * freq * t) * envelope * 0.2;
            }

            // Add heavy noise
            data[i] += (Math.random() - 0.5) * envelope * 0.8;
        }

        return { buffer, volume: 1.0 };
    }

    generateRocket() {
        if (!this.audioContext) return null;

        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = t < 0.1 ? t * 10 : 1;
            const freq = 50 + t * 100;

            // Whoosh sound
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
            // Add white noise
            data[i] += (Math.random() - 0.5) * envelope * 0.3;
        }

        return { buffer, volume: 0.9 };
    }

    generatePlasma() {
        if (!this.audioContext) return null;

        const duration = 0.2;
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 5);
            const freq1 = 2000 * Math.exp(-t * 2);
            const freq2 = 2100 * Math.exp(-t * 2);

            // Two oscillators slightly detuned
            data[i] = Math.sin(2 * Math.PI * freq1 * t) * envelope * 0.5;
            data[i] += Math.sin(2 * Math.PI * freq2 * t) * envelope * 0.5;
        }

        return { buffer, volume: 0.7 };
    }

    generateExplosion() {
        if (!this.audioContext) return null;

        const duration = 1.0;
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;

            // Initial impact
            if (t < 0.1) {
                data[i] = (Math.random() - 0.5) * (1 - t * 10);
            }
            // Rumble
            else {
                const envelope = Math.exp(-(t - 0.1) * 2);
                const freq = 40 * Math.exp(-(t - 0.1) * 0.5);
                data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
                data[i] += (Math.random() - 0.5) * envelope * 0.2;
            }
        }

        return { buffer, volume: 1.0 };
    }

    // More sound generators...
    generateMonsterGrowl(baseFreq) {
        if (!this.audioContext) return null;

        const duration = 1.0;
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.sin((Math.PI * t) / duration);
            const freq = baseFreq + Math.sin(t * 5) * 20;

            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
            data[i] += Math.sin(2 * Math.PI * freq * 2 * t) * envelope * 0.1;
        }

        return { buffer, volume: 0.6 };
    }

    generateFootstep() {
        if (!this.audioContext) return null;

        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 30);

            // Low thud
            data[i] = Math.sin(2 * Math.PI * 60 * t) * envelope * 0.5;
            // Add some noise
            data[i] += (Math.random() - 0.5) * envelope * 0.2;
        }

        return { buffer, volume: 0.3 };
    }

    // Placeholder generators for remaining sounds
    generateReload(duration) {
        return this.generateClick();
    }
    generatePump() {
        return this.generateClick();
    }
    generateSpin() {
        return this.generateMonsterGrowl(200);
    }
    generateCharge() {
        return this.generatePlasma();
    }
    generateBFGCharge() {
        return this.generatePlasma();
    }
    generateBFGFire() {
        return this.generateExplosion();
    }
    generateWeaponSwitch() {
        return this.generateClick();
    }
    generateClick() {
        return this.generateFootstep();
    }
    generateMonsterAlert(freq) {
        return this.generateMonsterGrowl(freq * 1.5);
    }
    generateMeleeAttack() {
        return this.generateMonsterGrowl(80);
    }
    generateMonsterPain(freq) {
        return this.generateMonsterGrowl(freq * 1.2);
    }
    generateMonsterDeath(freq) {
        return this.generateMonsterGrowl(freq * 0.5);
    }
    generateFireball() {
        return this.generatePlasma();
    }
    generateBite() {
        return this.generateMonsterGrowl(60);
    }
    generateFloatingMonster(freq) {
        return this.generateMonsterGrowl(freq);
    }
    generateLightning() {
        return this.generatePlasma();
    }
    generateEnemyPlasma() {
        return this.generatePlasma();
    }
    generatePlayerHurt() {
        return this.generateMonsterGrowl(150);
    }
    generatePlayerDeath() {
        return this.generateMonsterGrowl(100);
    }
    generateJump() {
        return this.generateFootstep();
    }
    generateLand() {
        return this.generateFootstep();
    }
    generateFootstepMetal() {
        return this.generateFootstep();
    }
    generateMenuSelect() {
        return this.generateClick();
    }
    generateMenuMove() {
        return this.generateClick();
    }
    generateMenuBack() {
        return this.generateClick();
    }
    generatePickup() {
        return this.generateClick();
    }
    generateHealthPickup() {
        return this.generatePickup();
    }
    generateArmorPickup() {
        return this.generatePickup();
    }
    generateAmmoPickup() {
        return this.generatePickup();
    }
    generateWeaponPickup() {
        return this.generatePickup();
    }
    generateKeyPickup() {
        return this.generatePickup();
    }
    generateSecret() {
        return this.generatePickup();
    }
    generateDoorOpen() {
        return this.generateMonsterGrowl(50);
    }
    generateDoorClose() {
        return this.generateMonsterGrowl(60);
    }
    generateElevatorStart() {
        return this.generateMonsterGrowl(40);
    }
    generateElevatorStop() {
        return this.generateMonsterGrowl(30);
    }
    generateTeleport() {
        return this.generatePlasma();
    }
    generateBarrelExplosion() {
        return this.generateExplosion();
    }
    generateMachinery() {
        return this.generateMonsterGrowl(30);
    }
    generateWind() {
        return this.generateMonsterGrowl(100);
    }
    generateLava() {
        return this.generateMonsterGrowl(20);
    }
    generateWater() {
        return this.generateMonsterGrowl(200);
    }
    generateElectricity() {
        return this.generatePlasma();
    }

    // 3D Audio playback methods
    play3D(soundCategory, soundName, position, options = {}) {
        const soundGen = this.sounds[soundCategory]?.[soundName];
        if (!soundGen) {
            console.warn(`Sound not found: ${soundCategory}.${soundName}`);
            return null;
        }

        const sound = soundGen();
        if (!sound) return null;

        // Calculate distance and direction
        const dx = position.x - this.listenerPosition.x;
        const dy = position.y - this.listenerPosition.y;
        const dz = position.z - this.listenerPosition.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Distance attenuation
        const maxDistance = options.maxDistance || 50;
        const refDistance = options.refDistance || 1;
        const rolloff = options.rolloff || 1;

        if (distance > maxDistance) return null;

        const attenuation = Math.pow(
            Math.max(refDistance, Math.min(distance, maxDistance)) / refDistance,
            -rolloff
        );

        // Calculate stereo pan
        const angle = Math.atan2(dx, dz) - this.listenerRotation;
        const pan = Math.sin(angle);

        // Apply 3D positioning
        sound.volume(attenuation * this.soundVolume * (options.volume || 1.0));
        sound.stereo(pan);

        // Apply reverb if in reverb zone
        if (options.reverb || this.isInReverbZone(position)) {
            // Would apply reverb effect here
        }

        sound.play();
        return sound;
    }

    play2D(soundCategory, soundName, options = {}) {
        const soundGen = this.sounds[soundCategory]?.[soundName];
        if (!soundGen) {
            console.warn(`Sound not found: ${soundCategory}.${soundName}`);
            return null;
        }

        const sound = soundGen();
        if (!sound) return null;

        sound.volume(this.soundVolume * (options.volume || 1.0));
        sound.play();
        return sound;
    }

    playMusic(trackName) {
        // Stop current music
        if (this.currentMusic) {
            this.currentMusic.fade(this.currentMusic.volume(), 0, 1000);
            this.currentMusic.once('fade', () => {
                this.currentMusic.stop();
                this.currentMusic = null;
            });
        }

        // Start new music
        const musicGen = this.music[trackName];
        if (!musicGen) return;

        const music = musicGen();
        if (!music) return;

        music.volume(0);
        music.play();
        music.fade(0, this.musicVolume, 1000);

        this.currentMusic = music;
        this.musicState = trackName;
    }

    updateMusicState(inCombat) {
        if (inCombat && this.musicState !== 'combat') {
            this.playMusic('combat');
            this.combatTimer = 5.0; // Keep combat music for 5 seconds after combat ends
        } else if (!inCombat && this.combatTimer <= 0 && this.musicState !== 'calm') {
            this.playMusic('calm');
        }
    }

    update(deltaTime) {
        // Update combat timer
        if (this.combatTimer > 0) {
            this.combatTimer -= deltaTime;
        }
    }

    updateListener(position, rotation) {
        this.listenerPosition = position;
        this.listenerRotation = rotation;

        // Update Howler listener
        Howler.pos(position.x, position.y, position.z);
        Howler.orientation(Math.sin(rotation), 0, Math.cos(rotation), 0, 1, 0);
    }

    addReverbZone(position, radius, intensity = 0.5) {
        this.reverbZones.push({ position, radius, intensity });
    }

    isInReverbZone(position) {
        for (const zone of this.reverbZones) {
            const dx = position.x - zone.position.x;
            const dy = position.y - zone.position.y;
            const dz = position.z - zone.position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < zone.radius) {
                return true;
            }
        }
        return false;
    }

    // Volume controls
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        Howler.volume(this.masterVolume);
    }

    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.volume(this.musicVolume);
        }
    }

    cleanup() {
        // Stop all sounds
        Howler.unload();

        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}
