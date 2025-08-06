class Tournament {
    constructor(id, name, type, description = '') {
        this.id = id || this.generateId();
        this.name = name;
        this.type = type; // 'singles', 'doubles', 'teams', 'mixed'
        this.description = description;
        this.startDate = null;
        this.endDate = null;
        this.status = 'planning'; // 'planning', 'registration', 'in-progress', 'completed', 'cancelled'
        this.maxParticipants = null;
        this.registrationDeadline = null;
        this.format = 'round-robin'; // 'round-robin', 'elimination', 'swiss', 'league'
        this.prizes = [];
        this.rules = [];
        this.participants = []; // Array of participant IDs
        this.matches = []; // Array of match IDs
        this.standings = []; // Current standings
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.metadata = {
            venue: '',
            entryFee: 0,
            currency: 'VND',
            contactInfo: '',
            website: '',
            organizer: ''
        };
    }

    generateId() {
        return 'tournament_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Add participant
    addParticipant(participantId) {
        if (this.status !== 'planning' && this.status !== 'registration') {
            throw new Error('Không thể thêm người tham gia khi giải đấu đã bắt đầu');
        }

        if (this.maxParticipants && this.participants.length >= this.maxParticipants) {
            throw new Error('Giải đấu đã đủ số người tham gia');
        }

        if (this.participants.includes(participantId)) {
            throw new Error('Người tham gia đã đăng ký');
        }

        if (this.registrationDeadline && new Date() > new Date(this.registrationDeadline)) {
            throw new Error('Đã hết hạn đăng ký');
        }

        this.participants.push(participantId);
        this.updatedAt = new Date();
        return true;
    }

    // Remove participant
    removeParticipant(participantId) {
        if (this.status === 'in-progress' || this.status === 'completed') {
            throw new Error('Không thể xóa người tham gia khi giải đấu đang diễn ra hoặc đã kết thúc');
        }

        const index = this.participants.indexOf(participantId);
        if (index === -1) {
            return false;
        }

        this.participants.splice(index, 1);
        this.updatedAt = new Date();
        return true;
    }

    // Check if participant is registered
    hasParticipant(participantId) {
        return this.participants.includes(participantId);
    }

    // Get participant count
    getParticipantCount() {
        return this.participants.length;
    }

    // Add match
    addMatch(matchId) {
        if (!this.matches.includes(matchId)) {
            this.matches.push(matchId);
            this.updatedAt = new Date();
        }
    }

    // Remove match
    removeMatch(matchId) {
        const index = this.matches.indexOf(matchId);
        if (index !== -1) {
            this.matches.splice(index, 1);
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    // Start tournament
    start() {
        if (this.status !== 'registration') {
            throw new Error('Giải đấu phải ở trạng thái đăng ký để có thể bắt đầu');
        }

        if (this.participants.length < 2) {
            throw new Error('Cần ít nhất 2 người tham gia để bắt đầu giải đấu');
        }

        this.status = 'in-progress';
        if (!this.startDate) {
            this.startDate = new Date();
        }
        this.updatedAt = new Date();
        
        this.generateMatches();
        return true;
    }

    // Complete tournament
    complete() {
        if (this.status !== 'in-progress') {
            throw new Error('Giải đấu phải đang diễn ra để có thể kết thúc');
        }

        this.status = 'completed';
        this.endDate = new Date();
        this.updatedAt = new Date();
        
        this.calculateFinalStandings();
        return true;
    }

    // Cancel tournament
    cancel() {
        if (this.status === 'completed') {
            throw new Error('Không thể hủy giải đấu đã kết thúc');
        }

        this.status = 'cancelled';
        this.updatedAt = new Date();
        return true;
    }

    // Open registration
    openRegistration() {
        if (this.status !== 'planning') {
            throw new Error('Chỉ có thể mở đăng ký khi giải đấu đang ở trạng thái lên kế hoạch');
        }

        this.status = 'registration';
        this.updatedAt = new Date();
        return true;
    }

    // Generate matches based on format
    generateMatches() {
        this.matches = []; // Clear existing matches
        
        switch (this.format) {
            case 'round-robin':
                this.generateRoundRobinMatches();
                break;
            case 'elimination':
                this.generateEliminationMatches();
                break;
            case 'swiss':
                this.generateSwissMatches();
                break;
            default:
                this.generateRoundRobinMatches();
        }
    }

    // Generate round-robin matches
    generateRoundRobinMatches() {
        const participants = [...this.participants];
        const matches = [];

        for (let i = 0; i < participants.length; i++) {
            for (let j = i + 1; j < participants.length; j++) {
                matches.push({
                    id: `match_${this.id}_${i}_${j}`,
                    tournamentId: this.id,
                    participant1: participants[i],
                    participant2: participants[j],
                    type: this.type,
                    status: 'scheduled',
                    round: 1,
                    createdAt: new Date()
                });
            }
        }

        this.matches = matches.map(m => m.id);
        return matches;
    }

    // Generate elimination matches
    generateEliminationMatches() {
        let participants = [...this.participants];
        
        // Add byes if necessary to make power of 2
        const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(participants.length)));
        while (participants.length < nextPowerOf2) {
            participants.push(null); // Bye
        }

        const matches = [];
        let round = 1;
        let currentParticipants = participants;

        while (currentParticipants.length > 1) {
            const roundMatches = [];
            
            for (let i = 0; i < currentParticipants.length; i += 2) {
                const participant1 = currentParticipants[i];
                const participant2 = currentParticipants[i + 1];
                
                if (participant1 && participant2) {
                    const match = {
                        id: `match_${this.id}_r${round}_${i/2}`,
                        tournamentId: this.id,
                        participant1,
                        participant2,
                        type: this.type,
                        status: 'scheduled',
                        round,
                        createdAt: new Date()
                    };
                    roundMatches.push(match);
                } else if (participant1) {
                    // Bye - participant1 advances automatically
                    roundMatches.push({
                        winner: participant1,
                        bye: true
                    });
                }
            }
            
            matches.push(...roundMatches.filter(m => !m.bye));
            currentParticipants = roundMatches.map(m => m.winner || null).filter(p => p);
            round++;
        }

        this.matches = matches.map(m => m.id);
        return matches;
    }

    // Generate Swiss system matches (simplified)
    generateSwissMatches() {
        // For now, use round-robin as fallback
        // Swiss system is more complex and requires ongoing pairing
        return this.generateRoundRobinMatches();
    }

    // Calculate current standings
    calculateStandings(matchController = null) {
        if (!matchController) {
            return this.standings;
        }

        const participantStats = {};

        // Initialize stats for all participants
        this.participants.forEach(participantId => {
            participantStats[participantId] = {
                id: participantId,
                matchesPlayed: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                points: 0,
                setsWon: 0,
                setsLost: 0,
                gamesWon: 0,
                gamesLost: 0
            };
        });

        // Process completed matches
        this.matches.forEach(matchId => {
            const match = matchController.getMatchById(matchId);
            if (match && match.status === 'completed') {
                const participant1Stats = participantStats[match.participant1];
                const participant2Stats = participantStats[match.participant2];

                if (participant1Stats && participant2Stats) {
                    participant1Stats.matchesPlayed++;
                    participant2Stats.matchesPlayed++;

                    if (match.winner === match.participant1) {
                        participant1Stats.wins++;
                        participant1Stats.points += 3; // 3 points for win
                        participant2Stats.losses++;
                    } else if (match.winner === match.participant2) {
                        participant2Stats.wins++;
                        participant2Stats.points += 3;
                        participant1Stats.losses++;
                    } else {
                        // Draw
                        participant1Stats.draws++;
                        participant2Stats.draws++;
                        participant1Stats.points += 1;
                        participant2Stats.points += 1;
                    }

                    // Calculate set and game stats if available
                    if (match.score && match.score.sets) {
                        const sets1 = match.score.sets.filter(set => set.winner === match.participant1).length;
                        const sets2 = match.score.sets.filter(set => set.winner === match.participant2).length;
                        
                        participant1Stats.setsWon += sets1;
                        participant1Stats.setsLost += sets2;
                        participant2Stats.setsWon += sets2;
                        participant2Stats.setsLost += sets1;

                        // Games within sets
                        match.score.sets.forEach(set => {
                            participant1Stats.gamesWon += set.player1Score || 0;
                            participant1Stats.gamesLost += set.player2Score || 0;
                            participant2Stats.gamesWon += set.player2Score || 0;
                            participant2Stats.gamesLost += set.player1Score || 0;
                        });
                    }
                }
            }
        });

        // Sort standings
        this.standings = Object.values(participantStats).sort((a, b) => {
            // Sort by points, then wins, then set difference, then game difference
            if (b.points !== a.points) return b.points - a.points;
            if (b.wins !== a.wins) return b.wins - a.wins;
            
            const setDiffA = a.setsWon - a.setsLost;
            const setDiffB = b.setsWon - b.setsLost;
            if (setDiffB !== setDiffA) return setDiffB - setDiffA;
            
            const gameDiffA = a.gamesWon - a.gamesLost;
            const gameDiffB = b.gamesWon - b.gamesLost;
            return gameDiffB - gameDiffA;
        });

        return this.standings;
    }

    // Calculate final standings
    calculateFinalStandings(matchController = null) {
        this.calculateStandings(matchController);
        // Add final rankings
        this.standings.forEach((participant, index) => {
            participant.finalRank = index + 1;
        });
        return this.standings;
    }

    // Get tournament progress
    getProgress(matchController = null) {
        if (!matchController) {
            return {
                totalMatches: this.matches.length,
                completedMatches: 0,
                percentage: 0
            };
        }

        const totalMatches = this.matches.length;
        const completedMatches = this.matches.filter(matchId => {
            const match = matchController.getMatchById(matchId);
            return match && match.status === 'completed';
        }).length;

        return {
            totalMatches,
            completedMatches,
            percentage: totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0
        };
    }

    // Validate tournament data
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length < 2) {
            errors.push('Tên giải đấu phải có ít nhất 2 ký tự');
        }

        const validTypes = ['singles', 'doubles', 'teams', 'mixed'];
        if (!validTypes.includes(this.type)) {
            errors.push('Loại giải đấu không hợp lệ');
        }

        const validFormats = ['round-robin', 'elimination', 'swiss', 'league'];
        if (!validFormats.includes(this.format)) {
            errors.push('Định dạng giải đấu không hợp lệ');
        }

        const validStatuses = ['planning', 'registration', 'in-progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(this.status)) {
            errors.push('Trạng thái giải đấu không hợp lệ');
        }

        if (this.startDate && this.endDate && new Date(this.startDate) > new Date(this.endDate)) {
            errors.push('Ngày bắt đầu không thể sau ngày kết thúc');
        }

        if (this.registrationDeadline && this.startDate && 
            new Date(this.registrationDeadline) > new Date(this.startDate)) {
            errors.push('Hạn đăng ký không thể sau ngày bắt đầu');
        }

        if (this.maxParticipants && this.maxParticipants < 2) {
            errors.push('Số người tham gia tối đa phải ít nhất là 2');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Export to JSON
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            description: this.description,
            startDate: this.startDate,
            endDate: this.endDate,
            status: this.status,
            maxParticipants: this.maxParticipants,
            registrationDeadline: this.registrationDeadline,
            format: this.format,
            prizes: this.prizes,
            rules: this.rules,
            participants: this.participants,
            matches: this.matches,
            standings: this.standings,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            metadata: this.metadata
        };
    }

    // Create from JSON
    static fromJSON(data) {
        const tournament = new Tournament(data.id, data.name, data.type, data.description);
        tournament.startDate = data.startDate ? new Date(data.startDate) : null;
        tournament.endDate = data.endDate ? new Date(data.endDate) : null;
        tournament.status = data.status || 'planning';
        tournament.maxParticipants = data.maxParticipants;
        tournament.registrationDeadline = data.registrationDeadline ? new Date(data.registrationDeadline) : null;
        tournament.format = data.format || 'round-robin';
        tournament.prizes = data.prizes || [];
        tournament.rules = data.rules || [];
        tournament.participants = data.participants || [];
        tournament.matches = data.matches || [];
        tournament.standings = data.standings || [];
        tournament.createdAt = new Date(data.createdAt);
        tournament.updatedAt = new Date(data.updatedAt);
        tournament.metadata = data.metadata || {
            venue: '',
            entryFee: 0,
            currency: 'VND',
            contactInfo: '',
            website: '',
            organizer: ''
        };
        return tournament;
    }

    // Get display info
    getDisplayInfo() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            description: this.description,
            startDate: this.startDate ? this.startDate.toLocaleDateString('vi-VN') : 'Chưa xác định',
            endDate: this.endDate ? this.endDate.toLocaleDateString('vi-VN') : 'Chưa xác định',
            status: this.getStatusDisplay(),
            participantCount: this.getParticipantCount(),
            maxParticipants: this.maxParticipants || 'Không giới hạn',
            format: this.getFormatDisplay(),
            venue: this.metadata.venue || 'Chưa xác định',
            entryFee: this.metadata.entryFee ? `${this.metadata.entryFee.toLocaleString()} ${this.metadata.currency}` : 'Miễn phí'
        };
    }

    getStatusDisplay() {
        const statusMap = {
            'planning': 'Đang lên kế hoạch',
            'registration': 'Đang đăng ký',
            'in-progress': 'Đang diễn ra',
            'completed': 'Đã kết thúc',
            'cancelled': 'Đã hủy'
        };
        return statusMap[this.status] || this.status;
    }

    getFormatDisplay() {
        const formatMap = {
            'round-robin': 'Vòng tròn',
            'elimination': 'Loại trực tiếp',
            'swiss': 'Swiss',
            'league': 'Giải đấu'
        };
        return formatMap[this.format] || this.format;
    }

    // Search functionality
    matchesSearch(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.name.toLowerCase().includes(term) ||
               this.description.toLowerCase().includes(term) ||
               this.type.toLowerCase().includes(term) ||
               this.metadata.venue.toLowerCase().includes(term) ||
               this.metadata.organizer.toLowerCase().includes(term);
    }
}
