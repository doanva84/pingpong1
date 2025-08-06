// Rule Controller - Manages tournament rules and validation
class RuleController {
    constructor() {
        this.rules = new Map();
        this.eventHandlers = new Map();
        this.defaultRules = this.getDefaultRules();
        
        this.loadRules();
        this.setupEventHandlers();
    }

    // Load rules from storage
    loadRules() {
        try {
            const stored = Storage.load('rules');
            if (stored && Array.isArray(stored)) {
                stored.forEach(ruleData => {
                    const rule = new Rule(
                        ruleData.name,
                        ruleData.type,
                        ruleData.description,
                        ruleData.value
                    );
                    
                    // Restore rule state
                    rule.id = ruleData.id;
                    rule.isActive = ruleData.isActive !== undefined ? ruleData.isActive : true;
                    rule.category = ruleData.category || 'general';
                    rule.priority = ruleData.priority || 1;
                    rule.conditions = ruleData.conditions || [];
                    rule.actions = ruleData.actions || [];
                    
                    this.rules.set(rule.id, rule);
                });
            } else {
                // Load default rules if no custom rules exist
                this.loadDefaultRules();
            }
        } catch (error) {
            console.error('Error loading rules:', error);
            this.loadDefaultRules();
        }
    }

    // Save rules to storage
    saveRules() {
        try {
            const ruleArray = Array.from(this.rules.values()).map(rule => ({
                id: rule.id,
                name: rule.name,
                type: rule.type,
                description: rule.description,
                value: rule.value,
                isActive: rule.isActive,
                category: rule.category,
                priority: rule.priority,
                conditions: rule.conditions,
                actions: rule.actions
            }));
            
            Storage.save('rules', ruleArray);
            return true;
        } catch (error) {
            console.error('Error saving rules:', error);
            return false;
        }
    }

    // Get default rules
    getDefaultRules() {
        return [
            {
                name: 'Điểm thắng set',
                type: 'scoring',
                description: 'Số điểm cần thiết để thắng một set',
                value: 11,
                category: 'scoring',
                priority: 1,
                conditions: [],
                actions: []
            },
            {
                name: 'Số set thắng trận',
                type: 'match',
                description: 'Số set cần thắng để thắng trận đấu',
                value: 2,
                category: 'match',
                priority: 1,
                conditions: [],
                actions: []
            },
            {
                name: 'Chênh lệch điểm tối thiểu',
                type: 'scoring',
                description: 'Chênh lệch điểm tối thiểu để thắng set khi đạt điểm giới hạn',
                value: 2,
                category: 'scoring',
                priority: 1,
                conditions: [{ type: 'score_limit_reached' }],
                actions: []
            },
            {
                name: 'Điểm tối đa một set',
                type: 'scoring',
                description: 'Điểm tối đa có thể đạt được trong một set (khi có deuce)',
                value: 21,
                category: 'scoring',
                priority: 1,
                conditions: [],
                actions: []
            },
            {
                name: 'Thời gian nghỉ giữa các set',
                type: 'timing',
                description: 'Thời gian nghỉ giữa các set (phút)',
                value: 1,
                category: 'timing',
                priority: 2,
                conditions: [],
                actions: []
            },
            {
                name: 'Thời gian timeout',
                type: 'timing',
                description: 'Thời gian timeout cho mỗi đội (phút)',
                value: 1,
                category: 'timing',
                priority: 2,
                conditions: [],
                actions: []
            },
            {
                name: 'Số timeout tối đa',
                type: 'match',
                description: 'Số lần timeout tối đa cho mỗi đội trong một trận',
                value: 1,
                category: 'match',
                priority: 2,
                conditions: [],
                actions: []
            },
            {
                name: 'Đổi phát bóng',
                type: 'serving',
                description: 'Số điểm sau khi đổi quyền phát bóng',
                value: 2,
                category: 'serving',
                priority: 1,
                conditions: [],
                actions: []
            },
            {
                name: 'Bắt buộc đăng ký trước',
                type: 'registration',
                description: 'Thời gian bắt buộc đăng ký trước giải đấu (giờ)',
                value: 24,
                category: 'registration',
                priority: 3,
                conditions: [],
                actions: []
            },
            {
                name: 'Tối đa người tham gia',
                type: 'tournament',
                description: 'Số lượng tối đa người tham gia trong một giải đấu',
                value: 32,
                category: 'tournament',
                priority: 2,
                conditions: [],
                actions: []
            }
        ];
    }

