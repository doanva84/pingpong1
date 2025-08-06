// Tournament Controller - Manages tournament operations
class TournamentController {
    constructor(playerController, doubleController, teamController) {
        this.playerController = playerController;
        this.doubleController = doubleController;
        this.teamController = teamController;
        this.tournaments = new Map();
        this.eventHandlers = new Map();
        this.storage = new Storage();
        
        this.loadTournaments();
        this.setupEventHandlers();
    }

    // Load tournaments from storage
    loadTournaments() {
        try {
            const stored = this.storage.load('tournaments');
            if (stored && Array.isArray(stored)) {
                stored.forEach(tournamentData => {
                    const tournament = new Tournament(
                        tournamentData.name,
                        tournamentData.type,
                        tournamentData.format,
                        tournamentData.maxParticipants
                    );
                    
                    // Restore tournament state
                    tournament.id = tournamentData.id;
                    tournament.status = tournamentData.status;
                    tournament.startDate = new Date(tournamentData.startDate);
                    tournament.endDate = new Date(tournamentData.endDate);
                    tournament.participants = tournamentData.participants || [];
                    tournament.matches = tournamentData.matches || [];
                    tournament.rules = tournamentData.rules || [];
                    tournament.currentRound = tournamentData.currentRound || 1;
                    tournament.bracket = tournamentData.bracket || [];
                    tournament.winner = tournamentData.winner || null;
                    
                    this.tournaments.set(tournament.id, tournament);
                });
            }
        } catch (error) {
            console.error('Error loading tournaments:', error);
        }
    }

    // Save tournaments to storage
    saveTournaments() {
        try {
            const tournamentArray = Array.from(this.tournaments.values()).map(tournament => ({
                id: tournament.id,
                name: tournament.name,
                type: tournament.type,
                format: tournament.format,
                maxParticipants: tournament.maxParticipants,
                status: tournament.status,
                startDate: tournament.startDate,
                endDate: tournament.endDate,
                participants: tournament.participants,
                matches: tournament.matches,
                rules: tournament.rules,
                currentRound: tournament.currentRound,
                bracket: tournament.bracket,
                winner: tournament.winner
            }));
            
            this.storage.save('tournaments', tournamentArray);
            return true;
        } catch (error) {
            console.error('Error saving tournaments:', error);
            return false;
        }
    }

    // Setup event handlers
    setupEventHandlers() {
        this.eventHandlers.set('create', this.handleCreateTournament.bind(this));
        this.eventHandlers.set('edit', this.handleEditTournament.bind(this));
        this.eventHandlers.set('delete', this.handleDeleteTournament.bind(this));
        this.eventHandlers.set('start', this.handleStartTournament.bind(this));
        this.eventHandlers.set('end', this.handleEndTournament.bind(this));
        this.eventHandlers.set('addParticipant', this.handleAddParticipant.bind(this));
        this.eventHandlers.set('removeParticipant', this.handleRemoveParticipant.bind(this));
        this.eventHandlers.set('generateBracket', this.handleGenerateBracket.bind(this));
        this.eventHandlers.set('nextRound', this.handleNextRound.bind(this));
    }

    // Create tournament
    async createTournament(tournamentData) {
        try {
            // Validate input
            if (!tournamentData.name || !tournamentData.type || !tournamentData.format) {
                throw new Error('Tên giải đấu, loại và định dạng là bắt buộc');
            }

            // Create tournament
            const tournament = new Tournament(
                tournamentData.name,
                tournamentData.type,
                tournamentData.format,
                tournamentData.maxParticipants || 32
            );

            // Set additional properties
            if (tournamentData.startDate) {
                tournament.startDate = new Date(tournamentData.startDate);
            }
            if (tournamentData.endDate) {
                tournament.endDate = new Date(tournamentData.endDate);
            }

            // Add rules if provided
            if (tournamentData.rules && Array.isArray(tournamentData.rules)) {
                tournament.rules = tournamentData.rules;
            }

            // Validate tournament
            if (!tournament.validate()) {
                throw new Error('Dữ liệu giải đấu không hợp lệ');
            }

            // Store tournament
            this.tournaments.set(tournament.id, tournament);
            this.saveTournaments();

            return tournament;
        } catch (error) {
            console.error('Error creating tournament:', error);
            throw error;
        }
    }

