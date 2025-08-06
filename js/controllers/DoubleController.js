class DoubleController {
    constructor(playerController) {
        this.playerController = playerController;
        this.doubles = [];
        this.storageKey = 'pingpong_doubles';
        this.loadFromStorage();
    }

    // Create new double
    createDouble(player1Id, player2Id, name = null) {
        // Validate players exist
        const player1 = this.playerController.getPlayerById(player1Id);
        const player2 = this.playerController.getPlayerById(player2Id);

        if (!player1) {
            throw new Error('Không tìm thấy vận động viên thứ nhất');
        }
        if (!player2) {
            throw new Error('Không tìm thấy vận động viên thứ hai');
        }
        if (player1Id === player2Id) {
            throw new Error('Không thể chọn cùng một vận động viên cho cả hai vị trí');
        }

        // Check if double already exists
        const existingDouble = this.doubles.find(d => 
            (d.player1Id === player1Id && d.player2Id === player2Id) ||
            (d.player1Id === player2Id && d.player2Id === player1Id)
        );

        if (existingDouble) {
            throw new Error('Cặp đôi này đã tồn tại');
        }

        const double = new Double(null, player1Id, player2Id, name);
        double.setNameFromPlayers(player1, player2);

        const validation = double.validate(this.playerController);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        this.doubles.push(double);
        this.saveToStorage();
        this.notifyChange('double_created', double);
        
        return double;
    }

    // Get double by ID
    getDoubleById(id) {
        return this.doubles.find(double => double.id === id) || null;
    }

    // Get all doubles
    getAllDoubles() {
        return [...this.doubles];
    }

    // Get active doubles
    getActiveDoubles() {
        return this.doubles.filter(double => double.isActive);
    }

    // Get doubles by player
    getDoublesByPlayer(playerId) {
        return this.doubles.filter(double => double.hasPlayer(playerId));
    }

    // Update double
    updateDouble(id, data) {
        const double = this.getDoubleById(id);
        if (!double) {
            throw new Error('Không tìm thấy cặp đôi');
        }

        // Update fields
        if (data.name !== undefined) {
            double.name = data.name;
        }
        if (data.player1Id !== undefined) {
            double.player1Id = data.player1Id;
        }
        if (data.player2Id !== undefined) {
            double.player2Id = data.player2Id;
        }

        double.updatedAt = new Date();

        // Validate updated double
        const validation = double.validate(this.playerController);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        // Update name if players changed
        if (data.player1Id !== undefined || data.player2Id !== undefined) {
            const player1 = this.playerController.getPlayerById(double.player1Id);
            const player2 = this.playerController.getPlayerById(double.player2Id);
            if (player1 && player2) {
                double.setNameFromPlayers(player1, player2);
            }
        }

        this.saveToStorage();
        this.notifyChange('double_updated', double);
        
        return double;
    }

    // Delete double
    deleteDouble(id) {
        const index = this.doubles.findIndex(double => double.id === id);
        if (index === -1) {
            throw new Error('Không tìm thấy cặp đôi');
        }

        const double = this.doubles[index];
        this.doubles.splice(index, 1);
        this.saveToStorage();
        this.notifyChange('double_deleted', double);
        
        return true;
    }

    // Search doubles
    searchDoubles(searchTerm) {
        if (!searchTerm) {
            return this.getAllDoubles();
        }

        return this.doubles.filter(double => 
            double.matchesSearch(searchTerm, this.playerController)
        );
    }

    // Get double statistics
    getDoubleStatistics(id) {
        const double = this.getDoubleById(id);
        if (!double) {
            throw new Error('Không tìm thấy cặp đôi');
        }

        return double.getStatistics();
    }

    // Update double after match
    updateDoubleAfterMatch(doubleId, isWin, opponent, score, date = new Date()) {
        const double = this.getDoubleById(doubleId);
        if (!double) {
            throw new Error('Không tìm thấy cặp đôi');
        }

        const matchResult = double.addMatchResult(isWin, opponent, score, date);

        this.saveToStorage();
        this.notifyChange('double_match_result', { double, matchResult });

        return { matchResult };
    }

    // Get top doubles by points
    getTopDoublesByPoints(limit = 10) {
        return [...this.doubles]
            .sort((a, b) => b.points - a.points)
            .slice(0, limit);
    }

    // Get top doubles by win rate
    getTopDoublesByWinRate(limit = 10, minMatches = 3) {
        return [...this.doubles]
            .filter(double => double.matchesPlayed >= minMatches)
            .sort((a, b) => b.winRate - a.winRate)
            .slice(0, limit);
    }

    // Activate/Deactivate double
    setDoubleStatus(id, isActive) {
        const double = this.getDoubleById(id);
        if (!double) {
            throw new Error('Không tìm thấy cặp đôi');
        }

        if (isActive) {
            double.activate();
        } else {
            double.deactivate();
        }

        this.saveToStorage();
        this.notifyChange('double_status_changed', { double, isActive });
        
        return double;
    }

    // Import doubles from data
    importDoubles(doublesData) {
        const importedDoubles = [];
        const errors = [];

        doublesData.forEach((data, index) => {
            try {
                const double = Double.fromJSON(data);
                const validation = double.validate(this.playerController);
                
                if (!validation.isValid) {
                    errors.push(`Dòng ${index + 1}: ${validation.errors.join(', ')}`);
                    return;
                }

                // Check for duplicate
                const existingDouble = this.doubles.find(d => 
                    (d.player1Id === double.player1Id && d.player2Id === double.player2Id) ||
                    (d.player1Id === double.player2Id && d.player2Id === double.player1Id)
                );

                if (existingDouble) {
                    errors.push(`Dòng ${index + 1}: Cặp đôi đã tồn tại`);
                    return;
                }

                this.doubles.push(double);
                importedDoubles.push(double);
            } catch (error) {
                errors.push(`Dòng ${index + 1}: ${error.message}`);
            }
        });

        if (importedDoubles.length > 0) {
            this.saveToStorage();
            this.notifyChange('doubles_imported', importedDoubles);
        }

        return {
            imported: importedDoubles.length,
            errors: errors
        };
    }

    // Export doubles to data
    exportDoubles() {
        return this.doubles.map(double => double.toJSON());
    }

    // Clear all doubles
    clearAllDoubles() {
        const count = this.doubles.length;
        this.doubles = [];
        this.saveToStorage();
        this.notifyChange('doubles_cleared', { count });
        return count;
    }

    // Generate sample doubles
    generateSampleDoubles() {
        const players = this.playerController.getAllPlayers();
        if (players.length < 2) {
            throw new Error('Cần ít nhất 2 vận động viên để tạo cặp đôi mẫu');
        }

        const sampleDoubles = [];
        const maxPairs = Math.min(5, Math.floor(players.length / 2));

        for (let i = 0; i < maxPairs; i++) {
            try {
                const player1 = players[i * 2];
                const player2 = players[i * 2 + 1];
                
                if (player1 && player2) {
                    const double = this.createDouble(player1.id, player2.id);
                    
                    // Add some sample points and matches
                    double.points = Math.floor(Math.random() * 300) + 20;
                    double.matchesPlayed = Math.floor(Math.random() * 15) + 3;
                    double.matchesWon = Math.floor(double.matchesPlayed * (Math.random() * 0.6 + 0.2));
                    double.matchesLost = double.matchesPlayed - double.matchesWon;
                    double.calculateWinRate();
                    
                    sampleDoubles.push(double);
                }
            } catch (error) {
                console.error('Error creating sample double:', error);
            }
        }

        if (sampleDoubles.length > 0) {
            this.saveToStorage();
            this.notifyChange('sample_doubles_created', sampleDoubles);
        }

        return sampleDoubles;
    }

    // Get statistics summary
    getStatisticsSummary() {
        const totalDoubles = this.doubles.length;
        const activeDoubles = this.getActiveDoubles().length;
        
        let totalMatches = 0;
        let totalPoints = 0;

        this.doubles.forEach(double => {
            totalMatches += double.matchesPlayed;
            totalPoints += double.points;
        });

        return {
            totalDoubles,
            activeDoubles,
            inactiveDoubles: totalDoubles - activeDoubles,
            totalMatches,
            totalPoints,
            averagePointsPerDouble: totalDoubles > 0 ? Math.round(totalPoints / totalDoubles) : 0,
            averageMatchesPerDouble: totalDoubles > 0 ? Math.round(totalMatches / totalDoubles) : 0
        };
    }

    // Get doubles that can compete (both players available)
    getCompetingDoubles() {
        return this.doubles.filter(double => double.canCompete(this.playerController));
    }

    // Get potential partners for a player
    getPotentialPartners(playerId) {
        const allPlayers = this.playerController.getAllPlayers();
        const existingPartners = this.getDoublesByPlayer(playerId)
            .map(double => double.getPartner(playerId))
            .filter(partnerId => partnerId);

        return allPlayers.filter(player => 
            player.id !== playerId && 
            !existingPartners.includes(player.id)
        );
    }

    // Check if two players can form a double
    canFormDouble(player1Id, player2Id) {
        if (player1Id === player2Id) return false;
        
        const existingDouble = this.doubles.find(d => 
            (d.player1Id === player1Id && d.player2Id === player2Id) ||
            (d.player1Id === player2Id && d.player2Id === player1Id)
        );

        return !existingDouble;
    }

    // Storage methods
    saveToStorage() {
        try {
            const data = this.exportDoubles();
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving doubles to storage:', error);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const doublesData = JSON.parse(data);
                this.doubles = doublesData.map(doubleData => Double.fromJSON(doubleData));
            }
        } catch (error) {
            console.error('Error loading doubles from storage:', error);
            this.doubles = [];
        }
    }

    // Event notification
    notifyChange(eventType, data) {
        const event = new CustomEvent('doubleControllerChange', {
            detail: { eventType, data }
        });
        document.dispatchEvent(event);
    }

    // Handle player deletion - remove affected doubles
    handlePlayerDeleted(playerId) {
        const affectedDoubles = this.getDoublesByPlayer(playerId);
        
        affectedDoubles.forEach(double => {
            this.deleteDouble(double.id);
        });

        if (affectedDoubles.length > 0) {
            this.notifyChange('doubles_auto_deleted', { 
                count: affectedDoubles.length,
                reason: 'Player deleted'
            });
        }
    }

    // Validate all doubles (check if players still exist)
    validateAllDoubles() {
        const invalidDoubles = [];
        
        this.doubles.forEach(double => {
            const validation = double.validate(this.playerController);
            if (!validation.isValid) {
                invalidDoubles.push({
                    double,
                    errors: validation.errors
                });
            }
        });

        return invalidDoubles;
    }

    // Clean up invalid doubles
    cleanupInvalidDoubles() {
        const invalidDoubles = this.validateAllDoubles();
        
        invalidDoubles.forEach(({ double }) => {
            this.deleteDouble(double.id);
        });

        return invalidDoubles.length;
    }
}
