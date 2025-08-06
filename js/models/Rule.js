class Rule {
    constructor(id, title, content, category = 'general') {
        this.id = id || this.generateId();
        this.title = title;
        this.content = content;
        this.category = category; // 'general', 'scoring', 'equipment', 'conduct', 'tournament'
        this.priority = 0; // Higher number = higher priority
        this.isActive = true;
        this.applicableToTypes = ['singles', 'doubles', 'teams']; // Which match types this rule applies to
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.tags = [];
        this.references = []; // References to other rules or external sources
    }

    generateId() {
        return 'rule_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Update rule
    update(title, content, category = null) {
        this.title = title;
        this.content = content;
        if (category) {
            this.category = category;
        }
        this.updatedAt = new Date();
        return true;
    }

    // Add tag
    addTag(tag) {
        const normalizedTag = tag.toLowerCase().trim();
        if (!this.tags.includes(normalizedTag)) {
            this.tags.push(normalizedTag);
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    // Remove tag
    removeTag(tag) {
        const normalizedTag = tag.toLowerCase().trim();
        const index = this.tags.indexOf(normalizedTag);
        if (index !== -1) {
            this.tags.splice(index, 1);
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    // Add reference
    addReference(reference) {
        if (!this.references.includes(reference)) {
            this.references.push(reference);
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    // Remove reference
    removeReference(reference) {
        const index = this.references.indexOf(reference);
        if (index !== -1) {
            this.references.splice(index, 1);
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    // Set applicable match types
    setApplicableTypes(types) {
        const validTypes = ['singles', 'doubles', 'teams'];
        const filteredTypes = types.filter(type => validTypes.includes(type));
        
        if (filteredTypes.length > 0) {
            this.applicableToTypes = filteredTypes;
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    // Check if rule applies to a match type
    appliesTo(matchType) {
        return this.applicableToTypes.includes(matchType);
    }

    // Activate rule
    activate() {
        this.isActive = true;
        this.updatedAt = new Date();
    }

    // Deactivate rule
    deactivate() {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    // Set priority
    setPriority(priority) {
        this.priority = Math.max(0, priority);
        this.updatedAt = new Date();
    }

    // Validate rule data
    validate() {
        const errors = [];

        if (!this.title || this.title.trim().length < 2) {
            errors.push('Tiêu đề luật phải có ít nhất 2 ký tự');
        }

        if (!this.content || this.content.trim().length < 10) {
            errors.push('Nội dung luật phải có ít nhất 10 ký tự');
        }

        const validCategories = ['general', 'scoring', 'equipment', 'conduct', 'tournament'];
        if (!validCategories.includes(this.category)) {
            errors.push('Danh mục luật không hợp lệ');
        }

        const validTypes = ['singles', 'doubles', 'teams'];
        const invalidTypes = this.applicableToTypes.filter(type => !validTypes.includes(type));
        if (invalidTypes.length > 0) {
            errors.push(`Loại trận đấu không hợp lệ: ${invalidTypes.join(', ')}`);
        }

        if (this.priority < 0) {
            errors.push('Độ ưu tiên không thể âm');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Get summary
    getSummary(maxLength = 100) {
        if (this.content.length <= maxLength) {
            return this.content;
        }
        return this.content.substring(0, maxLength).trim() + '...';
    }

    // Export to JSON
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            category: this.category,
            priority: this.priority,
            isActive: this.isActive,
            applicableToTypes: this.applicableToTypes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            tags: this.tags,
            references: this.references
        };
    }

    // Create from JSON
    static fromJSON(data) {
        const rule = new Rule(data.id, data.title, data.content, data.category);
        rule.priority = data.priority || 0;
        rule.isActive = data.isActive !== undefined ? data.isActive : true;
        rule.applicableToTypes = data.applicableToTypes || ['singles', 'doubles', 'teams'];
        rule.createdAt = new Date(data.createdAt);
        rule.updatedAt = new Date(data.updatedAt);
        rule.tags = data.tags || [];
        rule.references = data.references || [];
        return rule;
    }

    // Get display info
    getDisplayInfo() {
        return {
            id: this.id,
            title: this.title,
            summary: this.getSummary(),
            category: this.getCategoryDisplay(),
            priority: this.priority,
            isActive: this.isActive,
            applicableTypes: this.applicableToTypes.map(type => this.getTypeDisplay(type)),
            tags: this.tags,
            status: this.isActive ? 'Đang áp dụng' : 'Không áp dụng'
        };
    }

    getCategoryDisplay() {
        const categoryMap = {
            'general': 'Tổng quát',
            'scoring': 'Tính điểm',
            'equipment': 'Thiết bị',
            'conduct': 'Ứng xử',
            'tournament': 'Giải đấu'
        };
        return categoryMap[this.category] || this.category;
    }

    getTypeDisplay(type) {
        const typeMap = {
            'singles': 'Đơn',
            'doubles': 'Đôi',
            'teams': 'Đồng đội'
        };
        return typeMap[type] || type;
    }

    // Search functionality
    matchesSearch(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.title.toLowerCase().includes(term) ||
               this.content.toLowerCase().includes(term) ||
               this.category.toLowerCase().includes(term) ||
               this.tags.some(tag => tag.includes(term));
    }

    // Clone rule
    clone() {
        return Rule.fromJSON(this.toJSON());
    }

    // Create default rules
    static createDefaultRules() {
        const defaultRules = [
            {
                title: 'Cách tính điểm cơ bản',
                content: 'Mỗi set được chơi đến 11 điểm. Người chơi phải thắng với cách biệt ít nhất 2 điểm. Nếu tỷ số là 10-10, trận đấu tiếp tục cho đến khi một bên dẫn trước 2 điểm. Điểm tối đa trong một set là 21 điểm.',
                category: 'scoring',
                priority: 10,
                applicableToTypes: ['singles', 'doubles', 'teams'],
                tags: ['điểm', 'set', 'cơ bản']
            },
            {
                title: 'Quy định phát bóng',
                content: 'Người phát bóng phải thực hiện theo quy định: bóng phải được tung lên ít nhất 16cm, phát từ dưới lên, vợt phải tiếp xúc với bóng ở phía sau đường cuối bàn. Mỗi người phát 2 lần liên tiếp, sau đó chuyển quyền phát cho đối thủ.',
                category: 'general',
                priority: 9,
                applicableToTypes: ['singles', 'doubles', 'teams'],
                tags: ['phát bóng', 'quy định', 'luật']
            },
            {
                title: 'Thiết bị thi đấu',
                content: 'Vợt ping pong phải có màu đỏ một mặt và đen một mặt. Bóng ping pong phải có đường kính 40mm, màu trắng hoặc cam. Bàn ping pong chuẩn kích thước 2.74m x 1.525m, cao 0.76m.',
                category: 'equipment',
                priority: 8,
                applicableToTypes: ['singles', 'doubles', 'teams'],
                tags: ['vợt', 'bóng', 'bàn', 'thiết bị']
            },
            {
                title: 'Ứng xử trong thi đấu',
                content: 'Vận động viên phải thể hiện tinh thần fair play, tôn trọng đối thủ và trọng tài. Không được sử dụng ngôn ngữ không phù hợp, có hành vi thiếu tôn trọng. Vi phạm có thể bị cảnh cáo hoặc loại khỏi giải đấu.',
                category: 'conduct',
                priority: 7,
                applicableToTypes: ['singles', 'doubles', 'teams'],
                tags: ['ứng xử', 'fair play', 'tôn trọng']
            },
            {
                title: 'Quy định thi đấu đôi',
                content: 'Trong thi đấu đôi, các thành viên trong cặp phải luân phiên đánh bóng. Thứ tự phát bóng: A phát cho C, C trả cho B, B trả cho D, D trả cho A, sau đó A phát tiếp. Sau mỗi 2 điểm, đổi người phát.',
                category: 'general',
                priority: 8,
                applicableToTypes: ['doubles'],
                tags: ['đôi', 'luân phiên', 'phát bóng']
            },
            {
                title: 'Thời gian nghỉ giữa các set',
                content: 'Giữa các set, người chơi được nghỉ tối đa 1 phút. Khi một trong hai bên đạt 5 điểm trong set cuối (set quyết định), các đấu thủ đổi bàn và được nghỉ 1 phút.',
                category: 'general',
                priority: 6,
                applicableToTypes: ['singles', 'doubles', 'teams'],
                tags: ['nghỉ', 'set', 'thời gian']
            },
            {
                title: 'Quy định thắng thua trận đấu',
                content: 'Trận đấu thường được chơi theo thể thức best of 5 (ai thắng trước 3 set). Trong giải đấu nhanh có thể chơi best of 3 (ai thắng trước 2 set). Người thắng nhiều set hơn sẽ thắng trận.',
                category: 'scoring',
                priority: 9,
                applicableToTypes: ['singles', 'doubles', 'teams'],
                tags: ['thắng thua', 'set', 'trận đấu']
            },
            {
                title: 'Quy định về trọng tài',
                content: 'Trọng tài có quyền quyết định cuối cùng về các tình huống tranh cãi. Vận động viên có thể yêu cầu giải thích nhưng phải tôn trọng quyết định của trọng tài. Trọng tài có thể đưa ra cảnh cáo hoặc phạt điểm.',
                category: 'tournament',
                priority: 7,
                applicableToTypes: ['singles', 'doubles', 'teams'],
                tags: ['trọng tài', 'quyết định', 'phân xử']
            }
        ];

        return defaultRules.map((ruleData, index) => {
            const rule = new Rule(null, ruleData.title, ruleData.content, ruleData.category);
            rule.priority = ruleData.priority;
            rule.applicableToTypes = ruleData.applicableToTypes;
            rule.tags = ruleData.tags;
            return rule;
        });
    }

    // Get rules by category
    static filterByCategory(rules, category) {
        return rules.filter(rule => rule.category === category && rule.isActive);
    }

    // Get rules by match type
    static filterByMatchType(rules, matchType) {
        return rules.filter(rule => rule.appliesTo(matchType) && rule.isActive);
    }

    // Sort rules by priority
    static sortByPriority(rules) {
        return rules.sort((a, b) => b.priority - a.priority);
    }

    // Get active rules
    static getActiveRules(rules) {
        return rules.filter(rule => rule.isActive);
    }

    // Search rules
    static searchRules(rules, searchTerm) {
        return rules.filter(rule => rule.matchesSearch(searchTerm));
    }
}
