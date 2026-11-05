<script setup lang="ts">
defineProps<{
  name:
    | 'plus'
    | 'edit'
    | 'trash'
    | 'arrow-left'
    | 'undo'
    | 'redo'
    | 'check'
    | 'note'
  size?: number
}>()
</script>

<template>
  <svg
    class="app-icon"
    :width="size ?? 20"
    :height="size ?? 20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'plus'">
      <path d="M12 5v14M5 12h14" />
    </template>
    <template v-else-if="name === 'edit'">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </template>
    <template v-else-if="name === 'trash'">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
    </template>
    <template v-else-if="name === 'arrow-left'">
      <path d="m15 18-6-6 6-6" />
    </template>
    <template v-else-if="name === 'undo'">
      <path d="M9 7 4 12l5 5" /><path d="M20 17a8 8 0 0 0-13-5" />
    </template>
    <template v-else-if="name === 'redo'">
      <path d="m15 7 5 5-5 5" /><path d="M4 17a8 8 0 0 1 13-5" />
    </template>
    <template v-else-if="name === 'check'">
      <path d="m5 12 4 4L19 6" />
    </template>
    <template v-else>
      <path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h4" />
    </template>
  </svg>
</template>
