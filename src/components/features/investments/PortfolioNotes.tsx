import { useState } from 'react'
import { TrashIcon, Pencil1Icon, CheckIcon, Cross2Icon } from '@radix-ui/react-icons'
import { usePortfolioNotesQuery, useAddPortfolioNote, useUpdatePortfolioNote, useDeletePortfolioNote } from '@/hooks/usePortfolioNotes'
import { ConfirmDialog } from '@/components/features/ConfirmDialog'
import type { PortfolioNote } from '@/services/portfolioNotes'

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${date} às ${time}`
}

function NoteItem({
  note,
  onDelete,
}: {
  note: PortfolioNote
  onDelete: (id: string) => void
}) {
  const update = useUpdatePortfolioNote()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.content)

  function handleSave() {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === note.content) { setEditing(false); return }
    update.mutate({ id: note.id, content: trimmed }, { onSuccess: () => setEditing(false) })
  }

  function handleCancel() {
    setDraft(note.content)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
      {editing ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="w-full resize-none rounded-lg border border-primary bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-muted"
            >
              <Cross2Icon className="h-3 w-3" /> Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={update.isPending}
              className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <CheckIcon className="h-3 w-3" /> {update.isPending ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-foreground whitespace-pre-wrap flex-1">{note.content}</p>
            <div className="flex flex-shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => { setDraft(note.content); setEditing(true) }}
                className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Editar nota"
              >
                <Pencil1Icon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(note.id)}
                className="rounded p-1 text-muted-foreground hover:text-red-500 transition-colors"
                aria-label="Excluir nota"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{formatDateTime(note.created_at)}</p>
        </>
      )}
    </div>
  )
}

export function PortfolioNotes() {
  const { data: notes = [], isLoading } = usePortfolioNotesQuery()
  const add = useAddPortfolioNote()
  const remove = useDeletePortfolioNote()
  const [text, setText] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function handlePost() {
    const trimmed = text.trim()
    if (!trimmed) return
    add.mutate(trimmed, { onSuccess: () => setText('') })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost()
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <p className="text-sm font-medium text-foreground">Observações</p>

      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma observação sobre a carteira… (Cmd+Enter para publicar)"
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handlePost}
            disabled={!text.trim() || add.isPending}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {add.isPending ? 'Publicando…' : 'Publicar'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && notes.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">Nenhuma observação ainda.</p>
      )}

      {!isLoading && notes.length > 0 && (
        <div className="space-y-2">
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} onDelete={setDeleteId} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        title="Excluir nota"
        description="Esta observação será excluída permanentemente."
        confirmLabel="Excluir"
        onConfirm={() => {
          if (deleteId) remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
        }}
        loading={remove.isPending}
      />
    </div>
  )
}
