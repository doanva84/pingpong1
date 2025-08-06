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
        this.renderTournamentsTable();
    }

    // Render tournaments table
    renderTournamentsTable() {
        const tbody = document.getElementById('tournaments-tbody');
        if (!tbody) return;

        try {
            const tournaments = this.controllers.tournament.getAllTournaments();
            
            if (tournaments.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">Chưa có giải đấu nào</td></tr>';
                return;
            }

            tbody.innerHTML = tournaments.map(tournament => `
                <tr data-tournament-id="${tournament.id}">
                    <td>${tournament.name}</td>
                    <td><span class="badge badge-${this.getTournamentTypeClass(tournament.type)}">${this.getTournamentTypeText(tournament.type)}</span></td>
                    <td><span class="badge badge-${this.getTournamentStatusClass(tournament.status)}">${this.getTournamentStatusText(tournament.status)}</span></td>
                    <td>${tournament.participants.length}/${tournament.maxParticipants || 'Không giới hạn'}</td>
                    <td>${tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}</td>
                    <td>${tournament.endDate ? new Date(tournament.endDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}</td>
                    <td>${tournament.location || 'Chưa xác định'}</td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-primary" onclick="app.viewTournament('${tournament.id}')" title="Xem chi tiết">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="app.editTournament('${tournament.id}')" title="Chỉnh sửa">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="app.deleteTournament('${tournament.id}')" title="Xóa">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error rendering tournaments table:', error);
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Lỗi tải dữ liệu giải đấu</td></tr>';
        }
    }

    // Helper methods for tournament display
    getTournamentTypeClass(type) {
        const classes = {
            'single': 'primary',
            'double': 'success', 
            'team': 'info',
            'mixed': 'warning'
        };
        return classes[type] || 'secondary';
    }

    getTournamentTypeText(type) {
        const texts = {
            'single': 'Đơn',
            'double': 'Đôi',
            'team': 'Đội',
            'mixed': 'Hỗn hợp'
        };
        return texts[type] || type;
    }

    getTournamentStatusClass(status) {
        const classes = {
            'draft': 'secondary',
            'registration': 'info',
            'ongoing': 'warning',
            'completed': 'success',
            'cancelled': 'danger'
        };
        return classes[status] || 'secondary';
    }

    getTournamentStatusText(status) {
        const texts = {
            'draft': 'Nháp',
            'registration': 'Đang đăng ký',
            'ongoing': 'Đang diễn ra',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy'
        };
        return texts[status] || status;
    }

    loadMatches() {
        this.renderMatchesTable();
    }

    // Render matches table
    renderMatchesTable() {
        const tbody = document.getElementById('matches-tbody');
        if (!tbody) return;

        try {
            const matches = this.controllers.match.getAllMatches();
            
            if (matches.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">Chưa có trận đấu nào</td></tr>';
                return;
            }

            tbody.innerHTML = matches.map(match => `
                <tr data-match-id="${match.id}">
                    <td>${match.tournament ? match.tournament.name : 'Không xác định'}</td>
                    <td>${this.getParticipantName(match.participant1)}</td>
                    <td>${this.getParticipantName(match.participant2)}</td>
                    <td>
                        <span class="badge badge-${this.getMatchStatusClass(match.status)}">
                            ${this.getMatchStatusText(match.status)}
                        </span>
                    </td>
                    <td>${this.getMatchScore(match)}</td>
                    <td>${match.winner ? this.getParticipantName(match.winner) : '-'}</td>
                    <td>${match.scheduledDate ? new Date(match.scheduledDate).toLocaleString('vi-VN') : 'Chưa xác định'}</td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-primary" onclick="app.viewMatch('${match.id}')" title="Xem chi tiết">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-success" onclick="app.scoreMatch('${match.id}')" title="Ghi điểm">
                                <i class="fas fa-plus-square"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="app.editMatch('${match.id}')" title="Chỉnh sửa">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="app.deleteMatch('${match.id}')" title="Xóa">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error rendering matches table:', error);
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Lỗi tải dữ liệu trận đấu</td></tr>';
        }
    }

    // Helper methods for match display
    getParticipantName(participant) {
        if (!participant) return 'Chưa xác định';
        
        if (typeof participant === 'string') return participant;
        if (participant.name) return participant.name;
        if (participant.player1 && participant.player2) {
            return `${participant.player1.name} / ${participant.player2.name}`;
        }
        if (participant.members) {
            return participant.members.map(m => m.name).join(', ');
        }
        
        return 'Không xác định';
    }

    getMatchStatusClass(status) {
        const classes = {
            'scheduled': 'info',
            'ongoing': 'warning',
            'completed': 'success',
            'cancelled': 'danger'
        };
        return classes[status] || 'secondary';
    }

    getMatchStatusText(status) {
        const texts = {
            'scheduled': 'Đã lên lịch',
            'ongoing': 'Đang diễn ra',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy'
        };
        return texts[status] || status;
    }

    getMatchScore(match) {
        if (!match.scores || match.scores.length === 0) {
            return '-';
        }
        
        return match.scores.map(score => 
            `${score.player1Score}-${score.player2Score}`
        ).join(', ');
    }

    loadRankings() {
        this.renderRankings();
    }

    // Render rankings
    renderRankings() {
        const content = document.getElementById('rankings-content');
        if (!content) return;

        try {
            const rankings = this.calculateRankings();
            
            content.innerHTML = `
                <div class="rankings-container">
                    <div class="rankings-header">
                        <h3><i class="fas fa-medal"></i> Bảng xếp hạng</h3>
                        <div class="rankings-filters">
                            <select id="rankingType" onchange="app.renderRankings()">
                                <option value="overall">Tổng thể</option>
                                <option value="wins">Thắng nhiều nhất</option>
                                <option value="winRate">Tỷ lệ thắng</option>
                                <option value="points">Điểm số</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="rankings-table">
                        ${this.renderRankingsTable(rankings)}
                    </div>
                    
                    <div class="rankings-stats">
                        ${this.renderRankingsStats(rankings)}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error rendering rankings:', error);
            content.innerHTML = '<div class="text-center text-danger">Lỗi tải bảng xếp hạng</div>';
        }
    }

    // Calculate rankings
    calculateRankings() {
        const players = this.controllers.player.getAllPlayers();
        const matches = this.controllers.match.getAllMatches().filter(m => m.status === 'completed');
        
        const rankings = players.map(player => {
            const playerMatches = matches.filter(m => 
                (m.participant1 && m.participant1.id === player.id) || 
                (m.participant2 && m.participant2.id === player.id)
            );
            
            const wins = playerMatches.filter(m => 
                m.winner && m.winner.id === player.id
            ).length;
            
            const losses = playerMatches.length - wins;
            const winRate = playerMatches.length > 0 ? (wins / playerMatches.length * 100) : 0;
            
            // Calculate points based on set scores
            let totalPoints = 0;
            let totalOpponentPoints = 0;
            
            playerMatches.forEach(match => {
                if (match.scores && match.scores.length > 0) {
                    match.scores.forEach(score => {
                        if (match.participant1 && match.participant1.id === player.id) {
                            totalPoints += score.player1Score;
                            totalOpponentPoints += score.player2Score;
                        } else if (match.participant2 && match.participant2.id === player.id) {
                            totalPoints += score.player2Score;
                            totalOpponentPoints += score.player1Score;
                        }
                    });
                }
            });
            
            const pointsDifference = totalPoints - totalOpponentPoints;
            
            return {
                player: player,
                matches: playerMatches.length,
                wins: wins,
                losses: losses,
                winRate: winRate,
                points: totalPoints,
                opponentPoints: totalOpponentPoints,
                pointsDifference: pointsDifference,
                rating: this.calculatePlayerRating(wins, losses, winRate, pointsDifference)
            };
        });
        
        // Sort by rating (default)
        const rankingType = document.getElementById('rankingType')?.value || 'overall';
        
        switch (rankingType) {
            case 'wins':
                rankings.sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
                break;
            case 'winRate':
                rankings.sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);
                break;
            case 'points':
                rankings.sort((a, b) => b.pointsDifference - a.pointsDifference || b.points - a.points);
                break;
            default: // overall
                rankings.sort((a, b) => b.rating - a.rating);
        }
        
        return rankings;
    }

    // Calculate player rating
    calculatePlayerRating(wins, losses, winRate, pointsDifference) {
        const matchWeight = 1;
        const winRateWeight = 2;
        const pointsWeight = 0.1;
        
        return (wins * matchWeight) + (winRate * winRateWeight) + (pointsDifference * pointsWeight);
    }

    // Render rankings table
    renderRankingsTable(rankings) {
        if (rankings.length === 0) {
            return '<div class="text-center">Chưa có dữ liệu xếp hạng</div>';
        }

        return `
            <table class="table">
                <thead>
                    <tr>
                        <th>Hạng</th>
                        <th>Tên</th>
                        <th>Trận đấu</th>
                        <th>Thắng</th>
                        <th>Thua</th>
                        <th>Tỷ lệ thắng</th>
                        <th>Điểm số</th>
                        <th>Chênh lệch</th>
                        <th>Đánh giá</th>
                    </tr>
                </thead>
                <tbody>
                    ${rankings.map((ranking, index) => `
                        <tr class="ranking-row ${index < 3 ? 'top-player' : ''}">
                            <td>
                                <span class="rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}">
                                    ${index + 1}
                                    ${index === 0 ? '<i class="fas fa-crown"></i>' : ''}
                                </span>
                            </td>
                            <td>
                                <div class="player-info">
                                    <strong>${ranking.player.name}</strong>
                                    ${ranking.player.email ? `<br><small>${ranking.player.email}</small>` : ''}
                                </div>
                            </td>
                            <td>${ranking.matches}</td>
                            <td class="text-success"><strong>${ranking.wins}</strong></td>
                            <td class="text-danger">${ranking.losses}</td>
                            <td>
                                <span class="badge badge-${ranking.winRate >= 70 ? 'success' : ranking.winRate >= 50 ? 'warning' : 'danger'}">
                                    ${ranking.winRate.toFixed(1)}%
                                </span>
                            </td>
                            <td>${ranking.points}</td>
                            <td class="${ranking.pointsDifference >= 0 ? 'text-success' : 'text-danger'}">
                                ${ranking.pointsDifference >= 0 ? '+' : ''}${ranking.pointsDifference}
                            </td>
                            <td>
                                <div class="rating-display">
                                    <span class="rating-value">${ranking.rating.toFixed(1)}</span>
                                    <div class="rating-stars">
                                        ${this.renderRatingStars(ranking.rating)}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // Render rating stars
    renderRatingStars(rating) {
        const maxStars = 5;
        const starValue = Math.min(rating / 20, maxStars); // Scale to 0-5 stars
        const fullStars = Math.floor(starValue);
        const hasHalfStar = starValue - fullStars >= 0.5;
        
        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = fullStars + (hasHalfStar ? 1 : 0); i < maxStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    // Render rankings stats
    renderRankingsStats(rankings) {
        if (rankings.length === 0) return '';

        const totalMatches = rankings.reduce((sum, r) => sum + r.matches, 0);
        const avgWinRate = rankings.reduce((sum, r) => sum + r.winRate, 0) / rankings.length;
        const topPlayer = rankings[0];
        const mostActivePlayer = rankings.reduce((max, r) => r.matches > max.matches ? r : max, rankings[0]);

        return `
            <div class="rankings-stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${totalMatches}</div>
                        <div class="stat-label">Tổng trận đấu</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-percentage"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${avgWinRate.toFixed(1)}%</div>
                        <div class="stat-label">Tỷ lệ thắng TB</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-crown"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${topPlayer.player.name}</div>
                        <div class="stat-label">Hạng nhất</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-fire"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${mostActivePlayer.player.name}</div>
                        <div class="stat-label">Tích cực nhất</div>
                    </div>
                </div>
            </div>
        `;
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

    // Tournament action methods
    viewTournament(tournamentId) {
        try {
            const tournament = this.controllers.tournament.getTournament(tournamentId);
            if (!tournament) {
                this.showError('Không tìm thấy giải đấu');
                return;
            }

            const modalContent = `
                <div class="tournament-view">
                    <div class="modal-header">
                        <h2><i class="fas fa-trophy"></i> ${tournament.name}</h2>
                        <button class="close-btn" onclick="app.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="tournament-info">
                            <div class="info-row">
                                <strong>Loại giải:</strong> ${this.getTournamentTypeText(tournament.type)}
                            </div>
                            <div class="info-row">
                                <strong>Trạng thái:</strong> 
                                <span class="badge badge-${this.getTournamentStatusClass(tournament.status)}">
                                    ${this.getTournamentStatusText(tournament.status)}
                                </span>
                            </div>
                            <div class="info-row">
                                <strong>Số người tham gia:</strong> ${tournament.participants.length}/${tournament.maxParticipants || 'Không giới hạn'}
                            </div>
                            <div class="info-row">
                                <strong>Ngày bắt đầu:</strong> ${tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                            </div>
                            <div class="info-row">
                                <strong>Ngày kết thúc:</strong> ${tournament.endDate ? new Date(tournament.endDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                            </div>
                            <div class="info-row">
                                <strong>Địa điểm:</strong> ${tournament.location || 'Chưa xác định'}
                            </div>
                            <div class="info-row">
                                <strong>Mô tả:</strong> ${tournament.description || 'Không có mô tả'}
                            </div>
                        </div>
                        
                        <div class="participants-section">
                            <h3>Danh sách tham gia</h3>
                            <div class="participants-list">
                                ${tournament.participants.length > 0 ? 
                                    tournament.participants.map(p => `<span class="participant-badge">${p.name || p}</span>`).join('') :
                                    '<p class="text-muted">Chưa có người tham gia</p>'
                                }
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="app.closeModal()">Đóng</button>
                        <button class="btn btn-primary" onclick="app.editTournament('${tournament.id}')">Chỉnh sửa</button>
                    </div>
                </div>
            `;

            this.showModal(modalContent);
        } catch (error) {
            console.error('Error viewing tournament:', error);
            this.showError('Lỗi xem chi tiết giải đấu: ' + error.message);
        }
    }

    editTournament(tournamentId) {
        try {
            const tournament = this.controllers.tournament.getTournament(tournamentId);
            
            const modalContent = `
                <div class="tournament-edit">
                    <div class="modal-header">
                        <h2><i class="fas fa-edit"></i> ${tournament ? 'Chỉnh sửa giải đấu' : 'Tạo giải đấu mới'}</h2>
                        <button class="close-btn" onclick="app.closeModal()">×</button>
                    </div>
                    <form id="tournamentForm" class="modal-body">
                        <div class="form-group">
                            <label for="tournamentName">Tên giải đấu:</label>
                            <input type="text" id="tournamentName" name="name" value="${tournament ? tournament.name : ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="tournamentType">Loại giải:</label>
                            <select id="tournamentType" name="type" required>
                                <option value="">Chọn loại giải...</option>
                                <option value="single" ${tournament && tournament.type === 'single' ? 'selected' : ''}>Đơn</option>
                                <option value="double" ${tournament && tournament.type === 'double' ? 'selected' : ''}>Đôi</option>
                                <option value="team" ${tournament && tournament.type === 'team' ? 'selected' : ''}>Đội</option>
                                <option value="mixed" ${tournament && tournament.type === 'mixed' ? 'selected' : ''}>Hỗn hợp</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="tournamentMaxParticipants">Số người tối đa:</label>
                            <input type="number" id="tournamentMaxParticipants" name="maxParticipants" 
                                   value="${tournament ? tournament.maxParticipants || '' : ''}" min="2" max="128">
                        </div>
                        
                        <div class="form-group">
                            <label for="tournamentStartDate">Ngày bắt đầu:</label>
                            <input type="datetime-local" id="tournamentStartDate" name="startDate" 
                                   value="${tournament && tournament.startDate ? new Date(tournament.startDate).toISOString().slice(0, 16) : ''}">
                        </div>
                        
                        <div class="form-group">
                            <label for="tournamentEndDate">Ngày kết thúc:</label>
                            <input type="datetime-local" id="tournamentEndDate" name="endDate"
                                   value="${tournament && tournament.endDate ? new Date(tournament.endDate).toISOString().slice(0, 16) : ''}">
                        </div>
                        
                        <div class="form-group">
                            <label for="tournamentLocation">Địa điểm:</label>
                            <input type="text" id="tournamentLocation" name="location" value="${tournament ? tournament.location || '' : ''}">
                        </div>
                        
                        <div class="form-group">
                            <label for="tournamentDescription">Mô tả:</label>
                            <textarea id="tournamentDescription" name="description" rows="3">${tournament ? tournament.description || '' : ''}</textarea>
                        </div>
                    </form>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="app.closeModal()">Hủy</button>
                        <button class="btn btn-primary" onclick="app.saveTournament('${tournament ? tournament.id : ''}')">
                            ${tournament ? 'Cập nhật' : 'Tạo mới'}
                        </button>
                    </div>
                </div>
            `;

            this.showModal(modalContent);
        } catch (error) {
            console.error('Error editing tournament:', error);
            this.showError('Lỗi chỉnh sửa giải đấu: ' + error.message);
        }
    }

    async saveTournament(tournamentId) {
        try {
            const form = document.getElementById('tournamentForm');
            const formData = new FormData(form);
            
            const tournamentData = {
                name: formData.get('name'),
                type: formData.get('type'),
                maxParticipants: formData.get('maxParticipants') ? parseInt(formData.get('maxParticipants')) : null,
                startDate: formData.get('startDate') || null,
                endDate: formData.get('endDate') || null,
                location: formData.get('location'),
                description: formData.get('description')
            };

            if (tournamentId) {
                // Update existing tournament
                await this.controllers.tournament.updateTournament(tournamentId, tournamentData);
                this.showSuccess('Cập nhật giải đấu thành công!');
            } else {
                // Create new tournament
                await this.controllers.tournament.createTournament(tournamentData);
                this.showSuccess('Tạo giải đấu thành công!');
            }

            this.closeModal();
            this.renderTournamentsTable();
        } catch (error) {
            console.error('Error saving tournament:', error);
            this.showError('Lỗi lưu giải đấu: ' + error.message);
        }
    }

    async deleteTournament(tournamentId) {
        if (!confirm('Bạn có chắc chắn muốn xóa giải đấu này?')) {
            return;
        }

        try {
            await this.controllers.tournament.deleteTournament(tournamentId);
            this.showSuccess('Xóa giải đấu thành công!');
            this.renderTournamentsTable();
        } catch (error) {
            console.error('Error deleting tournament:', error);
            this.showError('Lỗi xóa giải đấu: ' + error.message);
        }
    }

    // Match action methods
    viewMatch(matchId) {
        try {
            const match = this.controllers.match.getMatch(matchId);
            if (!match) {
                this.showError('Không tìm thấy trận đấu');
                return;
            }

            const modalContent = `
                <div class="match-view">
                    <div class="modal-header">
                        <h2><i class="fas fa-table-tennis"></i> Chi tiết trận đấu</h2>
                        <button class="close-btn" onclick="app.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="match-info">
                            <div class="participants">
                                <div class="participant">
                                    <strong>${this.getParticipantName(match.participant1)}</strong>
                                </div>
                                <div class="vs">VS</div>
                                <div class="participant">
                                    <strong>${this.getParticipantName(match.participant2)}</strong>
                                </div>
                            </div>
                            
                            <div class="match-details">
                                <div class="info-row">
                                    <strong>Giải đấu:</strong> ${match.tournament ? match.tournament.name : 'Không xác định'}
                                </div>
                                <div class="info-row">
                                    <strong>Trạng thái:</strong> 
                                    <span class="badge badge-${this.getMatchStatusClass(match.status)}">
                                        ${this.getMatchStatusText(match.status)}
                                    </span>
                                </div>
                                <div class="info-row">
                                    <strong>Thời gian:</strong> ${match.scheduledDate ? new Date(match.scheduledDate).toLocaleString('vi-VN') : 'Chưa xác định'}
                                </div>
                                <div class="info-row">
                                    <strong>Người thắng:</strong> ${match.winner ? this.getParticipantName(match.winner) : 'Chưa có'}
                                </div>
                            </div>

                            ${match.scores && match.scores.length > 0 ? `
                                <div class="scores-section">
                                    <h3>Tỷ số các set</h3>
                                    <div class="scores-list">
                                        ${match.scores.map((score, index) => `
                                            <div class="score-item">
                                                <span>Set ${index + 1}:</span>
                                                <span class="score">${score.player1Score} - ${score.player2Score}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="app.closeModal()">Đóng</button>
                        <button class="btn btn-success" onclick="app.scoreMatch('${match.id}')">Ghi điểm</button>
                        <button class="btn btn-primary" onclick="app.editMatch('${match.id}')">Chỉnh sửa</button>
                    </div>
                </div>
            `;

            this.showModal(modalContent);
        } catch (error) {
            console.error('Error viewing match:', error);
            this.showError('Lỗi xem chi tiết trận đấu: ' + error.message);
        }
    }

    editMatch(matchId) {
        try {
            const match = this.controllers.match.getMatch(matchId);
            const tournaments = this.controllers.tournament.getAllTournaments();
            const players = this.controllers.player.getAllPlayers();
            
            const modalContent = `
                <div class="match-edit">
                    <div class="modal-header">
                        <h2><i class="fas fa-edit"></i> ${match ? 'Chỉnh sửa trận đấu' : 'Tạo trận đấu mới'}</h2>
                        <button class="close-btn" onclick="app.closeModal()">×</button>
                    </div>
                    <form id="matchForm" class="modal-body">
                        <div class="form-group">
                            <label for="matchTournament">Giải đấu:</label>
                            <select id="matchTournament" name="tournament">
                                <option value="">Chọn giải đấu...</option>
                                ${tournaments.map(t => `
                                    <option value="${t.id}" ${match && match.tournament && match.tournament.id === t.id ? 'selected' : ''}>
                                        ${t.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="matchParticipant1">Người chơi 1:</label>
                            <select id="matchParticipant1" name="participant1" required>
                                <option value="">Chọn người chơi...</option>
                                ${players.map(p => `
                                    <option value="${p.id}" ${match && match.participant1 && match.participant1.id === p.id ? 'selected' : ''}>
                                        ${p.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="matchParticipant2">Người chơi 2:</label>
                            <select id="matchParticipant2" name="participant2" required>
                                <option value="">Chọn người chơi...</option>
                                ${players.map(p => `
                                    <option value="${p.id}" ${match && match.participant2 && match.participant2.id === p.id ? 'selected' : ''}>
                                        ${p.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="matchScheduledDate">Thời gian:</label>
                            <input type="datetime-local" id="matchScheduledDate" name="scheduledDate"
                                   value="${match && match.scheduledDate ? new Date(match.scheduledDate).toISOString().slice(0, 16) : ''}">
                        </div>
                        
                        <div class="form-group">
                            <label for="matchStatus">Trạng thái:</label>
                            <select id="matchStatus" name="status">
                                <option value="scheduled" ${match && match.status === 'scheduled' ? 'selected' : ''}>Đã lên lịch</option>
                                <option value="ongoing" ${match && match.status === 'ongoing' ? 'selected' : ''}>Đang diễn ra</option>
                                <option value="completed" ${match && match.status === 'completed' ? 'selected' : ''}>Hoàn thành</option>
                                <option value="cancelled" ${match && match.status === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
                            </select>
                        </div>
                    </form>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="app.closeModal()">Hủy</button>
                        <button class="btn btn-primary" onclick="app.saveMatch('${match ? match.id : ''}')">
                            ${match ? 'Cập nhật' : 'Tạo mới'}
                        </button>
                    </div>
                </div>
            `;

            this.showModal(modalContent);
        } catch (error) {
            console.error('Error editing match:', error);
            this.showError('Lỗi chỉnh sửa trận đấu: ' + error.message);
        }
    }

    async saveMatch(matchId) {
        try {
            const form = document.getElementById('matchForm');
            const formData = new FormData(form);
            
            const participant1Id = formData.get('participant1');
            const participant2Id = formData.get('participant2');
            
            if (participant1Id === participant2Id) {
                this.showError('Không thể chọn cùng một người chơi cho cả hai vị trí');
                return;
            }
            
            const participant1 = this.controllers.player.getPlayer(participant1Id);
            const participant2 = this.controllers.player.getPlayer(participant2Id);
            
            const matchData = {
                participant1: participant1,
                participant2: participant2,
                scheduledDate: formData.get('scheduledDate') || null,
                status: formData.get('status') || 'scheduled'
            };

            if (formData.get('tournament')) {
                matchData.tournament = this.controllers.tournament.getTournament(formData.get('tournament'));
            }

            if (matchId) {
                // Update existing match
                await this.controllers.match.updateMatch(matchId, matchData);
                this.showSuccess('Cập nhật trận đấu thành công!');
            } else {
                // Create new match
                await this.controllers.match.createMatch(matchData);
                this.showSuccess('Tạo trận đấu thành công!');
            }

            this.closeModal();
            this.renderMatchesTable();
        } catch (error) {
            console.error('Error saving match:', error);
            this.showError('Lỗi lưu trận đấu: ' + error.message);
        }
    }

    scoreMatch(matchId) {
        try {
            const match = this.controllers.match.getMatch(matchId);
            if (!match) {
                this.showError('Không tìm thấy trận đấu');
                return;
            }

            const modalContent = `
                <div class="match-scoring">
                    <div class="modal-header">
                        <h2><i class="fas fa-plus-square"></i> Ghi điểm trận đấu</h2>
                        <button class="close-btn" onclick="app.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="participants-header">
                            <div class="participant">
                                <strong>${this.getParticipantName(match.participant1)}</strong>
                            </div>
                            <div class="vs">VS</div>
                            <div class="participant">
                                <strong>${this.getParticipantName(match.participant2)}</strong>
                            </div>
                        </div>
                        
                        <div class="current-scores">
                            <h3>Tỷ số hiện tại</h3>
                            <div id="scoresDisplay">
                                ${this.renderCurrentScores(match)}
                            </div>
                        </div>
                        
                        <div class="score-input">
                            <h3>Thêm set mới</h3>
                            <div class="score-form">
                                <div class="score-input-group">
                                    <label>${this.getParticipantName(match.participant1)}</label>
                                    <input type="number" id="player1Score" min="0" max="50" value="0">
                                </div>
                                <div class="score-separator">-</div>
                                <div class="score-input-group">
                                    <label>${this.getParticipantName(match.participant2)}</label>
                                    <input type="number" id="player2Score" min="0" max="50" value="0">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="app.closeModal()">Hủy</button>
                        <button class="btn btn-success" onclick="app.addScore('${match.id}')">Thêm set</button>
                        <button class="btn btn-primary" onclick="app.finishMatch('${match.id}')">Kết thúc trận</button>
                    </div>
                </div>
            `;

            this.showModal(modalContent);
        } catch (error) {
            console.error('Error opening match scoring:', error);
            this.showError('Lỗi mở ghi điểm: ' + error.message);
        }
    }

    renderCurrentScores(match) {
        if (!match.scores || match.scores.length === 0) {
            return '<p class="text-muted">Chưa có điểm số</p>';
        }

        return match.scores.map((score, index) => `
            <div class="score-display">
                <span>Set ${index + 1}:</span>
                <span class="score-values">${score.player1Score} - ${score.player2Score}</span>
            </div>
        `).join('');
    }

    async addScore(matchId) {
        try {
            const player1Score = parseInt(document.getElementById('player1Score').value);
            const player2Score = parseInt(document.getElementById('player2Score').value);

            if (isNaN(player1Score) || isNaN(player2Score)) {
                this.showError('Vui lòng nhập điểm số hợp lệ');
                return;
            }

            await this.controllers.match.addScore(matchId, player1Score, player2Score);
            this.showSuccess('Đã thêm điểm số!');
            
            // Refresh the scoring modal
            this.scoreMatch(matchId);
        } catch (error) {
            console.error('Error adding score:', error);
            this.showError('Lỗi thêm điểm: ' + error.message);
        }
    }

    async finishMatch(matchId) {
        try {
            await this.controllers.match.finishMatch(matchId);
            this.showSuccess('Đã kết thúc trận đấu!');
            this.closeModal();
            this.renderMatchesTable();
        } catch (error) {
            console.error('Error finishing match:', error);
            this.showError('Lỗi kết thúc trận đấu: ' + error.message);
        }
    }

    async deleteMatch(matchId) {
        if (!confirm('Bạn có chắc chắn muốn xóa trận đấu này?')) {
            return;
        }

        try {
            await this.controllers.match.deleteMatch(matchId);
            this.showSuccess('Xóa trận đấu thành công!');
            this.renderMatchesTable();
        } catch (error) {
            console.error('Error deleting match:', error);
            this.showError('Lỗi xóa trận đấu: ' + error.message);
        }
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
    app.editTournament('');
}

function showCreateMatchModal() {
    app.editMatch('');
}

function showCreateDoubleModal() {
    app.showDoubleModal();
}

function showCreateTeamModal() {
    app.showTeamModal();
}

function showAddRuleModal() {
    app.showRuleModal();
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
    try {
        const tournaments = app.controllers.tournament.getAllTournaments();
        if (tournaments.length === 0) {
            app.showError('Không có giải đấu nào để in');
            return;
        }
        
        // Create print window with tournament data
        const printContent = `
            <html>
                <head>
                    <title>Danh sách Giải đấu</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .badge { padding: 2px 6px; border-radius: 3px; font-size: 12px; }
                        .badge-primary { background-color: #007bff; color: white; }
                        .badge-success { background-color: #28a745; color: white; }
                        .badge-info { background-color: #17a2b8; color: white; }
                        .badge-warning { background-color: #ffc107; color: black; }
                        .badge-danger { background-color: #dc3545; color: white; }
                        .badge-secondary { background-color: #6c757d; color: white; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Danh sách Giải đấu Ping Pong</h1>
                        <p>Ngày in: ${new Date().toLocaleDateString('vi-VN')}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Tên giải</th>
                                <th>Loại</th>
                                <th>Trạng thái</th>
                                <th>Người tham gia</th>
                                <th>Ngày bắt đầu</th>
                                <th>Ngày kết thúc</th>
                                <th>Địa điểm</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tournaments.map(tournament => `
                                <tr>
                                    <td><strong>${tournament.name}</strong></td>
                                    <td><span class="badge badge-${app.getTournamentTypeClass(tournament.type)}">${app.getTournamentTypeText(tournament.type)}</span></td>
                                    <td><span class="badge badge-${app.getTournamentStatusClass(tournament.status)}">${app.getTournamentStatusText(tournament.status)}</span></td>
                                    <td>${tournament.participants.length}/${tournament.maxParticipants || 'Không giới hạn'}</td>
                                    <td>${tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}</td>
                                    <td>${tournament.endDate ? new Date(tournament.endDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}</td>
                                    <td>${tournament.location || 'Chưa xác định'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    } catch (error) {
        console.error('Error printing tournaments:', error);
        app.showError('Lỗi in danh sách giải đấu: ' + error.message);
    }
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
