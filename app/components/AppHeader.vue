<script setup lang="ts">
defineProps<{ compact?: boolean }>()
</script>

<template>
  <header class="app-header" :class="{ 'app-header--compact': compact }">
    <div class="app-header__inner">
      <NuxtLink class="brand" to="/" aria-label="Заметки — на главную">
        <span class="brand__mark"><AppIcon name="note" :size="20" /></span>
        <span>Заметки</span>
      </NuxtLink>
      <div class="app-header__actions"><slot /></div>
    </div>
  </header>
</template>
