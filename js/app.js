// Main App Class
class PingPongApp {
    constructor() {
        this.controllers = {};
        this.currentSection = 'dashboard';
        this.initialized = false;
        
        this.initializeApp();
    }

    // Initialize the application
    async initializeApp() {
        try {
            // Initialize controllers
            this.initializeControllers();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial data
            this.loadInitialData();
            
            // Initialize UI
            this.initializeUI();
            
            this.initialized = true;
            console.log('Ping Pong Tournament Manager initialized successfully');
            
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Lỗi khởi tạo ứng dụng: ' + error.message);
        }
    }

    // Initialize all controllers
    initializeControllers() {
        this.controllers.player = new PlayerController();
        this.controllers.double = new DoubleController(this.controllers.player);
        this.controllers.team = new TeamController(this.controllers.player);
        this.controllers.rule = new RuleController();
        this.controllers.tournament = new TournamentController(
            this.controllers.player,
            this.controllers.double,
            this.controllers.team
        );
        this.controllers.match = new MatchController(
            this.controllers.player,
            this.controllers.double,
            this.controllers.team,
            this.controllers.tournament
        );
    }

    // Setup event listeners
    setupEventListeners() {
        // Navigation
        this.setupNavigation();
        
        // Player events
        this.setupPlayerEvents();
        
        // Modal events
        this.setupModalEvents();
        
        // Search and filter events
        this.setupSearchEvents();
        
        // Window events
        window.addEventListener('beforeunload', () => {
            this.saveAllData();
        });
    }

