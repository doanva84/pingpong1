class TeamController {
    constructor(playerController) {
        this.playerController = playerController;
        this.teams = [];
        this.storageKey = 'pingpong_teams';
        this.loadFromStorage();
    }

    // Create new team
    createTeam(name, player1Id, player2Id, player3Id, player4Id = null, description = '') {
        const team = new Team(null, name, player1Id, player2Id, player3Id, player4Id);
        team.description = description;

        const validation = team.validate(this.playerController);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        // Check for duplicate team name
        if (this.getTeamByName(name)) {
            throw new Error('Tên đội đã tồn tại');
        }

        // Check if any player is already in another active team
        const playerIds = team.getPlayerIds();
        for (const playerId of playerIds) {
            const existingTeams = this.getTeamsByPlayer(playerId).filter(t => t.isActive);
            if (existingTeams.length > 0) {
                const player = this.playerController.getPlayerById(playerId);
                throw new Error(`${player?.name || 'Vận động viên'} đã có trong đội ${existingTeams[0].name}`);
            }
        }

        this.teams.push(team);
        this.saveToStorage();
        this.notifyChange('team_created', team);
        
        return team;
    }

    // Get team by ID
    getTeamById(id) {
        return this.teams.find(team => team.id === id) || null;
    }

    // Get team by name
    getTeamByName(name) {
        return this.teams.find(team => team.name.toLowerCase() === name.toLowerCase()) || null;
    }

    // Get all teams
    getAllTeams() {
        return [...this.teams];
    }

    // Get active teams
    getActiveTeams() {
        return this.teams.filter(team => team.isActive);
    }

    // Get teams by player
    getTeamsByPlayer(playerId) {
        return this.teams.filter(team => team.hasPlayer(playerId));
    }

    // Update team
    updateTeam(id, data) {
        const team = this.getTeamById(id);
        if (!team) {
            throw new Error('Không tìm thấy đội');
        }

        // Check name uniqueness if name is being changed
        if (data.name && data.name !== team.name && this.getTeamByName(data.name)) {
            throw new Error('Tên đội đã tồn tại');
        }

        // Update fields
        if (data.name !== undefined) team.name = data.name;
        if (data.description !== undefined) team.description = data.description;
        if (data.player1Id !== undefined) team.player1Id = data.player1Id;
        if (data.player2Id !== undefined) team.player2Id = data.player2Id;
        if (data.player3Id !== undefined) team.player3Id = data.player3Id;
        if (data.player4Id !== undefined) team.player4Id = data.player4Id;

        team.updatedAt = new Date();

        // Validate updated team
        const validation = team.validate(this.playerController);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        this.saveToStorage();
        this.notifyChange('team_updated', team);
        
        return team;
    }

    // Delete team
    deleteTeam(id) {
        const index = this.teams.findIndex(team => team.id === id);
        if (index === -1) {
            throw new Error('Không tìm thấy đội');
        }

        const team = this.teams[index];
        this.teams.splice(index, 1);
        this.saveToStorage();
        this.notifyChange('team_deleted', team);
        
        return true;
    }

    // Add player to team
    addPlayerToTeam(teamId, playerId) {
        const team = this.getTeamById(teamId);
        if (!team) {
            throw new Error('Không tìm thấy đội');
        }

        const player = this.playerController.getPlayerById(playerId);
        if (!player) {
            throw new Error('Không tìm thấy vận động viên');
        }

        // Check if player is already in another active team
        const existingTeams = this.getTeamsByPlayer(playerId).filter(t => t.isActive && t.id !== teamId);
        if (existingTeams.length > 0) {
            throw new Error(`Vận động viên đã có trong đội ${existingTeams[0].name}`);
        }

        team.addPlayer(playerId);
        this.saveToStorage();
        this.notifyChange('player_added_to_team', { team, playerId });
        
        return team;
    }

    // Remove player from team
    removePlayerFromTeam(teamId, playerId) {
        const team = this.getTeamById(teamId);
        if (!team) {
            throw new Error('Không tìm thấy đội');
        }

        const success = team.removePlayer(playerId);
        if (!success) {
            throw new Error('Vận động viên không có trong đội');
        }

        this.saveToStorage();
        this.notifyChange('player_removed_from_team', { team, playerId });
        
        return team;
    }

    // Set team captain
    setTeamCaptain(teamId, playerId) {
        const team = this.getTeamById(teamId);
        if (!team) {
            throw new Error('Không tìm thấy đội');
        }

        team.setCaptain(playerId);
        this.saveToStorage();
        this.notifyChange('team_captain_changed', { team, captainId: playerId });
        
        return team;
    }

    // Search teams
    searchTeams(searchTerm) {
        if (!searchTerm) {
            return this.getAllTeams();
        }

        return this.teams.filter(team => 
            team.matchesSearch(searchTerm, this.playerController)
        );
    }

    // Get team statistics
    getTeamStatistics(id) {
        const team = this.getTeamById(id);
        if (!team) {
            throw new Error('Không tìm thấy đội');
        }

        return team.getStatistics();
    }

    // Update team after match
    updateTeamAfterMatch(teamId, isWin, opponent, score, date = new Date()) {
        const team = this.getTeamById(teamId);
        if (!team) {
            throw new Error('Không tìm thấy đội');
        }

        const matchResult = team.addMatchResult(isWin, opponent, score, date);

        this.saveToStorage();
        this.notifyChange('team_match_result', { team, matchResult });

        return { matchResult };
    }

    // Get top teams by points
    getTopTeamsByPoints(limit = 10) {
        return [...this.teams]
            .sort((a, b) => b.points - a.points)
            .slice(0, limit);
    }

    // Get top teams by win rate
    getTopTeamsByWinRate(limit = 10, minMatches = 3) {
        return [...this.teams]
            .filter(team => team.matchesPlayed >= minMatches)
            .sort((a, b) => b.winRate - a.winRate)
            .slice(0, limit);
    }

    // Activate/Deactivate team
    setTeamStatus(id, isActive) {
        const team = this.getTeamById(id);
        if (!team) {
            throw new Error('Không tìm thấy đội');
        }

        if (isActive) {
            team.activate();
        } else {
            team.deactivate();
        }

        this.saveToStorage();
        this.notifyChange('team_status_changed', { team, isActive });
        
        return team;
    }

    // Get teams that can compete (have minimum players)
    getCompetingTeams() {
        return this.teams.filter(team => team.canCompete(this.playerController));
    }

    // Get available players (not in any active team)
    getAvailablePlayers() {
        const allPlayers = this.playerController.getAllPlayers();
        const playersInTeams = new Set();

        this.getActiveTeams().forEach(team => {
            team.getPlayerIds().forEach(playerId => {
                playersInTeams.add(playerId);
            });
        });

        return allPlayers.filter(player => !playersInTeams.has(player.id));
    }

    // Check if player is available for team
    isPlayerAvailable(playerId) {
        const activeTeams = this.getTeamsByPlayer(playerId).filter(team => team.isActive);
        return activeTeams.length === 0;
    }

    // Import teams from data
    importTeams(teamsData) {
        const importedTeams = [];
        const errors = [];

        teamsData.forEach((data, index) => {
            try {
                const team = Team.fromJSON(data);
                const validation = team.validate(this.playerController);
                
                if (!validation.isValid) {
                    errors.push(`Dòng ${index + 1}: ${validation.errors.join(', ')}`);
                    return;
                }

                // Check for duplicate name
                if (this.getTeamByName(team.name)) {
                    errors.push(`Dòng ${index + 1}: Tên đội ${team.name} đã tồn tại`);
                    return;
                }

                this.teams.push(team);
                importedTeams.push(team);
            } catch (error) {
                errors.push(`Dòng ${index + 1}: ${error.message}`);
            }
        });

        if (importedTeams.length > 0) {
            this.saveToStorage();
            this.notifyChange('teams_imported', importedTeams);
        }

        return {
            imported: importedTeams.length,
            errors: errors
        };
    }

    // Export teams to data
    exportTeams() {
        return this.teams.map(team => team.toJSON());
    }

    // Clear all teams
    clearAllTeams() {
        const count = this.teams.length;
        this.teams = [];
        this.saveToStorage();
        this.notifyChange('teams_cleared', { count });
        return count;
    }

    // Generate sample teams
    generateSampleTeams() {
        const availablePlayers = this.getAvailablePlayers();
        if (availablePlayers.length < 3) {
            throw new Error('Cần ít nhất 3 vận động viên có sẵn để tạo đội mẫu');
        }

        const sampleTeams = [];
        const teamNames = [
            'Lightning Strikers',
            'Thunder Wolves',
            'Phoenix Rising',
            'Dragon Force',
            'Eagle Warriors'
        ];

        const maxTeams = Math.min(teamNames.length, Math.floor(availablePlayers.length / 3));

        for (let i = 0; i < maxTeams; i++) {
            try {
                const startIndex = i * 3;
                const player1 = availablePlayers[startIndex];
                const player2 = availablePlayers[startIndex + 1];
                const player3 = availablePlayers[startIndex + 2];
                const player4 = availablePlayers[startIndex + 3] || null;

                if (player1 && player2 && player3) {
                    const team = this.createTeam(
                        teamNames[i],
                        player1.id,
                        player2.id,
                        player3.id,
                        player4?.id,
                        `Đội ${teamNames[i]} được tạo tự động`
                    );
                    
                    // Add some sample points and matches
                    team.points = Math.floor(Math.random() * 400) + 30;
                    team.matchesPlayed = Math.floor(Math.random() * 12) + 2;
                    team.matchesWon = Math.floor(team.matchesPlayed * (Math.random() * 0.6 + 0.2));
                    team.matchesLost = team.matchesPlayed - team.matchesWon;
                    team.calculateWinRate();
                    
                    sampleTeams.push(team);
                }
            } catch (error) {
                console.error('Error creating sample team:', error);
            }
        }

        if (sampleTeams.length > 0) {
            this.saveToStorage();
            this.notifyChange('sample_teams_created', sampleTeams);
        }

        return sampleTeams;
    }

    // Get statistics summary
    getStatisticsSummary() {
        const totalTeams = this.teams.length;
        const activeTeams = this.getActiveTeams().length;
        const competingTeams = this.getCompetingTeams().length;
        
        let totalMatches = 0;
        let totalPoints = 0;
        let totalPlayers = 0;

        this.teams.forEach(team => {
            totalMatches += team.matchesPlayed;
            totalPoints += team.points;
            totalPlayers += team.getPlayerCount();
        });

        return {
            totalTeams,
            activeTeams,
            inactiveTeams: totalTeams - activeTeams,
            competingTeams,
            totalMatches,
            totalPoints,
            totalPlayersInTeams: totalPlayers,
            averagePointsPerTeam: totalTeams > 0 ? Math.round(totalPoints / totalTeams) : 0,
            averageMatchesPerTeam: totalTeams > 0 ? Math.round(totalMatches / totalTeams) : 0,
            averagePlayersPerTeam: totalTeams > 0 ? Math.round(totalPlayers / totalTeams) : 0
        };
    }

    // Get team formations for matches
    getTeamFormations(teamId) {
        const team = this.getTeamById(teamId);
        if (!team) {
            throw new Error('Không tìm thấy đội');
        }

        return team.getFormations();
    }

    // Find potential team members for a player
    getPotentialTeammates(playerId, excludeTeamId = null) {
        const availablePlayers = this.getAvailablePlayers();
        
        // If player is in a team, include teammates
        if (excludeTeamId) {
            const excludeTeam = this.getTeamById(excludeTeamId);
            if (excludeTeam) {
                const teammateIds = excludeTeam.getPlayerIds().filter(id => id !== playerId);
                const teammates = teammateIds.map(id => this.playerController.getPlayerById(id)).filter(p => p);
                availablePlayers.push(...teammates);
            }
        }

        return availablePlayers.filter(player => player.id !== playerId);
    }

    // Storage methods
    saveToStorage() {
        try {
            const data = this.exportTeams();
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving teams to storage:', error);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const teamsData = JSON.parse(data);
                this.teams = teamsData.map(teamData => Team.fromJSON(teamData));
            }
        } catch (error) {
            console.error('Error loading teams from storage:', error);
            this.teams = [];
        }
    }

    // Event notification
    notifyChange(eventType, data) {
        const event = new CustomEvent('teamControllerChange', {
            detail: { eventType, data }
        });
        document.dispatchEvent(event);
    }

    // Handle player deletion - remove from teams or deactivate teams
    handlePlayerDeleted(playerId) {
        const affectedTeams = this.getTeamsByPlayer(playerId);
        const modifiedTeams = [];
        
        affectedTeams.forEach(team => {
            team.removePlayer(playerId);
            
            // Deactivate team if it doesn't have minimum players
            if (!team.hasMinimumPlayers()) {
                team.deactivate();
            }
            
            modifiedTeams.push(team);
        });

        if (modifiedTeams.length > 0) {
            this.saveToStorage();
            this.notifyChange('teams_auto_modified', { 
                teams: modifiedTeams,
                reason: 'Player deleted'
            });
        }
    }

    // Validate all teams (check if players still exist)
    validateAllTeams() {
        const invalidTeams = [];
        
        this.teams.forEach(team => {
            const validation = team.validate(this.playerController);
            if (!validation.isValid) {
                invalidTeams.push({
                    team,
                    errors: validation.errors
                });
            }
        });

        return invalidTeams;
    }

    // Clean up invalid teams
    cleanupInvalidTeams() {
        const invalidTeams = this.validateAllTeams();
        let cleanedCount = 0;
        
        invalidTeams.forEach(({ team }) => {
            // Try to fix the team by removing invalid players
            const validPlayerIds = team.getPlayerIds().filter(playerId => 
                this.playerController.getPlayerById(playerId)
            );
            
            if (validPlayerIds.length >= 3) {
                // Reassign valid players
                team.player1Id = validPlayerIds[0] || null;
                team.player2Id = validPlayerIds[1] || null;
                team.player3Id = validPlayerIds[2] || null;
                team.player4Id = validPlayerIds[3] || null;
            } else {
                // Not enough valid players, delete team
                this.deleteTeam(team.id);
                cleanedCount++;
            }
        });

        return cleanedCount;
    }

    // Get team match history
    getTeamMatchHistory(teamId, limit = null) {
        const team = this.getTeamById(teamId);
        if (!team) {
            throw new Error('Không tìm thấy đội');
        }

        const history = team.getRecentMatches(limit || team.history.length);
        return history.map(match => ({
            ...match,
            teamName: team.name
        }));
    }

    // Check team compatibility for tournaments
    checkTeamCompatibility(teamId, tournamentType) {
        const team = this.getTeamById(teamId);
        if (!team) {
            return { compatible: false, reason: 'Đội không tồn tại' };
        }

        if (!team.canCompete(this.playerController)) {
            return { compatible: false, reason: 'Đội không đủ điều kiện thi đấu' };
        }

        // Additional compatibility checks can be added here based on tournament type
        return { compatible: true };
    }
}
