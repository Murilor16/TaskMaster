import { useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { createPortal } from 'react-dom'

type Project = {
  _id: string
  name: string
  description?: string
}

type Column = {
  _id: string
  title: string
  status: 'todo' | 'in-progress' | 'done'
  position: number
}

type Task = {
  _id: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'done'
  position: number
}

type BoardResponse = {
  project: Project
  columns: Column[]
  tasks: Task[]
}

type ColumnDroppableProps = {
  column: Column
  tasks: Task[]
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
}

type TaskDraggableProps = {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

function TaskDraggable({ task, onEdit, onDelete }: TaskDraggableProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
  })
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <article
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
      <div className="task-actions">
        <button onClick={() => onEdit(task)}>Editar</button>
        <button onClick={() => onDelete(task)}>Deletar</button>
      </div>
    </article>
  )
}

function ColumnDroppable({ column, tasks, onEditTask, onDeleteTask }: ColumnDroppableProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.status,
  })

  return (
    <div className={`column ${isOver ? 'over' : ''}`} ref={setNodeRef}>
      <div className="column-header">
        <h2>{column.title}</h2>
        <span className="badge">{tasks.length}</span>
      </div>
      <div className="column-body">
        {tasks.map((task) => (
          <TaskDraggable
            key={task._id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
          />
        ))}
        {tasks.length === 0 && <div className="column-empty">Nenhuma tarefa aqui.</div>}
      </div>
    </div>
  )
}

const API_URL = 'http://localhost:4000'

