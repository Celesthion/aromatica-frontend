import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, CheckCircle2, ChevronDown, Circle, Plus, X } from 'lucide-react'
import { Field, FormDialog, Input } from '@/shared/ui'
import {
  addTaskItem,
  createTask,
  deleteTask,
  fetchTaskAssignees,
  fetchTasks,
  queryKeys,
  removeTaskItem,
  setTaskDone,
  toggleTaskItem,
} from '@/shared/api'
import { useEntityMutation } from '@/pages/admin/lib/useEntityMutation'
import { CARD_DARK } from './HubCardHeader'

export function TasksCard() {
  const queryClient = useQueryClient()
  const tasks = useQuery({
    queryKey: queryKeys.tasks.hub,
    queryFn: () => fetchTasks('', { status: 'TODO', size: 6 }),
  })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
  const complete = useMutation({ mutationFn: (id: string) => setTaskDone(id, true), onSuccess: invalidate })
  const removeTask = useMutation({ mutationFn: deleteTask, onSuccess: invalidate })
  const toggleItem = useMutation({ mutationFn: toggleTaskItem, onSuccess: invalidate })
  const removeItem = useMutation({ mutationFn: removeTaskItem, onSuccess: invalidate })
  const addItem = useMutation({
    mutationFn: ({ taskId, text }: { taskId: string; text: string }) => addTaskItem(taskId, text),
    onSuccess: () => {
      setNewItem('')
      invalidate()
    },
  })

  const [openId, setOpenId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const assignees = useQuery({
    queryKey: queryKeys.tasks.assignees,
    queryFn: fetchTaskAssignees,
    enabled: showForm,
  })
  const create = useEntityMutation({
    mutationFn: () =>
      createTask({
        title,
        description: description || null,
        dueDate: dueDate || null,
        assigneeId: assigneeId || null,
      }),
    invalidate: [queryKeys.tasks.all],
    onDone: () => {
      setShowForm(false)
      setTitle('')
      setDescription('')
      setDueDate('')
      setAssigneeId('')
    },
  })

  const openTasks = tasks.data?.items ?? []
  const totalItems = openTasks.reduce((s, t) => s + t.items.length, 0)
  const doneItems = openTasks.reduce((s, t) => s + t.items.filter((i) => i.done).length, 0)

  return (
    <div className={`flex flex-col p-5 lg:row-span-2 ${CARD_DARK}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Задачи смены</h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            title="Поставить задачу"
            onClick={() => setShowForm(true)}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/20 text-white/60 transition-colors hover:border-white/40 hover:text-white"
          >
            <Plus className="h-4 w-4" strokeWidth={1.8} />
          </button>
          <div className="text-2xl font-light tabular-nums">
            {doneItems}/{totalItems || openTasks.length}
          </div>
        </div>
      </div>
      {totalItems > 0 && (
        <div className="my-3 flex gap-1.5">
          {Array.from({ length: totalItems }).map((_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded ${i < doneItems ? 'bg-brand-slate-soft' : 'bg-white/[0.14]'}`}
            />
          ))}
        </div>
      )}

      <div className="mt-1 flex-1 space-y-0">
        {openTasks.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-white/50">Активных задач нет</p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-2 text-sm text-white/70 underline underline-offset-4 transition-colors hover:text-white"
            >
              Поставить задачу
            </button>
          </div>
        ) : (
          openTasks.map((t) => {
            const expanded = openId === t.id
            return (
              <div key={t.id} className="border-t border-white/[0.07] first:border-t-0">
                <div className="flex items-center gap-3 py-3">
                  <button
                    type="button"
                    title={expanded ? 'Свернуть чек-лист' : 'Открыть чек-лист'}
                    onClick={() => {
                      setOpenId(expanded ? null : t.id)
                      setNewItem('')
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-white/[0.06] text-white/60">
                      <ChevronDown
                        className={`h-[18px] w-[18px] transition-transform duration-200 ${
                          expanded ? '' : '-rotate-90'
                        }`}
                        strokeWidth={1.7}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-sm font-medium">{t.title}</b>
                      <small className="text-xs text-white/50">
                        {t.items.filter((i) => i.done).length}/{t.items.length || '—'}
                        {t.dueDate ? ` · до ${new Date(t.dueDate).toLocaleDateString('ru-RU')}` : ''}
                      </small>
                    </span>
                  </button>
                  <button
                    type="button"
                    title="Отметить выполненной"
                    onClick={() => complete.mutate(t.id)}
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/25 text-transparent transition-colors hover:border-brand-slate-soft hover:text-brand-slate-soft"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </button>
                </div>

                {expanded && (
                  <div className="space-y-1.5 pb-3 pl-[52px] pr-1">
                    {t.description && <p className="text-xs text-white/45">{t.description}</p>}
                    {t.items.map((i) => (
                      <div key={i.id} className="group/item flex items-center gap-2">
                        <button
                          type="button"
                          title={i.done ? 'Снять отметку' : 'Выполнено'}
                          onClick={() => toggleItem.mutate(i.id)}
                          className="shrink-0 text-white/45 transition-colors hover:text-brand-slate-soft"
                        >
                          {i.done ? (
                            <CheckCircle2 className="h-4 w-4 text-brand-slate-soft" strokeWidth={1.8} />
                          ) : (
                            <Circle className="h-4 w-4" strokeWidth={1.8} />
                          )}
                        </button>
                        <span
                          className={`min-w-0 flex-1 truncate text-sm ${
                            i.done ? 'text-white/35 line-through' : 'text-white/80'
                          }`}
                        >
                          {i.text}
                        </span>
                        <button
                          type="button"
                          title="Убрать пункт"
                          onClick={() => removeItem.mutate(i.id)}
                          className="shrink-0 text-white/30 opacity-0 transition hover:text-brand-bad-soft group-hover/item:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    <form
                      className="relative pt-0.5"
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (newItem.trim()) addItem.mutate({ taskId: t.id, text: newItem.trim() })
                      }}
                    >
                      <input
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="+ пункт чек-листа"
                        className="h-8 w-full rounded-lg bg-white/[0.06] pl-3 pr-8 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:bg-white/10"
                      />
                      {newItem.trim() && (
                        <button
                          type="submit"
                          title="Добавить пункт"
                          disabled={addItem.isPending}
                          className="absolute right-1 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <Plus className="h-4 w-4" strokeWidth={1.8} />
                        </button>
                      )}
                    </form>

                    {confirmId === t.id ? (
                      <div className="flex items-center gap-3 pt-1 text-xs">
                        <span className="text-white/50">Удалить задачу?</span>
                        <button
                          type="button"
                          onClick={() => removeTask.mutate(t.id)}
                          className="text-brand-bad-soft hover:underline"
                        >
                          Удалить
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="text-white/50 hover:text-white"
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(t.id)}
                        className="pt-1 text-xs text-white/35 transition-colors hover:text-brand-bad-soft"
                      >
                        Удалить задачу
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {showForm && (
        <FormDialog
          title="Новая задача"
          onClose={() => setShowForm(false)}
          onSubmit={() => create.mutate()}
          submitLabel="Поставить"
          busy={create.isPending}
          disabled={!title.trim()}
          error={create.error}
        >
          <Field label="Задача">
            <Input
              placeholder="Что нужно сделать"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Описание">
            <Input
              placeholder="необязательно"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="Срок">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Исполнитель">
            <select
              className="field w-full"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">— без исполнителя —</option>
              {(assignees.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
        </FormDialog>
      )}
    </div>
  )
}
