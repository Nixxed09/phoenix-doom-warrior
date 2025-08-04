import * as THREE from 'three';

export const DoorState = {
    CLOSED: 'closed',
    OPENING: 'opening',
    OPEN: 'open',
    CLOSING: 'closing'
};

export const KeyType = {
    RED: 'red',
    BLUE: 'blue',
    YELLOW: 'yellow'
};

export class Level {
    constructor(scene) {
        this.scene = scene;
        this.currentLevel = 1;
        this.episodeNumber = 1;
        this.mapNumber = 1;

        this.geometry = {
            floors: [],
            ceilings: [],
            walls: [],
            doors: [],
            elevators: [],
            teleporters: [],
            hazards: []
        };

        this.entities = {
            pickups: [],
            enemies: [],
            secrets: [],
            triggers: []
        };

        this.levelData = null;
        this.levelName = '';
        this.parTime = 120;

        this.stats = {
            startTime: 0,
            endTime: 0,
            enemiesKilled: 0,
            totalEnemies: 0,
            secretsFound: 0,
            totalSecrets: 0,
            itemsCollected: 0,
            totalItems: 0
        };

        this.spawnPoint = new THREE.Vector3(0, 1.6, 0);
        this.exitPoint = null;
        this.exitActive = false;

        this.keys = {
            red: false,
            blue: false,
            yellow: false
        };

        this.textures = this.createTextures();
        this.materials = this.createMaterials();
    }

    createTextures() {
        return {
            floor: this.createFloorTexture(),
            ceiling: this.createCeilingTexture(),
            wall: this.createWallTexture(),
            door: this.createDoorTexture(),
            tech: this.createTechTexture(),
            lava: this.createLavaTexture(),
            acid: this.createAcidTexture()
        };
    }

    createMaterials() {
        return {
            floor: new THREE.MeshPhongMaterial({
                map: this.textures.floor,
                side: THREE.DoubleSide
            }),
            ceiling: new THREE.MeshPhongMaterial({
                map: this.textures.ceiling,
                side: THREE.DoubleSide
            }),
            wall: new THREE.MeshPhongMaterial({
                map: this.textures.wall
            }),
            door: new THREE.MeshPhongMaterial({
                map: this.textures.door
            }),
            tech: new THREE.MeshPhongMaterial({
                map: this.textures.tech,
                emissive: 0x0066ff,
                emissiveIntensity: 0.2
            }),
            lava: new THREE.MeshPhongMaterial({
                map: this.textures.lava,
                emissive: 0xff3300,
                emissiveIntensity: 0.5
            }),
            acid: new THREE.MeshPhongMaterial({
                map: this.textures.acid,
                emissive: 0x00ff00,
                emissiveIntensity: 0.3
            })
        };
    }

    loadLevel(episodeNumber = 1, mapNumber = 1, customData = null) {
        this.clearLevel();
        this.episodeNumber = episodeNumber;
        this.mapNumber = mapNumber;

        if (customData) {
            this.levelData = customData;
        } else {
            this.levelData = this.getE1M1Data();
        }

        this.levelName = this.levelData.name;
        this.parTime = this.levelData.parTime || 120;
        this.stats.startTime = Date.now();

        this.buildLevelGeometry();
        this.placeEntities();
        this.setupLighting();

        this.stats.totalEnemies = this.entities.enemies.length;
        this.stats.totalSecrets = this.entities.secrets.length;
        this.stats.totalItems = this.entities.pickups.length;
    }

