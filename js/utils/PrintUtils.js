// Print Utilities - Handles printing and document generation
class PrintUtils {
    constructor() {
        this.templates = new Map();
        this.setupDefaultTemplates();
    }

    // Setup default print templates
    setupDefaultTemplates() {
        this.templates.set('tournament-bracket', this.getTournamentBracketTemplate());
        this.templates.set('match-schedule', this.getMatchScheduleTemplate());
        this.templates.set('player-list', this.getPlayerListTemplate());
        this.templates.set('tournament-report', this.getTournamentReportTemplate());
        this.templates.set('match-scorecard', this.getMatchScorecardTemplate());
    }

    // Print tournament bracket
    printTournamentBracket(tournament) {
        try {
            const template = this.templates.get('tournament-bracket');
            const content = this.generateTournamentBracketContent(tournament);
            return this.printDocument(template, content, `Bảng đấu - ${tournament.name}`);
        } catch (error) {
            console.error('Error printing tournament bracket:', error);
            throw error;
        }
    }

    // Print match schedule
    printMatchSchedule(matches, title = 'Lịch thi đấu') {
        try {
            const template = this.templates.get('match-schedule');
            const content = this.generateMatchScheduleContent(matches);
            return this.printDocument(template, content, title);
        } catch (error) {
            console.error('Error printing match schedule:', error);
            throw error;
        }
    }

    // Print player list
    printPlayerList(players, title = 'Danh sách vận động viên') {
        try {
            const template = this.templates.get('player-list');
            const content = this.generatePlayerListContent(players);
            return this.printDocument(template, content, title);
        } catch (error) {
            console.error('Error printing player list:', error);
            throw error;
        }
    }

    // Print tournament report
    printTournamentReport(tournament) {
        try {
            const template = this.templates.get('tournament-report');
            const content = this.generateTournamentReportContent(tournament);
            return this.printDocument(template, content, `Báo cáo giải đấu - ${tournament.name}`);
        } catch (error) {
            console.error('Error printing tournament report:', error);
            throw error;
        }
    }

    // Print match scorecard
    printMatchScorecard(match) {
        try {
            const template = this.templates.get('match-scorecard');
            const content = this.generateMatchScorecardContent(match);
            return this.printDocument(template, content, `Phiếu ghi điểm - Trận ${match.id}`);
        } catch (error) {
            console.error('Error printing match scorecard:', error);
            throw error;
        }
    }

    // Generate tournament bracket content
    generateTournamentBracketContent(tournament) {
        let html = `
            <div class="tournament-header">
                <h1>${tournament.name}</h1>
                <p>Loại: ${tournament.type} | Định dạng: ${tournament.format}</p>
                <p>Ngày bắt đầu: ${this.formatDate(tournament.startDate)} | Ngày kết thúc: ${this.formatDate(tournament.endDate)}</p>
            </div>
            <div class="bracket-container">
        `;

        // Generate bracket rounds
        if (tournament.bracket && tournament.bracket.length > 0) {
            tournament.bracket.forEach((round, roundIndex) => {
                html += `<div class="round">
                    <h3>Vòng ${roundIndex + 1}</h3>
                    <div class="matches">`;
                
                round.forEach(match => {
                    html += `
                        <div class="match">
                            <div class="participant">${this.getParticipantName(match.participant1)}</div>
                            <div class="vs">vs</div>
                            <div class="participant">${this.getParticipantName(match.participant2)}</div>
                            ${match.winner ? `<div class="winner">Thắng: ${this.getParticipantName(match.winner)}</div>` : ''}
                        </div>
                    `;
                });
                
                html += `</div></div>`;
            });
        }

        html += '</div>';
        return html;
    }

