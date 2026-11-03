<script setup lang="ts">
import { onBeforeRouteLeave } from 'vue-router'
import type { NoteDraft } from '~/types/note'
import { formatDraftDate } from '~/utils/date'
import { cloneNote } from '~/utils/note'
import { sortTodosByPriority } from '~/utils/todo'

definePageMeta({ key: route => route.fullPath })

const route = useRoute()
const notesStore = useNotesStore()
const draftsStore = useDraftsStore()
const editor = useEditorStore()

const routeId = computed(() => String(route.params.id))
const isNew = computed(() => routeId.value === 'new')
const draftKey = computed(() => isNew.value ? 'new' : routeId.value)
const sortedTodos = computed(() => editor.note ? sortTodosByPriority(editor.note.todos) : [])
const initialized = ref(false)
const notFound = ref(false)
const recoveryOpen = ref(false)
const recoveryDraft = ref<NoteDraft | null>(null)
const cancelOpen = ref(false)
const deleteOpen = ref(false)
const externallyDeleted = ref(false)
const saveError = ref('')
const allowNavigation = ref(false)
const pendingNavigation = ref<string | null>(null)
const newTodoText = ref('')
const newTodoInput = ref<HTMLInputElement | null>(null)
const storageAvailable = computed(() => notesStore.storageAvailable && draftsStore.storageAvailable)
const pageTitle = computed(() => {
  if (notFound.value) return 'Заметка не найдена'
  return isNew.value ? 'Новая заметка' : 'Редактирование'
})
let draftTimer: ReturnType<typeof setTimeout> | undefined

useHead(() => ({ title: pageTitle.value }))

