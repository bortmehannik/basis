<script setup lang="ts">
import type { Note } from '~/types/note'
import { formatNoteCount } from '~/utils/pluralize'

const notesStore = useNotesStore()
const draftsStore = useDraftsStore()
const noteToDelete = ref<Note | null>(null)
const operationError = ref('')
const storageAvailable = computed(() => notesStore.storageAvailable && draftsStore.storageAvailable)

useHead({ title: 'Заметки' })

function confirmDelete(): void {
  if (!noteToDelete.value) return
  const removed = notesStore.remove(noteToDelete.value.id)
  noteToDelete.value = null
  operationError.value = removed ? '' : 'Не удалось удалить заметку: локальное хранилище недоступно.'
}

</script>

<template>
  <div class="page-shell page-shell--with-sidebar home-page">
    <AppSidebar :note-count="notesStore.notes.length" :storage-available="storageAvailable" />
    <AppHeader>
      <AppButton variant="primary" size="small" @click="navigateTo('/notes/new')">
        <AppIcon name="plus" :size="17" />
        <span class="button-label">Новая заметка</span>
      </AppButton>
    </AppHeader>

    <main class="home container workspace-main">
      <p v-if="operationError" class="status-banner status-banner--error" role="alert">{{ operationError }}</p>
      <div class="page-heading">
        <div>
          <h1>Все заметки</h1>
          <p class="page-heading__description">Мысли, планы и задачи в одном месте</p>
        </div>
        <p v-if="notesStore.notes.length" class="page-heading__meta">
          {{ formatNoteCount(notesStore.notes.length) }}
        </p>
      </div>

      <div v-if="notesStore.sortedNotes.length" class="notes-grid">
        <NoteCard
          v-for="note in notesStore.sortedNotes"
          :key="note.id"
          :note="note"
          @delete="noteToDelete = $event"
        />
      </div>
      <EmptyNotes v-else />
    </main>

    <ConfirmDialog
      :open="Boolean(noteToDelete)"
      title="Удалить заметку?"
      :description="`«${noteToDelete?.title ?? ''}» и все её задачи будут удалены без возможности восстановления.`"
      confirm-text="Удалить"
      destructive
      @close="noteToDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
