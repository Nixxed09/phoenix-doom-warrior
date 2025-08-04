import { QualityPreset } from './Performance.js';

export class QualitySettings {
    constructor(ui, performanceOptimizer) {
        this.ui = ui;
        this.optimizer = performanceOptimizer;

        this.createQualityMenu();
    }

    createQualityMenu() {
        const videoMenu = document.getElementById('video-menu');
        if (!videoMenu) return;

        // Clear existing content
        videoMenu.innerHTML = '<h1>VIDEO SETTINGS</h1>';

        // Quality presets
        const presetSection = document.createElement('div');
        presetSection.className = 'menu-section';
        presetSection.innerHTML = `
            <h2>QUALITY PRESET</h2>
            <select id="quality-preset" class="menu-select">
                <option value="low">LOW</option>
                <option value="medium">MEDIUM</option>
                <option value="high" selected>HIGH</option>
                <option value="ultra">ULTRA</option>
                <option value="custom">CUSTOM</option>
            </select>
        `;
        videoMenu.appendChild(presetSection);

        // Individual settings
        const settingsSection = document.createElement('div');
        settingsSection.className = 'menu-section';
        settingsSection.id = 'custom-settings';
        settingsSection.innerHTML = `
            <h2>CUSTOM SETTINGS</h2>
            
            <div class="setting-row">
                <label>Resolution Scale</label>
                <input type="range" id="resolution-scale" min="0.5" max="2" step="0.1" value="1">
                <span id="resolution-scale-value">100%</span>
            </div>
            
            <div class="setting-row">
                <label>Shadows</label>
                <select id="shadows">
                    <option value="off">OFF</option>
                    <option value="low">LOW (512)</option>
                    <option value="medium">MEDIUM (1024)</option>
                    <option value="high" selected>HIGH (2048)</option>
                    <option value="ultra">ULTRA (4096)</option>
                </select>
            </div>
            
            <div class="setting-row">
                <label>Anti-Aliasing</label>
                <input type="checkbox" id="antialiasing" checked>
            </div>
            
            <div class="setting-row">
                <label>Post-Processing</label>
                <input type="checkbox" id="post-processing" checked>
            </div>
            
            <div class="setting-row">
                <label>Bloom</label>
                <input type="checkbox" id="bloom" checked>
            </div>
            
            <div class="setting-row">
                <label>Motion Blur</label>
                <input type="checkbox" id="motion-blur">
            </div>
            
            <div class="setting-row">
                <label>Particles</label>
                <input type="checkbox" id="particles" checked>
            </div>
            
            <div class="setting-row">
                <label>Decals</label>
                <input type="checkbox" id="decals" checked>
            </div>
            
            <div class="setting-row">
                <label>Texture Quality</label>
                <select id="texture-quality">
                    <option value="0.5">LOW</option>
                    <option value="0.75">MEDIUM</option>
                    <option value="1" selected>HIGH</option>
                </select>
            </div>
            
            <div class="setting-row">
                <label>Max Dynamic Lights</label>
                <input type="range" id="max-lights" min="2" max="16" step="2" value="8">
                <span id="max-lights-value">8</span>
            </div>
            
            <div class="setting-row">
                <label>FPS Limit</label>
                <select id="fps-limit">
                    <option value="0">UNLIMITED</option>
                    <option value="30">30 FPS</option>
                    <option value="60" selected>60 FPS</option>
                    <option value="120">120 FPS</option>
                    <option value="144">144 FPS</option>
                    <option value="240">240 FPS</option>
                </select>
            </div>
        `;
        videoMenu.appendChild(settingsSection);

        // Performance stats
        const statsSection = document.createElement('div');
        statsSection.className = 'menu-section';
        statsSection.innerHTML = `
            <h2>PERFORMANCE</h2>
            <div id="performance-stats">
                <div>FPS: <span id="stat-fps">60</span></div>
                <div>Draw Calls: <span id="stat-drawcalls">0</span></div>
                <div>Triangles: <span id="stat-triangles">0</span></div>
                <div>Visible Objects: <span id="stat-visible">0</span></div>
            </div>
        `;
        videoMenu.appendChild(statsSection);

        // Buttons
        const buttonsSection = document.createElement('div');
        buttonsSection.className = 'menu-buttons';
        buttonsSection.innerHTML = `
            <button onclick="game.qualitySettings.applySettings()">APPLY</button>
            <button onclick="game.qualitySettings.detectOptimalSettings()">AUTO-DETECT</button>
            <button onclick="game.ui.showMenu('options')">BACK</button>
        `;
        videoMenu.appendChild(buttonsSection);

        // Add styles
        this.addStyles();

        // Setup event listeners
        this.setupEventListeners();

        // Update stats periodically
        setInterval(() => this.updateStats(), 1000);
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .menu-select {
                width: 100%;
                padding: 5px;
                background: #222;
                color: white;
                border: 1px solid #444;
                font-family: monospace;
                font-size: 14px;
                cursor: pointer;
            }
            
            .setting-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 10px 0;
                padding: 5px;
                background: rgba(255, 255, 255, 0.05);
            }
            
            .setting-row label {
                flex: 1;
                font-size: 14px;
            }
            
            .setting-row input[type="range"] {
                width: 150px;
                margin: 0 10px;
            }
            
            .setting-row input[type="checkbox"] {
                width: 20px;
                height: 20px;
                cursor: pointer;
            }
            
            .setting-row select {
                padding: 3px;
                background: #333;
                color: white;
                border: 1px solid #555;
                font-family: monospace;
                cursor: pointer;
            }
            
