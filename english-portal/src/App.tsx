import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import WelcomeScreen from './components/WelcomeScreen'
import ComputerWorkspace from './components/ComputerWorkspace'
import ArchitectureWorkspace from './components/ArchitectureWorkspace'

export type Workspace = 'welcome' | 'computer' | 'architecture'

const pageVariants = {
  initial: { opacity: 0, scale: 0.96, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 1.02, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
}

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace>('welcome')

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a0b0f]">
      <AnimatePresence mode="wait">
        {workspace === 'welcome' && (
          <motion.div key="welcome" className="w-full h-full" {...pageVariants}>
            <WelcomeScreen onSelect={setWorkspace} />
          </motion.div>
        )}
        {workspace === 'computer' && (
          <motion.div key="computer" className="w-full h-full" {...pageVariants}>
            <ComputerWorkspace onBack={() => setWorkspace('welcome')} />
          </motion.div>
        )}
        {workspace === 'architecture' && (
          <motion.div key="architecture" className="w-full h-full" {...pageVariants}>
            <ArchitectureWorkspace onBack={() => setWorkspace('welcome')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