    // Generate match schedule content
    generateMatchScheduleContent(matches) {
        let html = `
            <div class="schedule-header">
                <h1>Lịch thi đấu</h1>
                <p>Ngày in: ${this.formatDate(new Date())}</p>
            </div>
            <table class="schedule-table">
                <thead>
                    <tr>
                        <th>Thời gian</th>
                        <th>Sân</th>
                        <th>Người chơi 1</th>
                        <th>Người chơi 2</th>
                        <th>Vòng</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
        `;

        matches.forEach(match => {
            html += `
                <tr>
                    <td>${match.startTime ? this.formatDateTime(match.startTime) : 'Chưa xác định'}</td>
                    <td>${match.courtNumber || '-'}</td>
                    <td>${this.getParticipantName(match.participant1)}</td>
                    <td>${this.getParticipantName(match.participant2)}</td>
                    <td>${match.round || '-'}</td>
                    <td>${this.getStatusText(match.status)}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        return html;
    }

    // Generate player list content
    generatePlayerListContent(players) {
        let html = `
            <div class="list-header">
                <h1>Danh sách vận động viên</h1>
                <p>Tổng số: ${players.length} người</p>
                <p>Ngày in: ${this.formatDate(new Date())}</p>
            </div>
            <table class="player-table">
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Tên</th>
                        <th>Trình độ</th>
                        <th>Liên hệ</th>
                        <th>Ngày đăng ký</th>
                    </tr>
                </thead>
                <tbody>
        `;

        players.forEach((player, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${player.name}</td>
                    <td>${this.getLevelText(player.level)}</td>
                    <td>${player.contactInfo || '-'}</td>
                    <td>${this.formatDate(player.registrationDate)}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        return html;
    }

    // Generate tournament report content
    generateTournamentReportContent(tournament) {
        let html = `
            <div class="report-header">
                <h1>Báo cáo giải đấu</h1>
                <h2>${tournament.name}</h2>
                <p>Ngày tạo báo cáo: ${this.formatDate(new Date())}</p>
            </div>
            
            <div class="report-section">
                <h3>Thông tin chung</h3>
                <ul>
                    <li>Loại giải đấu: ${tournament.type}</li>
                    <li>Định dạng: ${tournament.format}</li>
                    <li>Trạng thái: ${this.getStatusText(tournament.status)}</li>
                    <li>Số người tham gia: ${tournament.participants.length}</li>
                    <li>Tổng số trận đấu: ${tournament.matches.length}</li>
                </ul>
            </div>

            <div class="report-section">
                <h3>Kết quả</h3>
                ${tournament.winner ? `<p><strong>Người chiến thắng:</strong> ${this.getParticipantName(tournament.winner)}</p>` : '<p>Chưa có kết quả</p>'}
            </div>
        `;

        return html;
    }

    // Generate match scorecard content
    generateMatchScorecardContent(match) {
        let html = `
            <div class="scorecard-header">
                <h1>Phiếu ghi điểm</h1>
                <p>Trận đấu: ${match.id}</p>
                <p>Vòng: ${match.round || '-'}</p>
                <p>Thời gian: ${match.startTime ? this.formatDateTime(match.startTime) : 'Chưa xác định'}</p>
            </div>
            
            <div class="match-info">
                <div class="participants">
                    <div class="participant">
                        <h3>Người chơi 1</h3>
                        <p>${this.getParticipantName(match.participant1)}</p>
                    </div>
                    <div class="vs">VS</div>
                    <div class="participant">
                        <h3>Người chơi 2</h3>
                        <p>${this.getParticipantName(match.participant2)}</p>
                    </div>
                </div>
            </div>

            <div class="score-table">
                <table>
                    <thead>
                        <tr>
                            <th>Set</th>
                            <th>${this.getParticipantName(match.participant1)}</th>
                            <th>${this.getParticipantName(match.participant2)}</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Add score rows (5 sets maximum)
        for (let i = 1; i <= 5; i++) {
            const score = match.scores && match.scores[i - 1];
            html += `
                <tr>
                    <td>Set ${i}</td>
                    <td>${score ? score.player1Score : '_____'}</td>
                    <td>${score ? score.player2Score : '_____'}</td>
                </tr>
            `;
        }

        html += `
                    </tbody>
                </table>
            </div>

            <div class="signature-area">
                <div class="signature">
                    <p>Chữ ký trọng tài</p>
                    <div class="signature-line"></div>
                </div>
                <div class="signature">
                    <p>Chữ ký người chơi 1</p>
                    <div class="signature-line"></div>
                </div>
                <div class="signature">
                    <p>Chữ ký người chơi 2</p>
                    <div class="signature-line"></div>
                </div>
            </div>
        `;

        return html;
    }

    // Print document
    printDocument(template, content, title) {
        try {
            const printWindow = window.open('', '_blank');
            const fullHtml = template.replace('{{CONTENT}}', content).replace('{{TITLE}}', title);
            
            printWindow.document.write(fullHtml);
            printWindow.document.close();
            
            // Wait for content to load then print
            printWindow.onload = function() {
                printWindow.print();
            };
            
            return true;
        } catch (error) {
            console.error('Error opening print window:', error);
            throw error;
        }
    }

    // Get tournament bracket template
    getTournamentBracketTemplate() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>{{TITLE}}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .tournament-header { text-align: center; margin-bottom: 30px; }
                    .tournament-header h1 { margin: 0; font-size: 24px; }
                    .tournament-header p { margin: 5px 0; color: #666; }
                    .bracket-container { display: flex; flex-direction: column; }
                    .round { margin-bottom: 20px; page-break-inside: avoid; }
                    .round h3 { margin: 0 0 10px 0; font-size: 18px; }
                    .matches { display: flex; flex-wrap: wrap; gap: 10px; }
                    .match { border: 1px solid #ccc; padding: 10px; border-radius: 5px; min-width: 200px; }
                    .participant { font-weight: bold; }
                    .vs { text-align: center; color: #666; font-size: 12px; margin: 5px 0; }
                    .winner { color: #28a745; font-weight: bold; margin-top: 5px; }
                    @media print { body { margin: 0; } .match { break-inside: avoid; } }
                </style>
            </head>
            <body>
                {{CONTENT}}
            </body>
            </html>
        `;
    }

    // Get match schedule template
    getMatchScheduleTemplate() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>{{TITLE}}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .schedule-header { text-align: center; margin-bottom: 30px; }
                    .schedule-header h1 { margin: 0; font-size: 24px; }
                    .schedule-table { width: 100%; border-collapse: collapse; }
                    .schedule-table th, .schedule-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    .schedule-table th { background-color: #f8f9fa; font-weight: bold; }
                    .schedule-table tr:nth-child(even) { background-color: #f8f9fa; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                {{CONTENT}}
            </body>
            </html>
        `;
    }

    // Get player list template
    getPlayerListTemplate() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>{{TITLE}}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .list-header { text-align: center; margin-bottom: 30px; }
                    .list-header h1 { margin: 0; font-size: 24px; }
                    .player-table { width: 100%; border-collapse: collapse; }
                    .player-table th, .player-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    .player-table th { background-color: #f8f9fa; font-weight: bold; }
                    .player-table tr:nth-child(even) { background-color: #f8f9fa; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                {{CONTENT}}
            </body>
            </html>
        `;
    }

    // Get tournament report template
    getTournamentReportTemplate() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>{{TITLE}}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                    .report-header { text-align: center; margin-bottom: 30px; }
                    .report-header h1 { margin: 0; font-size: 24px; }
                    .report-header h2 { margin: 10px 0; font-size: 20px; color: #333; }
                    .report-section { margin-bottom: 20px; page-break-inside: avoid; }
                    .report-section h3 { margin: 0 0 10px 0; font-size: 18px; color: #444; }
                    .report-section ul { margin: 0; padding-left: 20px; }
                    .report-section li { margin-bottom: 5px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                {{CONTENT}}
            </body>
            </html>
        `;
    }

    // Get match scorecard template
    getMatchScorecardTemplate() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>{{TITLE}}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .scorecard-header { text-align: center; margin-bottom: 30px; }
                    .scorecard-header h1 { margin: 0; font-size: 24px; }
                    .match-info { margin-bottom: 20px; }
                    .participants { display: flex; align-items: center; justify-content: space-between; }
                    .participant { text-align: center; flex: 1; }
                    .participant h3 { margin: 0 0 10px 0; font-size: 16px; }
                    .vs { font-size: 20px; font-weight: bold; margin: 0 20px; }
                    .score-table { margin: 20px 0; }
                    .score-table table { width: 100%; border-collapse: collapse; }
                    .score-table th, .score-table td { border: 1px solid #000; padding: 10px; text-align: center; }
                    .score-table th { background-color: #f0f0f0; font-weight: bold; }
                    .signature-area { margin-top: 40px; display: flex; justify-content: space-between; }
                    .signature { text-align: center; }
                    .signature-line { border-bottom: 1px solid #000; width: 150px; margin-top: 20px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                {{CONTENT}}
            </body>
            </html>
        `;
    }

    // Helper methods
    formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('vi-VN');
    }

    formatDateTime(date) {
        if (!date) return '-';
        return new Date(date).toLocaleString('vi-VN');
    }

    getParticipantName(participantId) {
        // This would need to be connected to the actual controllers
        return participantId || 'Không xác định';
    }

    getStatusText(status) {
        const statusMap = {
            'scheduled': 'Đã lên lịch',
            'in-progress': 'Đang diễn ra',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy',
            'pending': 'Chờ xử lý'
        };
        return statusMap[status] || status;
    }

    getLevelText(level) {
        const levelMap = {
            'beginner': 'Mới bắt đầu',
            'intermediate': 'Trung bình',
            'advanced': 'Nâng cao',
            'professional': 'Chuyên nghiệp'
        };
        return levelMap[level] || level;
    }

    // Export to PDF (requires additional library)
    async exportToPDF(content, filename) {
        try {
            // This would require a PDF library like jsPDF
            console.log('PDF export functionality would require additional library implementation');
            throw new Error('PDF export not yet implemented');
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            throw error;
        }
    }

    // Export to Excel (requires additional library)
    async exportToExcel(data, filename) {
        try {
            // This would require an Excel library like SheetJS
            console.log('Excel export functionality would require additional library implementation');
            throw new Error('Excel export not yet implemented');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            throw error;
        }
    }
}