    // Setup navigation
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.closest('.nav-btn').dataset.section;
                this.showSection(section);
            });
        });
    }

    // Setup player events
    setupPlayerEvents() {
        // Listen for player controller changes
        document.addEventListener('playerControllerChange', (e) => {
            this.handlePlayerChange(e.detail);
        });

        // Listen for double controller changes
        document.addEventListener('doubleControllerChange', (e) => {
            this.handleDoubleChange(e.detail);
        });

        // Listen for team controller changes
        document.addEventListener('teamControllerChange', (e) => {
            this.handleTeamChange(e.detail);
        });

        // Listen for tournament controller changes
        document.addEventListener('tournamentControllerChange', (e) => {
            this.handleTournamentChange(e.detail);
        });

        // Listen for match controller changes
        document.addEventListener('matchControllerChange', (e) => {
            this.handleMatchChange(e.detail);
        });

        // Listen for rule controller changes
        document.addEventListener('ruleControllerChange', (e) => {
            this.handleRuleChange(e.detail);
        });

        // Player search
        const playerSearch = document.getElementById('player-search');
        if (playerSearch) {
            playerSearch.addEventListener('input', (e) => {
                this.searchPlayers(e.target.value);
            });
        }

        // Rank filter
        const rankFilter = document.getElementById('rank-filter');
        if (rankFilter) {
            rankFilter.addEventListener('change', (e) => {
                this.filterPlayersByRank(e.target.value);
            });
        }
    }

    // Setup modal events
    setupModalEvents() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // Close modal with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // Setup search events
    setupSearchEvents() {
        // General search functionality will be added here
    }

    // Show specific section
    showSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => section.classList.remove('active'));

        // Remove active class from nav buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => btn.classList.remove('active'));

        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
        }

        // Add active class to corresponding nav button
        const activeNavBtn = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeNavBtn) {
            activeNavBtn.classList.add('active');
        }

        // Load section data
        this.loadSectionData(sectionName);
    }

    // Load data for specific section
    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'players':
                this.loadPlayers();
                break;
            case 'doubles':
                this.loadDoubles();
                break;
            case 'teams':
                this.loadTeams();
                break;
            case 'tournaments':
                this.loadTournaments();
                break;
            case 'matches':
                this.loadMatches();
                break;
            case 'rankings':
                this.loadRankings();
                break;
            case 'rules':
                this.loadRules();
                break;
            case 'utilities':
                this.loadUtilities();
                break;
        }
    }

    // Load dashboard data
    loadDashboard() {
        this.updateDashboardStats();
        this.loadRecentActivities();
    }

    // Update dashboard statistics
    updateDashboardStats() {
        const playerStats = this.controllers.player.getStatisticsSummary();
        const doubleStats = this.controllers.double.getStatisticsSummary();
        const teamStats = this.controllers.team.getStatisticsSummary();
        
        document.getElementById('total-players').textContent = playerStats.totalPlayers;
        document.getElementById('total-doubles').textContent = doubleStats.totalDoubles;
        document.getElementById('total-teams').textContent = teamStats.totalTeams;
        document.getElementById('total-tournaments').textContent = '0'; // Will be updated when TournamentController is ready
        document.getElementById('total-matches').textContent = Math.floor(playerStats.totalMatches / 2); // Approximate
        document.getElementById('active-tournaments').textContent = '0'; // Will be updated when TournamentController is ready
    }

    // Load recent activities
    loadRecentActivities() {
        const activitiesList = document.getElementById('recent-activities-list');
        if (!activitiesList) return;

        const recentMatches = this.controllers.player.getRecentMatchResults(10);
        
        activitiesList.innerHTML = '';
        
        if (recentMatches.length === 0) {
            activitiesList.innerHTML = '<div class="activity-item">Chưa có hoạt động nào</div>';
            return;
        }

        recentMatches.forEach(match => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            const result = match.isWin ? 'thắng' : 'thua';
            const resultClass = match.isWin ? 'text-success' : 'text-danger';
            const date = new Date(match.date).toLocaleDateString('vi-VN');
            
            activityItem.innerHTML = `
                <div class="activity-content">
                    <strong>${match.playerName}</strong> 
                    <span class="${resultClass}">${result}</span> 
                    ${match.opponent?.name || 'Unknown'} 
                    (${match.matchType})
                    <div class="activity-meta">
                        <small>${date} - Điểm: ${match.pointsEarned || 0}</small>
                    </div>
                </div>
            `;
            
            activitiesList.appendChild(activityItem);
        });
    }

    // Load players section
    loadPlayers() {
        this.renderPlayersTable();
    }

    // Render players table
    renderPlayersTable(players = null) {
        const tbody = document.getElementById('players-tbody');
        if (!tbody) return;

        const playersToShow = players || this.controllers.player.getAllPlayers();
        tbody.innerHTML = '';

        if (playersToShow.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Chưa có vận động viên nào</td>
                </tr>
            `;
            return;
        }

        playersToShow.forEach((player, index) => {
            const row = document.createElement('tr');
            const displayInfo = player.getDisplayInfo();
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${player.name}</td>
                <td>${player.email}</td>
                <td>${player.address}</td>
                <td><span class="badge badge-${this.getRankBadgeClass(player.rank)}">${player.rank}</span></td>
                <td>${player.points}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-info" onclick="app.viewPlayer('${player.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="app.editPlayer('${player.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deletePlayer('${player.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Get badge class for rank
    getRankBadgeClass(rank) {
        const classes = {
            'Beginner': 'secondary',
            'Intermediate': 'info',
            'Advanced': 'warning',
            'Professional': 'success'
        };
        return classes[rank] || 'secondary';
    }

    // Search players
    searchPlayers(searchTerm) {
        const rankFilter = document.getElementById('rank-filter')?.value || null;
        const players = this.controllers.player.searchPlayers(searchTerm, rankFilter);
        this.renderPlayersTable(players);
    }

    // Filter players by rank
    filterPlayersByRank(rank) {
        const searchTerm = document.getElementById('player-search')?.value || '';
        const players = this.controllers.player.searchPlayers(searchTerm, rank || null);
        this.renderPlayersTable(players);
    }

    // Player CRUD operations
    viewPlayer(playerId) {
        const player = this.controllers.player.getPlayerById(playerId);
        if (!player) {
            this.showError('Không tìm thấy vận động viên');
            return;
        }
        
        this.showPlayerModal(player, 'view');
    }

    editPlayer(playerId) {
        const player = this.controllers.player.getPlayerById(playerId);
        if (!player) {
            this.showError('Không tìm thấy vận động viên');
            return;
        }
        
        this.showPlayerModal(player, 'edit');
    }

    deletePlayer(playerId) {
        const player = this.controllers.player.getPlayerById(playerId);
        if (!player) {
            this.showError('Không tìm thấy vận động viên');
            return;
        }

        if (confirm(`Bạn có chắc chắn muốn xóa vận động viên "${player.name}"?`)) {
            try {
                this.controllers.player.deletePlayer(playerId);
                this.showSuccess('Đã xóa vận động viên thành công');
                this.renderPlayersTable();
                this.updateDashboardStats();
            } catch (error) {
                this.showError('Lỗi khi xóa vận động viên: ' + error.message);
            }
        }
    }

    // Show player modal
    showPlayerModal(player = null, mode = 'add') {
        const modalHtml = this.generatePlayerModalHtml(player, mode);
        this.showModal(modalHtml);
        
        if (mode !== 'view') {
            this.setupPlayerModalEvents(player, mode);
        }
    }

    // Generate player modal HTML
    generatePlayerModalHtml(player, mode) {
        const isView = mode === 'view';
        const isEdit = mode === 'edit';
        const title = isView ? 'Thông tin vận động viên' : (isEdit ? 'Chỉnh sửa vận động viên' : 'Thêm vận động viên mới');
        
        return `
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="player-form">
                    <div class="form-group">
                        <label for="player-name">Tên *</label>
                        <input type="text" id="player-name" value="${player?.name || ''}" ${isView ? 'readonly' : ''} required>
                    </div>
                    <div class="form-group">
                        <label for="player-email">Email *</label>
                        <input type="email" id="player-email" value="${player?.email || ''}" ${isView ? 'readonly' : ''} required>
                    </div>
                    <div class="form-group">
                        <label for="player-address">Địa chỉ *</label>
                        <input type="text" id="player-address" value="${player?.address || ''}" ${isView ? 'readonly' : ''} required>
                    </div>
                    <div class="form-group">
                        <label for="player-rank">Hạng</label>
                        <select id="player-rank" ${isView ? 'disabled' : ''}>
                            <option value="Beginner" ${player?.rank === 'Beginner' ? 'selected' : ''}>Beginner</option>
                            <option value="Intermediate" ${player?.rank === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                            <option value="Advanced" ${player?.rank === 'Advanced' ? 'selected' : ''}>Advanced</option>
                            <option value="Professional" ${player?.rank === 'Professional' ? 'selected' : ''}>Professional</option>
                        </select>
                    </div>
                    ${player ? `
                        <div class="form-group">
                            <label>Điểm hiện tại</label>
                            <input type="text" value="${player.points}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Thống kê trận đấu</label>
                            <input type="text" value="${player.matchesWon}W-${player.matchesLost}L (${player.winRate}%)" readonly>
                        </div>
                    ` : ''}
                </form>
            </div>
            ${!isView ? `
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="app.closeModal()">Hủy</button>
                    <button class="btn btn-primary" onclick="app.savePlayer('${player?.id || ''}', '${mode}')">
                        ${isEdit ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                </div>
            ` : ''}
        `;
    }

    // Setup player modal events
    setupPlayerModalEvents(player, mode) {
        // Form validation can be added here
    }

    // Save player
    savePlayer(playerId, mode) {
        const form = document.getElementById('player-form');
        if (!form) return;

        const formData = new FormData(form);
        const data = {
            name: document.getElementById('player-name').value.trim(),
            email: document.getElementById('player-email').value.trim(),
            address: document.getElementById('player-address').value.trim(),
            rank: document.getElementById('player-rank').value
        };

        try {
            if (mode === 'edit') {
                this.controllers.player.updatePlayer(playerId, data);
                this.showSuccess('Đã cập nhật vận động viên thành công');
            } else {
                this.controllers.player.createPlayer(data.name, data.email, data.address, data.rank);
                this.showSuccess('Đã thêm vận động viên mới thành công');
            }
            
            this.closeModal();
            this.renderPlayersTable();
            this.updateDashboardStats();
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    // Handle player changes
    handlePlayerChange(detail) {
        const { eventType, data } = detail;
        
        switch (eventType) {
            case 'player_created':
            case 'player_updated':
            case 'player_deleted':
                if (this.currentSection === 'players') {
                    this.renderPlayersTable();
                }
                if (eventType === 'player_deleted') {
                    // Handle cascading effects
                    this.controllers.double.handlePlayerDeleted(data.id);
                    this.controllers.team.handlePlayerDeleted(data.id);
                }
                this.updateDashboardStats();
                break;
        }
    }

    // Handle double changes
    handleDoubleChange(detail) {
        const { eventType, data } = detail;
        
        switch (eventType) {
            case 'double_created':
            case 'double_updated':
            case 'double_deleted':
                if (this.currentSection === 'doubles') {
                    this.renderDoublesTable();
                }
                this.updateDashboardStats();
                break;
        }
    }

    // Handle team changes
    handleTeamChange(detail) {
        const { eventType, data } = detail;
        
        switch (eventType) {
            case 'team_created':
            case 'team_updated':
            case 'team_deleted':
                if (this.currentSection === 'teams') {
                    this.renderTeamsTable();
                }
                this.updateDashboardStats();
                break;
        }
    }

    // Handle tournament controller changes
    handleTournamentChange(detail) {
        const { eventType, data } = detail;
        
        switch (eventType) {
            case 'tournament_created':
            case 'tournament_updated':
            case 'tournament_deleted':
            case 'tournament_started':
            case 'tournament_ended':
                if (this.currentSection === 'tournaments') {
                    this.renderTournamentsTable();
                }
                this.updateDashboardStats();
                break;
        }
    }

    // Handle match controller changes
    handleMatchChange(detail) {
        const { eventType, data } = detail;
        
        switch (eventType) {
            case 'match_created':
            case 'match_updated':
            case 'match_deleted':
            case 'match_started':
            case 'match_ended':
            case 'match_score_updated':
                if (this.currentSection === 'matches') {
                    this.renderMatchesTable();
                }
                this.updateDashboardStats();
                break;
        }
    }

    // Handle rule controller changes
    handleRuleChange(detail) {
        const { eventType, data } = detail;
        
        switch (eventType) {
            case 'rule_created':
            case 'rule_updated':
            case 'rule_deleted':
            case 'rule_activated':
            case 'rule_deactivated':
                if (this.currentSection === 'rules') {
                    this.renderRulesTable();
                }
                break;
        }
    }

    // Render doubles table
    renderDoublesTable(doubles = null) {
        const tbody = document.getElementById('doubles-tbody');
        if (!tbody) return;

        const doublesToShow = doubles || this.controllers.double.getAllDoubles();
        tbody.innerHTML = '';

        if (doublesToShow.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">Chưa có cặp đôi nào</td>
                </tr>
            `;
            return;
        }

        doublesToShow.forEach((double, index) => {
            const row = document.createElement('tr');
            const displayInfo = double.getDisplayInfo(this.controllers.player);
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${double.name}</td>
                <td>${displayInfo.player1Name || 'Unknown'}</td>
                <td>${displayInfo.player2Name || 'Unknown'}</td>
                <td>${double.points}</td>
                <td>${double.matchesWon}</td>
                <td>${double.matchesLost}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-info" onclick="app.viewDouble('${double.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="app.editDouble('${double.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteDouble('${double.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Render teams table
    renderTeamsTable(teams = null) {
        const tbody = document.getElementById('teams-tbody');
        if (!tbody) return;

        const teamsToShow = teams || this.controllers.team.getAllTeams();
        tbody.innerHTML = '';

        if (teamsToShow.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Chưa có đội nào</td>
                </tr>
            `;
            return;
        }

        teamsToShow.forEach((team, index) => {
            const row = document.createElement('tr');
            const displayInfo = team.getDisplayInfo(this.controllers.player);
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${team.name}</td>
                <td>${displayInfo.playerNames ? displayInfo.playerNames.join(', ') : 'No players'}</td>
                <td>${team.points}</td>
                <td>${team.matchesWon}</td>
                <td>${team.matchesLost}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-info" onclick="app.viewTeam('${team.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="app.editTeam('${team.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteTeam('${team.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Render rules table
    renderRulesTable(rules = null) {
        const rulesContent = document.getElementById('rules-content');
        if (!rulesContent) return;

        const rulesToShow = rules || this.controllers.rule.getAllRules();
        
        if (rulesToShow.length === 0) {
            rulesContent.innerHTML = `
                <div class="empty-state">
                    <p>Chưa có luật nào được thiết lập</p>
                    <button class="btn btn-primary" onclick="app.showAddRuleModal()">
                        <i class="fas fa-plus"></i> Thêm luật đầu tiên
                    </button>
                </div>
            `;
            return;
        }

        // Group rules by category
        const rulesByCategory = {};
        rulesToShow.forEach(rule => {
            if (!rulesByCategory[rule.category]) {
                rulesByCategory[rule.category] = [];
            }
            rulesByCategory[rule.category].push(rule);
        });

        let html = '';
        Object.keys(rulesByCategory).forEach(category => {
            const categoryName = this.getCategoryDisplayName(category);
            html += `
                <div class="rule-category">
                    <h3>${categoryName}</h3>
                    <div class="rules-list">
            `;
            
            rulesByCategory[category].forEach(rule => {
                html += `
                    <div class="rule-item ${rule.isActive ? 'active' : 'inactive'}">
                        <div class="rule-header">
                            <h4>${rule.title}</h4>
                            <div class="rule-actions">
                                <span class="rule-status ${rule.isActive ? 'active' : 'inactive'}">
                                    ${rule.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                </span>
                                <button class="btn btn-sm btn-primary" onclick="app.editRule('${rule.id}')" title="Chỉnh sửa">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm ${rule.isActive ? 'btn-warning' : 'btn-success'}" 
                                        onclick="app.toggleRuleStatus('${rule.id}')" 
                                        title="${rule.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}">
                                    <i class="fas ${rule.isActive ? 'fa-pause' : 'fa-play'}"></i>
                                </button>
                                ${rule.category !== 'scoring' && rule.category !== 'match' ? `
                                    <button class="btn btn-sm btn-danger" onclick="app.deleteRule('${rule.id}')" title="Xóa">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <div class="rule-content">
                            <p class="rule-description">${rule.content}</p>
                            <div class="rule-details">
                                <span class="rule-value">Giá trị: <strong>${rule.value}</strong></span>
                                <span class="rule-type">Loại: ${rule.type}</span>
                                <span class="rule-priority">Độ ưu tiên: ${rule.priority}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });

        rulesContent.innerHTML = html;
    }

    // Get display name for rule category
    getCategoryDisplayName(category) {
        const categoryNames = {
            'scoring': 'Tính điểm',
            'match': 'Trận đấu',
            'timing': 'Thời gian',
            'serving': 'Phát bóng',
            'registration': 'Đăng ký',
            'tournament': 'Giải đấu',
            'custom': 'Tùy chỉnh',
            'general': 'Chung'
        };
        return categoryNames[category] || category;
    }

    // Double CRUD operations
    viewDouble(doubleId) {
        const double = this.controllers.double.getDoubleById(doubleId);
        if (!double) {
            this.showError('Không tìm thấy cặp đôi');
            return;
        }
        
        this.showDoubleModal(double, 'view');
    }

    editDouble(doubleId) {
        const double = this.controllers.double.getDoubleById(doubleId);
        if (!double) {
            this.showError('Không tìm thấy cặp đôi');
            return;
        }
        
        this.showDoubleModal(double, 'edit');
    }

    deleteDouble(doubleId) {
        const double = this.controllers.double.getDoubleById(doubleId);
        if (!double) {
            this.showError('Không tìm thấy cặp đôi');
            return;
        }

        if (confirm(`Bạn có chắc chắn muốn xóa cặp đôi "${double.name}"?`)) {
            try {
                this.controllers.double.deleteDouble(doubleId);
                this.showSuccess('Đã xóa cặp đôi thành công');
                this.renderDoublesTable();
                this.updateDashboardStats();
            } catch (error) {
                this.showError('Lỗi khi xóa cặp đôi: ' + error.message);
            }
        }
    }

    // Team CRUD operations
    viewTeam(teamId) {
        const team = this.controllers.team.getTeamById(teamId);
        if (!team) {
            this.showError('Không tìm thấy đội');
            return;
        }
        
        this.showTeamModal(team, 'view');
    }

    editTeam(teamId) {
        const team = this.controllers.team.getTeamById(teamId);
        if (!team) {
            this.showError('Không tìm thấy đội');
            return;
        }
        
        this.showTeamModal(team, 'edit');
    }

    deleteTeam(teamId) {
        const team = this.controllers.team.getTeamById(teamId);
        if (!team) {
            this.showError('Không tìm thấy đội');
            return;
        }

        if (confirm(`Bạn có chắc chắn muốn xóa đội "${team.name}"?`)) {
            try {
                this.controllers.team.deleteTeam(teamId);
                this.showSuccess('Đã xóa đội thành công');
                this.renderTeamsTable();
                this.updateDashboardStats();
            } catch (error) {
                this.showError('Lỗi khi xóa đội: ' + error.message);
            }
        }
    }

    // Rule CRUD operations
    showAddRuleModal() {
        this.showRuleModal(null, 'add');
    }

    editRule(ruleId) {
        const rule = this.controllers.rule.getRule(ruleId);
        if (!rule) {
            this.showError('Không tìm thấy luật');
            return;
        }
        
        this.showRuleModal(rule, 'edit');
    }

    async deleteRule(ruleId) {
        const rule = this.controllers.rule.getRule(ruleId);
        if (!rule) {
            this.showError('Không tìm thấy luật');
            return;
        }

        if (confirm(`Bạn có chắc chắn muốn xóa luật "${rule.title}"?`)) {
            try {
                await this.controllers.rule.deleteRule(ruleId);
                this.showSuccess('Đã xóa luật thành công');
                this.renderRulesTable();
            } catch (error) {
                this.showError('Lỗi khi xóa luật: ' + error.message);
            }
        }
    }

    async toggleRuleStatus(ruleId) {
        const rule = this.controllers.rule.getRule(ruleId);
        if (!rule) {
            this.showError('Không tìm thấy luật');
            return;
        }

        try {
            if (rule.isActive) {
                await this.controllers.rule.deactivateRule(ruleId);
                this.showSuccess('Đã vô hiệu hóa luật');
            } else {
                await this.controllers.rule.activateRule(ruleId);
                this.showSuccess('Đã kích hoạt luật');
            }
            this.renderRulesTable();
        } catch (error) {
            this.showError('Lỗi khi thay đổi trạng thái luật: ' + error.message);
        }
    }

    showRuleModal(rule = null, mode = 'add') {
        const isEdit = mode === 'edit';
        const modalTitle = isEdit ? 'Chỉnh sửa luật' : 'Thêm luật mới';
        
        const modalContent = `
            <h3>${modalTitle}</h3>
            <form id="ruleForm">
                <div class="form-group">
                    <label for="ruleName">Tên luật:</label>
                    <input type="text" id="ruleName" name="name" value="${rule ? rule.title : ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="ruleType">Loại:</label>
                    <select id="ruleType" name="type" required>
                        <option value="">Chọn loại...</option>
                        <option value="scoring" ${rule && rule.type === 'scoring' ? 'selected' : ''}>Tính điểm</option>
                        <option value="match" ${rule && rule.type === 'match' ? 'selected' : ''}>Trận đấu</option>
                        <option value="timing" ${rule && rule.type === 'timing' ? 'selected' : ''}>Thời gian</option>
                        <option value="serving" ${rule && rule.type === 'serving' ? 'selected' : ''}>Phát bóng</option>
                        <option value="registration" ${rule && rule.type === 'registration' ? 'selected' : ''}>Đăng ký</option>
                        <option value="tournament" ${rule && rule.type === 'tournament' ? 'selected' : ''}>Giải đấu</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="ruleCategory">Danh mục:</label>
                    <select id="ruleCategory" name="category" required>
                        <option value="">Chọn danh mục...</option>
                        <option value="scoring" ${rule && rule.category === 'scoring' ? 'selected' : ''}>Tính điểm</option>
                        <option value="match" ${rule && rule.category === 'match' ? 'selected' : ''}>Trận đấu</option>
                        <option value="timing" ${rule && rule.category === 'timing' ? 'selected' : ''}>Thời gian</option>
                        <option value="serving" ${rule && rule.category === 'serving' ? 'selected' : ''}>Phát bóng</option>
                        <option value="registration" ${rule && rule.category === 'registration' ? 'selected' : ''}>Đăng ký</option>
                        <option value="tournament" ${rule && rule.category === 'tournament' ? 'selected' : ''}>Giải đấu</option>
                        <option value="custom" ${rule && rule.category === 'custom' ? 'selected' : ''}>Tùy chỉnh</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="ruleDescription">Mô tả:</label>
                    <textarea id="ruleDescription" name="description" rows="3">${rule ? rule.content : ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="ruleValue">Giá trị:</label>
                    <input type="number" id="ruleValue" name="value" value="${rule ? rule.value : ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="rulePriority">Độ ưu tiên:</label>
                    <select id="rulePriority" name="priority">
                        <option value="1" ${rule && rule.priority === 1 ? 'selected' : ''}>Cao (1)</option>
                        <option value="2" ${rule && rule.priority === 2 ? 'selected' : ''}>Trung bình (2)</option>
                        <option value="3" ${rule && rule.priority === 3 ? 'selected' : ''}>Thấp (3)</option>
                    </select>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        ${isEdit ? 'Cập nhật' : 'Thêm'}
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Hủy</button>
                </div>
            </form>
        `;

        this.showModal(modalContent);

        // Handle form submission
        const form = document.getElementById('ruleForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const ruleData = {
                title: formData.get('name'),
                content: formData.get('description'),
                category: formData.get('category')
            };

            try {
                if (isEdit) {
                    await this.controllers.rule.updateRule(rule.id, ruleData);
                    this.showSuccess('Đã cập nhật luật thành công');
                } else {
                    await this.controllers.rule.createRule(ruleData.title, formData.get('type'), ruleData.content, ruleData.category);
                    this.showSuccess('Đã thêm luật thành công');
                }
                
                this.closeModal();
                this.renderRulesTable();
            } catch (error) {
                this.showError('Lỗi: ' + error.message);
            }
        });
    }

    // Show double modal (simplified version)
    showDoubleModal(double = null, mode = 'add') {
        const players = this.controllers.player.getAllPlayers();
        if (players.length < 2) {
            this.showError('Cần ít nhất 2 vận động viên để tạo cặp đôi');
            return;
        }

        const isView = mode === 'view';
        const isEdit = mode === 'edit';
        const title = isView ? 'Thông tin cặp đôi' : (isEdit ? 'Chỉnh sửa cặp đôi' : 'Tạo cặp đôi mới');
        
        const playerOptions = players.map(p => 
            `<option value="${p.id}" ${double && (double.player1Id === p.id || double.player2Id === p.id) ? 'selected' : ''}>${p.name}</option>`
        ).join('');

        const modalHtml = `
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="double-form">
                    <div class="form-group">
                        <label for="double-name">Tên cặp đôi</label>
                        <input type="text" id="double-name" value="${double?.name || ''}" ${isView ? 'readonly' : ''}>
                    </div>
                    <div class="form-group">
                        <label for="double-player1">Vận động viên 1 *</label>
                        <select id="double-player1" ${isView ? 'disabled' : ''} required>
                            <option value="">Chọn vận động viên</option>
                            ${playerOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="double-player2">Vận động viên 2 *</label>
                        <select id="double-player2" ${isView ? 'disabled' : ''} required>
                            <option value="">Chọn vận động viên</option>
                            ${playerOptions}
                        </select>
                    </div>
                    ${double ? `
                        <div class="form-group">
                            <label>Điểm hiện tại</label>
                            <input type="text" value="${double.points}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Thống kê trận đấu</label>
                            <input type="text" value="${double.matchesWon}W-${double.matchesLost}L (${double.winRate}%)" readonly>
                        </div>
                    ` : ''}
                </form>
            </div>
            ${!isView ? `
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="app.closeModal()">Hủy</button>
                    <button class="btn btn-primary" onclick="app.saveDouble('${double?.id || ''}', '${mode}')">
                        ${isEdit ? 'Cập nhật' : 'Tạo mới'}
                    </button>
                </div>
            ` : ''}
        `;

        this.showModal(modalHtml);

        // Set selected values for edit mode
        if (double && mode === 'edit') {
            setTimeout(() => {
                document.getElementById('double-player1').value = double.player1Id;
                document.getElementById('double-player2').value = double.player2Id;
            }, 100);
        }
    }

    // Save double
    saveDouble(doubleId, mode) {
        const name = document.getElementById('double-name').value.trim();
        const player1Id = document.getElementById('double-player1').value;
        const player2Id = document.getElementById('double-player2').value;

        if (!player1Id || !player2Id) {
            this.showError('Vui lòng chọn đầy đủ 2 vận động viên');
            return;
        }

        try {
            if (mode === 'edit') {
                this.controllers.double.updateDouble(doubleId, { name, player1Id, player2Id });
                this.showSuccess('Đã cập nhật cặp đôi thành công');
            } else {
                this.controllers.double.createDouble(player1Id, player2Id, name);
                this.showSuccess('Đã tạo cặp đôi mới thành công');
            }
            
            this.closeModal();
            this.renderDoublesTable();
            this.updateDashboardStats();
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    // Show team modal (simplified version)
    showTeamModal(team = null, mode = 'add') {
        const players = this.controllers.player.getAllPlayers();
        if (players.length < 3) {
            this.showError('Cần ít nhất 3 vận động viên để tạo đội');
            return;
        }

        const isView = mode === 'view';
        const isEdit = mode === 'edit';
        const title = isView ? 'Thông tin đội' : (isEdit ? 'Chỉnh sửa đội' : 'Tạo đội mới');
        
        const playerOptions = players.map(p => 
            `<option value="${p.id}">${p.name}</option>`
        ).join('');

        const modalHtml = `
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="team-form">
                    <div class="form-group">
                        <label for="team-name">Tên đội *</label>
                        <input type="text" id="team-name" value="${team?.name || ''}" ${isView ? 'readonly' : ''} required>
                    </div>
                    <div class="form-group">
                        <label for="team-description">Mô tả</label>
                        <textarea id="team-description" ${isView ? 'readonly' : ''}>${team?.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="team-player1">Đội trưởng *</label>
                        <select id="team-player1" ${isView ? 'disabled' : ''} required>
                            <option value="">Chọn đội trưởng</option>
                            ${playerOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="team-player2">Thành viên 2 *</label>
                        <select id="team-player2" ${isView ? 'disabled' : ''} required>
                            <option value="">Chọn thành viên</option>
                            ${playerOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="team-player3">Thành viên 3 *</label>
                        <select id="team-player3" ${isView ? 'disabled' : ''} required>
                            <option value="">Chọn thành viên</option>
                            ${playerOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="team-player4">Thành viên 4 (tùy chọn)</label>
                        <select id="team-player4" ${isView ? 'disabled' : ''}>
                            <option value="">Chọn thành viên (tùy chọn)</option>
                            ${playerOptions}
                        </select>
                    </div>
                    ${team ? `
                        <div class="form-group">
                            <label>Điểm hiện tại</label>
                            <input type="text" value="${team.points}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Thống kê trận đấu</label>
                            <input type="text" value="${team.matchesWon}W-${team.matchesLost}L (${team.winRate}%)" readonly>
                        </div>
                    ` : ''}
                </form>
            </div>
            ${!isView ? `
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="app.closeModal()">Hủy</button>
                    <button class="btn btn-primary" onclick="app.saveTeam('${team?.id || ''}', '${mode}')">
                        ${isEdit ? 'Cập nhật' : 'Tạo mới'}
                    </button>
                </div>
            ` : ''}
        `;

        this.showModal(modalHtml);

        // Set selected values for edit mode
        if (team && mode === 'edit') {
            setTimeout(() => {
                document.getElementById('team-player1').value = team.player1Id || '';
                document.getElementById('team-player2').value = team.player2Id || '';
                document.getElementById('team-player3').value = team.player3Id || '';
                document.getElementById('team-player4').value = team.player4Id || '';
            }, 100);
        }
    }

    // Save team
    saveTeam(teamId, mode) {
        const name = document.getElementById('team-name').value.trim();
        const description = document.getElementById('team-description').value.trim();
        const player1Id = document.getElementById('team-player1').value;
        const player2Id = document.getElementById('team-player2').value;
        const player3Id = document.getElementById('team-player3').value;
        const player4Id = document.getElementById('team-player4').value || null;

        if (!name || !player1Id || !player2Id || !player3Id) {
            this.showError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        try {
            if (mode === 'edit') {
                this.controllers.team.updateTeam(teamId, { 
                    name, description, player1Id, player2Id, player3Id, player4Id 
                });
                this.showSuccess('Đã cập nhật đội thành công');
            } else {
                this.controllers.team.createTeam(name, player1Id, player2Id, player3Id, player4Id, description);
                this.showSuccess('Đã tạo đội mới thành công');
            }
            
            this.closeModal();
            this.renderTeamsTable();
            this.updateDashboardStats();
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    // Placeholder methods for other sections
    loadDoubles() {
        this.renderDoublesTable();
    }

    loadTeams() {
        this.renderTeamsTable();
    }

    loadTournaments() {
        const tbody = document.getElementById('tournaments-tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tính năng đang phát triển</td></tr>';
        }
    }

    loadMatches() {
        const tbody = document.getElementById('matches-tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tính năng đang phát triển</td></tr>';
        }
    }

    loadRankings() {
        const content = document.getElementById('rankings-content');
        if (content) {
            content.innerHTML = '<div class="text-center">Tính năng đang phát triển</div>';
        }
    }

    loadRules() {
        this.renderRulesTable();
    }

    loadUtilities() {
        // Utilities are static, no need to load data
    }

    // Modal management
    showModal(content) {
        let modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            document.body.appendChild(modalContainer);
        }

        modalContainer.innerHTML = `
            <div class="modal active">
                <div class="modal-content">
                    ${content}
                </div>
            </div>
        `;
    }

    closeModal() {
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.innerHTML = '';
        }
    }

    // Load initial data
    loadInitialData() {
        // Data is loaded from localStorage in controllers
    }

    // Initialize UI
    initializeUI() {
        this.showSection('dashboard');
    }

    // Save all data
    saveAllData() {
        this.controllers.player.saveToStorage();
        this.controllers.double.saveToStorage();
        this.controllers.team.saveToStorage();
        // Other controllers will save their data here
    }

    // Utility methods
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type = 'info') {
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;

        // Add to page
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(messageDiv, container.firstChild);
        }

        // Remove after delay
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
}

// Global functions for modal actions
function showAddPlayerModal() {
    app.showPlayerModal();
}

function showCreateTournamentModal() {
    app.showMessage('Tính năng đang phát triển', 'info');
}

function showCreateMatchModal() {
    app.showMessage('Tính năng đang phát triển', 'info');
}

function showCreateDoubleModal() {
    app.showDoubleModal();
}

function showCreateTeamModal() {
    app.showTeamModal();
}

function showAddRuleModal() {
    app.showMessage('Tính năng đang phát triển', 'info');
}

// Utility functions
function exportData() {
    const data = {
        players: app.controllers.player.exportPlayers(),
        doubles: app.controllers.double.exportDoubles(),
        teams: app.controllers.team.exportTeams(),
        exportDate: new Date().toISOString(),
        version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pingpong_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    app.showSuccess('Đã xuất dữ liệu thành công');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            let totalImported = 0;
            const errors = [];
            
            if (data.players) {
                const result = app.controllers.player.importPlayers(data.players);
                totalImported += result.imported;
                errors.push(...result.errors);
            }

            if (data.doubles) {
                const result = app.controllers.double.importDoubles(data.doubles);
                totalImported += result.imported;
                errors.push(...result.errors);
            }

            if (data.teams) {
                const result = app.controllers.team.importTeams(data.teams);
                totalImported += result.imported;
                errors.push(...result.errors);
            }
            
            if (errors.length > 0) {
                app.showError(`Import hoàn tất với ${errors.length} lỗi. Đã import ${totalImported} mục.`);
            } else {
                app.showSuccess(`Đã import thành công ${totalImported} mục`);
            }
            
            // Refresh current section
            app.loadSectionData(app.currentSection);
            app.updateDashboardStats();
        } catch (error) {
            app.showError('Lỗi đọc file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function printPlayers() {
    window.print();
}

function printTournament() {
    app.showMessage('Tính năng đang phát triển', 'info');
}

function printRankings() {
    window.print();
}

function clearAllData() {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu? Hành động này không thể hoàn tác!')) {
        const playerCount = app.controllers.player.clearAllPlayers();
        const doubleCount = app.controllers.double.clearAllDoubles();
        const teamCount = app.controllers.team.clearAllTeams();
        
        app.showSuccess(`Đã xóa ${playerCount} vận động viên, ${doubleCount} cặp đôi, ${teamCount} đội`);
        
        // Refresh current section
        app.loadSectionData(app.currentSection);
        app.updateDashboardStats();
    }
}

function loadSampleData() {
    const players = app.controllers.player.generateSamplePlayers();
    let message = `Đã tạo ${players.length} vận động viên mẫu`;
    
    if (players.length >= 4) {
        const doubles = app.controllers.double.generateSampleDoubles();
        message += `, ${doubles.length} cặp đôi mẫu`;
    }
    
    if (players.length >= 6) {
        const teams = app.controllers.team.generateSampleTeams();
        message += `, ${teams.length} đội mẫu`;
    }
    
    app.showSuccess(message);
    
    // Refresh current section
    app.loadSectionData(app.currentSection);
    app.updateDashboardStats();
    app.loadRecentActivities();
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PingPongApp();
});