    // Load default rules
    loadDefaultRules() {
        this.defaultRules.forEach(ruleData => {
            const rule = new Rule(
                ruleData.name,
                ruleData.type,
                ruleData.description,
                ruleData.value
            );
            
            rule.category = ruleData.category;
            rule.priority = ruleData.priority;
            rule.conditions = ruleData.conditions;
            rule.actions = ruleData.actions;
            
            this.rules.set(rule.id, rule);
        });
        
        this.saveRules();
    }

    // Setup event handlers
    setupEventHandlers() {
        this.eventHandlers.set('create', this.handleCreateRule.bind(this));
        this.eventHandlers.set('edit', this.handleEditRule.bind(this));
        this.eventHandlers.set('delete', this.handleDeleteRule.bind(this));
        this.eventHandlers.set('activate', this.handleActivateRule.bind(this));
        this.eventHandlers.set('deactivate', this.handleDeactivateRule.bind(this));
        this.eventHandlers.set('resetToDefaults', this.handleResetToDefaults.bind(this));
        this.eventHandlers.set('validate', this.handleValidateRules.bind(this));
    }

    // Create rule
    async createRule(ruleData) {
        try {
            // Validate input
            if (!ruleData.name || !ruleData.type) {
                throw new Error('Tên và loại quy tắc là bắt buộc');
            }

            // Check for duplicate names
            const existingRule = Array.from(this.rules.values()).find(rule => 
                rule.name.toLowerCase() === ruleData.name.toLowerCase()
            );
            if (existingRule) {
                throw new Error('Tên quy tắc đã tồn tại');
            }

            // Create rule
            const rule = new Rule(
                ruleData.name,
                ruleData.type,
                ruleData.description || '',
                ruleData.value
            );

            // Set additional properties
            rule.category = ruleData.category || 'custom';
            rule.priority = ruleData.priority || 1;
            rule.conditions = ruleData.conditions || [];
            rule.actions = ruleData.actions || [];

            // Validate rule
            if (!rule.validate()) {
                throw new Error('Dữ liệu quy tắc không hợp lệ');
            }

            // Store rule
            this.rules.set(rule.id, rule);
            this.saveRules();

            return rule;
        } catch (error) {
            console.error('Error creating rule:', error);
            throw error;
        }
    }

    // Get rule by ID
    getRule(id) {
        return this.rules.get(id);
    }

    // Get all rules
    getAllRules() {
        return Array.from(this.rules.values());
    }

    // Get active rules
    getActiveRules() {
        return this.getAllRules().filter(rule => rule.isActive);
    }

    // Get rules by category
    getRulesByCategory(category) {
        return this.getAllRules().filter(rule => rule.category === category);
    }

    // Get rules by type
    getRulesByType(type) {
        return this.getAllRules().filter(rule => rule.type === type);
    }

    // Update rule
    async updateRule(id, updateData) {
        try {
            const rule = this.rules.get(id);
            if (!rule) {
                throw new Error('Không tìm thấy quy tắc');
            }

            // Check for duplicate names (excluding current rule)
            if (updateData.name) {
                const existingRule = Array.from(this.rules.values()).find(r => 
                    r.id !== id && r.name.toLowerCase() === updateData.name.toLowerCase()
                );
                if (existingRule) {
                    throw new Error('Tên quy tắc đã tồn tại');
                }
            }

            // Update properties
            Object.keys(updateData).forEach(key => {
                if (key in rule && updateData[key] !== undefined) {
                    rule[key] = updateData[key];
                }
            });

            // Validate updated rule
            if (!rule.validate()) {
                throw new Error('Dữ liệu quy tắc cập nhật không hợp lệ');
            }

            this.saveRules();
            return rule;
        } catch (error) {
            console.error('Error updating rule:', error);
            throw error;
        }
    }

    // Delete rule
    async deleteRule(id) {
        try {
            const rule = this.rules.get(id);
            if (!rule) {
                throw new Error('Không tìm thấy quy tắc');
            }

            // Prevent deletion of essential rules
            if (rule.category === 'scoring' || rule.category === 'match') {
                throw new Error('Không thể xóa quy tắc cốt lõi');
            }

            this.rules.delete(id);
            this.saveRules();
            return true;
        } catch (error) {
            console.error('Error deleting rule:', error);
            throw error;
        }
    }

    // Activate rule
    async activateRule(id) {
        try {
            const rule = this.rules.get(id);
            if (!rule) {
                throw new Error('Không tìm thấy quy tắc');
            }

            rule.isActive = true;
            this.saveRules();
            return rule;
        } catch (error) {
            console.error('Error activating rule:', error);
            throw error;
        }
    }

