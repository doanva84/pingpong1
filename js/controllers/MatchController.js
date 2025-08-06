// Match Controller - Manages match operations
class MatchController {
    constructor(playerController, doubleController, teamController, tournamentController) {
        this.playerController = playerController;
        this.doubleController = doubleController;
        this.teamController = teamController;
        this.tournamentController = tournamentController;
        this.matches = new Map();
        this.eventHandlers = new Map();
        
        this.loadMatches();
        this.setupEventHandlers();
    }

    // Load matches from storage
    loadMatches() {
        try {
            const stored = Storage.load('matches');
            if (stored && Array.isArray(stored)) {
                stored.forEach(matchData => {
                    const match = new Match(
                        matchData.participant1,
                        matchData.participant2,
                        matchData.tournamentId
                    );
                    
                    // Restore match state
                    match.id = matchData.id;
                    match.status = matchData.status;
                    match.startTime = matchData.startTime ? new Date(matchData.startTime) : null;
                    match.endTime = matchData.endTime ? new Date(matchData.endTime) : null;
                    match.scores = matchData.scores || [];
                    match.winner = matchData.winner || null;
                    match.round = matchData.round || 1;
                    match.courtNumber = matchData.courtNumber || null;
                    match.referee = matchData.referee || null;
                    match.notes = matchData.notes || '';
                    
                    this.matches.set(match.id, match);
                });
            }
        } catch (error) {
            console.error('Error loading matches:', error);
        }
    }

    // Save matches to storage
    saveMatches() {
        try {
            const matchArray = Array.from(this.matches.values()).map(match => ({
                id: match.id,
                participant1: match.participant1,
                participant2: match.participant2,
                tournamentId: match.tournamentId,
                status: match.status,
                startTime: match.startTime,
                endTime: match.endTime,
                scores: match.scores,
                winner: match.winner,
                round: match.round,
                courtNumber: match.courtNumber,
                referee: match.referee,
                notes: match.notes
            }));
            
            Storage.save('matches', matchArray);
            return true;
        } catch (error) {
            console.error('Error saving matches:', error);
            return false;
        }
    }

    // Setup event handlers
    setupEventHandlers() {
        this.eventHandlers.set('create', this.handleCreateMatch.bind(this));
        this.eventHandlers.set('edit', this.handleEditMatch.bind(this));
        this.eventHandlers.set('delete', this.handleDeleteMatch.bind(this));
        this.eventHandlers.set('start', this.handleStartMatch.bind(this));
        this.eventHandlers.set('end', this.handleEndMatch.bind(this));
        this.eventHandlers.set('cancel', this.handleCancelMatch.bind(this));
        this.eventHandlers.set('updateScore', this.handleUpdateScore.bind(this));
        this.eventHandlers.set('schedule', this.handleScheduleMatch.bind(this));
    }

    // Create match
    async createMatch(matchData) {
        try {
            // Validate input
            if (!matchData.participant1 || !matchData.participant2) {
                throw new Error('Cần có 2 người tham gia để tạo trận đấu');
            }

            if (matchData.participant1 === matchData.participant2) {
                throw new Error('Người tham gia không thể tự đấu với mình');
            }

            // Create match
            const match = new Match(
                matchData.participant1,
                matchData.participant2,
                matchData.tournamentId
            );

            // Set additional properties
            if (matchData.round) match.round = matchData.round;
            if (matchData.courtNumber) match.courtNumber = matchData.courtNumber;
            if (matchData.referee) match.referee = matchData.referee;
            if (matchData.notes) match.notes = matchData.notes;
            if (matchData.startTime) match.startTime = new Date(matchData.startTime);

            // Validate match
            if (!match.validate()) {
                throw new Error('Dữ liệu trận đấu không hợp lệ');
            }

            // Store match
            this.matches.set(match.id, match);
            this.saveMatches();

            return match;
        } catch (error) {
            console.error('Error creating match:', error);
            throw error;
        }
    }

    // Get match by ID
    getMatch(id) {
        return this.matches.get(id);
    }

