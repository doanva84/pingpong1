class DataManager {
    constructor() {
        this.storage = new Storage();
        this.validators = new Map();
        this.transformers = new Map();
        this.setupValidators();
        this.setupTransformers();
    }

    // Setup data validators
    setupValidators() {
        this.validators.set('players', (data) => {
            if (!Array.isArray(data)) return { valid: false, error: 'Players data must be an array' };
            
            for (let i = 0; i < data.length; i++) {
                const player = data[i];
                if (!player.id || !player.name || !player.email) {
                    return { valid: false, error: `Player at index ${i} is missing required fields` };
                }
                if (typeof player.name !== 'string' || typeof player.email !== 'string') {
                    return { valid: false, error: `Player at index ${i} has invalid field types` };
                }
            }
            
            return { valid: true };
        });

        this.validators.set('doubles', (data) => {
            if (!Array.isArray(data)) return { valid: false, error: 'Doubles data must be an array' };
            
            for (let i = 0; i < data.length; i++) {
                const double = data[i];
                if (!double.id || !double.player1Id || !double.player2Id) {
                    return { valid: false, error: `Double at index ${i} is missing required fields` };
                }
            }
            
            return { valid: true };
        });

        this.validators.set('teams', (data) => {
            if (!Array.isArray(data)) return { valid: false, error: 'Teams data must be an array' };
            
            for (let i = 0; i < data.length; i++) {
                const team = data[i];
                if (!team.id || !team.name || !team.player1Id || !team.player2Id || !team.player3Id) {
                    return { valid: false, error: `Team at index ${i} is missing required fields` };
                }
            }
            
            return { valid: true };
        });
    }

    // Setup data transformers for backward compatibility
    setupTransformers() {
        this.transformers.set('players', (data) => {
            return data.map(player => {
                // Ensure all required fields exist with defaults
                return {
                    id: player.id || this.generateId('player'),
                    name: player.name || '',
                    email: player.email || '',
                    address: player.address || '',
                    rank: player.rank || 'Beginner',
                    points: player.points || 0,
                    matchesWon: player.matchesWon || 0,
                    matchesLost: player.matchesLost || 0,
                    matchesPlayed: player.matchesPlayed || 0,
                    winRate: player.winRate || 0,
                    createdAt: player.createdAt || new Date().toISOString(),
                    updatedAt: player.updatedAt || new Date().toISOString(),
                    history: player.history || []
                };
            });
        });

        this.transformers.set('doubles', (data) => {
            return data.map(double => {
                return {
                    id: double.id || this.generateId('double'),
                    player1Id: double.player1Id,
                    player2Id: double.player2Id,
                    name: double.name || '',
                    points: double.points || 0,
                    matchesWon: double.matchesWon || 0,
                    matchesLost: double.matchesLost || 0,
                    matchesPlayed: double.matchesPlayed || 0,
                    winRate: double.winRate || 0,
                    createdAt: double.createdAt || new Date().toISOString(),
                    updatedAt: double.updatedAt || new Date().toISOString(),
                    history: double.history || [],
                    isActive: double.isActive !== undefined ? double.isActive : true
                };
            });
        });

        this.transformers.set('teams', (data) => {
            return data.map(team => {
                return {
                    id: team.id || this.generateId('team'),
                    name: team.name || '',
                    player1Id: team.player1Id,
                    player2Id: team.player2Id,
                    player3Id: team.player3Id,
                    player4Id: team.player4Id || null,
                    points: team.points || 0,
                    matchesWon: team.matchesWon || 0,
                    matchesLost: team.matchesLost || 0,
                    matchesPlayed: team.matchesPlayed || 0,
                    winRate: team.winRate || 0,
                    createdAt: team.createdAt || new Date().toISOString(),
                    updatedAt: team.updatedAt || new Date().toISOString(),
                    history: team.history || [],
                    isActive: team.isActive !== undefined ? team.isActive : true,
                    description: team.description || ''
                };
            });
        });
    }

    // Generate unique ID
    generateId(prefix) {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Save data with validation and transformation
    saveData(key, data) {
        try {
            // Validate data
            const validator = this.validators.get(key);
            if (validator) {
                const validation = validator(data);
                if (!validation.valid) {
                    throw new Error(`Validation failed for ${key}: ${validation.error}`);
                }
            }

            // Transform data if needed
            const transformer = this.transformers.get(key);
            const transformedData = transformer ? transformer(data) : data;

            // Save to storage
            return this.storage.save(key, transformedData);
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
            return false;
        }
    }

    // Load data with transformation
    loadData(key) {
        try {
            const data = this.storage.load(key);
            if (!data) return null;

            // Transform data if needed
            const transformer = this.transformers.get(key);
            return transformer ? transformer(data) : data;
        } catch (error) {
            console.error(`Error loading ${key}:`, error);
            return null;
        }
    }

    // Import data from external source
    async importData(importData) {
        const results = {
            success: {},
            errors: {},
            total: 0,
            imported: 0
        };

        const dataTypes = ['players', 'doubles', 'teams', 'tournaments', 'matches', 'rules'];

        for (const dataType of dataTypes) {
            if (importData[dataType]) {
                try {
                    results.total++;
                    
                    // Validate
                    const validator = this.validators.get(dataType);
                    if (validator) {
                        const validation = validator(importData[dataType]);
                        if (!validation.valid) {
                            results.errors[dataType] = validation.error;
                            continue;
                        }
                    }

                    // Transform and save
                    const transformer = this.transformers.get(dataType);
                    const transformedData = transformer ? transformer(importData[dataType]) : importData[dataType];
                    
                    if (this.storage.save(dataType, transformedData)) {
                        results.success[dataType] = transformedData.length || 1;
                        results.imported++;
                    } else {
                        results.errors[dataType] = 'Failed to save to storage';
                    }
                } catch (error) {
                    results.errors[dataType] = error.message;
                }
            }
        }

        return results;
    }

    // Export all data
    exportData() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            metadata: {
                appName: 'Ping Pong Tournament Manager',
                totalRecords: 0
            }
        };

        const dataTypes = ['players', 'doubles', 'teams', 'tournaments', 'matches', 'rules'];
        
        dataTypes.forEach(dataType => {
            const typeData = this.loadData(dataType);
            if (typeData) {
                data[dataType] = typeData;
                data.metadata.totalRecords += Array.isArray(typeData) ? typeData.length : 1;
            }
        });

        return data;
    }

    // Backup data to file
    async backupData(filename = null) {
        try {
            const data = this.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `pingpong_backup_${new Date().toISOString().split('T')[0]}.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return { success: true, filename: a.download };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Restore data from file
    async restoreData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const results = await this.importData(data);
                    resolve(results);
                } catch (error) {
                    reject(new Error('Invalid backup file: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    }

    // Clear all data
    clearAllData() {
        return this.storage.clear();
    }

    // Get storage statistics
    getStorageStats() {
        return this.storage.getUsageStats();
    }

    // Clean up storage
    cleanupStorage() {
        return this.storage.cleanup();
    }

    // Validate all stored data
    validateAllData() {
        const results = {
            valid: {},
            invalid: {},
            totalChecked: 0
        };

        const dataTypes = ['players', 'doubles', 'teams', 'tournaments', 'matches', 'rules'];
        
        dataTypes.forEach(dataType => {
            const data = this.loadData(dataType);
            if (data) {
                results.totalChecked++;
                const validator = this.validators.get(dataType);
                if (validator) {
                    const validation = validator(data);
                    if (validation.valid) {
                        results.valid[dataType] = true;
                    } else {
                        results.invalid[dataType] = validation.error;
                    }
                } else {
                    results.valid[dataType] = true; // No validator = assume valid
                }
            }
        });

        return results;
    }

    // Fix data integrity issues
    async fixDataIntegrity() {
        const fixes = {
            applied: [],
            errors: []
        };

        try {
            // Load all data
            const players = this.loadData('players') || [];
            const doubles = this.loadData('doubles') || [];
            const teams = this.loadData('teams') || [];

            // Fix orphaned doubles (doubles with non-existent players)
            const playerIds = new Set(players.map(p => p.id));
            const validDoubles = doubles.filter(double => {
                const hasValidPlayers = playerIds.has(double.player1Id) && playerIds.has(double.player2Id);
                if (!hasValidPlayers) {
                    fixes.applied.push(`Removed orphaned double: ${double.name}`);
                }
                return hasValidPlayers;
            });

            if (validDoubles.length !== doubles.length) {
                this.saveData('doubles', validDoubles);
            }

            // Fix orphaned teams (teams with non-existent players)
            const validTeams = teams.filter(team => {
                const playerList = [team.player1Id, team.player2Id, team.player3Id, team.player4Id]
                    .filter(id => id);
                const validPlayerCount = playerList.filter(id => playerIds.has(id)).length;
                
                if (validPlayerCount < 3) {
                    fixes.applied.push(`Removed orphaned team: ${team.name}`);
                    return false;
                }
                
                // Update team with only valid players
                if (validPlayerCount !== playerList.length) {
                    const validPlayerIds = playerList.filter(id => playerIds.has(id));
                    team.player1Id = validPlayerIds[0] || null;
                    team.player2Id = validPlayerIds[1] || null;
                    team.player3Id = validPlayerIds[2] || null;
                    team.player4Id = validPlayerIds[3] || null;
                    fixes.applied.push(`Fixed team players: ${team.name}`);
                }
                
                return true;
            });

            if (validTeams.length !== teams.length) {
                this.saveData('teams', validTeams);
            }

            // Fix missing IDs
            let playersFixed = false;
            players.forEach(player => {
                if (!player.id) {
                    player.id = this.generateId('player');
                    playersFixed = true;
                    fixes.applied.push(`Added missing ID to player: ${player.name}`);
                }
            });

            if (playersFixed) {
                this.saveData('players', players);
            }

        } catch (error) {
            fixes.errors.push(`Error during integrity fix: ${error.message}`);
        }

        return fixes;
    }

    // Create sample data
    createSampleData() {
        const sampleData = {
            players: [
                {
                    id: this.generateId('player'),
                    name: 'Nguyễn Văn A',
                    email: 'nva@example.com',
                    address: 'Hà Nội',
                    rank: 'Advanced',
                    points: 450,
                    matchesWon: 18,
                    matchesLost: 7,
                    matchesPlayed: 25,
                    winRate: 72,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    history: []
                },
                {
                    id: this.generateId('player'),
                    name: 'Trần Thị B',
                    email: 'ttb@example.com',
                    address: 'Hồ Chí Minh',
                    rank: 'Professional',
                    points: 680,
                    matchesWon: 24,
                    matchesLost: 6,
                    matchesPlayed: 30,
                    winRate: 80,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    history: []
                },
                {
                    id: this.generateId('player'),
                    name: 'Lê Văn C',
                    email: 'lvc@example.com',
                    address: 'Đà Nẵng',
                    rank: 'Intermediate',
                    points: 230,
                    matchesWon: 12,
                    matchesLost: 8,
                    matchesPlayed: 20,
                    winRate: 60,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    history: []
                }
            ]
        };

        // Create doubles from sample players
        if (sampleData.players.length >= 2) {
            sampleData.doubles = [
                {
                    id: this.generateId('double'),
                    player1Id: sampleData.players[0].id,
                    player2Id: sampleData.players[1].id,
                    name: `${sampleData.players[0].name} & ${sampleData.players[1].name}`,
                    points: 120,
                    matchesWon: 8,
                    matchesLost: 4,
                    matchesPlayed: 12,
                    winRate: 67,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    history: [],
                    isActive: true
                }
            ];
        }

        // Create teams from sample players
        if (sampleData.players.length >= 3) {
            sampleData.teams = [
                {
                    id: this.generateId('team'),
                    name: 'Lightning Strikers',
                    player1Id: sampleData.players[0].id,
                    player2Id: sampleData.players[1].id,
                    player3Id: sampleData.players[2].id,
                    player4Id: null,
                    points: 85,
                    matchesWon: 5,
                    matchesLost: 2,
                    matchesPlayed: 7,
                    winRate: 71,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    history: [],
                    isActive: true,
                    description: 'Đội mẫu được tạo tự động'
                }
            ];
        }

        return sampleData;
    }

    // Load sample data into storage
    async loadSampleData() {
        const sampleData = this.createSampleData();
        return await this.importData(sampleData);
    }
}

// Create global data manager instance
const dataManager = new DataManager();