    // Deactivate rule
    async deactivateRule(id) {
        try {
            const rule = this.rules.get(id);
            if (!rule) {
                throw new Error('Không tìm thấy quy tắc');
            }

            // Prevent deactivation of essential rules
            if (rule.category === 'scoring' || rule.category === 'match') {
                throw new Error('Không thể vô hiệu hóa quy tắc cốt lõi');
            }

            rule.isActive = false;
            this.saveRules();
            return rule;
        } catch (error) {
            console.error('Error deactivating rule:', error);
            throw error;
        }
    }

    // Reset to default rules
    async resetToDefaults() {
        try {
            this.rules.clear();
            this.loadDefaultRules();
            return true;
        } catch (error) {
            console.error('Error resetting to defaults:', error);
            throw error;
        }
    }

    // Validate tournament rules
    validateTournamentRules(tournament) {
        const errors = [];
        const activeRules = this.getActiveRules();

        // Validate against each active rule
        activeRules.forEach(rule => {
            try {
                if (!this.validateSingleRule(rule, tournament)) {
                    errors.push(`Quy tắc "${rule.name}" không được thỏa mãn`);
                }
            } catch (error) {
                errors.push(`Lỗi kiểm tra quy tắc "${rule.name}": ${error.message}`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Validate match rules
    validateMatchRules(match) {
        const errors = [];
        const matchRules = this.getRulesByCategory('match').concat(
            this.getRulesByCategory('scoring')
        ).filter(rule => rule.isActive);

        matchRules.forEach(rule => {
            try {
                if (!this.validateMatchRule(rule, match)) {
                    errors.push(`Quy tắc "${rule.name}" không được thỏa mãn`);
                }
            } catch (error) {
                errors.push(`Lỗi kiểm tra quy tắc "${rule.name}": ${error.message}`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Validate single rule
    validateSingleRule(rule, context) {
        switch (rule.type) {
            case 'tournament':
                return this.validateTournamentRule(rule, context);
            case 'match':
                return this.validateMatchRule(rule, context);
            case 'scoring':
                return this.validateScoringRule(rule, context);
            case 'timing':
                return this.validateTimingRule(rule, context);
            case 'registration':
                return this.validateRegistrationRule(rule, context);
            default:
                return true;
        }
    }

    // Validate tournament rule
    validateTournamentRule(rule, tournament) {
        switch (rule.name) {
            case 'Tối đa người tham gia':
                return tournament.participants.length <= rule.value;
            default:
                return true;
        }
    }

    // Validate match rule
    validateMatchRule(rule, match) {
        switch (rule.name) {
            case 'Số set thắng trận':
                if (match.status === 'completed' && match.winner) {
                    const winnerSets = this.countWinnerSets(match, match.winner);
                    return winnerSets >= rule.value;
                }
                return true;
            case 'Số timeout tối đa':
                // This would need timeout tracking in match
                return true;
            default:
                return true;
        }
    }

    // Validate scoring rule
    validateScoringRule(rule, match) {
        if (!match.scores || match.scores.length === 0) {
            return true;
        }

        const winPointRule = this.getRule('Điểm thắng set');
        const minDifferenceRule = this.getRule('Chênh lệch điểm tối thiểu');

        switch (rule.name) {
            case 'Điểm thắng set':
                return match.scores.every(score => {
                    const maxScore = Math.max(score.player1Score, score.player2Score);
                    const minScore = Math.min(score.player1Score, score.player2Score);
                    
                    // If someone won, they must have at least the required points
                    if (maxScore !== minScore) {
                        return maxScore >= rule.value;
                    }
                    return true;
                });
            
            case 'Chênh lệch điểm tối thiểu':
                return match.scores.every(score => {
                    const difference = Math.abs(score.player1Score - score.player2Score);
                    const maxScore = Math.max(score.player1Score, score.player2Score);
                    
                    // If someone reached win point, check difference
                    if (maxScore >= (winPointRule ? winPointRule.value : 11)) {
                        return difference >= rule.value;
                    }
                    return true;
                });
            
            default:
                return true;
        }
    }

    // Validate timing rule
    validateTimingRule(rule, context) {
        // Timing rules are mostly enforced during gameplay
        return true;
    }

    // Validate registration rule
    validateRegistrationRule(rule, tournament) {
        switch (rule.name) {
            case 'Bắt buộc đăng ký trước':
                if (tournament.startDate) {
                    const now = new Date();
                    const startDate = new Date(tournament.startDate);
                    const hoursUntilStart = (startDate - now) / (1000 * 60 * 60);
                    return hoursUntilStart >= rule.value;
                }
                return true;
            default:
                return true;
        }
    }

    // Helper method to count winner sets
    countWinnerSets(match, winner) {
        if (!match.scores) return 0;
        
        return match.scores.filter(score => {
            if (match.participant1 === winner) {
                return score.player1Score > score.player2Score;
            } else {
                return score.player2Score > score.player1Score;
            }
        }).length;
    }

    // Get rule value by name
    getRuleValue(ruleName) {
        const rule = Array.from(this.rules.values()).find(r => r.name === ruleName);
        return rule ? rule.value : null;
    }

    // Check if match is complete according to rules
    isMatchComplete(match) {
        const setsToWin = this.getRuleValue('Số set thắng trận') || 2;
        
        if (!match.scores || match.scores.length === 0) {
            return false;
        }

        let player1Sets = 0;
        let player2Sets = 0;

        match.scores.forEach(score => {
            if (score.player1Score > score.player2Score) {
                player1Sets++;
            } else if (score.player2Score > score.player1Score) {
                player2Sets++;
            }
        });

        return player1Sets >= setsToWin || player2Sets >= setsToWin;
    }

    // Get match winner according to rules
    getMatchWinner(match) {
        if (!this.isMatchComplete(match)) {
            return null;
        }

        let player1Sets = 0;
        let player2Sets = 0;

        match.scores.forEach(score => {
            if (score.player1Score > score.player2Score) {
                player1Sets++;
            } else if (score.player2Score > score.player1Score) {
                player2Sets++;
            }
        });

        return player1Sets > player2Sets ? match.participant1 : match.participant2;
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
    async handleCreateRule(data) {
        return await this.createRule(data);
    }

    async handleEditRule(data) {
        return await this.updateRule(data.id, data.updates);
    }

    async handleDeleteRule(data) {
        return await this.deleteRule(data.id);
    }

    async handleActivateRule(data) {
        return await this.activateRule(data.id);
    }

    async handleDeactivateRule(data) {
        return await this.deactivateRule(data.id);
    }

    async handleResetToDefaults(data) {
        return await this.resetToDefaults();
    }

    async handleValidateRules(data) {
        if (data.type === 'tournament') {
            return this.validateTournamentRules(data.context);
        } else if (data.type === 'match') {
            return this.validateMatchRules(data.context);
        } else {
            throw new Error('Unknown validation type');
        }
    }

    // Search rules
    searchRules(query) {
        if (!query) return this.getAllRules();
        
        const lowerQuery = query.toLowerCase();
        return this.getAllRules().filter(rule =>
            rule.name.toLowerCase().includes(lowerQuery) ||
            rule.description.toLowerCase().includes(lowerQuery) ||
            rule.category.toLowerCase().includes(lowerQuery) ||
            rule.type.toLowerCase().includes(lowerQuery)
        );
    }

    // Get rule categories
    getCategories() {
        const categories = new Set();
        this.getAllRules().forEach(rule => categories.add(rule.category));
        return Array.from(categories);
    }

    // Get rule types
    getTypes() {
        const types = new Set();
        this.getAllRules().forEach(rule => types.add(rule.type));
        return Array.from(types);
    }

    // Export rules configuration
    exportRules() {
        return {
            rules: Array.from(this.rules.values()),
            exportDate: new Date(),
            version: '1.0'
        };
    }

    // Import rules configuration
    async importRules(rulesData) {
        try {
            if (!rulesData.rules || !Array.isArray(rulesData.rules)) {
                throw new Error('Dữ liệu quy tắc không hợp lệ');
            }

            // Clear existing rules
            this.rules.clear();

            // Import new rules
            rulesData.rules.forEach(ruleData => {
                const rule = new Rule(
                    ruleData.name,
                    ruleData.type,
                    ruleData.description,
                    ruleData.value
                );
                
                rule.id = ruleData.id;
                rule.isActive = ruleData.isActive;
                rule.category = ruleData.category;
                rule.priority = ruleData.priority;
                rule.conditions = ruleData.conditions || [];
                rule.actions = ruleData.actions || [];
                
                this.rules.set(rule.id, rule);
            });

            this.saveRules();
            return true;
        } catch (error) {
            console.error('Error importing rules:', error);
            throw error;
        }
    }
}