onMounted(() => {
  notesStore.hydrate()
  draftsStore.hydrate()
  initialize()
  window.addEventListener('keydown', onGlobalKeydown)
  window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => {
  if (draftTimer) clearTimeout(draftTimer)
  window.removeEventListener('keydown', onGlobalKeydown)
  window.removeEventListener('beforeunload', onBeforeUnload)
  editor.reset()
})

function initialize(): void {
  const saved = isNew.value ? undefined : notesStore.findById(routeId.value)
  const draft = draftsStore.get(draftKey.value)

  if (!isNew.value && !saved && !draft) {
    notFound.value = true
    initialized.value = true
    return
  }

  editor.start(saved ?? createEmptyNote())
  externallyDeleted.value = Boolean(draft && !saved && !isNew.value)

  if (draft) {
    recoveryDraft.value = { ...draft, note: cloneNote(draft.note) }
    recoveryOpen.value = true
  }
  initialized.value = true
}

watch(() => notesStore.notes.map(note => note.id), (ids) => {
  if (initialized.value && !isNew.value && !ids.includes(routeId.value) && !externallyDeleted.value) {
    externallyDeleted.value = true
    persistDraft()
  }
})

watch(() => editor.note, () => {
  if (!initialized.value || recoveryOpen.value || notFound.value) return
  if (draftTimer) clearTimeout(draftTimer)
  draftTimer = setTimeout(persistDraft, 800)
}, { deep: true })

function persistDraft(): void {
  if (!editor.note) return
  if (!editor.isDirty && !externallyDeleted.value) {
    draftsStore.remove(draftKey.value)
    return
  }

  draftsStore.save(draftKey.value, {
    note: cloneNote(editor.note),
    sourceId: isNew.value ? null : routeId.value,
    savedAt: new Date().toISOString(),
  })
}

function restoreDraft(): void {
  if (recoveryDraft.value) editor.restoreWorkingCopy(recoveryDraft.value.note)
  recoveryOpen.value = false
}

function discardDraft(): void {
  draftsStore.remove(draftKey.value)
  recoveryOpen.value = false
  if (externallyDeleted.value && !notesStore.findById(routeId.value)) {
    allowNavigation.value = true
    navigateTo('/')
  }
}

function onGlobalKeydown(event: KeyboardEvent): void {
  const isUndoKey = event.code === 'KeyZ' || event.key.toLowerCase() === 'z'
  if (!(event.ctrlKey || event.metaKey) || event.altKey || !isUndoKey) return
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, [contenteditable="true"]')) return

  event.preventDefault()
  if (event.shiftKey) editor.redo()
  else editor.undo()
}

function onBeforeUnload(event: BeforeUnloadEvent): void {
  persistDraft()
  if (!editor.isDirty && !externallyDeleted.value) return
  event.preventDefault()
}

function updateTitle(value: string): void {
  editor.updateTitle(value)
}

function updateTodo(id: string, value: string): void {
  editor.updateTodoText(id, value)
}

async function commitNewTodo(keepFocus: boolean): Promise<void> {
  const text = newTodoText.value.trim()
  if (!text) {
    newTodoText.value = ''
    return
  }

  editor.addTodo(text)
  newTodoText.value = ''
  if (keepFocus) await nextTick(() => newTodoInput.value?.focus())
}

function finalizeTodo(todoId: string): void {
  editor.finalizeText(`todo:${todoId}`)
}

async function finalizeTodoAndFocusComposer(todoId: string): Promise<void> {
  finalizeTodo(todoId)
  await nextTick(() => newTodoInput.value?.focus())
}

async function saveNote(): Promise<void> {
  if (!editor.note) return
  saveError.value = ''
  editor.finalizeAllText()

  const now = new Date().toISOString()
  const saved = cloneNote(editor.note)
  saved.title = saved.title.trim() || 'Без названия'
  saved.todos = saved.todos
    .map(todo => ({ ...todo, text: todo.text.trim() }))
    .filter(todo => todo.text.length > 0)
  saved.updatedAt = now

  if (externallyDeleted.value) {
    saved.id = createId()
    saved.createdAt = now
  }

  if (!notesStore.save(saved)) {
    saveError.value = 'Не удалось сохранить заметку. Проверьте доступ к локальному хранилищу и повторите попытку.'
    return
  }
  draftsStore.remove(draftKey.value)
  editor.markSaved(saved)
  allowNavigation.value = true
  await navigateTo('/')
}

function requestCancel(): void {
  pendingNavigation.value = null
  if (!editor.isDirty && !externallyDeleted.value) {
    draftsStore.remove(draftKey.value)
    allowNavigation.value = true
    void navigateTo('/')
    return
  }

  cancelOpen.value = true
}

function closeCancel(): void {
  cancelOpen.value = false
  pendingNavigation.value = null
}

function confirmCancel(): void {
  const destination = pendingNavigation.value ?? '/'
  draftsStore.remove(draftKey.value)
  cancelOpen.value = false
  pendingNavigation.value = null
  editor.reset()
  allowNavigation.value = true
  navigateTo(destination)
}

function confirmDelete(): void {
  if (!isNew.value && !notesStore.remove(routeId.value)) {
    deleteOpen.value = false
    saveError.value = 'Не удалось удалить заметку. Проверьте доступ к локальному хранилищу и повторите попытку.'
    return
  }
  draftsStore.remove(draftKey.value)
  deleteOpen.value = false
  editor.reset()
  allowNavigation.value = true
  navigateTo('/')
}

onBeforeRouteLeave((to) => {
  if (allowNavigation.value) return true
  if (!editor.isDirty && !externallyDeleted.value) {
    draftsStore.remove(draftKey.value)
    return true
  }
  pendingNavigation.value = to.fullPath
  cancelOpen.value = true
  return false
})
</script>

<template>
  <div class="page-shell page-shell--with-sidebar editor-page">
    <AppSidebar :note-count="notesStore.notes.length" :storage-available="storageAvailable" />
    <AppHeader compact>
      <div class="history-actions" aria-label="История изменений">
        <AppButton size="icon" variant="ghost" :disabled="!editor.canUndo" aria-label="Отменить изменение" @click="editor.undo">
          <AppIcon name="undo" :size="19" />
        </AppButton>
        <AppButton size="icon" variant="ghost" :disabled="!editor.canRedo" aria-label="Повторить изменение" @click="editor.redo">
          <AppIcon name="redo" :size="19" />
        </AppButton>
      </div>
    </AppHeader>

    <main v-if="notFound" class="not-found container">
      <div class="empty-state__icon"><AppIcon name="note" :size="28" /></div>
      <p class="eyebrow">Ошибка 404</p>
      <h1>Заметка не найдена</h1>
      <p>Возможно, она была удалена или ссылка устарела.</p>
      <AppButton variant="primary" @click="navigateTo('/')">Вернуться к заметкам</AppButton>
    </main>

    <main v-else-if="initialized && editor.note" class="editor container container--editor">
      <div class="editor-toolbar">
        <AppButton variant="ghost" size="small" @click="requestCancel">
          <AppIcon name="arrow-left" :size="18" />
          Отменить
        </AppButton>
        <div class="editor-toolbar__actions">
          <AppButton
            v-if="!isNew && !externallyDeleted"
            variant="ghost"
            size="small"
            class="delete-button"
            @click="deleteOpen = true"
          >
            <AppIcon name="trash" :size="17" />
            <span class="button-label">Удалить</span>
          </AppButton>
          <AppButton variant="primary" size="small" @click="saveNote">
            {{ externallyDeleted ? 'Сохранить как новую' : 'Сохранить' }}
          </AppButton>
        </div>
      </div>

      <div v-if="externallyDeleted" class="status-banner" role="status">
        Эту заметку удалили в другой вкладке. Текущую версию можно сохранить как новую заметку.
      </div>
      <div v-if="saveError" class="status-banner status-banner--error" role="alert">{{ saveError }}</div>

      <form class="editor-card" novalidate @submit.prevent="saveNote">
        <label class="sr-only" for="note-title">Название заметки</label>
        <input
          id="note-title"
          class="title-input"
          :value="editor.note.title"
          placeholder="Название заметки"
          autocomplete="off"
          @input="updateTitle(($event.target as HTMLInputElement).value)"
          @blur="editor.finalizeText('title')"
        >

        <div class="todo-section">
          <div class="todo-section__heading">
            <h2>Задачи</h2>
            <span>{{ editor.note.todos.filter(todo => todo.completed).length }} из {{ editor.note.todos.length }}</span>
          </div>

          <TransitionGroup v-if="editor.note.todos.length" name="todo-sort" tag="div" class="todo-list">
            <TodoEditorRow
              v-for="todo in sortedTodos"
              :key="todo.id"
              :data-todo-id="todo.id"
              :todo="todo"
              @toggle="editor.toggleTodo(todo.id)"
              @update="updateTodo(todo.id, $event)"
              @blur="finalizeTodo(todo.id)"
              @enter="finalizeTodoAndFocusComposer(todo.id)"
              @priority="editor.setTodoPriority(todo.id, $event)"
              @remove="editor.removeTodo(todo.id)"
            />
          </TransitionGroup>
          <p v-else class="todo-section__empty">Добавьте первую задачу в эту заметку.</p>

          <div class="todo-composer">
            <AppIcon name="plus" :size="19" />
            <label class="sr-only" for="new-todo">Название новой задачи</label>
            <input
              id="new-todo"
              ref="newTodoInput"
              v-model="newTodoText"
              type="text"
              autocomplete="off"
              placeholder="Название задачи..."
              @keydown.enter.prevent="commitNewTodo(true)"
              @blur="commitNewTodo(false)"
            >
          </div>
        </div>
      </form>
      <p class="keyboard-hint">Ctrl/⌘ Z — отменить · Shift + Ctrl/⌘ Z — повторить</p>
    </main>

    <BaseModal
      :open="recoveryOpen"
      title="Восстановить черновик?"
      description="Найдены несохранённые изменения после прошлого сеанса."
      @close="discardDraft"
    >
      <p v-if="recoveryDraft" class="draft-time">
        Сохранён {{ formatDraftDate(recoveryDraft.savedAt) }}
      </p>
      <template #actions>
        <AppButton data-autofocus variant="secondary" @click="discardDraft">Не восстанавливать</AppButton>
        <AppButton variant="primary" @click="restoreDraft">Восстановить</AppButton>
      </template>
    </BaseModal>

    <ConfirmDialog
      :open="cancelOpen"
      title="Отменить редактирование?"
      description="Все изменения, внесённые после последнего сохранения, будут потеряны."
      confirm-text="Выйти без сохранения"
      destructive
      @close="closeCancel"
      @confirm="confirmCancel"
    />
    <ConfirmDialog
      :open="deleteOpen"
      title="Удалить заметку?"
      description="Заметка и все её задачи будут удалены без возможности восстановления."
      confirm-text="Удалить"
      destructive
      @close="deleteOpen = false"
      @confirm="confirmDelete"
    />
  </div>
</template>
