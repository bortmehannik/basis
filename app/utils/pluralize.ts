const russianPluralRules = new Intl.PluralRules('ru-RU')

export const formatNoteCount = (count: number): string => {
  const form = russianPluralRules.select(count)
  const label = form === 'one' ? 'заметка' : form === 'few' ? 'заметки' : 'заметок'
  return `${count} ${label}`
}
