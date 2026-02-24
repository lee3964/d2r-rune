// 改进的D2R符文价格爬虫

class ImprovedScraper {
    constructor() {
        this.currentSite = this.detectSite();
        this.runePatterns = this.getRunePatterns();
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
            '23#': ['23#', 'Mal', '马尔', '23号', '#23'],
            '24#': ['24#', 'Ist', '伊斯特', '24号', '#24'],
            '25#': ['25#', 'Gul', '古尔', '25号', '#25'],
            '26#': ['26#', 'Vex', '伐克斯', '26号', '#26'],
            '27#': ['27#', 'Ohm', '欧姆', '27号', '#27'],
            '28#': ['28#', 'Lo', '罗', '28号', '#28'],
            '29#': ['29#', 'Sur', '瑟', '29号', '#29'],
            '30#': ['30#', 'Ber', '贝', '30号', '#30'],
            '31#': ['31#', 'Jah', '乔', '31号', '#31'],
            '32#': ['32#', 'Cham', '查姆', '32号', '#32'],
            '33#': ['33#', 'Zod', '萨德', '33号', '#33']
        };
    }
    
    init() {
        if (!this.currentSite) return;
        
        console.log(`D2R监控器: 检测到${this.currentSite.toUpperCase()}网站，开始监控...`);
        
        // 立即开始监控
        this.startMonitoring();
        
        // 添加监控UI
        this.addMonitoringUI();
    }
    
    startMonitoring() {
        // 初始提取
        this.extractPrices();
        
        // 定时监控
        this.monitorInterval = setInterval(() => {
            this.extractPrices();
        }, 30000); // 每30秒监控一次
        
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
            attributes: true,
            characterData: true
        });
        
        this.observer = observer;
    }
    
    extractPrices() {
        console.log(`开始提取${this.currentSite.toUpperCase()}价格...`);
        
        const prices = this.currentSite === 'g2g' 
            ? this.extractG2GPrices() 
            : this.extractDD373Prices();
        
        if (Object.keys(prices).length > 0) {
            console.log(`提取到${Object.keys(prices).length}个符文价格:`, prices);
            this.sendPricesToBackground(prices);
            this.updateMonitoringUI(prices);
        } else {
            console.log('未找到符文价格，尝试备用方法...');
            this.tryAlternativeExtraction();
        }
    }
    
    extractG2GPrices() {
        const prices = {};
        
        try {
            // 方法1: 查找所有包含价格和符文信息的元素
            const priceElements = document.querySelectorAll('*');
            
            priceElements.forEach(element => {
                const text = element.textContent.trim();
                if (!text || text.length < 5) return;
                
                // 检查是否包含符文信息
                const rune = this.findRuneInText(text);
                if (!rune) return;
                
                // 提取价格
                const price = this.extractPriceFromText(text);
                if (!price || price < 1 || price > 10000) return;
                
                // 保存最低价
                if (!prices[rune] || price < prices[rune]) {
                    prices[rune] = price;
                    console.log(`找到 ${rune}: ¥${price} - ${text.substring(0, 50)}...`);
                }
            });
            
            // 方法2: 查找特定结构的商品卡片
            if (Object.keys(prices).length === 0) {
                this.extractG2GStructured(prices);
            }
            
        } catch (error) {
            console.error('提取G2G价格失败:', error);
        }
        
        return prices;
    }
    
    extractG2GStructured(prices) {
        // 尝试常见的G2G商品卡片结构
        const cardSelectors = [
            '.product-item',
            '.offer-item',
            '.listing-item',
            '.product-card',
            '.item-card',
            '[class*="product"]',
            '[class*="item"]',
            '[class*="listing"]'
        ];
        
        cardSelectors.forEach(selector => {
            const cards = document.querySelectorAll(selector);
            cards.forEach(card => {
                try {
                    const text = card.textContent.trim();
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
    
    extractDD373Prices() {
        const prices = {};
        
        try {
            // 方法1: 查找所有包含价格和符文信息的元素
            const priceElements = document.querySelectorAll('*');
            
            priceElements.forEach(element => {
                const text = element.textContent.trim();
                if (!text || text.length < 5) return;
                
                // 检查是否包含符文信息
                const rune = this.findRuneInText(text);
                if (!rune) return;
                
                // 提取价格
                const price = this.extractPriceFromText(text);
                if (!price || price < 1 || price > 10000) return;
                
                // 保存最低价
                if (!prices[rune] || price < prices[rune]) {
                    prices[rune] = price;
                    console.log(`找到 ${rune}: ¥${price} - ${text.substring(0, 50)}...`);
                }
            });
            
            // 方法2: 查找特定结构的商品卡片
            if (Object.keys(prices).length === 0) {
                this.extractDD373Structured(prices);
            }
            
        } catch (error) {
            console.error('提取DD373价格失败:', error);
        }
        
        return prices;
    }
    
    extractDD373Structured(prices) {
        // 尝试常见的DD373商品卡片结构
        const cardSelectors = [
            '.goods-item',
            '.item',
            '.product',
            '.list-item',
            '.goods-list-item',
            '[class*="goods"]',
            '[class*="item"]',
            '[class*="product"]'
        ];
        
        cardSelectors.forEach(selector => {
            const cards = document.querySelectorAll(selector);
            cards.forEach(card => {
                try {
                    const text = card.textContent.trim();
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
        
        // 直接匹配符文编号
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
        // 多种价格格式匹配
        const pricePatterns = [
            /[¥￥]\s*(\d+\.?\d*)/,                    // ¥12.34
            /(\d+\.?\d*)\s*[元]/,                     // 12.34元
            /价格\s*[:：]?\s*(\d+\.?\d*)/i,           // 价格: 12.34
            /￥\s*(\d+\.?\d*)/,                       // ￥12.34
            /CNY\s*(\d+\.?\d*)/i,                     // CNY 12.34
            /RMB\s*(\d+\.?\d*)/i,                     // RMB 12.34
            /(\d+\.?\d*)\s*CNY/i,                     // 12.34 CNY
            /(\d+\.?\d*)\s*RMB/i,                     // 12.34 RMB
            /cost\s*[:：]?\s*(\d+\.?\d*)/i,           // cost: 12.34
            /单价\s*[:：]?\s*(\d+\.?\d*)/i,           // 单价: 12.34
            /(\d+\.?\d*)\s*起/i                       // 12.34起
        ];
        
        for (const pattern of pricePatterns) {
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
    
    tryAlternativeExtraction() {
        // 备用提取方法：查找所有数字和符文组合
        const allText = document.body.textContent;
        const lines = allText.split('\n').filter(line => line.trim().length > 10);
        
        lines.forEach(line => {
            const rune = this.findRuneInText(line);
            if (rune) {
                // 在行中查找价格
                const priceMatch = line.match(/(\d+\.?\d*)/g);
                if (priceMatch) {
                    priceMatch.forEach(priceStr => {
                        const price = parseFloat(priceStr);
                        if (price > 1 && price < 10000) {
                            console.log(`备用方法找到 ${rune}: ¥${price}`);
                        }
                    });
                }
            }
        });
    }
    
    sendPricesToBackground(prices) {
        chrome.runtime.sendMessage({
            action: 'pagePrices',
            site: this.currentSite,
            prices: prices,
            timestamp: new Date().toISOString(),
            url: window.location.href
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('发送价格数据失败:', chrome.runtime.lastError);
            } else if (response && response.success) {
                console.log('价格数据已发送到后台');
            }
        });
    }
    
    addMonitoringUI() {
        // 添加监控状态指示器
        const monitorDiv = document.createElement('div');
        monitorDiv.id = 'd2r-monitor-ui';
        monitorDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.85);
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            z-index: 99999;
            font-family: Arial, sans-serif;
            font-size: 12px;
            max-width: 300px;
            max-height: 400px;
            overflow-y: auto;
            border: 2px solid #4a6fa5;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        monitorDiv.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <div style="width: 10px; height: 10px; background: #4CAF50; border-radius: 50%; margin-right: 8px;"></div>
                <strong style="color: #4a6fa5;">D2R监控器 (${this.currentSite.toUpperCase()})</strong>
            </div>
            <div id="d2r-monitor-status" style="margin-bottom: 8px;">
                <span style="color: #aaa;">状态: </span>
                <span style="color: #4CAF50;">监控中...</span>
            </div>
            <div id="d2r-monitor-prices" style="font-size: 11px;">
                <div style="color: #aaa; margin-bottom: 4px;">已找到: <span id="d2r-found-count">0</span> 个符文</div>
                <div id="d2r-price-list" style="max-height: 200px; overflow-y: auto;"></div>
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #333; font-size: 10px; color: #888;">
                最后更新: <span id="d2r-last-update">刚刚</span>
            </div>
        `;
        
        document.body.appendChild(monitorDiv);
        
        // 添加关闭按钮
        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 8px;
            cursor: pointer;
            color: #999;
            font-size: 16px;
        `;
        closeBtn.onclick = () => monitorDiv.remove();
        monitorDiv.appendChild(closeBtn);
    }
    
    updateMonitoringUI(prices) {
        const ui = document.getElementById('d2r-monitor-ui');
        if (!ui) return;
        
        // 更新状态
        const statusEl = ui.querySelector('#d2r-monitor-status span:last-child');
        if (statusEl) {
            statusEl.textContent = `已找到 ${Object.keys(prices).length} 个符文`;
            statusEl.style.color = Object.keys(prices).length > 0 ? '#4CAF50' : '#FF9800';
        }
        
        // 更新计数
        const countEl = ui.querySelector('#d2r-found-count');
        if (countEl) {
            countEl.textContent = Object.keys(prices).length;
        }
        
        // 更新价格列表
        const listEl = ui.querySelector('#d2r-price-list');
        if (listEl) {
            let html = '';
            Object.entries(prices).forEach(([rune, price]) => {
                html += `<div style="margin-bottom: 2px;">
                    <span style="color: #4a6fa5; font-weight: bold;">${rune}</span>: 
                    <span style="color: #FFD700;">¥${price.toFixed(2)}</span>
                </div>`;
            });
            listEl.innerHTML = html || '<div style="color: #888; font-style: italic;">未找到价格</div>';
        }
        
        // 更新时间
        const timeEl = ui.querySelector('#d2r-last-update');
        if (timeEl) {
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }
    
    cleanup() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        if (this.observer) {
            this.observer.disconnect();
        }
        
        const ui = document.getElementById('d2r-monitor-ui');
        if (ui) {
            ui.remove();
        }
    }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.d2rScraper = new ImprovedScraper();
    });
} else {
    window.d2rScraper = new ImprovedScraper();
}