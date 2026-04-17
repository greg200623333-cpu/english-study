# 紧急修复指南 - 用户数据未重置

## 当前问题

从控制台输出可以看到：
- `sessionStorage.getItem('force-reset-store')` 返回 `null`
- localStorage 中还有旧账号的数据（vocabularyGDP: 760）
- localStorage 中没有 `lastUserId` 字段

## 原因分析

1. **浏览器缓存了旧代码**：即使代码已更新，浏览器可能还在使用缓存的 JavaScript 文件
2. **Zustand store 版本不匹配**：localStorage 中的数据是旧版本的，没有 `lastUserId` 字段

## 立即解决方案

### 方案 1：手动清除并刷新（推荐）

在浏览器控制台运行以下命令：

```javascript
// 清除所有数据并刷新
localStorage.clear()
sessionStorage.clear()
window.location.reload()
```

### 方案 2：硬刷新页面

1. **Windows/Linux**: 按 `Ctrl + Shift + R` 或 `Ctrl + F5`
2. **Mac**: 按 `Cmd + Shift + R`

这会清除浏览器缓存并重新加载页面。

### 方案 3：清除浏览器缓存

1. 打开开发者工具（F12）
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

## 验证步骤

清除后，在控制台运行：

```javascript
// 应该返回 null（数据已清除）
console.log(localStorage.getItem('study-mode-war-room'))

// 应该返回 null
console.log(sessionStorage.getItem('force-reset-store'))
```

## 重新测试

1. **清除所有数据**（使用上面的方案 1）
2. **硬刷新页面**（Ctrl+Shift+R）
3. **注册新账号**
4. **观察控制台**

应该看到：
```
[Dashboard] Force reset triggered, reloading page...
```

## 如果还是不行

请提供以下信息：

### 1. 检查代码版本

在控制台运行：
```javascript
// 检查 register 页面是否设置了标志
// 打开 /register 页面，填写表单但不提交
// 在控制台运行：
console.log('Register page loaded')
```

### 2. 检查 Zustand store 版本

在控制台运行：
```javascript
// 检查 store 是否有 checkUserSwitch 方法
import { useStudyModeStore } from '@/stores/useStudyModeStore'
console.log(typeof useStudyModeStore.getState().checkUserSwitch)
// 应该返回 'function'
```

### 3. 手动测试注册流程

在控制台运行：
```javascript
// 模拟注册成功后的操作
sessionStorage.setItem('force-reset-store', 'true')
console.log('Set force-reset flag:', sessionStorage.getItem('force-reset-store'))
// 然后刷新页面
window.location.reload()
```

## 临时解决方案：修改 Zustand store 版本号

如果上述方法都不行，可以强制 Zustand 重新初始化：

1. 打开 `stores/useStudyModeStore.ts`
2. 找到这一行：
   ```typescript
   version: 2,
   ```
3. 改为：
   ```typescript
   version: 3,
   ```
4. 保存文件
5. 硬刷新页面（Ctrl+Shift+R）

这会强制 Zustand 清除旧数据并重新初始化。

## 最终方案：完全重置

如果以上都不行，在控制台运行：

```javascript
// 完全重置
localStorage.clear()
sessionStorage.clear()
// 清除所有 cookies
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
})
// 刷新
window.location.href = '/register'
```

## 下一步

清除数据后：
1. 注册一个**全新的用户名**（之前从未使用过的）
2. 观察控制台输出
3. 检查页面是否显示空白数据

如果还有问题，请提供：
1. 完整的控制台输出（截图）
2. Network 面板中 `/api/auth/register` 请求的详情
3. 注册使用的用户名（确认是否是新用户名）
