'use client'

import React, { Component, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

type ErrorBoundaryLevel = 'page' | 'section' | 'component'

interface ErrorBoundaryProps {
  children: ReactNode
  level?: ErrorBoundaryLevel
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { level = 'component', onError } = this.props

    console.error(`[ErrorBoundary:${level}] Caught error:`, error)
    console.error('[ErrorBoundary] Error info:', errorInfo)

    if (onError) {
      onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const { fallback, level = 'component' } = this.props

      if (fallback) {
        return fallback
      }

      return (
        <DefaultErrorFallback
          level={level}
          error={this.state.error}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  level: ErrorBoundaryLevel
  error: Error | null
  onReset: () => void
}

function DefaultErrorFallback({ level, error, onReset }: DefaultErrorFallbackProps) {
  const router = useRouter()

  const levelConfig = {
    page: {
      title: '页面加载失败',
      description: '抱歉，页面遇到了问题',
      showHome: true,
      containerClass: 'min-h-screen flex items-center justify-center bg-gray-50',
    },
    section: {
      title: '内容加载失败',
      description: '这部分内容暂时无法显示',
      showHome: false,
      containerClass: 'p-6 bg-red-50 border border-red-200 rounded-lg',
    },
    component: {
      title: '组件错误',
      description: '此组件遇到问题',
      showHome: false,
      containerClass: 'p-4 bg-yellow-50 border border-yellow-200 rounded',
    },
  }

  const config = levelConfig[level]

  return (
    <div className={config.containerClass}>
      <div className="text-center max-w-md mx-auto">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{config.title}</h2>
        <p className="text-gray-600 mb-4">{config.description}</p>
        {error && (
          <details className="text-left mb-4 p-3 bg-white rounded border border-gray-200">
            <summary className="cursor-pointer text-sm text-gray-700 font-medium">
              错误详情
            </summary>
            <pre className="mt-2 text-xs text-red-600 overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onReset}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            重试
          </button>
          {config.showHome && (
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              返回首页
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorBoundaryClass {...props} />
}
