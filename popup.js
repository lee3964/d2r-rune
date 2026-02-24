// D2R符文套利监控器 - 弹出窗口逻辑

class D2RArbitrageMonitor {
    constructor() {
        this.prices = {};
        this.settings = {
            updateInterval: 3, // 分钟
            notificationThreshold: 20, // CNY
            enableNotifications: true,
            highlightBest: true,
            githubToken: '',
            minProfit: 5,
            minProfitRate: 10,
            sortBy: 'profit'
        };
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.bindEvents();
        this.loadPrices();
        this.startAutoRefresh();
    }
    
    bindEvents() {
        // 刷新按钮
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.updatePrices();
        });
        
        // 设置按钮
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettings();
        });
        
        // 导出按钮
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });
        
        // 自动刷新切换
        document.getElementById('autoRefreshToggle').addEventListener('click', (e) => {
            this.toggleAutoRefresh(e.target);
        });
        
        // 过滤器变化
        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.settings.sortBy = e.target.value;
            this.saveSettings();
            this.renderTable();
        });
        
        document.getElementById('minProfit').addEventListener('change', (e) => {
            this.settings.minProfit = parseInt(e.target.value) || 0;
            this.saveSettings();
            this.renderTable();
        });
        
        document.getElementById('minProfitRate').addEventListener('change', (e) => {
            this.settings.minProfitRate = parseInt(e.target.value) || 0;
            this.saveSettings();
            this.renderTable();
        });
        
        // 设置模态框
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideSettings();
            });
        });
        
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettingsFromForm();
        });
        
        // 点击模态框外部关闭
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.hideSettings();
            }
        });
    }
    
    loadSettings() {
        chrome.storage.local.get(['d2rSettings'], (result) => {
            if (result.d2rSettings) {
                this.settings = { ...this.settings, ...result.d2rSettings };
                this.updateSettingsForm();
            }
        });
    }
    
    saveSettings() {
        chrome.storage.local.set({ d2rSettings: this.settings });
    }
    
    saveSettingsFromForm() {
        this.settings.updateInterval = parseInt(document.getElementById('updateInterval').value) || 3;
        this.settings.notificationThreshold = parseInt(document.getElementById('notificationThreshold').value) || 20;
        this.settings.enableNotifications = document.getElementById('enableNotifications').checked;
        this.settings.highlightBest = document.getElementById('highlightBest').checked;
        this.settings.githubToken = document.getElementById('githubToken').value;
        
        this.saveSettings();
        this.hideSettings();
        this.startAutoRefresh();
    }
    
    updateSettingsForm() {
        document.getElementById('updateInterval').value = this.settings.updateInterval;
        document.getElementById('notificationThreshold').value = this.settings.notificationThreshold;
        document.getElementById('enableNotifications').checked = this.settings.enableNotifications;
        document.getElementById('highlightBest').checked = this.settings.highlightBest;
        document.getElementById('githubToken').value = this.settings.githubToken;
        document.getElementById('sortBy').value = this.settings.sortBy;
        document.getElementById('minProfit').value = this.settings.minProfit;
        document.getElementById('minProfitRate').value = this.settings.minProfitRate;
    }
    
    showSettings() {
        document.getElementById('settingsModal').classList.add('show');
    }
    
    hideSettings() {
        document.getElementById('settingsModal').classList.remove('show');
    }
    
    loadPrices() {
        chrome.storage.local.get(['d2rPrices', 'lastUpdate'], (result) => {
            if (result.d2rPrices) {
                this.prices = result.d2rPrices;
                this.renderTable();
            }
            
            if (result.lastUpdate) {
                this.updateLastUpdateTime(result.lastUpdate);
            }
        });
    }
    
    async updatePrices() {
        this.setStatus('updating', '更新价格中...');
        
        try {
            // 发送消息给background script开始爬取
            const response = await chrome.runtime.sendMessage({ 
                action: 'fetchPrices' 
            });
            
            if (response.success) {
                this.prices = response.prices;
                this.renderTable();
                this.setStatus('success', '价格更新成功');
                this.updateLastUpdateTime(new Date().toISOString());
                
                // 保存到本地存储
                chrome.storage.local.set({ 
                    d2rPrices: this.prices,
                    lastUpdate: new Date().toISOString()
                });
                
                // 检查是否有高利润机会
                this.checkHighProfitOpportunities();
                
                // 同步到GitHub Gist（如果配置了token）
                if (this.settings.githubToken) {
                    this.syncToGitHubGist();
                }
            } else {
                throw new Error(response.error || '更新失败');
            }
        } catch (error) {
            console.error('更新价格失败:', error);
            this.setStatus('error', `更新失败: ${error.message}`);
        }
    }
    
    setStatus(type, message) {
        const statusElement = document.getElementById('status');
        statusElement.textContent = message;
        statusElement.className = `status-${type}`;
    }
    
    updateLastUpdateTime(timestamp) {
        const date = new Date(timestamp);
        const formattedTime = date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('lastUpdate').textContent = `最后更新: ${formattedTime}`;
    }
    
    renderTable() {
        const tableBody = document.getElementById('priceTableBody');
        
        if (!this.prices || Object.keys(this.prices).length === 0) {
            tableBody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="7">
                        <div class="loading">
                            <i class="fas fa-exclamation-circle"></i> 暂无价格数据，请点击"立即更新"
                        </div>
                    </td>
                </tr>
            `;
            this.updateSummary({});
            return;
        }
        
        // 过滤和排序数据
        let runes = Object.values(this.prices);
        
        // 应用过滤器
        runes = runes.filter(rune => {
            const profit = this.calculateProfit(rune);
            const profitRate = this.calculateProfitRate(rune);
            return profit >= this.settings.minProfit && profitRate >= this.settings.minProfitRate;
        });
        
        // 应用排序
        runes.sort((a, b) => {
            const profitA = this.calculateProfit(a);
            const profitB = this.calculateProfit(b);
            const profitRateA = this.calculateProfitRate(a);
            const profitRateB = this.calculateProfitRate(b);
            
            switch (this.settings.sortBy) {
                case 'profit':
                    return profitB - profitA;
                case 'profitRate':
                    return profitRateB - profitRateA;
                case 'runeNumber':
                    return parseInt(a.rune.replace('#', '')) - parseInt(b.rune.replace('#', ''));
                case 'g2gPrice':
                    return (b.g2gPrice || 0) - (a.g2gPrice || 0);
                case 'dd373Price':
                    return (b.dd373Price || 0) - (a.dd373Price || 0);
                default:
                    return profitB - profitA;
            }
        });
        
        // 生成表格行
        let html = '';
        let bestProfit = -Infinity;
        let bestRune = null;
        let totalProfitRate = 0;
        let validRunes = 0;
        
        runes.forEach(rune => {
            const profit = this.calculateProfit(rune);
            const profitRate = this.calculateProfitRate(rune);
            
            // 更新统计数据
            if (profit > bestProfit) {
                bestProfit = profit;
                bestRune = rune;
            }
            
            if (profit > 0) {
                totalProfitRate += profitRate;
                validRunes++;
            }
            
            // 确定行样式
            let rowClass = '';
            if (this.settings.highlightBest && rune === bestRune) {
                rowClass = 'best-profit';
            } else if (profit >= this.settings.notificationThreshold) {
                rowClass = 'high-profit';
            }
            
            // 推荐标识
            let recommendHtml = '';
            if (profit >= this.settings.notificationThreshold) {
                recommendHtml = '<span class="recommend-buy">强烈推荐</span>';
            } else if (profit > 0) {
                recommendHtml = '<i class="fas fa-star recommend-star"></i>';
            }
            
            html += `
                <tr class="${rowClass}">
                    <td class="rune-cell">${rune.rune}</td>
                    <td class="name-cell">${rune.name || '未知'}</td>
                    <td class="price-cell dd373-price">¥${this.formatPrice(rune.dd373Price)}</td>
                    <td class="price-cell g2g-price">¥${this.formatPrice(rune.g2gPrice)}</td>
                    <td class="profit-cell ${profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                        ¥${this.formatPrice(profit)}
                    </td>
                    <td class="profit-rate-cell ${profitRate >= 0 ? 'profit-positive' : 'profit-negative'}">
                        ${profitRate.toFixed(1)}%
                    </td>
                    <td class="recommend-cell">${recommendHtml}</td>
                </tr>
            `;
        });
        
        if (html === '') {
            html = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #6c757d;">
                        没有找到符合条件的符文
                    </td>
                </tr>
            `;
        }
        
        tableBody.innerHTML = html;
        
        // 更新摘要信息
        this.updateSummary({
            bestRune,
            bestProfit,
            avgProfitRate: validRunes > 0 ? (totalProfitRate / validRunes).toFixed(1) : 0
        });
    }
    
    updateSummary({ bestRune, bestProfit, avgProfitRate }) {
        document.getElementById('bestRune').textContent = bestRune ? 
            `${bestRune.rune} (${bestRune.name || '未知'})` : '-';
        
        document.getElementById('maxProfit').textContent = bestProfit !== undefined ? 
            `¥${this.formatPrice(bestProfit)}` : '- CNY';
        
        document.getElementById('avgProfitRate').textContent = avgProfitRate ? 
            `${avgProfitRate}%` : '- %';
    }
    
    calculateProfit(rune) {
        if (!rune.g2gPrice || !rune.dd373Price) return 0;
        
        // G2G净收入 = 销售价 * (1 - 9%)
        const g2gNet = rune.g2gPrice * 0.91;
        
        // DD373总成本 = 采购价 * (1 + 5%)
        const dd373Total = rune.dd373Price * 1.05;
        
        // 利润 = G2G净收入 - DD373总成本
        return g2gNet - dd373Total;
    }
    
    calculateProfitRate(rune) {
        const profit = this.calculateProfit(rune);
        if (!rune.dd373Price || profit <= 0) return 0;
        
        // 利润率 = 利润 / DD373总成本 * 100%
        const dd373Total = rune.dd373Price * 1.05;
        return (profit / dd373Total) * 100;
    }
    
    formatPrice(price) {
        if (!price && price !== 0) return '0.00';
        return parseFloat(price).toFixed(2);
    }
    
    checkHighProfitOpportunities() {
        if (!this.settings.enableNotifications) return;
        
        let highProfitRunes = [];
        Object.values(this.prices).forEach(rune => {
            const profit = this.calculateProfit(rune);
            if (profit >= this.settings.notificationThreshold) {
                highProfitRunes.push({
                    rune: rune.rune,
                    name: rune.name,
                    profit: profit
                });
            }
        });
        
        if (highProfitRunes.length > 0) {
            this.showNotification(highProfitRunes);
        }
    }
    
    showNotification(highProfitRunes) {
        const bestRune = highProfitRunes.reduce((best, current) => 
            current.profit > best.profit ? current : best
        );
        
        const notificationOptions = {
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: '💰 发现高利润套利机会！',
            message: `${bestRune.rune} (${bestRune.name}) 利润: ¥${this.formatPrice(bestRune.profit)}`,
            priority: 2
        };
        
        chrome.notifications.create('highProfitAlert', notificationOptions);
    }
    
    startAutoRefresh() {
        // 清除现有alarm
        chrome.alarms.clear('autoRefresh');
        
        // 创建新的alarm
        chrome.alarms.create('autoRefresh', {
            periodInMinutes: this.settings.updateInterval
        });
        
        // 监听alarm触发
        chrome.alarms.onAlarm.addListener((alarm) => {
            if (alarm.name === 'autoRefresh') {
                this.updatePrices();
            }
        });
    }
    
    toggleAutoRefresh(button) {
        const isActive = button.classList.contains('active');
        
        if (isActive) {
            chrome.alarms.clear('autoRefresh');
            button.classList.remove('active');
            button.innerHTML = '<i class="fas fa-toggle-off"></i> 关闭';
        } else {
            this.startAutoRefresh();
            button.classList.add('active');
            button.innerHTML = '<i class="fas fa-toggle-on"></i> 开启';
        }
    }
    
    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            prices: this.prices,
            summary: {
                bestRune: document.getElementById('bestRune').textContent,
                maxProfit: document.getElementById('maxProfit').textContent,
                avgProfitRate: document.getElementById('avgProfitRate').textContent
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `d2r-arbitrage-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    async syncToGitHubGist() {
        if (!this.settings.githubToken) return;
        
        try {
            const data = {
                timestamp: new Date().toISOString(),
                prices: this.prices
            };
            
            const response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.settings.githubToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: 'D2R符文套利数据',
                    public: false,
                    files: {
                        'd2r-prices.json': {
                            content: JSON.stringify(data, null, 2)
                        }
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`GitHub API错误: ${response.status}`);
            }
            
            console.log('数据已同步到GitHub Gist');
        } catch (error) {
            console.error('同步到GitHub Gist失败:', error);
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.monitor = new D2RArbitrageMonitor();
});