    getE1M1Data() {
        return {
            name: 'Test Arena',
            parTime: 60,
            spawnPoint: { x: 0, y: 1.6, z: 0 },
            exitPoint: { x: 0, y: 1.6, z: -18 },
            rooms: [
                {
                    id: 'test_arena',
                    floor: { x: 0, z: 0, width: 40, depth: 40, height: 0 },
                    ceiling: { height: 6 },
                    walls: [
                        { start: { x: -20, z: -20 }, end: { x: 20, z: -20 } },
                        { start: { x: 20, z: -20 }, end: { x: 20, z: 20 } },
                        { start: { x: 20, z: 20 }, end: { x: -20, z: 20 } },
                        { start: { x: -20, z: 20 }, end: { x: -20, z: -20 } }
                    ],
                    hasExit: true
                }
            ],
            entities: [
                { type: 'zombie', position: { x: -10, z: -10 } },
                { type: 'zombie', position: { x: 10, z: -10 } },
                { type: 'imp', position: { x: -10, z: 10 } },
                { type: 'imp', position: { x: 10, z: 10 } },
                { type: 'demon', position: { x: 0, z: -15 } },

                { type: 'health', position: { x: -15, z: 0 } },
                { type: 'ammo', position: { x: -10, z: 0 } },
                { type: 'shotgun', position: { x: -5, z: 0 } },
                { type: 'chaingun', position: { x: 0, z: 0 } },
                { type: 'rocket_launcher', position: { x: 5, z: 0 } },
                { type: 'plasma_gun', position: { x: 10, z: 0 } },
                { type: 'bfg9000', position: { x: 15, z: 0 } },

                { type: 'health', position: { x: -15, z: -5 } },
                { type: 'health', position: { x: -5, z: -5 } },
                { type: 'health', position: { x: 5, z: -5 } },
                { type: 'health', position: { x: 15, z: -5 } },

                { type: 'armor', position: { x: -15, z: 5 } },
                { type: 'armor', position: { x: -5, z: 5 } },
                { type: 'armor', position: { x: 5, z: 5 } },
                { type: 'armor', position: { x: 15, z: 5 } },

                { type: 'ammo', position: { x: -12, z: 12 } },
                { type: 'shells', position: { x: -4, z: 12 } },
                { type: 'rockets', position: { x: 4, z: 12 } },
                { type: 'cells', position: { x: 12, z: 12 } },

                { type: 'ammo', position: { x: -12, z: -12 } },
                { type: 'shells', position: { x: -4, z: -12 } },
                { type: 'rockets', position: { x: 4, z: -12 } },
                { type: 'cells', position: { x: 12, z: -12 } }
            ],
            hazards: [],
            teleporters: []
        };
    }

    buildLevelGeometry() {
        const data = this.levelData;

        if (data.spawnPoint) {
            this.spawnPoint = new THREE.Vector3(
                data.spawnPoint.x,
                data.spawnPoint.y,
                data.spawnPoint.z
            );
        }

        if (data.exitPoint) {
            this.exitPoint = new THREE.Vector3(
                data.exitPoint.x,
                data.exitPoint.y,
                data.exitPoint.z
            );
        }

        data.rooms.forEach(room => {
            this.createRoom(room);
        });

        if (data.hazards) {
            data.hazards.forEach(hazard => {
                this.createHazard(hazard);
            });
        }

        if (data.teleporters) {
            data.teleporters.forEach(teleporter => {
                this.createTeleporter(teleporter);
            });
        }
    }

    createRoom(roomData) {
        const floorY = roomData.floor.height || 0;
        const ceilingY = floorY + (roomData.ceiling.height || 4);

        const floorGeometry = new THREE.PlaneGeometry(roomData.floor.width, roomData.floor.depth);
        const floor = new THREE.Mesh(floorGeometry, this.materials.floor);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(roomData.floor.x, floorY, roomData.floor.z);
        floor.receiveShadow = true;
        this.geometry.floors.push(floor);
        this.scene.add(floor);

        const ceilingGeometry = new THREE.PlaneGeometry(roomData.floor.width, roomData.floor.depth);
        const ceiling = new THREE.Mesh(ceilingGeometry, this.materials.ceiling);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(roomData.floor.x, ceilingY, roomData.floor.z);
        ceiling.receiveShadow = true;
        this.geometry.ceilings.push(ceiling);
        this.scene.add(ceiling);

        if (roomData.walls) {
            roomData.walls.forEach(wallData => {
                this.createWall(wallData, floorY, ceilingY);
            });
        }

        if (roomData.doors) {
            roomData.doors.forEach(doorData => {
                this.createDoor(doorData, floorY, ceilingY);
            });
        }

        if (roomData.elevation) {
            this.createElevator({
                position: { x: roomData.floor.x, z: roomData.floor.z },
                width: roomData.floor.width,
                depth: roomData.floor.depth,
                bottomY: 0,
                topY: roomData.elevation
            });
        }

        if (roomData.hasExit) {
            this.createExitSwitch(roomData.floor.x, floorY + 1, roomData.floor.z);
        }

        if (roomData.isSecret) {
            this.entities.secrets.push({
                position: new THREE.Vector3(roomData.floor.x, floorY, roomData.floor.z),
                radius: Math.max(roomData.floor.width, roomData.floor.depth) / 2,
                found: false
            });
        }
    }

