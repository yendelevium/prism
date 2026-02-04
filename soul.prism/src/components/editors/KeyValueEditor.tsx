'use client'

import { useCallback, useState } from 'react'
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

export type KeyValueRow = {
  id: string
  key: string
  value: string
  enabled?: boolean
  readonly?: boolean
  secret?: boolean
}

export type KeyValueEditorProps = {
  rows: KeyValueRow[]
  onChange: (rows: KeyValueRow[]) => void

  title?: string

  mode?: 'edit' | 'view'
  allowAdd?: boolean
  allowDelete?: boolean
  allowToggle?: boolean

  keyPlaceholder?: string
  valuePlaceholder?: string
  emptyState?: string

  validateKey?: (key: string) => string | null
  validateValue?: (value: string) => string | null

  rowHeight?: 'sm' | 'md'
  dense?: boolean
}

export function KeyValueEditor({
  rows,
  onChange,
  title,

  mode = 'edit',
  allowAdd = false,
  allowDelete = false,
  allowToggle = false,

  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  emptyState = 'No entries',

  validateKey,
  validateValue,

  rowHeight = 'md',
  dense = false,
}: KeyValueEditorProps) {
  const isView = mode === 'view'

  /** Local visibility state for secrets */
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  const toggleReveal = (id: string) => {
    setRevealed(r => ({ ...r, [id]: !r[id] }))
  }

  const updateRow = useCallback(
    (id: string, patch: Partial<KeyValueRow>) => {
      onChange(
        rows.map(row =>
          row.id === id ? { ...row, ...patch } : row
        )
      )
    },
    [rows, onChange]
  )

  const deleteRow = (id: string) => {
    onChange(rows.filter(r => r.id !== id))
  }

  const addRow = () => {
    onChange([
      ...rows,
      {
        id: crypto.randomUUID(),
        key: '',
        value: '',
        enabled: true,
      },
    ])
  }

  const rowHeightClass =
    rowHeight === 'sm'
      ? 'h-[28px]'
      : 'h-[36px]'

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      {(title || (allowAdd && !isView)) && (
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--border-color)] px-3 py-2">
          <div className="text-xs font-medium text-[var(--text-primary)]">
            {title}
          </div>

          {allowAdd && !isView && (
            <button
              onClick={addRow}
              className={clsx(
                'flex items-center gap-1 rounded px-2 py-1 text-xs',
                'text-[var(--accent)] hover:bg-[var(--bg-secondary)]',
                dense && 'py-0.5'
              )}
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Rows */}
      <div className="flex-1 min-h-0 overflow-auto px-2">
        {rows.length === 0 && (
          <div className="px-2 py-3 text-xs text-[var(--text-secondary)]">
            {emptyState}
          </div>
        )}

        <div className="flex flex-col gap-1">
          {rows.map(row => {
            const keyError = validateKey?.(row.key)
            const valueError = validateValue?.(row.value)
            const isSecret = row.secret
            const isRevealed = revealed[row.id]

            return (
              <div
                key={row.id}
                className={clsx(
                  'flex items-center gap-2 rounded px-1',
                  rowHeightClass,
                  !isView && 'hover:bg-[var(--bg-secondary)]'
                )}
              >
                {/* Toggle */}
                {allowToggle && !isView && (
                  <input
                    type="checkbox"
                    checked={row.enabled ?? true}
                    disabled={isView}
                    onChange={e =>
                      updateRow(row.id, {
                        enabled: e.target.checked,
                      })
                    }
                  />
                )}

                {/* Key */}
                <input
                  value={row.key}
                  placeholder={keyPlaceholder}
                  disabled={isView || row.readonly}
                  onChange={e =>
                    updateRow(row.id, { key: e.target.value })
                  }
                  className={clsx(
                    'flex-1 bg-transparent text-xs outline-none',
                    'text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]',
                    keyError && 'text-[var(--error)]'
                  )}
                />

                {/* Value */}
                <div className="relative flex flex-1 items-center">
                  <input
                    value={row.value}
                    placeholder={valuePlaceholder}
                    type={
                      isSecret && !isRevealed
                        ? 'password'
                        : 'text'
                    }
                    disabled={isView || row.readonly}
                    onChange={e =>
                      updateRow(row.id, {
                        value: e.target.value,
                      })
                    }
                    className={clsx(
                      'w-full bg-transparent text-xs outline-none pr-6',
                      'text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]',
                      valueError && 'text-[var(--error)]'
                    )}
                  />

                  {/* Secret toggle */}
                  {isSecret && (
                    <button
                      type="button"
                      onClick={() => toggleReveal(row.id)}
                      className="absolute right-1 text-[var(--text-secondary)] hover:text-[var(--accent)]"
                      tabIndex={-1}
                    >
                      {isRevealed ? (
                        <EyeSlashIcon className="h-3.5 w-3.5" />
                      ) : (
                        <EyeIcon className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Delete */}
                {allowDelete && !isView && !row.readonly && (
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="text-[var(--accent)] hover:text-[var(--accent-hover)]"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
