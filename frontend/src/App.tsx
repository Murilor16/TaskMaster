import './App.css'
import { KanbanBoard } from './components/KanbanBoard'

function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="logo-group">
          <div className="logo-mark">TM</div>
          <div className="logo-text">
            <span className="logo-title">TaskMaster</span>
            <span className="logo-subtitle">Kanban board for modern teams</span>
          </div>
        </div>
        <div className="header-meta">
          <span className="pill">React • Node • MongoDB</span>
          <span className="pill pill-outline">Portfolio project</span>
        </div>
      </header>
      <main className="app-main">
        <KanbanBoard />
      </main>
      <footer className="app-footer">
        <span>TaskMaster · Project management demo</span>
        <span>Built with React, TypeScript, Node.js & MongoDB</span>
      </footer>
    </div>
  )
}

export default App
