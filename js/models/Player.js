class Player {
    constructor(id, name, email, address, rank = 'Beginner') {
        this.id = id || this.generateId();
        this.name = name;
        this.email = email;
        this.address = address;
        this.rank = rank; // Beginner, Intermediate, Advanced, Professional
        this.points = 0;
        this.matchesWon = 0;
        this.matchesLost = 0;
        this.matchesPlayed = 0;
        this.winRate = 0;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.history = []; // Match history
    }

    generateId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Calculate win rate
    calculateWinRate() {
        if (this.matchesPlayed === 0) return 0;
        this.winRate = Math.round((this.matchesWon / this.matchesPlayed) * 100);
        return this.winRate;
    }

    // Add match result
    addMatchResult(isWin, opponent, matchType, score, date = new Date()) {
        const result = {
            id: 'match_' + Date.now(),
            isWin,
            opponent,
            matchType, // 'singles', 'doubles', 'teams'
            score,
            date,
            pointsEarned: isWin ? this.calculatePointsEarned(opponent, matchType) : 0
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

    // Calculate points earned based on opponent rank and match type
    calculatePointsEarned(opponent, matchType) {
        const basePoints = {
            'singles': 10,
            'doubles': 8,
            'teams': 6
        };

        const rankMultiplier = {
            'Beginner': 1,
            'Intermediate': 1.2,
            'Advanced': 1.5,
            'Professional': 2
        };

        const opponentRank = opponent.rank || 'Beginner';
        return Math.round(basePoints[matchType] * rankMultiplier[opponentRank]);
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
            rank: this.rank,
            points: this.points,
            matchesPlayed: this.matchesPlayed,
            matchesWon: this.matchesWon,
            matchesLost: this.matchesLost,
            winRate: this.winRate,
            totalPointsEarned: this.history.reduce((total, match) => total + (match.pointsEarned || 0), 0)
        };
    }

    // Update rank based on points
    updateRank() {
        const oldRank = this.rank;
        
        if (this.points >= 1000) {
            this.rank = 'Professional';
        } else if (this.points >= 500) {
            this.rank = 'Advanced';
        } else if (this.points >= 200) {
            this.rank = 'Intermediate';
        } else {
            this.rank = 'Beginner';
        }

        if (oldRank !== this.rank) {
            this.updatedAt = new Date();
            return true; // Rank changed
        }
        return false;
    }

    // Validate player data
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length < 2) {
            errors.push('Tên phải có ít nhất 2 ký tự');
        }

        if (!this.email || !this.isValidEmail(this.email)) {
            errors.push('Email không hợp lệ');
        }

        if (!this.address || this.address.trim().length < 5) {
            errors.push('Địa chỉ phải có ít nhất 5 ký tự');
        }

        const validRanks = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
        if (!validRanks.includes(this.rank)) {
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

    // Export to JSON
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            address: this.address,
            rank: this.rank,
            points: this.points,
            matchesWon: this.matchesWon,
            matchesLost: this.matchesLost,
            matchesPlayed: this.matchesPlayed,
            winRate: this.winRate,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            history: this.history
        };
    }

    // Create from JSON
    static fromJSON(data) {
        const player = new Player(data.id, data.name, data.email, data.address, data.rank);
        player.points = data.points || 0;
        player.matchesWon = data.matchesWon || 0;
        player.matchesLost = data.matchesLost || 0;
        player.matchesPlayed = data.matchesPlayed || 0;
        player.winRate = data.winRate || 0;
        player.createdAt = new Date(data.createdAt);
        player.updatedAt = new Date(data.updatedAt);
        player.history = data.history || [];
        return player;
    }

    // Clone player
    clone() {
        return Player.fromJSON(this.toJSON());
    }

    // Get display info
    getDisplayInfo() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            address: this.address,
            rank: this.rank,
            points: this.points,
            winRate: this.winRate + '%',
            matchRecord: `${this.matchesWon}W-${this.matchesLost}L`,
            status: this.getStatus()
        };
    }

    getStatus() {
        if (this.matchesPlayed === 0) return 'Mới';
        if (this.winRate >= 80) return 'Xuất sắc';
        if (this.winRate >= 60) return 'Tốt';
        if (this.winRate >= 40) return 'Trung bình';
        return 'Cần cải thiện';
    }

    // Search functionality
    matchesSearch(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.name.toLowerCase().includes(term) ||
               this.email.toLowerCase().includes(term) ||
               this.address.toLowerCase().includes(term) ||
               this.rank.toLowerCase().includes(term);
    }
}
