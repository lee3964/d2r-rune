// D2R符文套利监控器 - 改进的内容脚本

class D2RPriceScraper {
    constructor() {
        this.currentSite = this.detectSite();
        this.runePatterns = this.getRunePatterns();
        this.prices = {};
        this.init();
    }
    
    detectSite() {
        const url = window.location.href;
        if (url.includes('g2g.com')) {
            return 'g2g';
        } else if (url.includes('dd373.com')) {
            return 'dd373';
        }
        return null;
    }
    
    getRunePatterns() {
        return {
            '23#': ['23#', 'Mal', '马尔'],
            '24#': ['24#', 'Ist', '伊斯特'],
            '25#': ['25#', 'Gul', '古尔'],
            '26#': ['26#', 'Vex', '伐克斯'],
            '27#': ['27#', 'Ohm', '欧姆'],
            '28#': ['28#', 'Lo', '罗'],
            '29#': ['29#', 'Sur', '瑟'],
            '30#': ['30#', 'Ber', '贝'],
            '31#': ['31#', 'Jah', '乔'],
            '32#': ['32#', 'Cham', '查姆'],
            '33#': ['33#', 'Zod', '萨德']
        };
    }
    
    init() {
        if (!this.currentSite) return;
        
        console.log(`D2R监控器: 检测到${this.currentSite.toUpperCase()}网站`);
        
        // 开始监控
        this.startMonitoring();
        
        // 添加监控UI
        this.addMonitoringUI();
    }
    
    startMonitoring() {
        // 初始提取
        this.extractPrices();
        
        // 定时监控（每10秒）
        this.monitorInterval = setInterval(() => {
            this.extractPrices();
        }, 10000);
        
        // 监听页面变化
        this.setupMutationObserver();
    }
    
    setupMutationObserver() {
        const observer = new MutationObserver(() => {
            setTimeout(() => this.extractPrices(), 1000);
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });
        
        this.observer = observer;
    }
    
    extractPrices() {
        console.log(`提取${this.currentSite.toUpperCase()}价格...`);
        
        const newPrices = this.currentSite === 'g2g' 
            ? this.extractG2GPrices() 
            : this.extractDD373Prices();
        
        if (Object.keys(newPrices).length > 0) {
            this.prices = newPrices;
            this.sendPricesToBackground(newPrices);
            this.updateMonitoringUI(newPrices);
        }
    }
    
