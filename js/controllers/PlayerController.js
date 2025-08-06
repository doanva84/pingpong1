class PlayerController {
    constructor() {
        this.players = [];
        this.storageKey = 'pingpong_players';
        this.loadFromStorage();
    }

    // Create new player
    createPlayer(name, email, address, rank = 'Beginner') {
        const player = new Player(null, name, email, address, rank);
        const validation = player.validate();
        
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        // Check for duplicate email
        if (this.getPlayerByEmail(email)) {
            throw new Error('Email đã tồn tại');
        }

        this.players.push(player);
        this.saveToStorage();
        this.notifyChange('player_created', player);
        
        return player;
    }

    // Get player by ID
    getPlayerById(id) {
        return this.players.find(player => player.id === id) || null;
    }

    // Get player by email
    getPlayerByEmail(email) {
        return this.players.find(player => player.email === email) || null;
    }

    // Get all players
    getAllPlayers() {
        return [...this.players];
    }

    // Get active players (players who have played recently or are available)
    getActivePlayers() {
        return this.players.filter(player => {
            // Consider players active if they've played in the last 6 months or are new
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            return player.createdAt > sixMonthsAgo || 
                   player.history.some(match => new Date(match.date) > sixMonthsAgo);
        });
    }

    // Update player
    updatePlayer(id, data) {
        const player = this.getPlayerById(id);
        if (!player) {
            throw new Error('Không tìm thấy vận động viên');
        }

        // Check email uniqueness if email is being changed
        if (data.email && data.email !== player.email && this.getPlayerByEmail(data.email)) {
            throw new Error('Email đã tồn tại');
        }

        // Update fields
        if (data.name !== undefined) player.name = data.name;
        if (data.email !== undefined) player.email = data.email;
        if (data.address !== undefined) player.address = data.address;
        if (data.rank !== undefined) player.rank = data.rank;

        player.updatedAt = new Date();

        // Validate updated player
        const validation = player.validate();
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        this.saveToStorage();
        this.notifyChange('player_updated', player);
        
        return player;
    }

    // Delete player
    deletePlayer(id) {
        const index = this.players.findIndex(player => player.id === id);
        if (index === -1) {
            throw new Error('Không tìm thấy vận động viên');
        }

        const player = this.players[index];
        this.players.splice(index, 1);
        this.saveToStorage();
        this.notifyChange('player_deleted', player);
        
        return true;
    }

    // Search players
    searchPlayers(searchTerm, rankFilter = null) {
        let results = this.players;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(player => player.matchesSearch(term));
        }

        if (rankFilter) {
            results = results.filter(player => player.rank === rankFilter);
        }

        return results;
    }

    // Get players by rank
    getPlayersByRank(rank) {
        return this.players.filter(player => player.rank === rank);
    }

    // Get player statistics
    getPlayerStatistics(id) {
        const player = this.getPlayerById(id);
        if (!player) {
            throw new Error('Không tìm thấy vận động viên');
        }

        return player.getStatistics();
    }

    // Update player after match
    updatePlayerAfterMatch(playerId, isWin, opponent, matchType, score, date = new Date()) {
        const player = this.getPlayerById(playerId);
        if (!player) {
            throw new Error('Không tìm thấy vận động viên');
        }

        const matchResult = player.addMatchResult(isWin, opponent, matchType, score, date);
        const rankChanged = player.updateRank();

        this.saveToStorage();
        this.notifyChange('player_match_result', { player, matchResult, rankChanged });

        return { matchResult, rankChanged };
    }

    // Get top players by points
    getTopPlayersByPoints(limit = 10) {
        return [...this.players]
            .sort((a, b) => b.points - a.points)
            .slice(0, limit);
    }

    // Get top players by win rate
    getTopPlayersByWinRate(limit = 10, minMatches = 5) {
        return [...this.players]
            .filter(player => player.matchesPlayed >= minMatches)
            .sort((a, b) => b.winRate - a.winRate)
            .slice(0, limit);
    }

    // Get recent match results
    getRecentMatchResults(limit = 20) {
        const allMatches = [];
        
        this.players.forEach(player => {
            player.history.forEach(match => {
                allMatches.push({
                    ...match,
                    playerId: player.id,
                    playerName: player.name
                });
            });
        });

        return allMatches
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    // Get match history for player
    getPlayerMatchHistory(playerId, limit = null) {
        const player = this.getPlayerById(playerId);
        if (!player) {
            throw new Error('Không tìm thấy vận động viên');
        }

        const history = player.getRecentMatches(limit || player.history.length);
        return history.map(match => ({
            ...match,
            playerName: player.name
        }));
    }

    // Import players from data
    importPlayers(playersData) {
        const importedPlayers = [];
        const errors = [];

        playersData.forEach((data, index) => {
            try {
                const player = Player.fromJSON(data);
                const validation = player.validate();
                
                if (!validation.isValid) {
                    errors.push(`Dòng ${index + 1}: ${validation.errors.join(', ')}`);
                    return;
                }

                // Check for duplicate email
                if (this.getPlayerByEmail(player.email)) {
                    errors.push(`Dòng ${index + 1}: Email ${player.email} đã tồn tại`);
                    return;
                }

                this.players.push(player);
                importedPlayers.push(player);
            } catch (error) {
                errors.push(`Dòng ${index + 1}: ${error.message}`);
            }
        });

        if (importedPlayers.length > 0) {
            this.saveToStorage();
            this.notifyChange('players_imported', importedPlayers);
        }

        return {
            imported: importedPlayers.length,
            errors: errors
        };
    }

    // Export players to data
    exportPlayers() {
        return this.players.map(player => player.toJSON());
    }

    // Clear all players
    clearAllPlayers() {
        const count = this.players.length;
        this.players = [];
        this.saveToStorage();
        this.notifyChange('players_cleared', { count });
        return count;
    }

    // Generate sample players
    generateSamplePlayers() {
        const samplePlayers = [
            { name: 'Nguyễn Văn A', email: 'nva@email.com', address: 'Hà Nội', rank: 'Advanced' },
            { name: 'Trần Thị B', email: 'ttb@email.com', address: 'Hồ Chí Minh', rank: 'Professional' },
            { name: 'Lê Văn C', email: 'lvc@email.com', address: 'Đà Nẵng', rank: 'Intermediate' },
            { name: 'Phạm Thị D', email: 'ptd@email.com', address: 'Hải Phòng', rank: 'Beginner' },
            { name: 'Hoàng Văn E', email: 'hve@email.com', address: 'Cần Thơ', rank: 'Intermediate' },
            { name: 'Vũ Thị F', email: 'vtf@email.com', address: 'Huế', rank: 'Advanced' },
            { name: 'Đỗ Văn G', email: 'dvg@email.com', address: 'Nha Trang', rank: 'Beginner' },
            { name: 'Bùi Thị H', email: 'bth@email.com', address: 'Vũng Tàu', rank: 'Professional' }
        ];

        const created = [];
        samplePlayers.forEach(data => {
            try {
                if (!this.getPlayerByEmail(data.email)) {
                    const player = this.createPlayer(data.name, data.email, data.address, data.rank);
                    // Add some sample points and matches
                    player.points = Math.floor(Math.random() * 500) + 50;
                    player.matchesPlayed = Math.floor(Math.random() * 20) + 5;
                    player.matchesWon = Math.floor(player.matchesPlayed * (Math.random() * 0.6 + 0.2));
                    player.matchesLost = player.matchesPlayed - player.matchesWon;
                    player.calculateWinRate();
                    created.push(player);
                }
            } catch (error) {
                console.error('Error creating sample player:', error);
            }
        });

        if (created.length > 0) {
            this.saveToStorage();
            this.notifyChange('sample_players_created', created);
        }

        return created;
    }

    // Get statistics summary
    getStatisticsSummary() {
        const totalPlayers = this.players.length;
        const rankCounts = {
            'Beginner': 0,
            'Intermediate': 0,
            'Advanced': 0,
            'Professional': 0
        };

        let totalMatches = 0;
        let totalPoints = 0;

        this.players.forEach(player => {
            rankCounts[player.rank]++;
            totalMatches += player.matchesPlayed;
            totalPoints += player.points;
        });

        return {
            totalPlayers,
            rankCounts,
            totalMatches,
            totalPoints,
            averagePointsPerPlayer: totalPlayers > 0 ? Math.round(totalPoints / totalPlayers) : 0,
            averageMatchesPerPlayer: totalPlayers > 0 ? Math.round(totalMatches / totalPlayers) : 0
        };
    }

    // Storage methods
    saveToStorage() {
        try {
            const data = this.exportPlayers();
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving players to storage:', error);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const playersData = JSON.parse(data);
                this.players = playersData.map(playerData => Player.fromJSON(playerData));
            }
        } catch (error) {
            console.error('Error loading players from storage:', error);
            this.players = [];
        }
    }

    // Event notification
    notifyChange(eventType, data) {
        const event = new CustomEvent('playerControllerChange', {
            detail: { eventType, data }
        });
        document.dispatchEvent(event);
    }

    // Validation helpers
    validatePlayerData(data) {
        const errors = [];

        if (!data.name || data.name.trim().length < 2) {
            errors.push('Tên phải có ít nhất 2 ký tự');
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Email không hợp lệ');
        }

        if (!data.address || data.address.trim().length < 5) {
            errors.push('Địa chỉ phải có ít nhất 5 ký tự');
        }

        const validRanks = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
        if (data.rank && !validRanks.includes(data.rank)) {
            errors.push('Hạng không hợp lệ');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
