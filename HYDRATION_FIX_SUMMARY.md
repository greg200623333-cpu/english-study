# React Hydration Mismatch 修复总结

## 问题描述
用户在注册新账号并登录后，重定向到 `/(app)/ssa` 页面时触发 React Error #310 (Hydration Mismatch)。

## 根本原因
1. **服务端渲染 (SSR) 与客户端渲染不一致**：组件在服务端渲染时无法访问 localStorage 和浏览器 API
2. **Zustand Store 未完成水合 (Hydration)**：组件在 Zustand 从 localStorage 恢复状态之前就开始渲染
3. **模块级别的 Date.now() 调用**：服务端和客户端执行时间不同，导致时间戳不一致

## 修复方案

### 1. app/(app)/ssa/page.tsx
添加客户端挂载保护，确保组件只在客户端渲染：

```typescript
'use client'

import { useEffect, useState } from 'react'
import { SsaCommandCenter } from '@/components/study-mode/SsaCommandCenter'

export const dynamic = 'force-dynamic'

export default function SsaPage() {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300 mx-auto" />
          <p className="text-sm text-slate-400">Loading SSA Command Center...</p>
        </div>
      </div>
    )
  }

  return <SsaCommandCenter />
}
```

### 2. components/study-mode/SsaCommandCenter.tsx

#### 2.1 修复模块级别的 Date.now() 调用
**问题**：`const NOW = Date.now()` 在模块加载时执行，服务端和客户端时间不同

**修复**：将其改为函数调用
```typescript
// 修复前
const NOW = Date.now()
const fallbackWords: SsaWord[] = [...]

// 修复后
function getFallbackWords(): SsaWord[] {
  const NOW = Date.now()
  return [...]
}
```

#### 2.2 修复状态初始化
**问题**：组件状态直接使用 Zustand store 的值初始化，但此时 store 可能未完成水合

**修复**：使用安全的默认值初始化
```typescript
// 修复前
const [words, setWords] = useState<SsaWord[]>(fallbackWords)
const [mountModalOpen, setMountModalOpen] = useState(ssaMountRequired)
const [pendingTier, setPendingTier] = useState<WordTier>(selectedWordTier)
const [pendingExam, setPendingExam] = useState<ExamType | null>(selectedExam)

// 修复后
const [words, setWords] = useState<SsaWord[]>([])
const [loading, setLoading] = useState(true)
const [mountModalOpen, setMountModalOpen] = useState(false)
const [pendingTier, setPendingTier] = useState<WordTier>('core')
const [pendingExam, setPendingExam] = useState<ExamType | null>(null)
```

#### 2.3 添加 Zustand 水合检查
**问题**：组件在 Zustand store 完成水合之前就开始渲染和访问 store 数据

**修复**：在渲染前检查 `_hasHydrated` 标志
```typescript
// 在 return 语句前添加
if (!_hasHydrated) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300 mx-auto" />
        <p className="text-sm text-slate-400">Initializing SSA Command Center...</p>
      </div>
    </div>
  )
}
```

#### 2.4 修复 useEffect 依赖
**问题**：useEffect 在 Zustand 水合完成前就执行，导致读取到错误的初始值

**修复**：添加 `_hasHydrated` 依赖并同步 store 值到本地状态
```typescript
useEffect(() => {
  setMountModalOpen(ssaMountRequired)
  setPendingTier(selectedWordTier)
  setPendingExam(selectedExam)
}, [ssaMountRequired, selectedWordTier, selectedExam])

useEffect(() => {
  if (!_hasHydrated) return
  if (hasMountedRef.current) return
  hasMountedRef.current = true

  // 初始化 fallback words
  if (words.length === 0) {
    setWords(getFallbackWords())
  }

  if (!ssaMountRequired && selectedExam) {
    void mountWordbook(selectedExam, selectedWordTier).then(() => setHasMountedWordbook(true))
  } else {
    setLoading(false)
  }
}, [_hasHydrated])
```

#### 2.5 修复 mountWordbook 函数
**问题**：函数内部使用了模块级别的 `fallbackWords` 常量

**修复**：改为调用 `getFallbackWords()` 函数
```typescript
const supabase = createClient()
const fallbackWords = getFallbackWords()
const now = Date.now()
```

## 修复效果

### 渲染流程（修复后）
1. **服务端渲染**：`/(app)/ssa/page.tsx` 返回 loading 状态
2. **客户端挂载**：`hasMounted` 变为 `true`
3. **Zustand 水合**：从 localStorage 恢复状态，`_hasHydrated` 变为 `true`
4. **组件渲染**：`SsaCommandCenter` 使用水合后的正确状态渲染
5. **数据加载**：如果已选择词书，自动加载词汇数据

### 防护层级
1. **页面级别**：`hasMounted` 保护，确保只在客户端渲染
2. **组件级别**：`_hasHydrated` 保护，确保 Zustand store 已完成水合
3. **状态级别**：使用安全的默认值初始化，避免读取未水合的 store 值
4. **函数级别**：将模块级别的时间戳调用移到函数内部

## 测试建议
1. 清除浏览器 localStorage
2. 注册新账号并登录
3. 观察重定向到 `/ssa` 页面时是否出现 hydration 错误
4. 检查浏览器控制台是否有 React Error #310
5. 验证页面加载后功能是否正常

## 相关文件
- `app/(app)/ssa/page.tsx` - 页面级别挂载保护
- `components/study-mode/SsaCommandCenter.tsx` - 组件级别水合保护
- `stores/useStudyModeStore.ts` - Zustand store 配置（已有 `_hasHydrated` 标志）

## 注意事项
1. 所有访问 localStorage 或浏览器 API 的组件都应该添加 `hasMounted` 保护
2. 所有使用 Zustand persist 中间件的组件都应该检查 `_hasHydrated`
3. 避免在模块级别调用 `Date.now()` 或其他会产生不同值的函数
4. 状态初始化应该使用静态默认值，而不是从 store 读取