    extractG2GPrices() {
        const prices = {};
        
        try {
            // 方法1: 搜索整个页面
            const allText = document.body.textContent;
            const lines = allText.split('\n');
            
            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed.length < 10) return;
                
                // 查找符文
                const rune = this.findRuneInText(trimmed);
                if (!rune) return;
                
                // 查找价格
                const price = this.extractPriceFromText(trimmed);
                if (!price) return;
                
                // 保存最低价
                if (!prices[rune] || price < prices[rune]) {
                    prices[rune] = price;
                }
            });
            
            // 方法2: 查找商品卡片
            this.extractFromCards(prices);
            
        } catch (error) {
            console.error('提取G2G价格失败:', error);
        }
        
        return prices;
    }
    
    extractDD373Prices() {
        const prices = {};
        
        try {
            // 方法1: 搜索整个页面
            const allText = document.body.textContent;
            const lines = allText.split('\n');
            
            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed.length < 10) return;
                
                // 查找符文
                const rune = this.findRuneInText(trimmed);
                if (!rune) return;
                
                // 查找价格
                const price = this.extractPriceFromText(trimmed);
                if (!price) return;
                
                // 保存最低价
                if (!prices[rune] || price < prices[rune]) {
                    prices[rune] = price;
                }
            });
            
            // 方法2: 查找商品卡片
            this.extractFromCards(prices);
            
        } catch (error) {
            console.error('提取DD373价格失败:', error);
        }
        
        return prices;
    }
    
    extractFromCards(prices) {
        // 尝试常见的选择器
        const selectors = [
            '.product-item', '.offer-item', '.listing-item',
            '.goods-item', '.item', '.product',
            '[class*="item"]', '[class*="product"]', '[class*="goods"]'
        ];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                try {
                    const text = element.textContent.trim();
                    if (text.length < 10) return;
                    
                    const rune = this.findRuneInText(text);
                    if (!rune) return;
                    
                    const price = this.extractPriceFromText(text);
                    if (!price) return;
                    
                    if (!prices[rune] || price < prices[rune]) {
                        prices[rune] = price;
                    }
                } catch (e) {
                    // 忽略错误
                }
            });
        });
    }
    
    findRuneInText(text) {
        const upperText = text.toUpperCase();
        
        // 匹配符文编号
        for (const rune of Object.keys(this.runePatterns)) {
            if (upperText.includes(rune)) {
                return rune;
            }
        }
        
        // 匹配符文名称
        for (const [rune, patterns] of Object.entries(this.runePatterns)) {
            for (const pattern of patterns) {
                if (upperText.includes(pattern.toUpperCase())) {
                    return rune;
                }
            }
        }
        
        return null;
    }
    
    extractPriceFromText(text) {
        // 价格匹配模式
        const patterns = [
            /[¥￥]\s*(\d+\.?\d*)/,
            /(\d+\.?\d*)\s*[元]/,
            /价格\s*[:：]?\s*(\d+\.?\d*)/i,
            /￥\s*(\d+\.?\d*)/,
            /CNY\s*(\d+\.?\d*)/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const price = parseFloat(match[1]);
                if (!isNaN(price) && price > 0 && price < 10000) {
                    return price;
                }
            }
        }
        
        return null;
    }
    
    sendPricesToBackground(prices) {
        chrome.runtime.sendMessage({
            action: 'pagePrices',
            site: this.currentSite,
            prices: prices,
            timestamp: new Date().toISOString()
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('发送价格失败:', chrome.runtime.lastError);
            }
        });
    }
    
    addMonitoringUI() {
        // 创建监控UI
        const ui = document.createElement('div');
        ui.id = 'd2r-monitor';
        ui.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 9999;
            font-size: 12px;
            max-width: 250px;
            border: 1px solid #4a6fa5;
        `;
        
        ui.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <strong style="color: #4a6fa5;">D2R监控器</strong>
                <span id="d2r-site">${this.currentSite.toUpperCase()}</span>
            </div>
            <div style="margin-bottom: 5px;">
                <span style="color: #aaa;">状态: </span>
                <span id="d2r-status" style="color: #4CAF50;">监控中</span>
            </div>
            <div id="d2r-prices" style="max-height: 150px; overflow-y: auto;">
                <div style="color: #888; font-style: italic;">等待数据...</div>
            </div>
            <div style="margin-top: 5px; font-size: 10px; color: #888; text-align: right;">
                更新: <span id="d2r-update-time">刚刚</span>
            </div>
        `;
        
        document.body.appendChild(ui);
    }
    
    updateMonitoringUI(prices) {
        const ui = document.getElementById('d2r-monitor');
        if (!ui) return;
        
        // 更新价格显示
        const pricesEl = ui.querySelector('#d2r-prices');
        if (pricesEl) {
            if (Object.keys(prices).length === 0) {
                pricesEl.innerHTML = '<div style="color: #888; font-style: italic;">未找到价格</div>';
            } else {
                let html = '';
                Object.entries(prices).forEach(([rune, price]) => {
                    html += `<div style="margin-bottom: 2px;">
                        <span style="color: #4a6fa5;">${rune}</span>: 
                        <span style="color: #FFD700;">¥${price.toFixed(2)}</span>
                    </div>`;
                });
                pricesEl.innerHTML = html;
            }
        }
        
        // 更新时间
        const timeEl = ui.querySelector('#d2r-update-time');
        if (timeEl) {
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        
        // 更新状态
        const statusEl = ui.querySelector('#d2r-status');
        if (statusEl) {
            statusEl.textContent = `找到 ${Object.keys(prices).length} 个符文`;
            statusEl.style.color = Object.keys(prices).length > 0 ? '#4CAF50' : '#FF9800';
        }
    }
    
    cleanup() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        if (this.observer) {
            this.observer.disconnect();
        }
        
        const ui = document.getElementById('d2r-monitor');
        if (ui) {
            ui.remove();
        }
    }
}

// 初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.d2rScraper = new D2RPriceScraper();
    });
} else {
    window.d2rScraper = new D2RPriceScraper();
}