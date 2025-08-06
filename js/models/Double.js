class Double {
    constructor(id, player1Id, player2Id, name = null) {
        this.id = id || this.generateId();
        this.player1Id = player1Id;
        this.player2Id = player2Id;
        this.name = name || this.generateName();
        this.points = 0;
        this.matchesWon = 0;
        this.matchesLost = 0;
        this.matchesPlayed = 0;
        this.winRate = 0;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.history = []; // Match history
        this.isActive = true;
    }

    generateId() {
        return 'double_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateName() {
        // Name will be generated when players are available
        return `Cặp đôi ${this.id.substr(-4)}`;
    }

    // Set name based on players
    setNameFromPlayers(player1, player2) {
        if (player1 && player2) {
            this.name = `${player1.name} & ${player2.name}`;
            this.updatedAt = new Date();
        }
    }

    // Calculate win rate
    calculateWinRate() {
        if (this.matchesPlayed === 0) return 0;
        this.winRate = Math.round((this.matchesWon / this.matchesPlayed) * 100);
        return this.winRate;
    }

    // Add match result
    addMatchResult(isWin, opponent, score, date = new Date()) {
        const result = {
            id: 'match_' + Date.now(),
            isWin,
            opponent: opponent.id || opponent,
            opponentName: opponent.name || 'Unknown',
            matchType: 'doubles',
            score,
            date,
            pointsEarned: isWin ? this.calculatePointsEarned(opponent) : 0
        };

        this.history.push(result);
        this.matchesPlayed++;
        
        if (isWin) {
            this.matchesWon++;
            this.points += result.pointsEarned;
        } else {
            this.matchesLost++;
        }

        this.calculateWinRate();
        this.updatedAt = new Date();
        
        return result;
    }

    // Calculate points earned based on opponent strength
    calculatePointsEarned(opponent) {
        const basePoints = 15; // Higher than singles due to coordination difficulty
        
        // If opponent is another double, compare average ranks
        if (opponent.player1Id && opponent.player2Id) {
            const opponentAvgPoints = opponent.points || 0;
            const multiplier = Math.max(0.5, Math.min(2.0, (opponentAvgPoints / Math.max(this.points, 1))));
            return Math.round(basePoints * multiplier);
        }
        
        return basePoints;
    }

    // Get players info (requires player controller)
    getPlayersInfo(playerController) {
        const player1 = playerController.getPlayerById(this.player1Id);
        const player2 = playerController.getPlayerById(this.player2Id);
        
        return {
            player1: player1 ? player1.getDisplayInfo() : null,
            player2: player2 ? player2.getDisplayInfo() : null,
            isComplete: player1 && player2
        };
    }

    // Get average rank of players
    getAverageRank(playerController) {
        const player1 = playerController.getPlayerById(this.player1Id);
        const player2 = playerController.getPlayerById(this.player2Id);
        
        if (!player1 || !player2) return 'Unknown';
        
        const rankValues = {
            'Beginner': 1,
            'Intermediate': 2,
            'Advanced': 3,
            'Professional': 4
        };
        
        const avgValue = (rankValues[player1.rank] + rankValues[player2.rank]) / 2;
        
        if (avgValue >= 3.5) return 'Professional';
        if (avgValue >= 2.5) return 'Advanced';
        if (avgValue >= 1.5) return 'Intermediate';
        return 'Beginner';
    }

    // Get recent matches
    getRecentMatches(limit = 5) {
        return this.history
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    // Get statistics
    getStatistics() {
        return {
            id: this.id,
            name: this.name,
            points: this.points,
            matchesPlayed: this.matchesPlayed,
            matchesWon: this.matchesWon,
            matchesLost: this.matchesLost,
            winRate: this.winRate,
            totalPointsEarned: this.history.reduce((total, match) => total + (match.pointsEarned || 0), 0),
            averagePointsPerMatch: this.matchesPlayed > 0 ? Math.round(this.points / this.matchesPlayed) : 0
        };
    }

    // Validate double data
    validate(playerController) {
        const errors = [];

        if (!this.player1Id) {
            errors.push('Phải chọn vận động viên thứ nhất');
        }

        if (!this.player2Id) {
            errors.push('Phải chọn vận động viên thứ hai');
        }

        if (this.player1Id === this.player2Id) {
            errors.push('Không thể chọn cùng một vận động viên cho cả hai vị trí');
        }

        // Check if players exist
        if (playerController) {
            const player1 = playerController.getPlayerById(this.player1Id);
            const player2 = playerController.getPlayerById(this.player2Id);

            if (this.player1Id && !player1) {
                errors.push('Vận động viên thứ nhất không tồn tại');
            }

            if (this.player2Id && !player2) {
                errors.push('Vận động viên thứ hai không tồn tại');
            }
        }

        if (!this.name || this.name.trim().length < 2) {
            errors.push('Tên cặp đôi phải có ít nhất 2 ký tự');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Check if this double can compete (both players available)
    canCompete(playerController) {
        const player1 = playerController.getPlayerById(this.player1Id);
        const player2 = playerController.getPlayerById(this.player2Id);
        return player1 && player2 && this.isActive;
    }

    // Deactivate double
    deactivate() {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    // Activate double
    activate() {
        this.isActive = true;
        this.updatedAt = new Date();
    }

    // Export to JSON
    toJSON() {
        return {
            id: this.id,
            player1Id: this.player1Id,
            player2Id: this.player2Id,
            name: this.name,
            points: this.points,
            matchesWon: this.matchesWon,
            matchesLost: this.matchesLost,
            matchesPlayed: this.matchesPlayed,
            winRate: this.winRate,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            history: this.history,
            isActive: this.isActive
        };
    }

    // Create from JSON
    static fromJSON(data) {
        const double = new Double(data.id, data.player1Id, data.player2Id, data.name);
        double.points = data.points || 0;
        double.matchesWon = data.matchesWon || 0;
        double.matchesLost = data.matchesLost || 0;
        double.matchesPlayed = data.matchesPlayed || 0;
        double.winRate = data.winRate || 0;
        double.createdAt = new Date(data.createdAt);
        double.updatedAt = new Date(data.updatedAt);
        double.history = data.history || [];
        double.isActive = data.isActive !== undefined ? data.isActive : true;
        return double;
    }

    // Clone double
    clone() {
        return Double.fromJSON(this.toJSON());
    }

    // Get display info
    getDisplayInfo(playerController = null) {
        const displayInfo = {
            id: this.id,
            name: this.name,
            points: this.points,
            winRate: this.winRate + '%',
            matchRecord: `${this.matchesWon}W-${this.matchesLost}L`,
            status: this.getStatus(),
            isActive: this.isActive
        };

        if (playerController) {
            const playersInfo = this.getPlayersInfo(playerController);
            displayInfo.player1Name = playersInfo.player1 ? playersInfo.player1.name : 'Unknown';
            displayInfo.player2Name = playersInfo.player2 ? playersInfo.player2.name : 'Unknown';
            displayInfo.averageRank = this.getAverageRank(playerController);
            displayInfo.isComplete = playersInfo.isComplete;
        }

        return displayInfo;
    }

    getStatus() {
        if (!this.isActive) return 'Không hoạt động';
        if (this.matchesPlayed === 0) return 'Mới';
        if (this.winRate >= 80) return 'Xuất sắc';
        if (this.winRate >= 60) return 'Tốt';
        if (this.winRate >= 40) return 'Trung bình';
        return 'Cần cải thiện';
    }

    // Search functionality
    matchesSearch(searchTerm, playerController = null) {
        const term = searchTerm.toLowerCase();
        let matches = this.name.toLowerCase().includes(term);

        if (playerController) {
            const player1 = playerController.getPlayerById(this.player1Id);
            const player2 = playerController.getPlayerById(this.player2Id);
            
            if (player1) {
                matches = matches || player1.name.toLowerCase().includes(term);
            }
            if (player2) {
                matches = matches || player2.name.toLowerCase().includes(term);
            }
        }

        return matches;
    }

    // Check if player is part of this double
    hasPlayer(playerId) {
        return this.player1Id === playerId || this.player2Id === playerId;
    }

    // Get partner of a specific player
    getPartner(playerId) {
        if (this.player1Id === playerId) return this.player2Id;
        if (this.player2Id === playerId) return this.player1Id;
        return null;
    }
}