            #performance-stats {
                background: rgba(0, 0, 0, 0.5);
                padding: 10px;
                border: 1px solid #444;
                font-size: 12px;
                font-family: monospace;
            }
            
            #performance-stats div {
                margin: 5px 0;
            }
            
            #performance-stats span {
                color: #0ff;
                float: right;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Preset selector
        const presetSelect = document.getElementById('quality-preset');
        presetSelect.addEventListener('change', e => {
            if (e.target.value !== 'custom') {
                this.optimizer.applyPreset(e.target.value);
                this.updateUIFromSettings();
            }

            // Show/hide custom settings
            document.getElementById('custom-settings').style.opacity =
                e.target.value === 'custom' ? '1' : '0.5';
        });

        // Resolution scale
        const resScale = document.getElementById('resolution-scale');
        const resScaleValue = document.getElementById('resolution-scale-value');
        resScale.addEventListener('input', e => {
            resScaleValue.textContent = Math.round(e.target.value * 100) + '%';
            document.getElementById('quality-preset').value = 'custom';
        });

        // Max lights
        const maxLights = document.getElementById('max-lights');
        const maxLightsValue = document.getElementById('max-lights-value');
        maxLights.addEventListener('input', e => {
            maxLightsValue.textContent = e.target.value;
            document.getElementById('quality-preset').value = 'custom';
        });

        // Any other change sets to custom
        const inputs = document.querySelectorAll('#custom-settings input, #custom-settings select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                document.getElementById('quality-preset').value = 'custom';
            });
        });
    }

    updateUIFromSettings() {
        const settings = this.optimizer.settings;

        document.getElementById('resolution-scale').value = settings.resolutionScale;
        document.getElementById('resolution-scale-value').textContent =
            Math.round(settings.resolutionScale * 100) + '%';

        // Shadow quality
        let shadowValue = 'off';
        if (settings.shadows) {
            switch (settings.shadowMapSize) {
                case 512:
                    shadowValue = 'low';
                    break;
                case 1024:
                    shadowValue = 'medium';
                    break;
                case 2048:
                    shadowValue = 'high';
                    break;
                case 4096:
                    shadowValue = 'ultra';
                    break;
            }
        }
        document.getElementById('shadows').value = shadowValue;

        document.getElementById('antialiasing').checked = settings.antialiasing;
        document.getElementById('post-processing').checked = settings.postProcessing;
        document.getElementById('bloom').checked = settings.bloom;
        document.getElementById('motion-blur').checked = settings.motionBlur;
        document.getElementById('particles').checked = settings.particles;
        document.getElementById('decals').checked = settings.decals;
        document.getElementById('texture-quality').value = settings.textureQuality;
        document.getElementById('max-lights').value = settings.maxLights;
        document.getElementById('max-lights-value').textContent = settings.maxLights;
        document.getElementById('fps-limit').value = settings.fpsLimit;
    }

    applySettings() {
        const settings = {
            resolutionScale: parseFloat(document.getElementById('resolution-scale').value),
            shadows: document.getElementById('shadows').value !== 'off',
            shadowMapSize: this.getShadowMapSize(document.getElementById('shadows').value),
            antialiasing: document.getElementById('antialiasing').checked,
            postProcessing: document.getElementById('post-processing').checked,
            bloom: document.getElementById('bloom').checked,
            motionBlur: document.getElementById('motion-blur').checked,
            particles: document.getElementById('particles').checked,
            decals: document.getElementById('decals').checked,
            textureQuality: parseFloat(document.getElementById('texture-quality').value),
            maxLights: parseInt(document.getElementById('max-lights').value),
            fpsLimit: parseInt(document.getElementById('fps-limit').value),
            lodBias: 0 // Calculate based on other settings
        };

        // Update optimizer settings
        this.optimizer.settings = settings;
        this.optimizer.currentPreset = QualityPreset.CUSTOM;
        this.optimizer.applySettings();

        // Save to localStorage
        localStorage.setItem('qualitySettings', JSON.stringify(settings));

        this.ui.showMessage('Settings applied', 2000, '#00ff00');
    }

    getShadowMapSize(value) {
        switch (value) {
            case 'low':
                return 512;
            case 'medium':
                return 1024;
            case 'high':
                return 2048;
            case 'ultra':
                return 4096;
            default:
                return 1024;
        }
    }

    detectOptimalSettings() {
        // Simple auto-detection based on current performance
        const stats = this.optimizer.getStats();

        let preset = QualityPreset.HIGH;

        if (stats.fps < 30) {
            preset = QualityPreset.LOW;
        } else if (stats.fps < 45) {
            preset = QualityPreset.MEDIUM;
        } else if (stats.fps > 100 && stats.drawCalls < 100) {
            preset = QualityPreset.ULTRA;
        }

        this.optimizer.applyPreset(preset);
        document.getElementById('quality-preset').value = preset;
        this.updateUIFromSettings();

        this.ui.showMessage(`Recommended: ${preset.toUpperCase()} quality`, 3000, '#00ff00');
    }

    updateStats() {
        if (document.getElementById('video-menu').style.display === 'none') return;

        const stats = this.optimizer.getStats();
        document.getElementById('stat-fps').textContent = Math.round(stats.fps);
        document.getElementById('stat-drawcalls').textContent = stats.drawCalls;
        document.getElementById('stat-triangles').textContent = stats.triangles.toLocaleString();
        document.getElementById('stat-visible').textContent = stats.visibleObjects;
    }

    loadSettings() {
        const saved = localStorage.getItem('qualitySettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.optimizer.settings = settings;
                this.optimizer.currentPreset = QualityPreset.CUSTOM;
                this.optimizer.applySettings();
                document.getElementById('quality-preset').value = 'custom';
                this.updateUIFromSettings();
            } catch (e) {
                console.error('Failed to load quality settings:', e);
            }
        }
    }
}
