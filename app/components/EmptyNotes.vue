<template>
  <section class="empty-state">
    <div class="empty-state__icon"><AppIcon name="note" :size="28" /></div>
    <h2>Пока здесь тихо</h2>
    <p>Создайте первую заметку — идеи и дела будут собраны в одном месте.</p>
    <AppButton variant="primary" @click="navigateTo('/notes/new')">
      <AppIcon name="plus" :size="18" />
      Новая заметка
    </AppButton>
  </section>
</template>
