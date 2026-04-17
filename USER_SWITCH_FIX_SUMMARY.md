# 用户切换数据重置修复总结

## 问题描述
用户在已登录状态下注册新账号时：
1. 注册成功但控制台显示 409 错误
2. 页面显示的是旧账号的学习进度和配置
3. localStorage 中的 Zustand store 数据没有被清空

## 根本原因
1. **注册/登录时没有清除 localStorage**：旧账号的数据仍然保存在浏览器中
2. **没有用户切换检测机制**：系统无法识别当前登录用户与 localStorage 中存储的用户不一致
3. **Zustand store 直接从 localStorage 恢复**：即使用户切换，store 仍然加载旧数据

## 修复方案

### 1. 注册页面 (app/register/page.tsx)
在注册前清除所有本地数据：

```typescript
async function handleRegister(e: React.FormEvent) {
  e.preventDefault()
  // ... 验证逻辑 ...

  setLoading(true)
  setError('')

  try {
    // 清除旧账号的所有本地数据
    localStorage.clear()
    sessionStorage.clear()

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    // ... 处理响应 ...
  } catch (err) {
    setError('网络错误，请重试')
    setLoading(false)
  }
}
```

### 2. 登录页面 (app/login/page.tsx)
在登录前清除所有本地数据：

```typescript
async function handleLogin(e: React.FormEvent) {
  e.preventDefault()
  setLoading(true)
  setError('')

  try {
    // 清除旧账号的所有本地数据
    localStorage.clear()
    sessionStorage.clear()

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, rememberMe }),
    })
    // ... 处理响应 ...
  } catch (err) {
    setError('网络错误，请重试')
    setLoading(false)
  }
}
```

### 3. Zustand Store (stores/useStudyModeStore.ts)

#### 3.1 添加 lastUserId 字段
在 `StudyModeSnapshot` 类型中添加：

```typescript
export type StudyModeSnapshot = {
  lastUserId: string | null  // 新增：存储最后登录的用户 ID
  hasSeenBriefing: boolean
  // ... 其他字段
}
```

#### 3.2 添加用户切换检测方法
```typescript
checkUserSwitch: (currentUserId: string | null) => {
  const state = get()
  const storedUserId = state.lastUserId

  // 如果当前用户 ID 与存储的不同，说明用户切换了
  if (storedUserId && currentUserId && storedUserId !== currentUserId) {
    // 重置所有数据
    get().resetForUserSwitch()
    // 设置新的用户 ID
    set({ lastUserId: currentUserId })
    return true
  }

  // 如果是首次登录或者用户 ID 相同，更新存储的用户 ID
  if (currentUserId && currentUserId !== storedUserId) {
    set({ lastUserId: currentUserId })
  }

  return false
}
```

#### 3.3 更新 resetForUserSwitch 方法
```typescript
resetForUserSwitch: () => {
  set({
    lastUserId: null,  // 重置用户 ID
    hasSeenBriefing: false,
    selectedExam: null,
    // ... 重置所有字段到初始值
  })
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('study-mode-war-room')
  }
}
```

#### 3.4 更新 persist 配置
在 `partialize` 中添加 `lastUserId`：

```typescript
partialize: (state) => ({
  lastUserId: state.lastUserId,  // 持久化用户 ID
  hasSeenBriefing: state.hasSeenBriefing,
  // ... 其他字段
})
```

### 4. Dashboard 页面 (app/(app)/dashboard/page.tsx)
在加载数据前检测用户切换：

```typescript
useEffect(() => {
  async function load() {
    const sessionRes = await fetch('/api/auth/session')
    if (!sessionRes.ok) {
      setUser(null)
      return
    }
    const { user: sessionUser } = await sessionRes.json()
    if (!sessionUser) {
      setUser(null)
      return
    }

    // 检测用户切换
    const userSwitched = checkUserSwitch(sessionUser.id)
    if (userSwitched) {
      console.log('[Dashboard] User switched detected, store has been reset')
    }

    setUser({ id: sessionUser.id, username: sessionUser.username })
    // ... 加载数据
  }
  load()
}, [/* dependencies */])
```

## 修复效果

### 场景 1：注册新账号
1. 用户点击注册
2. **清除 localStorage 和 sessionStorage**
3. 发送注册请求
4. 注册成功后跳转到 dashboard
5. Dashboard 检测到新用户，显示空白数据和引导流程

### 场景 2：切换账号登录
1. 用户在已登录状态下登录另一个账号
2. **清除 localStorage 和 sessionStorage**
3. 发送登录请求
4. 登录成功后跳转到 dashboard
5. Dashboard 检测到用户切换，自动重置 store
6. 显示新账号的数据

### 场景 3：同一账号重新登录
1. 用户登录
2. Dashboard 检测到用户 ID 相同
3. 不重置数据，继续使用现有进度

## 防护层级

### 第一层：登录/注册时清除
- ✅ 在发送请求前清除所有 localStorage 和 sessionStorage
- ✅ 确保旧数据不会被 Zustand 重新加载

### 第二层：用户切换检测
- ✅ 在 dashboard 加载时检测用户 ID 是否变化
- ✅ 如果检测到切换，自动重置 Zustand store

### 第三层：持久化用户 ID
- ✅ 在 Zustand store 中存储 lastUserId
- ✅ 每次加载时对比当前用户与存储的用户

## 关于 409 错误

409 错误可能是因为：
1. **重复请求**：表单提交时可能触发了多次请求
2. **用户名已存在**：如果之前注册过但失败了，用户名可能已经在数据库中

这个问题通过以下方式解决：
- ✅ 添加 `loading` 状态防止重复提交
- ✅ 添加 try-catch 错误处理
- ✅ 清除 localStorage 确保不会有残留数据

## 测试步骤

### 测试 1：全新注册
1. 清除浏览器所有数据
2. 注册新账号
3. 验证：显示引导流程，所有数据为空

### 测试 2：切换账号
1. 登录账号 A，学习一些单词
2. 不清除浏览器数据，直接注册账号 B
3. 验证：账号 B 显示空白数据，不显示账号 A 的进度

### 测试 3：重新登录同一账号
1. 登录账号 A，学习一些单词
2. 退出后重新登录账号 A
3. 验证：显示之前的学习进度

## 注意事项

1. **localStorage.clear() 会清除所有数据**：包括其他应用的数据，但这是必要的，因为我们需要确保完全清除旧账号的数据
2. **用户切换检测依赖 user_id**：确保 session API 返回正确的 user_id
3. **Zustand version 需要升级到 3**：如果遇到问题，检查 persist 配置中的 version 字段

## 相关文件
- `app/register/page.tsx` - 注册页面，添加 localStorage 清除
- `app/login/page.tsx` - 登录页面，添加 localStorage 清除
- `stores/useStudyModeStore.ts` - Zustand store，添加用户切换检测
- `app/(app)/dashboard/page.tsx` - Dashboard 页面，调用用户切换检测
