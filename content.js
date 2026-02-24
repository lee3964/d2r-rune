// D2R符文套利监控器 - 内容脚本
// 在目标网站页面上运行，用于提取价格数据

class PageScraper {
    constructor() {
        this.currentSite = this.detectSite();
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
    
    init() {
        if (!this.currentSite) return;
        
        console.log(`D2R监控器: 检测到${this.currentSite.toUpperCase()}网站`);
        
        // 监听页面变化
        this.observePageChanges();
        
        // 初始提取
        this.extractPrices();
    }
    
    observePageChanges() {
        // 使用MutationObserver监听DOM变化
        const observer = new MutationObserver((mutations) => {
            let shouldExtract = false;
            
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldExtract = true;
                    break;
                }
            }
            
            if (shouldExtract) {
                setTimeout(() => this.extractPrices(), 500);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    extractPrices() {
        const prices = this.currentSite === 'g2g' 
            ? this.extractG2GPrices() 
            : this.extractDD373Prices();
        
        if (Object.keys(prices).length > 0) {
            this.sendPricesToBackground(prices);
        }
    }
    
    extractG2GPrices() {
        const prices = {};
        
        try {
            // G2G网站价格提取逻辑
            // 根据实际页面结构调整选择器
            
            // 方法1: 尝试常见的选择器
            const selectors = [
                '.product-item',
                '.offer-item', 
                '.listing-item',
                '[class*="item"][class*="product"]',
                '[class*="item"][class*="offer"]'
            ];
            
            let items = [];
            for (const selector of selectors) {
                const found = document.querySelectorAll(selector);
                if (found.length > 0) {
                    items = found;
                    break;
                }
            }
            
            items.forEach(item => {
                try {
                    // 提取标题
                    const titleSelectors = [
                        '.product-title',
                        '.offer-title',
                        '.title',
                        '[class*="title"]',
                        'h3', 'h4'
                    ];
                    
                    let title = '';
                    for (const selector of titleSelectors) {
                        const element = item.querySelector(selector);
                        if (element) {
                            title = element.textContent.trim();
                            break;
                        }
                    }
                    
                    if (!title) return;
                    
                    // 提取符文信息
                    const rune = this.extractRuneFromTitle(title);
                    if (!rune) return;
                    
                    // 提取价格
                    const priceSelectors = [
                        '.product-price',
                        '.offer-price',
                        '.price',
                        '[class*="price"]',
                        '.amount',
                        '.cost'
                    ];
                    
                    let priceText = '';
                    for (const selector of priceSelectors) {
                        const element = item.querySelector(selector);
                        if (element) {
                            priceText = element.textContent.trim();
                            break;
                        }
                    }
                    
                    const price = this.extractPriceFromText(priceText);
                    if (!price) return;
                    
                    // 保存最低价
                    if (!prices[rune] || price < prices[rune]) {
                        prices[rune] = price;
                    }
                    
                } catch (error) {
                    console.error('提取单个商品失败:', error);
                }
            });
            
        } catch (error) {
            console.error('提取G2G价格失败:', error);
        }
        
        console.log('G2G提取结果:', prices);
        return prices;
    }
    
    extractDD373Prices() {
        const prices = {};
        
        try {
            // DD373网站价格提取逻辑
            // 根据实际页面结构调整选择器
            
            // 方法1: 尝试常见的选择器
            const selectors = [
                '.goods-item',
                '.item',
                '.product',
                '.list-item',
                '[class*="item"]'
            ];
            
            let items = [];
            for (const selector of selectors) {
                const found = document.querySelectorAll(selector);
                if (found.length > 0) {
                    items = found;
                    break;
                }
            }
            
            items.forEach(item => {
                try {
                    // 提取标题
                    const titleSelectors = [
                        '.goods-name',
                        '.item-title',
                        '.title',
                        '.name',
                        'h3', 'h4'
                    ];
                    
                    let title = '';
                    for (const selector of titleSelectors) {
                        const element = item.querySelector(selector);
                        if (element) {
                            title = element.textContent.trim();
                            break;
                        }
                    }
                    
                    if (!title) return;
                    
                    // 提取符文信息
                    const rune = this.extractRuneFromTitle(title);
                    if (!rune) return;
                    
                    // 提取价格
                    const priceSelectors = [
                        '.goods-price',
                        '.item-price',
                        '.price',
                        '.cost',
                        '.amount'
                    ];
                    
                    let priceText = '';
                    for (const selector of priceSelectors) {
                        const element = item.querySelector(selector);
                        if (element) {
                            priceText = element.textContent.trim();
                            break;
                        }
                    }
                    
                    const price = this.extractPriceFromText(priceText);
                    if (!price) return;
                    
                    // 保存最低价
                    if (!prices[rune] || price < prices[rune]) {
                        prices[rune] = price;
                    }
                    
                } catch (error) {
                    console.error('提取单个商品失败:', error);
                }
            });
            
        } catch (error) {
            console.error('提取DD373价格失败:', error);
        }
        
        console.log('DD373提取结果:', prices);
        return prices;
    }
    
    extractRuneFromTitle(title) {
        // 符文映射
        const runePatterns = {
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
        
        for (const [rune, patterns] of Object.entries(runePatterns)) {
            for (const pattern of patterns) {
                if (title.includes(pattern)) {
                    return rune;
                }
            }
        }
        
        // 尝试数字匹配
        const runeRegex = /(\d{2})#/;
        const match = title.match(runeRegex);
        if (match) {
            const runeNumber = parseInt(match[1]);
            if (runeNumber >= 23 && runeNumber <= 33) {
                return match[0];
            }
        }
        
        return null;
    }
    
    extractPriceFromText(text) {
        if (!text) return null;
        
        // 匹配各种价格格式
        const pricePatterns = [
            /[¥￥]\s*(\d+\.?\d*)/,           // ¥12.34
            /(\d+\.?\d*)\s*[元]/i,           // 12.34元
            /价格\s*[:：]?\s*(\d+\.?\d*)/i,   // 价格: 12.34
            /cost\s*[:：]?\s*(\d+\.?\d*)/i,   // cost: 12.34
            /(\d+\.?\d*)\s*CNY/i,            // 12.34 CNY
            /(\d+\.?\d*)\s*RMB/i             // 12.34 RMB
        ];
        
        for (const pattern of pricePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const price = parseFloat(match[1]);
                if (!isNaN(price) && price > 0) {
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
    
    // 在页面上显示提取的信息（调试用）
    showDebugInfo(prices) {
        const debugDiv = document.createElement('div');
        debugDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 9999;
            font-size: 12px;
            max-width: 300px;
            max-height: 400px;
            overflow-y: auto;
        `;
        
        let html = `<strong>D2R监控器 (${this.currentSite.toUpperCase()})</strong><br>`;
        html += `<small>提取到 ${Object.keys(prices).length} 个符文价格</small><br><br>`;
        
        Object.entries(prices).forEach(([rune, price]) => {
            html += `${rune}: ¥${price.toFixed(2)}<br>`;
        });
        
        debugDiv.innerHTML = html;
        document.body.appendChild(debugDiv);
        
        // 5秒后自动移除
        setTimeout(() => {
            if (debugDiv.parentNode) {
                debugDiv.parentNode.removeChild(debugDiv);
            }
        }, 5000);
    }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.scraper = new PageScraper();
    });
} else {
    window.scraper = new PageScraper();
}

// 导出用于测试
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PageScraper };
}