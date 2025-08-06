class Storage {
    constructor() {
        this.prefix = 'pingpong_';
        this.version = '1.0';
    }

    // Save data to localStorage with versioning
    save(key, data) {
        try {
            const wrappedData = {
                version: this.version,
                timestamp: new Date().toISOString(),
                data: data
            };
            localStorage.setItem(this.prefix + key, JSON.stringify(wrappedData));
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            return false;
        }
    }

    // Load data from localStorage with version checking
    load(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (!item) return null;

            const wrappedData = JSON.parse(item);
            
            // Check version compatibility
            if (!this.isVersionCompatible(wrappedData.version)) {
                console.warn(`Data version ${wrappedData.version} may not be compatible with current version ${this.version}`);
            }

            return wrappedData.data;
        } catch (error) {
            console.error('Error loading from storage:', error);
            return null;
        }
    }

    // Remove data from localStorage
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Error removing from storage:', error);
            return false;
        }
    }

    // Clear all app data
    clear() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    // Check if version is compatible
    isVersionCompatible(version) {
        // Simple version check - in real app, you might want more sophisticated logic
        return version === this.version || version.startsWith('1.');
    }

    // Get storage info
    getStorageInfo() {
        const info = {
            totalKeys: 0,
            appKeys: 0,
            totalSize: 0,
            appSize: 0,
            keys: []
        };

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                const size = new Blob([value]).size;
                
                info.totalKeys++;
                info.totalSize += size;
                
                if (key.startsWith(this.prefix)) {
                    info.appKeys++;
                    info.appSize += size;
                    info.keys.push({
                        key: key.replace(this.prefix, ''),
                        size: size,
                        lastModified: this.getLastModified(key)
                    });
                }
            }
        } catch (error) {
            console.error('Error getting storage info:', error);
        }

        return info;
    }

    // Get last modified date for a key
    getLastModified(key) {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;

            const wrappedData = JSON.parse(item);
            return wrappedData.timestamp ? new Date(wrappedData.timestamp) : null;
        } catch (error) {
            return null;
        }
    }

    // Export all app data
    exportAll() {
        const exportData = {
            version: this.version,
            exportDate: new Date().toISOString(),
            data: {}
        };

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    const cleanKey = key.replace(this.prefix, '');
                    exportData.data[cleanKey] = this.load(cleanKey);
                }
            }
        } catch (error) {
            console.error('Error exporting data:', error);
        }

        return exportData;
    }

    // Import all app data
    importAll(importData) {
        const results = {
            success: 0,
            errors: [],
            skipped: 0
        };

        try {
            // Version check
            if (!this.isVersionCompatible(importData.version)) {
                results.errors.push(`Version ${importData.version} may not be compatible`);
            }

            // Import each data type
            for (const [key, data] of Object.entries(importData.data)) {
                try {
                    if (this.save(key, data)) {
                        results.success++;
                    } else {
                        results.errors.push(`Failed to save ${key}`);
                    }
                } catch (error) {
                    results.errors.push(`Error importing ${key}: ${error.message}`);
                }
            }
        } catch (error) {
            results.errors.push(`General import error: ${error.message}`);
        }

        return results;
    }

    // Check storage quota
    checkQuota() {
        try {
            const testKey = this.prefix + 'quota_test';
            const testData = 'x'.repeat(1024); // 1KB test
            
            localStorage.setItem(testKey, testData);
            localStorage.removeItem(testKey);
            
            return {
                available: true,
                estimated: this.estimateQuota()
            };
        } catch (error) {
            return {
                available: false,
                error: error.message
            };
        }
    }

    // Estimate available storage
    estimateQuota() {
        const testKey = this.prefix + 'quota_estimate';
        let size = 0;
        
        try {
            while (true) {
                const testData = 'x'.repeat(size + 1024);
                localStorage.setItem(testKey, testData);
                size += 1024;
                
                if (size > 5 * 1024 * 1024) break; // Stop at 5MB
            }
        } catch (error) {
            // Quota exceeded
        } finally {
            localStorage.removeItem(testKey);
        }
        
        return Math.floor(size / 1024); // Return in KB
    }

    // Backup data to file
    backupToFile(filename = null) {
        const data = this.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `pingpong_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return true;
    }

    // Restore data from file
    restoreFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const results = this.importAll(data);
                    resolve(results);
                } catch (error) {
                    reject(new Error('Invalid backup file: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    }

    // Migrate data from old versions
    migrate() {
        // Check for old data format and migrate if necessary
        const migrations = [
            this.migrateFromV0ToV1.bind(this)
        ];

        let migrationCount = 0;
        migrations.forEach(migration => {
            if (migration()) {
                migrationCount++;
            }
        });

        return migrationCount;
    }

    // Example migration from version 0 to 1
    migrateFromV0ToV1() {
        // Check if there's old format data without version info
        const oldPlayers = localStorage.getItem('players');
        if (oldPlayers && !localStorage.getItem(this.prefix + 'players')) {
            try {
                const players = JSON.parse(oldPlayers);
                this.save('players', players);
                localStorage.removeItem('players');
                return true;
            } catch (error) {
                console.error('Migration v0->v1 failed:', error);
            }
        }
        return false;
    }

    // Clean up orphaned or corrupted data
    cleanup() {
        const cleaned = {
            removed: 0,
            errors: []
        };

        try {
            const keysToCheck = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keysToCheck.push(key);
                }
            }

            keysToCheck.forEach(key => {
                try {
                    const item = localStorage.getItem(key);
                    JSON.parse(item); // Test if valid JSON
                } catch (error) {
                    localStorage.removeItem(key);
                    cleaned.removed++;
                    cleaned.errors.push(`Removed corrupted key: ${key}`);
                }
            });
        } catch (error) {
            cleaned.errors.push(`Cleanup error: ${error.message}`);
        }

        return cleaned;
    }

    // Get storage usage statistics
    getUsageStats() {
        const info = this.getStorageInfo();
        const quota = this.checkQuota();
        
        return {
            used: info.appSize,
            usedFormatted: this.formatBytes(info.appSize),
            available: quota.available,
            estimatedQuota: quota.estimated ? quota.estimated * 1024 : null,
            estimatedQuotaFormatted: quota.estimated ? this.formatBytes(quota.estimated * 1024) : 'Unknown',
            usage: quota.estimated ? Math.round((info.appSize / (quota.estimated * 1024)) * 100) : 0,
            keys: info.appKeys
        };
    }

    // Format bytes to human readable format
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Create global storage instance
const storage = new Storage();
