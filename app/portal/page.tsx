'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import WelcomeScreen from '@/components/portal/WelcomeScreen'
import ComputerWorkspace from '@/components/portal/ComputerWorkspace'
import ArchitectureWorkspace from '@/components/portal/ArchitectureWorkspace'

export type Workspace = 'welcome' | 'computer' | 'architecture'

const pageVariants = {
  initial: { opacity: 0, scale: 0.96, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 1.02, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
}

export default function PortalPage() {
  const [workspace, setWorkspace] = useState<Workspace>(() => {
    if (typeof window === 'undefined') return 'welcome'
    const savedWorkspace = localStorage.getItem('portal_workspace')
    if (savedWorkspace === 'computer' || savedWorkspace === 'architecture') {
      
      localStorage.removeItem('portal_workspace')
      return savedWorkspace as Workspace
    }
    return 'welcome'
  })

  return (
    <div className="min-h-screen" style={{ background: '#0a0b0f' }}>
      <AnimatePresence mode="wait">
        {workspace === 'welcome' && (
          <motion.div
            key="welcome"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <WelcomeScreen onSelectWorkspace={setWorkspace} />
          </motion.div>
        )}
        {workspace === 'computer' && (
          <motion.div
            key="computer"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ComputerWorkspace onBack={() => {
              localStorage.removeItem('portal_workspace')
              setWorkspace('welcome')
            }} />
          </motion.div>
        )}
        {workspace === 'architecture' && (
          <motion.div
            key="architecture"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ArchitectureWorkspace onBack={() => {
              localStorage.removeItem('portal_workspace')
              setWorkspace('welcome')
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