    // Get all matches
    getAllMatches() {
        return Array.from(this.matches.values());
    }

    // Get matches by status
    getMatchesByStatus(status) {
        return this.getAllMatches().filter(match => match.status === status);
    }

    // Get matches by tournament
    getMatchesByTournament(tournamentId) {
        return this.getAllMatches().filter(match => match.tournamentId === tournamentId);
    }

    // Get matches by participant
    getMatchesByParticipant(participantId) {
        return this.getAllMatches().filter(match => 
            match.participant1 === participantId || match.participant2 === participantId
        );
    }

    // Get matches by round
    getMatchesByRound(tournamentId, round) {
        return this.getAllMatches().filter(match => 
            match.tournamentId === tournamentId && match.round === round
        );
    }

    // Update match
    async updateMatch(id, updateData) {
        try {
            const match = this.matches.get(id);
            if (!match) {
                throw new Error('Không tìm thấy trận đấu');
            }

            // Prevent updating completed matches
            if (match.status === 'completed' && updateData.status !== 'completed') {
                throw new Error('Không thể cập nhật trận đấu đã hoàn thành');
            }

            // Update properties
            Object.keys(updateData).forEach(key => {
                if (key in match && updateData[key] !== undefined) {
                    if (key === 'startTime' || key === 'endTime') {
                        match[key] = new Date(updateData[key]);
                    } else {
                        match[key] = updateData[key];
                    }
                }
            });

            // Validate updated match
            if (!match.validate()) {
                throw new Error('Dữ liệu trận đấu cập nhật không hợp lệ');
            }

            this.saveMatches();
            return match;
        } catch (error) {
            console.error('Error updating match:', error);
            throw error;
        }
    }

    // Delete match
    async deleteMatch(id) {
        try {
            const match = this.matches.get(id);
            if (!match) {
                throw new Error('Không tìm thấy trận đấu');
            }

            // Check if match can be deleted
            if (match.status === 'in-progress') {
                throw new Error('Không thể xóa trận đấu đang diễn ra');
            }

            this.matches.delete(id);
            this.saveMatches();
            return true;
        } catch (error) {
            console.error('Error deleting match:', error);
            throw error;
        }
    }

    // Start match
    async startMatch(id) {
        try {
            const match = this.matches.get(id);
            if (!match) {
                throw new Error('Không tìm thấy trận đấu');
            }

            if (match.status !== 'scheduled') {
                throw new Error('Chỉ có thể bắt đầu trận đấu đã được lên lịch');
            }

            match.start();
            this.saveMatches();
            return match;
        } catch (error) {
            console.error('Error starting match:', error);
            throw error;
        }
    }

    // End match
    async endMatch(id, winner = null) {
        try {
            const match = this.matches.get(id);
            if (!match) {
                throw new Error('Không tìm thấy trận đấu');
            }

            if (match.status !== 'in-progress') {
                throw new Error('Chỉ có thể kết thúc trận đấu đang diễn ra');
            }

            match.end(winner);
            this.saveMatches();
            return match;
        } catch (error) {
            console.error('Error ending match:', error);
            throw error;
        }
    }

    // Cancel match
    async cancelMatch(id, reason = '') {
        try {
            const match = this.matches.get(id);
            if (!match) {
                throw new Error('Không tìm thấy trận đấu');
            }

            if (match.status === 'completed') {
                throw new Error('Không thể hủy trận đấu đã hoàn thành');
            }

            match.cancel();
            if (reason) {
                match.notes = (match.notes || '') + '\nLý do hủy: ' + reason;
            }
            
            this.saveMatches();
            return match;
        } catch (error) {
            console.error('Error cancelling match:', error);
            throw error;
        }
    }