    createWall(wallData, floorY, ceilingY) {
        const start = new THREE.Vector3(wallData.start.x, floorY, wallData.start.z);
        const end = new THREE.Vector3(wallData.end.x, floorY, wallData.end.z);
        const height = ceilingY - floorY;

        const length = start.distanceTo(end);
        const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const angle = Math.atan2(end.z - start.z, end.x - start.x);

        const geometry = new THREE.BoxGeometry(length, height, 0.5);
        const material = wallData.secret
            ? new THREE.MeshPhongMaterial({
                  map: this.textures.wall,
                  emissive: 0x333333,
                  emissiveIntensity: 0.1
              })
            : this.materials.wall;

        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(midpoint.x, floorY + height / 2, midpoint.z);
        wall.rotation.y = angle;
        wall.castShadow = true;
        wall.receiveShadow = true;

        if (wallData.secret) {
            wall.userData.secret = true;
            wall.userData.pushable = true;
        }

        this.geometry.walls.push(wall);
        this.scene.add(wall);
    }

    createDoor(doorData, floorY, ceilingY) {
        const height = ceilingY - floorY;
        const doorGeometry = new THREE.BoxGeometry(doorData.width || 3, height, 0.5);

        let doorMaterial = this.materials.door;
        if (doorData.keyRequired) {
            const keyColor = {
                [KeyType.RED]: 0xff0000,
                [KeyType.BLUE]: 0x0000ff,
                [KeyType.YELLOW]: 0xffff00
            };

            doorMaterial = new THREE.MeshPhongMaterial({
                map: this.textures.door,
                color: keyColor[doorData.keyRequired] || 0xffffff
            });
        }

        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(doorData.position.x, floorY + height / 2, doorData.position.z);

        door.userData = {
            isDoor: true,
            state: DoorState.CLOSED,
            keyRequired: doorData.keyRequired,
            openHeight: height,
            closedY: door.position.y,
            openY: door.position.y + height,
            speed: 2
        };

        this.geometry.doors.push(door);
        this.scene.add(door);
    }

    createElevator(elevatorData) {
        const geometry = new THREE.BoxGeometry(elevatorData.width, 0.2, elevatorData.depth);
        const material = this.materials.tech;

        const platform = new THREE.Mesh(geometry, material);
        platform.position.set(
            elevatorData.position.x,
            elevatorData.bottomY,
            elevatorData.position.z
        );
        platform.receiveShadow = true;

        platform.userData = {
            isElevator: true,
            bottomY: elevatorData.bottomY,
            topY: elevatorData.topY,
            currentY: elevatorData.bottomY,
            speed: 1,
            moving: false,
            direction: 1
        };

        this.geometry.elevators.push(platform);
        this.scene.add(platform);
    }

