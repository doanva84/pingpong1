class Team {
    constructor(id, name, player1Id, player2Id, player3Id, player4Id = null) {
        this.id = id || this.generateId();
        this.name = name;
        this.player1Id = player1Id; // Captain
        this.player2Id = player2Id;
        this.player3Id = player3Id;
        this.player4Id = player4Id; // Optional 4th player
        this.points = 0;
        this.matchesWon = 0;
        this.matchesLost = 0;
        this.matchesPlayed = 0;
        this.winRate = 0;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.history = []; // Match history
        this.isActive = true;
        this.description = '';
    }

    generateId() {
        return 'team_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Get all player IDs
    getPlayerIds() {
        const ids = [this.player1Id, this.player2Id, this.player3Id];
        if (this.player4Id) {
            ids.push(this.player4Id);
        }
        return ids.filter(id => id); // Remove null/undefined
    }

    // Get number of players
    getPlayerCount() {
        return this.getPlayerIds().length;
    }

    // Check if team has minimum required players (3)
    hasMinimumPlayers() {
        return this.getPlayerCount() >= 3;
    }

    // Check if team is full (4 players)
    isFull() {
        return this.getPlayerCount() === 4;
    }

    // Add player to team
    addPlayer(playerId) {
        if (this.isFull()) {
            throw new Error('Đội đã đủ 4 người');
        }

        if (this.hasPlayer(playerId)) {
            throw new Error('Người chơi đã có trong đội');
        }

        if (!this.player1Id) {
            this.player1Id = playerId;
        } else if (!this.player2Id) {
            this.player2Id = playerId;
        } else if (!this.player3Id) {
            this.player3Id = playerId;
        } else if (!this.player4Id) {
            this.player4Id = playerId;
        }

        this.updatedAt = new Date();
        return true;
    }

    // Remove player from team
    removePlayer(playerId) {
        if (this.player1Id === playerId) {
            // If removing captain, promote next player
            this.player1Id = this.player2Id;
            this.player2Id = this.player3Id;
            this.player3Id = this.player4Id;
            this.player4Id = null;
        } else if (this.player2Id === playerId) {
            this.player2Id = this.player3Id;
            this.player3Id = this.player4Id;
            this.player4Id = null;
        } else if (this.player3Id === playerId) {
            this.player3Id = this.player4Id;
            this.player4Id = null;
        } else if (this.player4Id === playerId) {
            this.player4Id = null;
        } else {
            return false; // Player not found
        }

        this.updatedAt = new Date();
        return true;
    }

    // Check if player is in team
    hasPlayer(playerId) {
        return this.getPlayerIds().includes(playerId);
    }

    // Get captain (player1)
    getCaptainId() {
        return this.player1Id;
    }

    // Set captain
    setCaptain(playerId) {
        if (!this.hasPlayer(playerId)) {
            throw new Error('Người chơi không có trong đội');
        }

        // Remove player from current position
        this.removePlayer(playerId);
        
        // Move current captain to empty slot
        const oldCaptain = this.player1Id;
        this.player1Id = playerId;
        
        if (oldCaptain) {
            this.addPlayer(oldCaptain);
        }

        this.updatedAt = new Date();
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
            matchType: 'teams',
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
        const basePoints = 20; // Higher than doubles due to team coordination
        
        if (opponent.points !== undefined) {
            const opponentPoints = opponent.points || 0;
            const multiplier = Math.max(0.5, Math.min(2.0, (opponentPoints / Math.max(this.points, 1))));
            return Math.round(basePoints * multiplier);
        }
        
        return basePoints;
    }

    // Get players info (requires player controller)
    getPlayersInfo(playerController) {
        const playerIds = this.getPlayerIds();
        const players = [];

        for (const playerId of playerIds) {
            const player = playerController.getPlayerById(playerId);
            players.push(player ? player.getDisplayInfo() : null);
        }

        return {
            players,
            validPlayers: players.filter(p => p !== null),
            isComplete: players.length >= 3 && players.every(p => p !== null)
        };
    }

    // Get average rank of team
    getAverageRank(playerController) {
        const playerIds = this.getPlayerIds();
        const players = playerIds.map(id => playerController.getPlayerById(id)).filter(p => p);
        
        if (players.length === 0) return 'Unknown';
        
        const rankValues = {
            'Beginner': 1,
            'Intermediate': 2,
            'Advanced': 3,
            'Professional': 4
        };
        
        const avgValue = players.reduce((sum, player) => sum + rankValues[player.rank], 0) / players.length;
        
        if (avgValue >= 3.5) return 'Professional';
        if (avgValue >= 2.5) return 'Advanced';
        if (avgValue >= 1.5) return 'Intermediate';
        return 'Beginner';
    }

    // Get team strength (average points of players)
    getTeamStrength(playerController) {
        const playerIds = this.getPlayerIds();
        const players = playerIds.map(id => playerController.getPlayerById(id)).filter(p => p);
        
        if (players.length === 0) return 0;
        
        const totalPoints = players.reduce((sum, player) => sum + player.points, 0);
        return Math.round(totalPoints / players.length);
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
            playerCount: this.getPlayerCount(),
            points: this.points,
            matchesPlayed: this.matchesPlayed,
            matchesWon: this.matchesWon,
            matchesLost: this.matchesLost,
            winRate: this.winRate,
            totalPointsEarned: this.history.reduce((total, match) => total + (match.pointsEarned || 0), 0),
            averagePointsPerMatch: this.matchesPlayed > 0 ? Math.round(this.points / this.matchesPlayed) : 0
        };
    }

    // Validate team data
    validate(playerController) {
        const errors = [];

        if (!this.name || this.name.trim().length < 2) {
            errors.push('Tên đội phải có ít nhất 2 ký tự');
        }

        if (!this.hasMinimumPlayers()) {
            errors.push('Đội phải có ít nhất 3 người chơi');
        }

        // Check for duplicate players
        const playerIds = this.getPlayerIds();
        const uniqueIds = [...new Set(playerIds)];
        if (playerIds.length !== uniqueIds.length) {
            errors.push('Không thể có cùng một người chơi trong đội nhiều lần');
        }

        // Check if players exist
        if (playerController) {
            for (const playerId of playerIds) {
                const player = playerController.getPlayerById(playerId);
                if (!player) {
                    errors.push(`Người chơi với ID ${playerId} không tồn tại`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Check if this team can compete
    canCompete(playerController) {
        if (!this.isActive || !this.hasMinimumPlayers()) {
            return false;
        }

        const playerIds = this.getPlayerIds();
        for (const playerId of playerIds) {
            const player = playerController.getPlayerById(playerId);
            if (!player) {
                return false;
            }
        }

        return true;
    }

    // Deactivate team
    deactivate() {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    // Activate team
    activate() {
        this.isActive = true;
        this.updatedAt = new Date();
    }

    // Export to JSON
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            player1Id: this.player1Id,
            player2Id: this.player2Id,
            player3Id: this.player3Id,
            player4Id: this.player4Id,
            points: this.points,
            matchesWon: this.matchesWon,
            matchesLost: this.matchesLost,
            matchesPlayed: this.matchesPlayed,
            winRate: this.winRate,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            history: this.history,
            isActive: this.isActive,
            description: this.description
        };
    }

    // Create from JSON
    static fromJSON(data) {
        const team = new Team(data.id, data.name, data.player1Id, data.player2Id, data.player3Id, data.player4Id);
        team.points = data.points || 0;
        team.matchesWon = data.matchesWon || 0;
        team.matchesLost = data.matchesLost || 0;
        team.matchesPlayed = data.matchesPlayed || 0;
        team.winRate = data.winRate || 0;
        team.createdAt = new Date(data.createdAt);
        team.updatedAt = new Date(data.updatedAt);
        team.history = data.history || [];
        team.isActive = data.isActive !== undefined ? data.isActive : true;
        team.description = data.description || '';
        return team;
    }

    // Clone team
    clone() {
        return Team.fromJSON(this.toJSON());
    }

    // Get display info
    getDisplayInfo(playerController = null) {
        const displayInfo = {
            id: this.id,
            name: this.name,
            playerCount: this.getPlayerCount(),
            points: this.points,
            winRate: this.winRate + '%',
            matchRecord: `${this.matchesWon}W-${this.matchesLost}L`,
            status: this.getStatus(),
            isActive: this.isActive,
            description: this.description
        };

        if (playerController) {
            const playersInfo = this.getPlayersInfo(playerController);
            displayInfo.playerNames = playersInfo.validPlayers.map(p => p.name);
            displayInfo.captainName = this.player1Id ? 
                (playerController.getPlayerById(this.player1Id)?.name || 'Unknown') : 'Unknown';
            displayInfo.averageRank = this.getAverageRank(playerController);
            displayInfo.teamStrength = this.getTeamStrength(playerController);
            displayInfo.isComplete = playersInfo.isComplete;
        }

        return displayInfo;
    }

    getStatus() {
        if (!this.isActive) return 'Không hoạt động';
        if (!this.hasMinimumPlayers()) return 'Thiếu người';
        if (this.matchesPlayed === 0) return 'Mới';
        if (this.winRate >= 80) return 'Xuất sắc';
        if (this.winRate >= 60) return 'Tốt';
        if (this.winRate >= 40) return 'Trung bình';
        return 'Cần cải thiện';
    }

    // Search functionality
    matchesSearch(searchTerm, playerController = null) {
        const term = searchTerm.toLowerCase();
        let matches = this.name.toLowerCase().includes(term) ||
                     this.description.toLowerCase().includes(term);

        if (playerController) {
            const playerIds = this.getPlayerIds();
            for (const playerId of playerIds) {
                const player = playerController.getPlayerById(playerId);
                if (player && player.name.toLowerCase().includes(term)) {
                    matches = true;
                    break;
                }
            }
        }

        return matches;
    }

    // Get formation options for matches
    getFormations() {
        const playerIds = this.getPlayerIds();
        const formations = [];

        // Singles formations (each player can play singles)
        for (const playerId of playerIds) {
            formations.push({
                type: 'singles',
                players: [playerId],
                description: `${playerId} (Đơn)`
            });
        }

        // Doubles formations
        if (playerIds.length >= 2) {
            for (let i = 0; i < playerIds.length; i++) {
                for (let j = i + 1; j < playerIds.length; j++) {
                    formations.push({
                        type: 'doubles',
                        players: [playerIds[i], playerIds[j]],
                        description: `${playerIds[i]} & ${playerIds[j]} (Đôi)`
                    });
                }
            }
        }

        return formations;
    }
}
