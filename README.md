# 🎮 Phoenix DOOM Warrior

<p align="center">
  <img src="public/icon-512.png" alt="Phoenix DOOM Warrior Logo" width="200"/>
</p>

<p align="center">
  <strong>A modern 3D DOOM-style first-person shooter built with Three.js</strong>
</p>

<p align="center">
  🌐 <strong>Live Demo:</strong> <a href="https://vercel.com/phoenixs-projects-b770c793/phoenix-doom-warrior/">Play Now on Vercel</a>
</p>

<p align="center">
  <a href="https://phoenix-doom-warrior.vercel.app">🎮 Play Now</a> •
  <a href="#features">Features</a> •
  <a href="#how-to-play">How to Play</a> •
  <a href="#development">Development</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" />
  <img src="https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white" />
</p>

## 📖 Description

Phoenix DOOM Warrior is a fast-paced first-person shooter that combines classic DOOM gameplay with modern web technologies. Built entirely with JavaScript and Three.js, it runs directly in your web browser with no downloads required.

Created by Phoenix (age 10) of NIX GAMES as a learning project that evolved into a full-featured game.

## ✨ Features

### 🎮 Core Gameplay
- **7 Weapons**: From fist to the mighty BFG 9000
- **5 Enemy Types**: Each with unique AI and attack patterns
- **Classic FPS Movement**: Fast-paced action with no reloading
- **Health & Armor System**: Classic pickup-based survival
- **Secret Areas**: Hidden rooms with bonus items

### 🌐 Multiplayer (P2P)
- **4 Game Modes**: Deathmatch, Team DM, CTF, Co-op
- **Up to 4 Players**: WebRTC peer-to-peer networking
- **Room Codes**: Easy game joining with 6-character codes
- **In-Game Chat**: Real-time text communication

### 🎨 Visual Effects
- **Dynamic Lighting**: Muzzle flashes illuminate the environment
- **Particle System**: Blood splatters, explosions, smoke
- **Post-Processing**: Bloom effects (quality setting dependent)
- **Screen Effects**: Camera shake, damage indicators

### 🔊 Audio System
- **3D Spatial Audio**: Directional sound with distance falloff
- **Dynamic Music**: Switches between calm and combat themes
- **Procedural Sound**: All sounds generated in real-time
- **Reverb Zones**: Echo effects in large spaces

### ⚡ Performance
- **Quality Presets**: Low, Medium, High, Ultra settings
- **LOD System**: Level-of-detail for complex objects
- **Frustum Culling**: Only renders visible objects
- **Object Pooling**: Efficient memory management
- **60 FPS Target**: Optimized for smooth gameplay

### 📱 Platform Support
- **Desktop**: Full keyboard + mouse controls
- **Mobile**: Touch controls with virtual joystick
- **PWA**: Install as app, play offline
- **Cross-Browser**: Chrome, Firefox, Safari, Edge

## 🎮 How to Play

### Controls

#### Keyboard (Desktop)
- **WASD** - Move
- **Mouse** - Look around
- **Left Click** - Shoot
- **Shift** - Sprint
- **Space** - Jump
- **Ctrl/C** - Crouch
- **E** - Interact/Use
- **1-7** - Switch weapons
- **Tab** - Toggle minimap
- **T** - Chat (multiplayer)
- **Esc** - Pause menu

#### Touch (Mobile)
- **Left Joystick** - Move
- **Right Screen** - Look around
- **Fire Button** - Shoot
- **Jump Button** - Jump

### Game Modes

#### Single Player
Start a new game and fight through waves of demons to reach the exit of each level.

#### Multiplayer
1. **Create Room**: Select game mode and share the room code
2. **Join Room**: Enter a 6-character room code
3. **Game Modes**:
   - **Deathmatch**: Free-for-all combat
   - **Team Deathmatch**: Red vs Blue teams
   - **Capture the Flag**: Capture enemy flag 3 times to win
   - **Co-op Campaign**: Play story mode together

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Modern web browser with WebGL support

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/phoenix-doom-warrior.git
cd phoenix-doom-warrior

# Install dependencies
npm install

# Generate PWA icons (optional)
npm run generate-icons

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run deploy       # Deploy to Vercel
npm run analyze      # Analyze bundle size
npm run lint         # Lint code
npm run format       # Format code with Prettier
```

### Project Structure

```
phoenix-doom-warrior/
├── src/
│   ├── main.js              # Entry point
│   ├── Game.js              # Core game engine
│   ├── Player.js            # Player controller
│   ├── Enemy.js             # Enemy AI system
│   ├── Weapon.js            # Weapon mechanics
│   ├── Level.js             # Level loader
│   ├── UI.js                # HUD and menus
│   ├── Audio.js             # Sound system
│   ├── Multiplayer.js       # P2P networking
│   ├── Performance.js       # Optimization system
│   ├── ParticleSystem.js    # Visual effects
│   └── QualitySettings.js   # Graphics options
├── public/
│   ├── sw.js                # Service worker
│   └── manifest.json        # PWA manifest
├── assets/                  # Game assets
├── tests/                   # Test files
└── server/                  # Signaling server
```

### Architecture

The game uses a modular, class-based architecture:

- **Game Loop**: Fixed timestep with interpolation
- **State Management**: Finite state machine for game flow
- **Entity System**: Base classes for game objects
- **Event System**: Custom events for decoupled communication
- **Asset Pipeline**: Procedural generation for textures/sounds

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Code Style
- Use 4 spaces for indentation
- Follow ESLint rules
- Add JSDoc comments for public methods
- Keep functions small and focused

### Pull Request Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Testing
- Write tests for new features
- Ensure all tests pass (`npm test`)
- Test on multiple browsers
- Check mobile compatibility

### Bug Reports
Please use GitHub Issues to report bugs. Include:
- Browser and OS information
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Phoenix** - Game design and direction (age 10!)
- **NIX GAMES** - Publisher and support
- **Three.js Community** - Amazing 3D library
- **Original DOOM** - Inspiration and gameplay
- **Open Source Contributors** - Various libraries used

## 🚀 Deployment

The game is automatically deployed to Vercel on push to main branch.

### Manual Deployment

```bash
# Build and deploy to Vercel
npm run deploy

# Deploy preview (without production flag)
npm run deploy:preview
```

### Self-Hosting

1. Build the project: `npm run build`
2. Serve the `dist` folder with any static web server
3. Ensure HTTPS is enabled for PWA features
4. Configure headers for service worker

## 📊 Performance Tips

- **Low-end devices**: Use Low or Medium quality preset
- **Mobile**: Enable performance mode in settings
- **Battery saving**: Limit FPS to 30 in video settings
- **Network**: Close unnecessary tabs for better multiplayer

## 🎯 Roadmap

- [ ] More levels and environments
- [ ] Additional enemy types
- [ ] Weapon modifications/upgrades
- [ ] Ranked multiplayer mode
- [ ] Level editor
- [ ] Steam release (Electron wrapper)
- [ ] VR support (WebXR)

---

<p align="center">
  <strong>"Built by kids. Played by legends."</strong> - NIX GAMES
</p>

<p align="center">
  Made with ❤️ by Phoenix and the open source community
</p>