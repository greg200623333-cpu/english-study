'use client'

import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

interface Props {
  content: string
}

export default function MarkdownMessage({ content }: Props) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeHighlight]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          return !inline ? (
            <code
              className={`${className} block bg-black/50 rounded-lg p-3 my-2 text-xs sm:text-sm overflow-x-auto`}
              {...props}
            >
              {children}
            </code>
          ) : (
            <code
              className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded text-xs sm:text-sm"
              {...props}
            >
              {children}
            </code>
          )
        },
        pre({ children }) {
          return <pre className="overflow-x-auto">{children}</pre>
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>
        },
        ul({ children }) {
          return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
        },
        li({ children }) {
          return <li className="text-sm">{children}</li>
        },
        h1({ children }) {
          return <h1 className="text-xl font-bold mb-2 mt-4">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-base font-bold mb-2 mt-2">{children}</h3>
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-purple-500/50 pl-4 italic text-slate-300 my-2">
              {children}
            </blockquote>
          )
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 underline"
            >
              {children}
            </a>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