    // Update match score
    async updateScore(id, scoreData) {
        try {
            const match = this.matches.get(id);
            if (!match) {
                throw new Error('Không tìm thấy trận đấu');
            }

            if (match.status !== 'in-progress') {
                throw new Error('Chỉ có thể cập nhật điểm cho trận đấu đang diễn ra');
            }

            // Validate score data
            if (!scoreData.player1Score && scoreData.player1Score !== 0) {
                throw new Error('Điểm người chơi 1 là bắt buộc');
            }
            if (!scoreData.player2Score && scoreData.player2Score !== 0) {
                throw new Error('Điểm người chơi 2 là bắt buộc');
            }

            // Update score
            match.updateScore(scoreData.player1Score, scoreData.player2Score, scoreData.set);
            
            // Check if match should end
            if (scoreData.isGamePoint) {
                const winner = scoreData.player1Score > scoreData.player2Score ? 
                    match.participant1 : match.participant2;
                match.end(winner);
            }

            this.saveMatches();
            return match;
        } catch (error) {
            console.error('Error updating score:', error);
            throw error;
        }
    }

    // Schedule match
    async scheduleMatch(id, scheduleData) {
        try {
            const match = this.matches.get(id);
            if (!match) {
                throw new Error('Không tìm thấy trận đấu');
            }

            // Update schedule information
            if (scheduleData.startTime) {
                match.startTime = new Date(scheduleData.startTime);
            }
            if (scheduleData.courtNumber) {
                match.courtNumber = scheduleData.courtNumber;
            }
            if (scheduleData.referee) {
                match.referee = scheduleData.referee;
            }

            match.schedule();
            this.saveMatches();
            return match;
        } catch (error) {
            console.error('Error scheduling match:', error);
            throw error;
        }
    }

    // Get match statistics
    getMatchStats(id) {
        const match = this.matches.get(id);
        if (!match) {
            return null;
        }

        return {
            id: match.id,
            status: match.status,
            duration: match.getDuration(),
            totalPoints: match.getTotalScore(),
            winner: match.winner,
            scores: match.scores,
            round: match.round
        };
    }

