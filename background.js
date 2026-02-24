// D2R符文套利监控器 - 后台服务

// 符文映射表
const RUNE_MAPPING = {
    '23#': { number: 23, name: 'Mal' },
    '24#': { number: 24, name: 'Ist' },
    '25#': { number: 25, name: 'Gul' },
    '26#': { number: 26, name: 'Vex' },
    '27#': { number: 27, name: 'Ohm' },
    '28#': { number: 28, name: 'Lo' },
    '29#': { number: 29, name: 'Sur' },
    '30#': { number: 30, name: 'Ber' },
    '31#': { number: 31, name: 'Jah' },
    '32#': { number: 32, name: 'Cham' },
    '33#': { number: 33, name: 'Zod' }
};

class BackgroundService {
    constructor() {
        this.init();
    }
    
    init() {
        // 监听来自popup的消息
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // 保持消息通道开放用于异步响应
        });
        
        // 监听扩展安装/更新
        chrome.runtime.onInstalled.addListener(() => {
            this.onInstalled();
        });
        
        // 初始化价格数据
        this.initializePrices();
    }
    
    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'fetchPrices':
                    const prices = await this.fetchAllPrices();
                    sendResponse({ success: true, prices });
                    break;
                    
                case 'getPrices':
                    const storedPrices = await this.getStoredPrices();
                    sendResponse({ success: true, prices: storedPrices });
                    break;
                    
                case 'pagePrices':
                    // 接收来自内容脚本的价格数据
                    console.log(`收到${message.site}价格数据:`, message.prices);
                    this.processPagePrices(message.site, message.prices);
                    sendResponse({ success: true });
                    break;
                    
                default:
                    sendResponse({ success: false, error: '未知操作' });
            }
        } catch (error) {
            console.error('处理消息时出错:', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    
    processPagePrices(site, prices) {
        // 更新存储的价格
        chrome.storage.local.get(['d2rPrices'], (result) => {
            const currentPrices = result.d2rPrices || {};
            const updatedPrices = { ...currentPrices };
            
            // 更新对应网站的价格
            Object.keys(prices).forEach(rune => {
                if (!updatedPrices[rune]) {
                    updatedPrices[rune] = {
                        rune,
                        name: RUNE_MAPPING[rune]?.name || '未知',
                        g2gPrice: null,
                        dd373Price: null,
                        lastUpdated: null
                    };
                }
                
                if (site === 'g2g') {
                    updatedPrices[rune].g2gPrice = prices[rune];
                } else if (site === 'dd373') {
                    updatedPrices[rune].dd373Price = prices[rune];
                }
                
                updatedPrices[rune].lastUpdated = new Date().toISOString();
            });
            
            // 保存更新后的价格
            chrome.storage.local.set({ d2rPrices: updatedPrices }, () => {
                console.log('价格数据已更新');
                
                // 发送通知给popup
                chrome.runtime.sendMessage({
                    action: 'pricesUpdated',
                    prices: updatedPrices
                }).catch(() => {
                    // popup may not be open, ignore error
                });
            });
        });
    }
    
    onInstalled() {
        console.log('D2R符文套利监控器已安装/更新');
        
        // 创建默认设置
        chrome.storage.local.get(['d2rSettings'], (result) => {
            if (!result.d2rSettings) {
                const defaultSettings = {
                    updateInterval: 3,
                    notificationThreshold: 20,
                    enableNotifications: true,
                    highlightBest: true,
                    githubToken: '',
                    minProfit: 5,
                    minProfitRate: 10,
                    sortBy: 'profit'
                };
                chrome.storage.local.set({ d2rSettings: defaultSettings });
            }
        });
        
        // 创建定时任务
        chrome.alarms.create('autoRefresh', {
            periodInMinutes: 3
        });
    }
    
    initializePrices() {
        // 初始化空的符文价格数据
        const initialPrices = {};
        Object.keys(RUNE_MAPPING).forEach(rune => {
            initialPrices[rune] = {
                rune,
                name: RUNE_MAPPING[rune].name,
                g2gPrice: null,
                dd373Price: null,
                lastUpdated: null
            };
        });
        
        chrome.storage.local.set({ d2rPrices: initialPrices });
    }
    
    async getStoredPrices() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['d2rPrices'], (result) => {
                resolve(result.d2rPrices || {});
            });
        });
    }
    
    async fetchAllPrices() {
        console.log('开始获取符文价格...');
        
        try {
            // 并行获取两个网站的价格
            const [g2gPrices, dd373Prices] = await Promise.all([
                this.fetchG2GPrices(),
                this.fetchDD373Prices()
            ]);
            
            // 合并价格数据
            const allPrices = {};
            Object.keys(RUNE_MAPPING).forEach(rune => {
                allPrices[rune] = {
                    rune,
                    name: RUNE_MAPPING[rune].name,
                    g2gPrice: g2gPrices[rune] || null,
                    dd373Price: dd373Prices[rune] || null,
                    lastUpdated: new Date().toISOString()
                };
            });
            
            console.log('价格获取完成:', allPrices);
            return allPrices;
            
        } catch (error) {
            console.error('获取价格失败:', error);
            throw error;
        }
    }
    
    async fetchG2GPrices() {
        const url = 'https://www.g2g.com/cn/categories/diablo-2-resurrected-item-for-sale?fa=7075ff24%3Ac16696b1%7C7071deb3%3A4d2c8b55%7Cec59a3aa%3A9fa18172,53c0e8e3,28b7948c,d9ab9405,274a78dd,7c273a77,c41e297e,caa33535,b980ce6c,b3984b8d,e6414e3b&sort=lowest_price';
        
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`G2G请求失败: ${response.status}`);
            }
            
            const html = await response.text();
            return this.parseG2GHTML(html);
            
        } catch (error) {
            console.error('获取G2G价格失败:', error);
            return {};
        }
    }
    
    parseG2GHTML(html) {
        const prices = {};
        
        try {
            // 创建临时DOM解析器
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // 查找所有商品项
            const items = doc.querySelectorAll('.product-item, .offer-item, .listing-item');
            
            items.forEach(item => {
                // 提取符文信息
                const titleElement = item.querySelector('.product-title, .offer-title, .title');
                if (!titleElement) return;
                
                const title = titleElement.textContent.trim();
                
                // 检查是否是23#-33#符文
                const runeMatch = this.extractRuneFromTitle(title);
                if (!runeMatch) return;
                
                // 提取价格
                const priceElement = item.querySelector('.product-price, .offer-price, .price');
                if (!priceElement) return;
                
                const priceText = priceElement.textContent.trim();
                const price = this.extractPriceFromText(priceText);
                
                if (price && runeMatch in RUNE_MAPPING) {
                    // 只保留最低价
                    if (!prices[runeMatch] || price < prices[runeMatch]) {
                        prices[runeMatch] = price;
                    }
                }
            });
            
        } catch (error) {
            console.error('解析G2G HTML失败:', error);
        }
        
        return prices;
    }
    
    async fetchDD373Prices() {
        const url = 'https://www.dd373.com/s-1psrbm-u6w1hm-hx35xs-0-0-0-sndbsb-0-0-0-0-0-1-20-0-1.html?qufu=true';
        
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`DD373请求失败: ${response.status}`);
            }
            
            const html = await response.text();
            return this.parseDD373HTML(html);
            
        } catch (error) {
            console.error('获取DD373价格失败:', error);
            return {};
        }
    }
    
    parseDD373HTML(html) {
        const prices = {};
        
        try {
            // 创建临时DOM解析器
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // 查找所有商品项 - 根据DD373的实际结构调整选择器
            const items = doc.querySelectorAll('.goods-item, .item, .product, .list-item');
            
            items.forEach(item => {
                // 提取符文信息
                const titleElement = item.querySelector('.goods-name, .item-title, .title, .name');
                if (!titleElement) return;
                
                const title = titleElement.textContent.trim();
                
                // 检查是否是23#-33#符文
                const runeMatch = this.extractRuneFromTitle(title);
                if (!runeMatch) return;
                
                // 提取价格
                const priceElement = item.querySelector('.goods-price, .item-price, .price, .cost');
                if (!priceElement) return;
                
                const priceText = priceElement.textContent.trim();
                const price = this.extractPriceFromText(priceText);
                
                if (price && runeMatch in RUNE_MAPPING) {
                    // 只保留最低价
                    if (!prices[runeMatch] || price < prices[runeMatch]) {
                        prices[runeMatch] = price;
                    }
                }
            });
            
        } catch (error) {
            console.error('解析DD373 HTML失败:', error);
        }
        
        return prices;
    }
    
    extractRuneFromTitle(title) {
        // 匹配符文格式：23#、24# 等
        const runeRegex = /(\d{2})#/g;
        const matches = title.match(runeRegex);
        
        if (matches) {
            for (const match of matches) {
                const runeNumber = parseInt(match.replace('#', ''));
                if (runeNumber >= 23 && runeNumber <= 33) {
                    return match;
                }
            }
        }
        
        // 尝试匹配符文名称
        const runeNames = {
            'Mal': '23#',
            'Ist': '24#',
            'Gul': '25#',
            'Vex': '26#',
            'Ohm': '27#',
            'Lo': '28#',
            'Sur': '29#',
            'Ber': '30#',
            'Jah': '31#',
            'Cham': '32#',
            'Zod': '33#'
        };
        
        for (const [name, rune] of Object.entries(runeNames)) {
            if (title.includes(name)) {
                return rune;
            }
        }
        
        return null;
    }
    
    extractPriceFromText(text) {
        // 匹配人民币价格：¥12.34 或 12.34元
        const priceRegex = /[¥￥]?\s*(\d+\.?\d*)\s*[元]?/;
        const match = text.match(priceRegex);
        
        if (match && match[1]) {
            return parseFloat(match[1]);
        }
        
        return null;
    }
}

// 初始化后台服务
const service = new BackgroundService();

// 导出用于测试
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BackgroundService, RUNE_MAPPING };
}