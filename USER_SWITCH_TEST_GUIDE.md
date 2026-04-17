# 用户切换数据重置 - 测试指南

## 修复说明

现在使用了**两阶段重置机制**：

### 阶段 1：注册/登录时设置标志
- 注册/登录成功后，在 `sessionStorage` 中设置 `force-reset-store` 标志
- 不立即清除 localStorage，避免影响当前页面

### 阶段 2：Dashboard 加载时重置
- Dashboard 页面加载时检查 `force-reset-store` 标志
- 如果标志存在，清除 localStorage 并刷新页面
- 刷新后 Zustand 从空的 localStorage 重新初始化

## 测试步骤

### 测试 1：注册新账号（推荐）

1. **打开浏览器开发者工具**
   - 按 F12 或右键 → 检查
   - 切换到 "Console" 标签页

2. **注册新账号**
   - 使用一个全新的用户名（例如：testuser123）
   - 填写密码并提交

3. **观察控制台输出**
   应该看到：
   ```
   [Dashboard] Force reset triggered, reloading page...
   ```

4. **验证页面数据**
   - 页面应该显示空白数据（没有学习进度）
   - 应该弹出引导模态框（选择考试类型）
   - Vocabulary GDP 应该是 0
   - 没有已学单词

### 测试 2：切换账号登录

1. **使用账号 A 登录并学习一些单词**
   - 记住账号 A 的学习进度（例如：已学 10 个单词）

2. **不要清除浏览器数据，直接登录账号 B**
   - 在登录页面输入账号 B 的用户名和密码

3. **观察控制台输出**
   应该看到：
   ```
   [Dashboard] User switched detected, store has been reset
   ```
   或
   ```
   [Dashboard] Force reset triggered, reloading page...
   ```

4. **验证页面数据**
   - 页面应该显示账号 B 的数据（如果是新账号，应该是空白）
   - 不应该显示账号 A 的学习进度

### 测试 3：同一账号重新登录

1. **登录账号 A**
2. **退出后重新登录账号 A**
3. **验证数据保留**
   - 应该显示之前的学习进度
   - 不应该被重置

## 如何检查 localStorage

### 方法 1：使用开发者工具
1. 按 F12 打开开发者工具
2. 切换到 "Application" 标签页（Chrome）或 "Storage" 标签页（Firefox）
3. 左侧菜单找到 "Local Storage"
4. 点击你的网站域名（例如：http://localhost:3000）
5. 查看右侧的键值对列表

### 方法 2：使用控制台
1. 按 F12 打开开发者工具
2. 切换到 "Console" 标签页
3. 输入以下命令并按回车：
   ```javascript
   localStorage.getItem('study-mode-war-room')
   ```
4. 如果返回 `null`，说明数据已被清除
5. 如果返回一个 JSON 字符串，说明数据还在

### 方法 3：查看所有 localStorage 数据
在控制台输入：
```javascript
console.log(localStorage)
```

## 预期行为

### 注册新账号后
- ✅ localStorage 中的 `study-mode-war-room` 应该被删除
- ✅ 页面刷新后显示空白数据
- ✅ 控制台显示 `[Dashboard] Force reset triggered, reloading page...`

### 切换账号后
- ✅ localStorage 中的 `study-mode-war-room` 应该被删除
- ✅ 页面刷新后显示新账号的数据
- ✅ 控制台显示 `[Dashboard] User switched detected, store has been reset`

### 同一账号重新登录
- ✅ localStorage 中的数据保持不变
- ✅ 页面显示之前的学习进度
- ✅ 不会触发重置

## 如果还是显示旧数据

### 检查清单

1. **确认代码已更新**
   - 刷新页面（Ctrl+F5 或 Cmd+Shift+R）
   - 清除浏览器缓存

2. **检查控制台输出**
   - 是否看到 `[Dashboard] Force reset triggered` 或 `[Dashboard] User switched detected`？
   - 如果没有，说明重置逻辑没有触发

3. **手动清除 localStorage**
   在控制台输入：
   ```javascript
   localStorage.clear()
   location.reload()
   ```

4. **检查 sessionStorage**
   在控制台输入：
   ```javascript
   sessionStorage.getItem('force-reset-store')
   ```
   - 如果返回 `"true"`，说明标志已设置但页面没有刷新

5. **检查 Zustand store 的 lastUserId**
   在控制台输入：
   ```javascript
   JSON.parse(localStorage.getItem('study-mode-war-room') || '{}').state?.lastUserId
   ```
   - 这应该显示当前存储的用户 ID

## 调试命令

### 查看当前用户 ID
```javascript
fetch('/api/auth/session').then(r => r.json()).then(d => console.log('Current user:', d.user))
```

### 查看存储的用户 ID
```javascript
const store = JSON.parse(localStorage.getItem('study-mode-war-room') || '{}')
console.log('Stored user ID:', store.state?.lastUserId)
```

### 强制重置
```javascript
localStorage.removeItem('study-mode-war-room')
sessionStorage.setItem('force-reset-store', 'true')
location.reload()
```

## 常见问题

### Q: 页面刷新了两次
A: 这是正常的。第一次刷新是清除 localStorage，第二次是用户切换检测触发的。

### Q: 控制台没有任何输出
A: 检查是否启用了控制台日志过滤。确保 "Verbose" 或 "All levels" 选项已启用。

### Q: 还是显示旧数据
A: 尝试完全关闭浏览器标签页，然后重新打开。有时浏览器会缓存页面状态。

## 需要提供的信息

如果问题仍然存在，请提供：

1. **控制台完整输出**（截图或复制文本）
2. **localStorage 内容**
   ```javascript
   console.log(localStorage.getItem('study-mode-war-room'))
   ```
3. **sessionStorage 内容**
   ```javascript
   console.log(sessionStorage.getItem('force-reset-store'))
   ```
4. **当前用户信息**
   ```javascript
   fetch('/api/auth/session').then(r => r.json()).then(console.log)
   ```
5. **操作步骤**（详细描述你做了什么）
