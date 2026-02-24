# D2R符文套利监控器 - 安装指南

## 🔧 快速安装步骤

### 方法1：从GitHub安装（推荐）
```bash
# 1. 克隆仓库
git clone https://github.com/lee3964/d2r-rune.git
# 或下载ZIP: https://github.com/lee3964/d2r-rune/archive/refs/heads/main.zip

# 2. 进入目录
cd d2r-rune

# 3. Chrome加载扩展
#   打开: chrome://extensions/
#   开启"开发者模式"
#   点击"加载已解压的扩展程序"
#   选择 d2r-rune 文件夹
```

### 方法2：直接测试
1. 打开 `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择本文件夹

## 🧪 功能测试

### 测试1：基本功能
1. 打开扩展测试页面：`test_simple.html`
2. 点击各个测试按钮
3. 确认所有测试通过

### 测试2：实际网站测试
1. **打开G2G网站**：
   ```
   https://www.g2g.com/cn/categories/diablo-2-resurrected-item-for-sale?fa=...
   ```
   - 等待页面加载
   - 查看右上角监控UI
   - 应该显示找到的符文和价格

2. **打开DD373网站**：
   ```
   https://www.dd373.com/s-1psrbm-u6w1hm-hx35xs-0-0-0-sndbsb-0-0-0-0-0-1-20-0-1.html
   ```
   - 等待页面加载
   - 查看右上角监控UI
   - 应该显示找到的符文和价格

3. **查看扩展面板**：
   - 点击Chrome工具栏的扩展图标
   - 点击"立即更新"
   - 查看价格对比和利润计算

## 🔍 故障排除

### 问题1：扩展加载失败
```
错误: Failed to load extension
```
**解决方案**：
1. 检查 `manifest.json` 格式
2. 确保所有文件存在
3. 重新加载扩展

### 问题2：监控UI不显示
**解决方案**：
1. 刷新页面
2. 按F12打开开发者工具
3. 查看Console错误信息
4. 确认扩展已启用

### 问题3：价格提取失败
**解决方案**：
1. 等待页面完全加载
2. 滚动页面触发内容加载
3. 检查网络连接

### 问题4：扩展面板空白
**解决方案**：
1. 点击"立即更新"按钮
2. 检查后台脚本是否运行
3. 查看存储数据

## 📊 预期效果

### 在目标网站上
```
右上角显示:
[D2R监控器 G2G]
状态: 找到 5 个符文
23#: ¥45.23
30#: ¥850.75
31#: ¥950.50
更新: 15:30
```

### 在扩展面板上
```
符文    DD373采购   G2G销售   利润   推荐
30#    ¥720.30    ¥850.75   ¥54.38   ⭐
31#    ¥850.50    ¥950.50   ¥14.95   ⭐
```

## 🚀 快速验证

运行以下命令验证文件完整性：
```bash
# 检查关键文件
ls -la manifest.json background.js content.js popup.js icons/

# 验证JSON格式
python3 -m json.tool manifest.json > /dev/null && echo "✅ manifest.json 格式正确"

# 验证JS语法
node -c background.js && echo "✅ background.js 语法正确"
node -c content.js && echo "✅ content.js 语法正确"
node -c popup.js && echo "✅ popup.js 语法正确"
```

## 📞 技术支持

如果遇到问题：
1. 截图显示错误信息
2. 提供Chrome版本
3. 描述具体操作步骤
4. 在GitHub提交Issue

## 🔄 更新日志

### v1.0.1 (修复版)
- 修复manifest.json格式问题
- 修复JavaScript语法错误
- 添加测试页面
- 改进错误处理

### v1.0.0 (初始版)
- 基础价格监控功能
- G2G和DD373价格对比
- 利润计算和推荐
- 自动刷新和通知

---

**安装完成后，请立即测试并反馈结果！** 🎯