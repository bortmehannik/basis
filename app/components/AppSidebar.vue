<script setup lang="ts">
withDefaults(defineProps<{ noteCount: number; storageAvailable?: boolean }>(), {
  storageAvailable: true,
})
</script>

<template>
  <aside class="app-sidebar">
    <NuxtLink class="sidebar-identity" to="/" aria-label="Заметки — на главную">
      <span class="sidebar-identity__mark"><AppIcon name="check" :size="18" /></span>
      <span>Мои заметки</span>
    </NuxtLink>

    <AppButton class="sidebar-create" variant="primary" @click="navigateTo('/notes/new')">
      <AppIcon name="plus" :size="18" />
      Добавить заметку
    </AppButton>

    <nav class="sidebar-nav" aria-label="Основная навигация">
      <NuxtLink class="sidebar-nav__item is-active" to="/">
        <span class="sidebar-nav__icon"><AppIcon name="note" :size="18" /></span>
        <span>Все заметки</span>
        <span class="sidebar-nav__count">{{ noteCount }}</span>
      </NuxtLink>
    </nav>

    <div class="sidebar-footer">
      <span class="sidebar-footer__dot" :class="{ 'is-error': !storageAvailable }" />
      {{ storageAvailable ? 'Данные сохранены локально' : 'Хранилище недоступно' }}
    </div>
  </aside>
</template>
