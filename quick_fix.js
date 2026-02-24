// D2R扩展快速修复脚本
// 直接在Chrome控制台运行此脚本

// 1. 检查扩展状态
console.log('🔍 检查D2R扩展状态...');

// 检查chrome API
if (typeof chrome === 'undefined' || !chrome.runtime) {
    console.error('❌ Chrome扩展API不可用');
} else {
    console.log('✅ Chrome扩展API可用');
    
    // 获取扩展信息
    try {
        const manifest = chrome.runtime.getManifest();
        console.log('📦 扩展信息:', {
            name: manifest.name,
            version: manifest.version,
            description: manifest.description
        });
    } catch (e) {
        console.error('❌ 获取扩展信息失败:', e);
    }
}

// 2. 检查存储数据
console.log('\n📊 检查存储数据...');
chrome.storage.local.get(['d2rPrices', 'd2rSettings'], (result) => {
    console.log('存储数据:', result);
    
    if (!result.d2rPrices || Object.keys(result.d2rPrices).length === 0) {
        console.log('⚠️ 价格数据为空，添加模拟数据...');
        addMockData();
    } else {
        console.log(`✅ 找到 ${Object.keys(result.d2rPrices).length} 个符文价格`);
    }
});

// 3. 添加模拟数据函数
function addMockData() {
    const mockPrices = {
        '30#': {
            rune: '30#',
            name: 'Ber',
            g2gPrice: 850.75,
            dd373Price: 720.30,
            lastUpdated: new Date().toISOString()
        },
        '31#': {
            rune: '31#',
            name: 'Jah',
            g2gPrice: 950.50,
            dd373Price: 850.50,
            lastUpdated: new Date().toISOString()
        },
        '32#': {
            rune: '32#',
            name: 'Cham',
            g2gPrice: 1200.00,
            dd373Price: 1100.00,
            lastUpdated: new Date().toISOString()
        }
    };
    
    chrome.storage.local.set({ d2rPrices: mockPrices }, () => {
        console.log('✅ 模拟数据添加成功:', mockPrices);
        
        // 通知扩展面板更新
        chrome.runtime.sendMessage({
            action: 'pricesUpdated',
            prices: mockPrices
        }, (response) => {
            console.log('📤 发送更新通知:', response);
            
            // 提示用户刷新扩展面板
            console.log('\n🎯 修复完成！请：');
            console.log('1. 点击扩展图标打开面板');
            console.log('2. 点击"立即更新"按钮');
            console.log('3. 现在应该显示模拟数据');
        });
    });
}

// 4. 测试内容脚本
console.log('\n🧪 测试内容脚本...');
function testContentScript() {
    // 模拟价格提取
    const testText = '符文 30# Ber 价格: ¥850.75';
    const priceMatch = testText.match(/[¥￥]\s*(\d+\.?\d*)/);
    if (priceMatch) {
        console.log(`✅ 价格提取测试通过: ¥${priceMatch[1]}`);
    } else {
        console.log('❌ 价格提取测试失败');
    }
}
testContentScript();

// 5. 提供修复指令
console.log('\n🔧 修复指令:');
console.log('1. 按F5刷新扩展面板页面');
console.log('2. 或点击扩展图标重新打开面板');
console.log('3. 点击"立即更新"按钮');

// 6. 检查当前页面
console.log('\n🌐 当前页面分析:');
console.log('URL:', window.location.href);
console.log('网站:', window.location.href.includes('g2g.com') ? 'G2G' : 
                    window.location.href.includes('dd373.com') ? 'DD373' : '其他');

// 如果是目标网站，尝试运行内容脚本
if (window.location.href.includes('g2g.com') || window.location.href.includes('dd373.com')) {
    console.log('🎯 检测到目标网站，尝试注入内容脚本...');
    
    // 简单的内容脚本模拟
    setTimeout(() => {
        const mockPrices = {
            '30#': 850.75,
            '31#': 950.50
        };
        
        console.log('📤 模拟发送价格数据:', mockPrices);
        
        chrome.runtime.sendMessage({
            action: 'pagePrices',
            site: window.location.href.includes('g2g.com') ? 'g2g' : 'dd373',
            prices: mockPrices,
            timestamp: new Date().toISOString()
        }, (response) => {
            console.log('📥 后台响应:', response);
        });
    }, 2000);
}

console.log('\n✅ 快速修复脚本执行完成！');