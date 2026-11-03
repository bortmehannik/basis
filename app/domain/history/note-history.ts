import { applyChange, invertChange, type HistoryState, type NoteChange } from './types'
import type { Note } from '~/types/note'

export class NoteHistory {
  private readonly state: HistoryState = { past: [], future: [] }

  constructor(private readonly limit = 50) {}

  get canUndo(): boolean {
    return this.state.past.length > 0
  }

  get canRedo(): boolean {
    return this.state.future.length > 0
  }

  get size(): number {
    return this.state.past.length
  }

  record(change: NoteChange): void {
    this.state.past.push(structuredClone(change))
    if (this.state.past.length > this.limit) this.state.past.shift()
    this.state.future.length = 0
  }

  discardFuture(): void {
    this.state.future.length = 0
  }

  undo(note: Note): boolean {
    const change = this.state.past.pop()
    if (!change) return false

    applyChange(note, invertChange(change))
    this.state.future.push(change)
    return true
  }

  redo(note: Note): boolean {
    const change = this.state.future.pop()
    if (!change) return false

    applyChange(note, change)
    this.state.past.push(change)
    return true
  }

  clear(): void {
    this.state.past.length = 0
    this.state.future.length = 0
  }
}
