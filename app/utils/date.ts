const noteDateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
const draftDateFormatter = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })

export const formatNoteDate = (value: string): string => noteDateFormatter.format(new Date(value))
export const formatDraftDate = (value: string): string => draftDateFormatter.format(new Date(value))
