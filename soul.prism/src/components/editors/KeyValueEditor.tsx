'use client'

import { useCallback, useState } from 'react'
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

/**
 * Represents a single editable key/value entry.
 *
 * Rows are treated as immutable records and are replaced wholesale
 * when changes occur.
 */
export type KeyValueRow = {
  /**
   * Stable unique identifier for the row.
   *
   * Used for React rendering and local UI state such as secret visibility.
   */
  id: string

  /**
   * Key name for the entry.
   */
  key: string

  /**
   * Value associated with the key.
   */
  value: string

  /**
   * Whether this row is enabled.
   *
   * When disabled, the row remains visible but is considered inactive.
   *
   * @defaultValue true
   */
  enabled?: boolean

  /**
   * Whether this row is read-only.
   *
   * Read-only rows cannot be edited or deleted, regardless of editor mode.
   */
  readonly?: boolean

  /**
   * Whether the value should be treated as sensitive.
   *
   * Secret values are masked by default and can be temporarily revealed
   * via a visibility toggle.
   */
  secret?: boolean
}

/**
 * Props for {@link KeyValueEditor}.
 */
export type KeyValueEditorProps = {
  /**
   * List of key/value rows to render.
   *
   * This component is fully controlled; all mutations are surfaced
   * through {@link KeyValueEditorProps.onChange}.
   */
  rows: KeyValueRow[]

  /**
   * Callback invoked whenever rows are added, removed, or modified.
   */
  onChange: (rows: KeyValueRow[]) => void

  /**
   * Optional title rendered in the editor header.
   */
  title?: string

  /**
   * Display mode of the editor.
   *
   * - `edit`: fields are editable and controls may be shown
   * - `view`: read-only presentation with no mutations allowed
   *
   * @defaultValue "edit"
   */
  mode?: 'edit' | 'view'

  /**
   * Whether users may add new rows.
   *
   * Only applies in `edit` mode.
   *
   * @defaultValue false
   */
  allowAdd?: boolean

  /**
   * Whether users may delete existing rows.
   *
   * Read-only rows cannot be deleted even when this is enabled.
   *
   * @defaultValue false
   */
  allowDelete?: boolean

  /**
   * Whether rows expose an enabled/disabled toggle.
   *
   * @defaultValue false
   */
  allowToggle?: boolean

  /**
   * Placeholder text for the key input.
   *
   * @defaultValue "Key"
   */
  keyPlaceholder?: string

  /**
   * Placeholder text for the value input.
   *
   * @defaultValue "Value"
   */
  valuePlaceholder?: string

  /**
   * Text shown when no rows are present.
   *
   * @defaultValue "No entries"
   */
  emptyState?: string

  /**
   * Optional validation function for keys.
   *
   * Returning a string indicates an error message; returning `null`
   * indicates a valid value.
   */
  validateKey?: (key: string) => string | null

  /**
   * Optional validation function for values.
   *
   * Returning a string indicates an error message; returning `null`
   * indicates a valid value.
   */
  validateValue?: (value: string) => string | null

  /**
   * Visual height of each row.
   *
   * @defaultValue "md"
   */
  rowHeight?: 'sm' | 'md'

  /**
   * Whether to use a more compact visual density.
   *
   * @defaultValue false
   */
  dense?: boolean
}

/**
 * Controlled editor for managing key/value pairs.
 *
 * @remarks
 * Responsibilities:
 * - Render editable or read-only key/value rows
 * - Provide optional controls for adding, deleting, and toggling rows
 * - Support validation feedback and secret value masking
 *
 * This component does not manage persistence or validation state itself;
 * it delegates all data ownership to the parent.
 */
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
  /**
   * Whether the editor is currently in view-only mode.
   */
  const isView = mode === 'view'

  /**
   * Local visibility state for secret values.
   *
   * This state is intentionally ephemeral and not exposed to the parent.
   */
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  /**
   * Toggle visibility of a secret value for a specific row.
   */
  const toggleReveal = (id: string) => {
    setRevealed(r => ({ ...r, [id]: !r[id] }))
  }

  /**
   * Update a single row by applying a partial patch.
   *
   * Rows are replaced immutably to preserve referential integrity.
   */
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

  /**
   * Remove a row by its identifier.
   */
  const deleteRow = (id: string) => {
    onChange(rows.filter(r => r.id !== id))
  }

  /**
   * Append a new, empty row to the editor.
   */
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

  /**
   * CSS class applied based on row height selection.
   */
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