    // Get tournament by ID
    getTournament(id) {
        return this.tournaments.get(id);
    }

    // Get all tournaments
    getAllTournaments() {
        return Array.from(this.tournaments.values());
    }

    // Get tournaments by status
    getTournamentsByStatus(status) {
        return this.getAllTournaments().filter(tournament => tournament.status === status);
    }

    // Update tournament
    async updateTournament(id, updateData) {
        try {
            const tournament = this.tournaments.get(id);
            if (!tournament) {
                throw new Error('Không tìm thấy giải đấu');
            }

            // Update properties
            Object.keys(updateData).forEach(key => {
                if (key in tournament && updateData[key] !== undefined) {
                    if (key === 'startDate' || key === 'endDate') {
                        tournament[key] = new Date(updateData[key]);
                    } else {
                        tournament[key] = updateData[key];
                    }
                }
            });

            // Validate updated tournament
            if (!tournament.validate()) {
                throw new Error('Dữ liệu giải đấu cập nhật không hợp lệ');
            }

            this.saveTournaments();
            return tournament;
        } catch (error) {
            console.error('Error updating tournament:', error);
            throw error;
        }
    }

    // Delete tournament
    async deleteTournament(id) {
        try {
            const tournament = this.tournaments.get(id);
            if (!tournament) {
                throw new Error('Không tìm thấy giải đấu');
            }

            // Check if tournament can be deleted
            if (tournament.status === 'in-progress') {
                throw new Error('Không thể xóa giải đấu đang diễn ra');
            }

            this.tournaments.delete(id);
            this.saveTournaments();
            return true;
        } catch (error) {
            console.error('Error deleting tournament:', error);
            throw error;
        }
    }

    // Start tournament
    async startTournament(id) {
        try {
            const tournament = this.tournaments.get(id);
            if (!tournament) {
                throw new Error('Không tìm thấy giải đấu');
            }

            if (tournament.status !== 'scheduled') {
                throw new Error('Chỉ có thể bắt đầu giải đấu đã được lên lịch');
            }

            if (tournament.participants.length < 2) {
                throw new Error('Cần ít nhất 2 người tham gia để bắt đầu giải đấu');
            }

            tournament.start();
            this.saveTournaments();
            return tournament;
        } catch (error) {
            console.error('Error starting tournament:', error);
            throw error;
        }
    }

    // End tournament
    async endTournament(id, winner = null) {
        try {
            const tournament = this.tournaments.get(id);
            if (!tournament) {
                throw new Error('Không tìm thấy giải đấu');
            }

            if (tournament.status !== 'in-progress') {
                throw new Error('Chỉ có thể kết thúc giải đấu đang diễn ra');
            }

            tournament.end(winner);
            this.saveTournaments();
            return tournament;
        } catch (error) {
            console.error('Error ending tournament:', error);
            throw error;
        }
    }

    // Add participant to tournament
    async addParticipant(tournamentId, participantId, participantType = 'player') {
        try {
            const tournament = this.tournaments.get(tournamentId);
            if (!tournament) {
                throw new Error('Không tìm thấy giải đấu');
            }

            // Get participant based on type
            let participant;
            switch (participantType) {
                case 'player':
                    participant = this.playerController.getPlayer(participantId);
                    break;
                case 'double':
                    participant = this.doubleController.getDouble(participantId);
                    break;
                case 'team':
                    participant = this.teamController.getTeam(participantId);
                    break;
                default:
                    throw new Error('Loại người tham gia không hợp lệ');
            }

            if (!participant) {
                throw new Error('Không tìm thấy người tham gia');
            }

            // Add participant to tournament
            tournament.addParticipant(participant, participantType);
            this.saveTournaments();
            return tournament;
        } catch (error) {
            console.error('Error adding participant:', error);
            throw error;
        }
    }

    // Remove participant from tournament
    async removeParticipant(tournamentId, participantId) {
        try {
            const tournament = this.tournaments.get(tournamentId);
            if (!tournament) {
                throw new Error('Không tìm thấy giải đấu');
            }

            tournament.removeParticipant(participantId);
            this.saveTournaments();
            return tournament;
        } catch (error) {
            console.error('Error removing participant:', error);
            throw error;
        }
    }