    createTeleporter(teleporterData) {
        const createTeleportPad = (position, isEntrance) => {
            const padGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 16);
            const padMaterial = new THREE.MeshPhongMaterial({
                color: isEntrance ? 0x00ffff : 0xff00ff,
                emissive: isEntrance ? 0x00ffff : 0xff00ff,
                emissiveIntensity: 0.5
            });

            const pad = new THREE.Mesh(padGeometry, padMaterial);
            pad.position.set(position.x, 0.1, position.z);

            const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: isEntrance ? 0x00ffff : 0xff00ff,
                transparent: true,
                opacity: 0.8
            });

            for (let i = 0; i < 20; i++) {
                const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                particle.userData = {
                    angle: Math.random() * Math.PI * 2,
                    height: Math.random() * 3,
                    speed: 0.5 + Math.random() * 0.5
                };
                pad.add(particle);
            }

            pad.userData = {
                isTeleporter: true,
                isEntrance: isEntrance,
                destination: isEntrance
                    ? new THREE.Vector3(teleporterData.exit.x, 1.6, teleporterData.exit.z)
                    : null
            };

            return pad;
        };

        const entrance = createTeleportPad(teleporterData.entrance, true);
        const exit = createTeleportPad(teleporterData.exit, false);

        this.geometry.teleporters.push(entrance, exit);
        this.scene.add(entrance);
        this.scene.add(exit);
    }

    createHazard(hazardData) {
        const geometry = new THREE.PlaneGeometry(hazardData.area.width, hazardData.area.depth);

        const material = hazardData.type === 'lava' ? this.materials.lava : this.materials.acid;

        const hazard = new THREE.Mesh(geometry, material);
        hazard.rotation.x = -Math.PI / 2;
        hazard.position.set(hazardData.area.x, -0.1, hazardData.area.z);

        hazard.userData = {
            isHazard: true,
            type: hazardData.type,
            damage: hazardData.type === 'lava' ? 10 : 5,
            bounds: new THREE.Box3(
                new THREE.Vector3(
                    hazardData.area.x - hazardData.area.width / 2,
                    -1,
                    hazardData.area.z - hazardData.area.depth / 2
                ),
                new THREE.Vector3(
                    hazardData.area.x + hazardData.area.width / 2,
                    0.5,
                    hazardData.area.z + hazardData.area.depth / 2
                )
            )
        };

        this.geometry.hazards.push(hazard);
        this.scene.add(hazard);
    }

    createExitSwitch(x, y, z) {
        const switchGeometry = new THREE.BoxGeometry(1, 1, 0.2);
        const switchMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.3
        });

        const exitSwitch = new THREE.Mesh(switchGeometry, switchMaterial);
        exitSwitch.position.set(x, y, z - 4.9);

        exitSwitch.userData = {
            isExitSwitch: true,
            activated: false
        };

        this.scene.add(exitSwitch);

        const signGeometry = new THREE.PlaneGeometry(2, 0.5);
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 256, 64);
        ctx.fillStyle = '#f00';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('EXIT', 128, 48);

        const signTexture = new THREE.CanvasTexture(canvas);
        const signMaterial = new THREE.MeshBasicMaterial({ map: signTexture });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(x, y + 1.5, z - 4.8);
        this.scene.add(sign);
    }

    placeEntities() {
        if (!this.levelData.entities) return;

        this.levelData.entities.forEach(entity => {
            const position = new THREE.Vector3(entity.position.x, 0.5, entity.position.z);

            if (
                entity.type === 'zombie' ||
                entity.type === 'imp' ||
                entity.type === 'demon' ||
                entity.type === 'cacodemon' ||
                entity.type === 'hell_knight'
            ) {
                this.entities.enemies.push({
                    type: entity.type,
                    position: position,
                    spawned: false
                });
            } else {
                const pickup = this.createPickup(entity.type, position);
                if (pickup) {
                    if (entity.secret) {
                        pickup.userData.secret = true;
                    }
                    this.entities.pickups.push(pickup);
                    this.scene.add(pickup);
                }
            }
        });
    }

    createPickup(type, position) {
        let geometry, material, color;

        const pickupTypes = {
            health: { color: 0x00ff00, size: 0.3 },
            armor: { color: 0x0080ff, size: 0.3 },
            ammo: { color: 0xffff00, size: 0.4, box: true },
            shells: { color: 0xff6600, size: 0.4, box: true },
            rockets: { color: 0xff0066, size: 0.5, box: true },
            cells: { color: 0x00ffff, size: 0.4, box: true },

            shotgun: { color: 0x666666, size: 0.6, weapon: true },
            chaingun: { color: 0x888888, size: 0.7, weapon: true },
            rocket_launcher: { color: 0x444444, size: 0.8, weapon: true },
            plasma_gun: { color: 0x0066ff, size: 0.7, weapon: true },
            bfg9000: { color: 0x00ff00, size: 1.0, weapon: true },

            red_key: { color: 0xff0000, size: 0.3, key: true },
            blue_key: { color: 0x0000ff, size: 0.3, key: true },
            yellow_key: { color: 0xffff00, size: 0.3, key: true },

            soul_sphere: { color: 0x0088ff, size: 0.5, special: true },
            invulnerability: { color: 0x00ff00, size: 0.5, special: true },
            berserk: { color: 0xff0000, size: 0.5, special: true }
        };

        const pickupData = pickupTypes[type];
        if (!pickupData) return null;

        if (pickupData.box) {
            geometry = new THREE.BoxGeometry(pickupData.size, pickupData.size, pickupData.size);
        } else {
            geometry = new THREE.SphereGeometry(pickupData.size, 16, 16);
        }

        material = new THREE.MeshPhongMaterial({
            color: pickupData.color,
            emissive: pickupData.color,
            emissiveIntensity: 0.5
        });

        const pickup = new THREE.Mesh(geometry, material);
        pickup.position.copy(position);
        pickup.userData = {
            type: type,
            isPickup: true,
            respawnTime: pickupData.special ? 30 : 0
        };

        if (pickupData.key) {
            pickup.userData.keyType = type.replace('_key', '');
        }

        return pickup;
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x202020, 0.3);
        this.scene.add(ambientLight);

        const pointLights = [
            { x: 0, y: 3, z: 0, color: 0xffffff, intensity: 0.5 },
            { x: -20, y: 3, z: -30, color: 0xff8800, intensity: 0.4 },
            { x: 20, y: 3, z: -30, color: 0x0088ff, intensity: 0.4 }
        ];

        pointLights.forEach(lightData => {
            const light = new THREE.PointLight(lightData.color, lightData.intensity, 30);
            light.position.set(lightData.x, lightData.y, lightData.z);
            light.castShadow = true;
            this.scene.add(light);
        });

        this.geometry.hazards.forEach(hazard => {
            if (hazard.userData.type === 'lava') {
                const lavaLight = new THREE.PointLight(0xff3300, 0.5, 10);
                lavaLight.position.copy(hazard.position);
                lavaLight.position.y = 1;
                this.scene.add(lavaLight);
            }
        });
    }

    updatePickups(deltaTime) {
        this.entities.pickups.forEach(pickup => {
            if (pickup.parent) {
                pickup.rotation.y += deltaTime * 2;
                pickup.position.y = pickup.userData.originalY || 0.5;
                pickup.position.y += Math.sin(Date.now() * 0.002) * 0.1;
            }
        });
    }

    updateDoors(deltaTime) {
        this.geometry.doors.forEach(door => {
            const data = door.userData;

            switch (data.state) {
                case DoorState.OPENING:
                    door.position.y += data.speed * deltaTime;
                    if (door.position.y >= data.openY) {
                        door.position.y = data.openY;
                        data.state = DoorState.OPEN;
                        setTimeout(() => {
                            if (data.state === DoorState.OPEN) {
                                data.state = DoorState.CLOSING;
                            }
                        }, 5000);
                    }
                    break;

                case DoorState.CLOSING:
                    door.position.y -= data.speed * deltaTime;
                    if (door.position.y <= data.closedY) {
                        door.position.y = data.closedY;
                        data.state = DoorState.CLOSED;
                    }
                    break;
            }
        });
    }

    updateElevators(deltaTime) {
        this.geometry.elevators.forEach(elevator => {
            const data = elevator.userData;

            if (data.moving) {
                data.currentY += data.speed * data.direction * deltaTime;

                if (data.direction > 0 && data.currentY >= data.topY) {
                    data.currentY = data.topY;
                    data.moving = false;
                } else if (data.direction < 0 && data.currentY <= data.bottomY) {
                    data.currentY = data.bottomY;
                    data.moving = false;
                }

                elevator.position.y = data.currentY;
            }
        });
    }

    updateTeleporters(deltaTime) {
        this.geometry.teleporters.forEach(teleporter => {
            teleporter.children.forEach(particle => {
                const data = particle.userData;
                data.angle += data.speed * deltaTime;
                const radius = 1;
                particle.position.x = Math.cos(data.angle) * radius;
                particle.position.z = Math.sin(data.angle) * radius;
                particle.position.y = data.height + Math.sin(Date.now() * 0.001) * 0.5;
            });

            teleporter.rotation.y += deltaTime;
        });
    }

    activateDoor(door, hasKey) {
        const data = door.userData;

        if (data.keyRequired && !hasKey) {
            return false;
        }

        if (data.state === DoorState.CLOSED) {
            data.state = DoorState.OPENING;
            return true;
        }

        return false;
    }

    activateElevator(elevator) {
        const data = elevator.userData;

        if (!data.moving) {
            data.moving = true;
            data.direction = data.currentY === data.bottomY ? 1 : -1;
        }
    }

    checkHazards(position) {
        for (let hazard of this.geometry.hazards) {
            if (hazard.userData.bounds.containsPoint(position)) {
                return hazard.userData;
            }
        }
        return null;
    }

    checkTeleporter(position) {
        for (let teleporter of this.geometry.teleporters) {
            if (teleporter.userData.isEntrance) {
                const distance = position.distanceTo(teleporter.position);
                if (distance < 1.5) {
                    return teleporter.userData.destination;
                }
            }
        }
        return null;
    }

    checkSecrets(position) {
        this.entities.secrets.forEach((secret, index) => {
            if (!secret.found) {
                const distance = position.distanceTo(secret.position);
                if (distance < secret.radius) {
                    secret.found = true;
                    this.stats.secretsFound++;
                    return true;
                }
            }
        });
        return false;
    }

    activateExitSwitch() {
        this.exitActive = true;
        this.stats.endTime = Date.now();
        return {
            time: (this.stats.endTime - this.stats.startTime) / 1000,
            parTime: this.parTime,
            kills: `${this.stats.enemiesKilled}/${this.stats.totalEnemies}`,
            secrets: `${this.stats.secretsFound}/${this.stats.totalSecrets}`,
            items: `${this.stats.itemsCollected}/${this.stats.totalItems}`
        };
    }

    generateProceduralLevel(width = 50, height = 50, roomCount = 10) {
        const rooms = [];
        const connections = [];

        for (let i = 0; i < roomCount; i++) {
            const room = {
                x: Math.random() * (width - 10) - (width - 10) / 2,
                z: Math.random() * (height - 10) - (height - 10) / 2,
                width: 5 + Math.random() * 10,
                depth: 5 + Math.random() * 10,
                height: 3 + Math.random() * 3
            };
            rooms.push(room);
        }

        for (let i = 0; i < rooms.length - 1; i++) {
            connections.push({
                from: i,
                to: i + 1
            });
        }

        return {
            name: 'Procedural Level',
            parTime: 120,
            rooms: rooms,
            connections: connections
        };
    }

    clearLevel() {
        Object.values(this.geometry).forEach(array => {
            array.forEach(obj => {
                if (obj.parent) {
                    this.scene.remove(obj);
                }
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(mat => mat.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
        });

        Object.keys(this.geometry).forEach(key => {
            this.geometry[key] = [];
        });

        this.entities.pickups.forEach(pickup => {
            if (pickup.parent) this.scene.remove(pickup);
        });

        Object.keys(this.entities).forEach(key => {
            this.entities[key] = [];
        });

        const lights = this.scene.children.filter(child => child instanceof THREE.Light);
        lights.forEach(light => this.scene.remove(light));
    }

    createFloorTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, 256, 256);

        for (let i = 0; i < 256; i += 32) {
            ctx.strokeStyle = '#111';
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 256);
            ctx.moveTo(0, i);
            ctx.lineTo(256, i);
            ctx.stroke();
        }

        for (let i = 0; i < 20; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
            ctx.fillRect(
                Math.random() * 256,
                Math.random() * 256,
                Math.random() * 10,
                Math.random() * 10
            );
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10);
        return texture;
    }

    createCeilingTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, 256, 256);

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                ctx.fillStyle = (i + j) % 2 === 0 ? '#1a1a1a' : '#0a0a0a';
                ctx.fillRect(i * 32, j * 32, 32, 32);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10);
        return texture;
    }

    createWallTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#444';
        ctx.fillRect(0, 0, 256, 256);

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 4; x++) {
                const offset = y % 2 === 0 ? 0 : 32;
                ctx.strokeRect(x * 64 + offset, y * 32, 64 - 2, 32 - 2);
            }
        }

        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.1})`;
            ctx.fillRect(
                Math.random() * 256,
                Math.random() * 256,
                Math.random() * 20,
                Math.random() * 20
            );
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createDoorTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#666';
        ctx.fillRect(0, 0, 128, 256);

        ctx.fillStyle = '#555';
        ctx.fillRect(10, 10, 108, 236);

        ctx.strokeStyle = '#777';
        ctx.lineWidth = 4;
        ctx.strokeRect(20, 20, 88, 216);

        ctx.fillStyle = '#444';
        ctx.fillRect(30, 30, 68, 96);
        ctx.fillRect(30, 130, 68, 96);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    createTechTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#223';
        ctx.fillRect(0, 0, 256, 256);

        ctx.strokeStyle = '#446';
        ctx.lineWidth = 2;
        for (let i = 0; i < 256; i += 16) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 256);
            ctx.moveTo(0, i);
            ctx.lineTo(256, i);
            ctx.stroke();
        }

        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = '#66f';
            ctx.fillRect(50 + i * 40, 100, 20, 20);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createLavaTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, '#ff6600');
        gradient.addColorStop(0.5, '#ff3300');
        gradient.addColorStop(1, '#990000');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);

        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = `rgba(255, ${Math.random() * 100}, 0, ${Math.random() * 0.5})`;
            ctx.beginPath();
            ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 20, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createAcidTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0a0';
        ctx.fillRect(0, 0, 256, 256);

        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const radius = Math.random() * 10;

            ctx.fillStyle = `rgba(0, ${200 + Math.random() * 55}, 0, ${Math.random() * 0.5})`;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    getSpawnPoint() {
        return this.spawnPoint.clone();
    }

    getAllWalls() {
        return [...this.geometry.walls, ...this.geometry.doors];
    }
}