    // Get participant statistics
    getParticipantStats(participantId) {
        const participantMatches = this.getMatchesByParticipant(participantId);
        
        const stats = {
            totalMatches: participantMatches.length,
            wins: 0,
            losses: 0,
            winRate: 0,
            totalPointsScored: 0,
            totalPointsConceded: 0,
            averagePointsPerMatch: 0,
            currentStreak: 0,
            longestWinStreak: 0,
            recentMatches: []
        };

        let currentStreak = 0;
        let longestStreak = 0;
        let isWinStreak = true;

        participantMatches
            .filter(match => match.status === 'completed')
            .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))
            .forEach((match, index) => {
                const isWinner = match.winner === participantId;
                const isParticipant1 = match.participant1 === participantId;
                
                if (isWinner) {
                    stats.wins++;
                    if (index === 0 || isWinStreak) {
                        currentStreak = isWinStreak ? currentStreak + 1 : 1;
                        isWinStreak = true;
                    }
                } else {
                    stats.losses++;
                    if (index === 0 || !isWinStreak) {
                        currentStreak = !isWinStreak ? currentStreak + 1 : 1;
                        isWinStreak = false;
                    }
                }

                longestStreak = Math.max(longestStreak, currentStreak);

                // Calculate points
                match.scores.forEach(score => {
                    if (isParticipant1) {
                        stats.totalPointsScored += score.player1Score;
                        stats.totalPointsConceded += score.player2Score;
                    } else {
                        stats.totalPointsScored += score.player2Score;
                        stats.totalPointsConceded += score.player1Score;
                    }
                });

                // Add to recent matches (limit to 10)
                if (stats.recentMatches.length < 10) {
                    stats.recentMatches.push({
                        id: match.id,
                        opponent: isParticipant1 ? match.participant2 : match.participant1,
                        result: isWinner ? 'win' : 'loss',
                        date: match.endTime,
                        scores: match.scores
                    });
                }
            });

        stats.winRate = stats.totalMatches > 0 ? stats.wins / stats.totalMatches : 0;
        stats.averagePointsPerMatch = stats.totalMatches > 0 ? 
            stats.totalPointsScored / stats.totalMatches : 0;
        stats.currentStreak = currentStreak;
        stats.longestWinStreak = longestStreak;

        return stats;
    }

    // Handle events
    async handleEvent(eventType, data) {
        const handler = this.eventHandlers.get(eventType);
        if (handler) {
            return await handler(data);
        } else {
            throw new Error(`Unknown event type: ${eventType}`);
        }
    }

    // Event handlers
    async handleCreateMatch(data) {
        return await this.createMatch(data);
    }

    async handleEditMatch(data) {
        return await this.updateMatch(data.id, data.updates);
    }

    async handleDeleteMatch(data) {
        return await this.deleteMatch(data.id);
    }

    async handleStartMatch(data) {
        return await this.startMatch(data.id);
    }

    async handleEndMatch(data) {
        return await this.endMatch(data.id, data.winner);
    }

    async handleCancelMatch(data) {
        return await this.cancelMatch(data.id, data.reason);
    }

    async handleUpdateScore(data) {
        return await this.updateScore(data.id, data.scoreData);
    }

    async handleScheduleMatch(data) {
        return await this.scheduleMatch(data.id, data.scheduleData);
    }

    // Search matches
    searchMatches(query) {
        if (!query) return this.getAllMatches();
        
        const lowerQuery = query.toLowerCase();
        return this.getAllMatches().filter(match => {
            // Get participant names for search
            const participant1Name = this.getParticipantName(match.participant1);
            const participant2Name = this.getParticipantName(match.participant2);
            
            return participant1Name.toLowerCase().includes(lowerQuery) ||
                   participant2Name.toLowerCase().includes(lowerQuery) ||
                   match.status.toLowerCase().includes(lowerQuery) ||
                   (match.notes && match.notes.toLowerCase().includes(lowerQuery));
        });
    }

    // Helper method to get participant name
    getParticipantName(participantId) {
        // Try to find in different collections
        let participant = this.playerController.getPlayer(participantId);
        if (participant) return participant.name;
        
        participant = this.doubleController.getDouble(participantId);
        if (participant) return participant.name;
        
        participant = this.teamController.getTeam(participantId);
        if (participant) return participant.name;
        
        return 'Unknown';
    }

    // Generate match schedule for tournament
    generateTournamentSchedule(tournamentId, startDate, courtCount = 1) {
        const tournamentMatches = this.getMatchesByTournament(tournamentId);
        const schedule = [];
        
        let currentDate = new Date(startDate);
        let currentTime = new Date(currentDate);
        currentTime.setHours(9, 0, 0, 0); // Start at 9 AM
        
        const matchDuration = 60; // minutes per match
        const breakTime = 15; // minutes between matches
        
        tournamentMatches
            .filter(match => match.status === 'pending')
            .sort((a, b) => a.round - b.round)
            .forEach((match, index) => {
                const courtNumber = (index % courtCount) + 1;
                
                // If all courts are busy, move to next time slot
                if (courtNumber === 1 && index >= courtCount) {
                    currentTime.setMinutes(currentTime.getMinutes() + matchDuration + breakTime);
                    
                    // If too late in the day, move to next day
                    if (currentTime.getHours() >= 21) {
                        currentDate.setDate(currentDate.getDate() + 1);
                        currentTime = new Date(currentDate);
                        currentTime.setHours(9, 0, 0, 0);
                    }
                }
                
                match.startTime = new Date(currentTime);
                match.courtNumber = courtNumber;
                match.schedule();
                
                schedule.push({
                    matchId: match.id,
                    startTime: match.startTime,
                    courtNumber: match.courtNumber,
                    participant1: this.getParticipantName(match.participant1),
                    participant2: this.getParticipantName(match.participant2),
                    round: match.round
                });
            });
            
        this.saveMatches();
        return schedule;
    }

    // Get today's matches
    getTodaysMatches() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return this.getAllMatches().filter(match => {
            if (!match.startTime) return false;
            const matchDate = new Date(match.startTime);
            return matchDate >= today && matchDate < tomorrow;
        });
    }

    // Get live matches
    getLiveMatches() {
        return this.getMatchesByStatus('in-progress');
    }
}
