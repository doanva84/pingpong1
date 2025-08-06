class Match {
    constructor(id, type, participant1, participant2, tournamentId = null) {
        this.id = id || this.generateId();
        this.type = type; // 'singles', 'doubles', 'teams'
        this.participant1 = participant1; // Player/Double/Team ID
        this.participant2 = participant2; // Player/Double/Team ID
        this.tournamentId = tournamentId;
        this.status = 'scheduled'; // 'scheduled', 'in-progress', 'completed', 'cancelled', 'postponed'
        this.winner = null;
        this.score = {
            sets: [], // Array of set scores
            participant1Points: 0,
            participant2Points: 0,
            totalSets1: 0,
            totalSets2: 0
        };
        this.scheduledDate = null;
        this.startTime = null;
        this.endTime = null;
        this.venue = '';
        this.referee = '';
        this.notes = '';
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.round = 1;
        this.matchNumber = null;
        this.metadata = {
            bestOf: 5, // Best of 5 sets by default
            winningScore: 11, // 11 points to win a set
            minWinMargin: 2, // Must win by at least 2 points
            maxScore: 21, // Maximum score in a set (deuce rules)
            timeLimit: null, // Time limit in minutes
            breaks: [] // Break times
        };
    }

    generateId() {
        return 'match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Start match
    start() {
        if (this.status !== 'scheduled') {
            throw new Error('Chỉ có thể bắt đầu trận đấu đã được lên lịch');
        }

        this.status = 'in-progress';
        this.startTime = new Date();
        this.updatedAt = new Date();
        
        // Initialize first set if no sets exist
        if (this.score.sets.length === 0) {
            this.addSet();
        }

        return true;
    }

    // End match
    end(winner = null) {
        if (this.status !== 'in-progress') {
            throw new Error('Chỉ có thể kết thúc trận đấu đang diễn ra');
        }

        this.status = 'completed';
        this.endTime = new Date();
        this.winner = winner || this.calculateWinner();
        this.updatedAt = new Date();
        
        this.calculateFinalScore();
        return true;
    }

    // Cancel match
    cancel(reason = '') {
        if (this.status === 'completed') {
            throw new Error('Không thể hủy trận đấu đã kết thúc');
        }

        this.status = 'cancelled';
        this.notes = reason ? `Hủy: ${reason}` : 'Đã hủy';
        this.updatedAt = new Date();
        return true;
    }

    // Postpone match
    postpone(newDate = null, reason = '') {
        if (this.status === 'completed' || this.status === 'cancelled') {
            throw new Error('Không thể hoãn trận đấu đã kết thúc hoặc đã hủy');
        }

        this.status = 'postponed';
        if (newDate) {
            this.scheduledDate = new Date(newDate);
        }
        this.notes = reason ? `Hoãn: ${reason}` : 'Đã hoãn';
        this.updatedAt = new Date();
        return true;
    }

    // Reschedule match
    reschedule(newDate, newVenue = null) {
        if (this.status === 'completed') {
            throw new Error('Không thể sắp xếp lại lịch cho trận đấu đã kết thúc');
        }

        this.scheduledDate = new Date(newDate);
        if (newVenue) {
            this.venue = newVenue;
        }
        
        if (this.status === 'postponed') {
            this.status = 'scheduled';
        }
        
        this.updatedAt = new Date();
        return true;
    }

    // Add new set
    addSet() {
        const setNumber = this.score.sets.length + 1;
        const newSet = {
            setNumber,
            participant1Score: 0,
            participant2Score: 0,
            winner: null,
            completed: false,
            startTime: new Date(),
            endTime: null
        };
        
        this.score.sets.push(newSet);
        this.updatedAt = new Date();
        return newSet;
    }

    // Update current set score
    updateCurrentSetScore(participant1Score, participant2Score) {
        if (this.status !== 'in-progress') {
            throw new Error('Chỉ có thể cập nhật điểm khi trận đấu đang diễn ra');
        }

        const currentSet = this.getCurrentSet();
        if (!currentSet || currentSet.completed) {
            throw new Error('Không có set nào đang diễn ra');
        }

        currentSet.participant1Score = Math.max(0, participant1Score);
        currentSet.participant2Score = Math.max(0, participant2Score);
        
        // Check if set is won
        const setWinner = this.checkSetWinner(currentSet);
        if (setWinner) {
            this.completeSet(currentSet, setWinner);
            
            // Check if match is won
            const matchWinner = this.calculateWinner();
            if (matchWinner) {
                this.end(matchWinner);
            } else {
                // Add new set if match continues
                this.addSet();
            }
        }

        this.updatedAt = new Date();
        return currentSet;
    }

    // Get current active set
    getCurrentSet() {
        return this.score.sets.find(set => !set.completed) || null;
    }

    // Check if a set is won
    checkSetWinner(set) {
        const { participant1Score, participant2Score } = set;
        const { winningScore, minWinMargin, maxScore } = this.metadata;

        // Standard win condition
        if (participant1Score >= winningScore && participant1Score - participant2Score >= minWinMargin) {
            return this.participant1;
        }
        if (participant2Score >= winningScore && participant2Score - participant1Score >= minWinMargin) {
            return this.participant2;
        }

        // Deuce situation - need to reach maxScore
        if (participant1Score >= maxScore && participant1Score > participant2Score) {
            return this.participant1;
        }
        if (participant2Score >= maxScore && participant2Score > participant1Score) {
            return this.participant2;
        }

        return null; // No winner yet
    }

    // Complete a set
    completeSet(set, winner) {
        set.winner = winner;
        set.completed = true;
        set.endTime = new Date();
        
        // Update set totals
        if (winner === this.participant1) {
            this.score.totalSets1++;
        } else {
            this.score.totalSets2++;
        }

        return set;
    }

    // Calculate match winner based on sets won
    calculateWinner() {
        const { bestOf } = this.metadata;
        const setsToWin = Math.ceil(bestOf / 2);

        if (this.score.totalSets1 >= setsToWin) {
            return this.participant1;
        }
        if (this.score.totalSets2 >= setsToWin) {
            return this.participant2;
        }

        return null; // No winner yet
    }

    // Calculate final score
    calculateFinalScore() {
        this.score.participant1Points = this.score.sets.reduce((total, set) => total + set.participant1Score, 0);
        this.score.participant2Points = this.score.sets.reduce((total, set) => total + set.participant2Score, 0);
    }

    // Get match duration in minutes
    getDuration() {
        if (!this.startTime) return 0;
        const endTime = this.endTime || new Date();
        return Math.round((endTime - this.startTime) / (1000 * 60));
    }

    // Get score summary
    getScoreSummary() {
        const sets = this.score.sets.map(set => {
            if (!set.completed) return 'In Progress';
            return `${set.participant1Score}-${set.participant2Score}`;
        });

        return {
            sets,
            totalSets: `${this.score.totalSets1}-${this.score.totalSets2}`,
            totalPoints: `${this.score.participant1Points}-${this.score.participant2Points}`,
            currentSet: this.getCurrentSet(),
            winner: this.winner,
            isCompleted: this.status === 'completed'
        };
    }

    // Validate match data
    validate() {
        const errors = [];

        const validTypes = ['singles', 'doubles', 'teams'];
        if (!validTypes.includes(this.type)) {
            errors.push('Loại trận đấu không hợp lệ');
        }

        if (!this.participant1) {
            errors.push('Phải có người tham gia thứ nhất');
        }

        if (!this.participant2) {
            errors.push('Phải có người tham gia thứ hai');
        }

        if (this.participant1 === this.participant2) {
            errors.push('Hai người tham gia không thể giống nhau');
        }

        const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled', 'postponed'];
        if (!validStatuses.includes(this.status)) {
            errors.push('Trạng thái trận đấu không hợp lệ');
        }

        if (this.scheduledDate && new Date(this.scheduledDate) < new Date()) {
            if (this.status === 'scheduled') {
                errors.push('Không thể lên lịch trận đấu trong quá khứ');
            }
        }

        if (this.metadata.bestOf && this.metadata.bestOf < 1) {
            errors.push('Số set tối đa phải ít nhất là 1');
        }

        if (this.metadata.winningScore && this.metadata.winningScore < 1) {
            errors.push('Điểm thắng set phải ít nhất là 1');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Get participants info (requires controllers)
    getParticipantsInfo(playerController, doubleController = null, teamController = null) {
        let participant1Info = null;
        let participant2Info = null;

        switch (this.type) {
            case 'singles':
                participant1Info = playerController.getPlayerById(this.participant1);
                participant2Info = playerController.getPlayerById(this.participant2);
                break;
            case 'doubles':
                if (doubleController) {
                    participant1Info = doubleController.getDoubleById(this.participant1);
                    participant2Info = doubleController.getDoubleById(this.participant2);
                }
                break;
            case 'teams':
                if (teamController) {
                    participant1Info = teamController.getTeamById(this.participant1);
                    participant2Info = teamController.getTeamById(this.participant2);
                }
                break;
        }

        return {
            participant1: participant1Info ? participant1Info.getDisplayInfo() : null,
            participant2: participant2Info ? participant2Info.getDisplayInfo() : null,
            isValid: participant1Info && participant2Info
        };
    }

    // Export to JSON
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            participant1: this.participant1,
            participant2: this.participant2,
            tournamentId: this.tournamentId,
            status: this.status,
            winner: this.winner,
            score: this.score,
            scheduledDate: this.scheduledDate,
            startTime: this.startTime,
            endTime: this.endTime,
            venue: this.venue,
            referee: this.referee,
            notes: this.notes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            round: this.round,
            matchNumber: this.matchNumber,
            metadata: this.metadata
        };
    }

    // Create from JSON
    static fromJSON(data) {
        const match = new Match(data.id, data.type, data.participant1, data.participant2, data.tournamentId);
        match.status = data.status || 'scheduled';
        match.winner = data.winner;
        match.score = data.score || {
            sets: [],
            participant1Points: 0,
            participant2Points: 0,
            totalSets1: 0,
            totalSets2: 0
        };
        match.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;
        match.startTime = data.startTime ? new Date(data.startTime) : null;
        match.endTime = data.endTime ? new Date(data.endTime) : null;
        match.venue = data.venue || '';
        match.referee = data.referee || '';
        match.notes = data.notes || '';
        match.createdAt = new Date(data.createdAt);
        match.updatedAt = new Date(data.updatedAt);
        match.round = data.round || 1;
        match.matchNumber = data.matchNumber;
        match.metadata = {
            bestOf: 5,
            winningScore: 11,
            minWinMargin: 2,
            maxScore: 21,
            timeLimit: null,
            breaks: [],
            ...data.metadata
        };
        return match;
    }

    // Get display info
    getDisplayInfo() {
        const scoreSummary = this.getScoreSummary();
        
        return {
            id: this.id,
            type: this.getTypeDisplay(),
            status: this.getStatusDisplay(),
            scheduledDate: this.scheduledDate ? this.scheduledDate.toLocaleDateString('vi-VN') : 'Chưa xác định',
            venue: this.venue || 'Chưa xác định',
            score: scoreSummary.totalSets,
            sets: scoreSummary.sets,
            winner: this.winner,
            duration: this.getDuration() + ' phút',
            round: this.round,
            matchNumber: this.matchNumber,
            notes: this.notes
        };
    }

    getTypeDisplay() {
        const typeMap = {
            'singles': 'Đơn',
            'doubles': 'Đôi',
            'teams': 'Đồng đội'
        };
        return typeMap[this.type] || this.type;
    }

    getStatusDisplay() {
        const statusMap = {
            'scheduled': 'Đã lên lịch',
            'in-progress': 'Đang diễn ra',
            'completed': 'Đã kết thúc',
            'cancelled': 'Đã hủy',
            'postponed': 'Đã hoãn'
        };
        return statusMap[this.status] || this.status;
    }

    // Search functionality
    matchesSearch(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.venue.toLowerCase().includes(term) ||
               this.referee.toLowerCase().includes(term) ||
               this.notes.toLowerCase().includes(term) ||
               this.type.toLowerCase().includes(term) ||
               this.status.toLowerCase().includes(term);
    }

    // Quick score update methods
    incrementScore(participant, points = 1) {
        const currentSet = this.getCurrentSet();
        if (!currentSet || currentSet.completed) return false;

        if (participant === this.participant1) {
            currentSet.participant1Score += points;
        } else if (participant === this.participant2) {
            currentSet.participant2Score += points;
        } else {
            return false;
        }

        return this.updateCurrentSetScore(currentSet.participant1Score, currentSet.participant2Score);
    }

    decrementScore(participant, points = 1) {
        const currentSet = this.getCurrentSet();
        if (!currentSet || currentSet.completed) return false;

        if (participant === this.participant1) {
            currentSet.participant1Score = Math.max(0, currentSet.participant1Score - points);
        } else if (participant === this.participant2) {
            currentSet.participant2Score = Math.max(0, currentSet.participant2Score - points);
        } else {
            return false;
        }

        return this.updateCurrentSetScore(currentSet.participant1Score, currentSet.participant2Score);
    }
}
