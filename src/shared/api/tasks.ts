import { adminFetch, del, type Paged, post, searchPaged } from './core'

export interface TaskItem {
  id: string
  text: string
  done: boolean
  position: number
}

export interface Task {
  id: string
  title: string
  description: string | null
  assigneeId: string | null
  assigneeName: string | null
  createdBy: string | null
  createdByName: string | null
  status: 'TODO' | 'DONE'
  dueDate: string | null
  createdAt: string
  doneAt: string | null
  items: TaskItem[]
}

export interface TaskAssignee {
  id: string
  name: string
}

/** Задачи страницами: по умолчанию открытые сверху и ближайший срок первым. */
export function fetchTasks(
  q = '',
  { status, page = 0, size = 20 }: { status?: Task['status']; page?: number; size?: number } = {},
): Promise<Paged<Task>> {
  return searchPaged<Task>('/api/tasks/search', { q: q || undefined, status, page, size })
}

export function fetchTaskAssignees(): Promise<TaskAssignee[]> {
  return adminFetch('/api/tasks/assignees')
}

export function createTask(data: {
  title: string
  description?: string | null
  assigneeId?: string | null
  dueDate?: string | null
  items?: string[]
}): Promise<Task> {
  return adminFetch('/api/tasks', post(data))
}

export function deleteTask(id: string): Promise<void> {
  return adminFetch(`/api/tasks/${id}`, del())
}

export function setTaskDone(id: string, done: boolean): Promise<Task> {
  return adminFetch(`/api/tasks/${id}/${done ? 'done' : 'reopen'}`, post())
}

export function addTaskItem(id: string, text: string): Promise<Task> {
  return adminFetch(`/api/tasks/${id}/items`, post({ text }))
}

export function toggleTaskItem(itemId: string): Promise<Task> {
  return adminFetch(`/api/tasks/items/${itemId}/toggle`, post())
}

export function removeTaskItem(itemId: string): Promise<Task> {
  return adminFetch(`/api/tasks/items/${itemId}`, del())
}