export function KanbanBoard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [board, setBoard] = useState<BoardResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [deletingProject, setDeletingProject] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [activeStatus, setActiveStatus] = useState<'todo' | 'in-progress' | 'done'>('todo')
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  )

  useEffect(() => {
    fetch(`${API_URL}/api/projects`)
      .then((res) => res.json())
      .then((data: Project[]) => {
        setProjects(data)
        if (data.length > 0) {
          setSelectedProjectId(data[0]._id)
        }
      })
      .catch((err) => console.error(err))
  }, [])

  useEffect(() => {
    if (!selectedProjectId) return
    setLoading(true)
    fetch(`${API_URL}/api/projects/${selectedProjectId}/board`)
      .then((res) => res.json())
      .then((data: BoardResponse) => {
        setBoard(data)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [selectedProjectId])

  const fetchBoard = (projectId: string) => {
    return fetch(`${API_URL}/api/projects/${projectId}/board`).then((res) => res.json()) as Promise<BoardResponse>
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = board?.tasks.find((t) => t._id === active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over || !board || !selectedProjectId) return

    const taskId = active.id as string
    const overId = over.id as string

    const task = board.tasks.find((t) => t._id === taskId)
    if (!task) return

    const column = board.columns.find((c) => c._id === overId || c.status === overId)
    if (!column) return

    if (task.status === column.status) return // no change

    // Find the max position in the new column
    const tasksInColumn = board.tasks.filter((t) => t.status === column.status)
    const maxPosition = tasksInColumn.length > 0 ? Math.max(...tasksInColumn.map((t) => t.position)) : -1
    const newPosition = maxPosition + 1

    // Update task
    const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: column.status,
        position: newPosition,
      }),
    })

    if (!res.ok) {
      console.error('Erro ao mover tarefa', res.status, await res.text())
      return
    }

    const freshBoard = await fetchBoard(selectedProjectId)
    setBoard(freshBoard)
  }

  const handleEditTask = async (task: Task) => {
    const newTitle = window.prompt('Novo título:', task.title)
    if (newTitle === null) return
    const newDescription = window.prompt('Nova descrição:', task.description || '')

    const res = await fetch(`${API_URL}/api/tasks/${task._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle.trim() || task.title,
        description: newDescription?.trim() || task.description,
      }),
    })

    if (!res.ok) {
      console.error('Erro ao editar tarefa', res.status, await res.text())
      return
    }

    if (selectedProjectId) {
      const freshBoard = await fetchBoard(selectedProjectId)
      setBoard(freshBoard)
    }
  }

  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm(`Deletar tarefa "${task.title}"?`)) return

    const res = await fetch(`${API_URL}/api/tasks/${task._id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      console.error('Erro ao deletar tarefa', res.status, await res.text())
      return
    }

    if (selectedProjectId) {
      const freshBoard = await fetchBoard(selectedProjectId)
      setBoard(freshBoard)
    }
  }

  const handleCreateTask = async () => {
    if (!selectedProjectId || !newTaskTitle.trim()) return
    const title = newTaskTitle.trim()
    setNewTaskTitle('')
    const res = await fetch(`${API_URL}/api/projects/${selectedProjectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: '',
        status: activeStatus,
      }),
    })
    if (!res.ok) {
      console.error('Erro ao criar tarefa', res.status, await res.text())
      return
    }
    const freshBoard = await fetchBoard(selectedProjectId)
    setBoard(freshBoard)
  }

  const handleCreateProject = async () => {
    const name = window.prompt('Nome do novo projeto:')
    if (!name) return
    const description = window.prompt('Descrição (opcional):') ?? ''

    setCreatingProject(true)
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      if (!res.ok) return
      const project: Project = await res.json()
      setProjects((prev) => [project, ...prev])
      setSelectedProjectId(project._id)
    } finally {
      setCreatingProject(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!selectedProjectId) return
    const current = projects.find((p) => p._id === selectedProjectId)
    const name = current?.name ?? 'este projeto'

    if (!window.confirm(`Tem certeza que deseja excluir "${name}"? Essa ação não pode ser desfeita.`)) {
      return
    }

    setDeletingProject(true)
    try {
      const res = await fetch(`${API_URL}/api/projects/${selectedProjectId}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) {
        console.error('Erro ao deletar projeto', res.status, await res.text())
        return
      }

      const remaining = projects.filter((p) => p._id !== selectedProjectId)
      setProjects(remaining)

      if (remaining.length > 0) {
        setSelectedProjectId(remaining[0]._id)
      } else {
        setSelectedProjectId(null)
        setBoard(null)
      }
    } finally {
      setDeletingProject(false)
    }
  }

  const tasksByStatus = (status: Task['status']) =>
    board?.tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position) ?? []

  return (
    <div className="kanban-layout">
      <aside className="sidebar">
        <h2>Projetos</h2>
        <ul className="project-list">
          {projects.map((project) => (
            <li
              key={project._id}
              className={project._id === selectedProjectId ? 'project-item active' : 'project-item'}
              onClick={() => setSelectedProjectId(project._id)}
            >
              <span className="project-name">{project.name}</span>
              {project.description && <span className="project-description">{project.description}</span>}
            </li>
          ))}
          {projects.length === 0 && <li className="empty-state">Nenhum projeto ainda.</li>}
        </ul>
        <div className="sidebar-actions">
          <button className="primary-button full-width" onClick={handleCreateProject} disabled={creatingProject}>
            {creatingProject ? 'Criando...' : 'Novo projeto'}
          </button>
          <button
            className="danger-button full-width"
            onClick={handleDeleteProject}
            disabled={!selectedProjectId || deletingProject}
          >
            {deletingProject ? 'Excluindo...' : 'Excluir projeto'}
          </button>
        </div>
      </aside>
      <section className="board-area">
        {loading && <div className="board-loading">Carregando quadro...</div>}
        {!loading && !board && (
          <div className="board-empty">Selecione ou crie um projeto para começar.</div>
        )}
        {board && (
          <>
            <header className="board-header">
              <div>
                <h1>{board.project.name}</h1>
                {board.project.description && <p>{board.project.description}</p>}
              </div>
              <div className="new-task">
                <input
                  type="text"
                  placeholder="Nova tarefa..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <select
                  value={activeStatus}
                  onChange={(e) => setActiveStatus(e.target.value as typeof activeStatus)}
                >
                  <option value="todo">A Fazer</option>
                  <option value="in-progress">Em Progresso</option>
                  <option value="done">Concluído</option>
                </select>
                <button className="primary-button" onClick={handleCreateTask}>
                  Adicionar
                </button>
              </div>
            </header>
            <div className="columns">
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                {board.columns.map((column) => (
                  <ColumnDroppable
                    key={column._id}
                    column={column}
                    tasks={tasksByStatus(column.status)}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                  />
                ))}
                {createPortal(
                  <DragOverlay>
                    {activeTask ? (
                      <article className="task-card dragging">
                        <h3>{activeTask.title}</h3>
                        {activeTask.description && <p>{activeTask.description}</p>}
                      </article>
                    ) : null}
                  </DragOverlay>,
                  document.body
                )}
              </DndContext>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

