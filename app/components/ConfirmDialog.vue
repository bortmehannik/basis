<script setup lang="ts">
withDefaults(defineProps<{
  open: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
}>(), {
  confirmText: 'Подтвердить',
  cancelText: 'Отмена',
})

const emit = defineEmits<{ confirm: []; close: [] }>()
</script>

<template>
  <BaseModal :open="open" :title="title" :description="description" @close="emit('close')">
    <template #actions>
      <AppButton data-autofocus variant="secondary" @click="emit('close')">{{ cancelText }}</AppButton>
      <AppButton :variant="destructive ? 'danger' : 'primary'" @click="emit('confirm')">
        {{ confirmText }}
      </AppButton>
    </template>
  </BaseModal>
</template>