    // Generate tournament bracket
    async generateBracket(tournamentId) {
        try {
            const tournament = this.tournaments.get(tournamentId);
            if (!tournament) {
                throw new Error('Không tìm thấy giải đấu');
            }

            if (tournament.participants.length < 2) {
                throw new Error('Cần ít nhất 2 người tham gia để tạo bảng đấu');
            }

            tournament.generateBracket();
            this.saveTournaments();
            return tournament;
        } catch (error) {
            console.error('Error generating bracket:', error);
            throw error;
        }
    }

    // Advance to next round
    async nextRound(tournamentId) {
        try {
            const tournament = this.tournaments.get(tournamentId);
            if (!tournament) {
                throw new Error('Không tìm thấy giải đấu');
            }

            if (tournament.status !== 'in-progress') {
                throw new Error('Giải đấu phải đang diễn ra để chuyển vòng');
            }

            tournament.nextRound();
            this.saveTournaments();
            return tournament;
        } catch (error) {
            console.error('Error advancing to next round:', error);
            throw error;
        }
    }

    // Get tournament statistics
    getTournamentStats(id) {
        const tournament = this.tournaments.get(id);
        if (!tournament) {
            return null;
        }

        return {
            id: tournament.id,
            name: tournament.name,
            status: tournament.status,
            participantCount: tournament.participants.length,
            matchCount: tournament.matches.length,
            currentRound: tournament.currentRound,
            totalRounds: tournament.bracket.length,
            startDate: tournament.startDate,
            endDate: tournament.endDate,
            winner: tournament.winner
        };
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
    async handleCreateTournament(data) {
        return await this.createTournament(data);
    }

    async handleEditTournament(data) {
        return await this.updateTournament(data.id, data.updates);
    }

    async handleDeleteTournament(data) {
        return await this.deleteTournament(data.id);
    }

    async handleStartTournament(data) {
        return await this.startTournament(data.id);
    }

    async handleEndTournament(data) {
        return await this.endTournament(data.id, data.winner);
    }

    async handleAddParticipant(data) {
        return await this.addParticipant(data.tournamentId, data.participantId, data.type);
    }

    async handleRemoveParticipant(data) {
        return await this.removeParticipant(data.tournamentId, data.participantId);
    }

    async handleGenerateBracket(data) {
        return await this.generateBracket(data.id);
    }

    async handleNextRound(data) {
        return await this.nextRound(data.id);
    }

    // Search tournaments
    searchTournaments(query) {
        if (!query) return this.getAllTournaments();
        
        const lowerQuery = query.toLowerCase();
        return this.getAllTournaments().filter(tournament =>
            tournament.name.toLowerCase().includes(lowerQuery) ||
            tournament.type.toLowerCase().includes(lowerQuery) ||
            tournament.format.toLowerCase().includes(lowerQuery)
        );
    }

    // Get tournament leaderboard
    getTournamentLeaderboard(id) {
        const tournament = this.tournaments.get(id);
        if (!tournament) {
            return [];
        }

        // Calculate rankings based on wins/losses
        const stats = new Map();
        
        tournament.matches.forEach(match => {
            if (match.status === 'completed') {
                const winner = match.winner;
                const loser = match.participant1 === winner ? match.participant2 : match.participant1;
                
                // Update winner stats
                if (!stats.has(winner)) {
                    stats.set(winner, { wins: 0, losses: 0, points: 0 });
                }
                stats.get(winner).wins++;
                stats.get(winner).points += 3; // 3 points for a win
                
                // Update loser stats
                if (!stats.has(loser)) {
                    stats.set(loser, { wins: 0, losses: 0, points: 0 });
                }
                stats.get(loser).losses++;
            }
        });

        // Convert to leaderboard format
        return Array.from(stats.entries())
            .map(([participantId, stat]) => ({
                participantId,
                wins: stat.wins,
                losses: stat.losses,
                points: stat.points,
                winRate: stat.wins / (stat.wins + stat.losses) || 0
            }))
            .sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                return b.winRate - a.winRate;
            });
    }
}
