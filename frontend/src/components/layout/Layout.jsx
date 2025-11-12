import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'
import { ThemeProvider } from '../../contexts/ThemeContext'

export default function Layout({ children }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {/* Animated Background */}
        <div className="bg-animation fixed top-0 left-0 w-full h-full z-[-1]"></div>
        
        {/* Floating Particles */}
        <div className="particles fixed top-0 left-0 w-full h-full z-[-1] pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="particle absolute w-1 h-1 rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${20 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>
        
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 p-6 pt-28">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}