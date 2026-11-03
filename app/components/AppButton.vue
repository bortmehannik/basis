<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'regular' | 'small' | 'icon'
  type?: 'button' | 'submit'
  disabled?: boolean
  ariaLabel?: string
}>(), {
  variant: 'secondary',
  size: 'regular',
  type: 'button',
})
</script>

<template>
  <button
    :type="type"
    class="app-button"
    :class="[`app-button--${variant}`, `app-button--${size}`]"
    :disabled="disabled"
    :aria-label="ariaLabel"
  >
    <slot />
  </button>
</template>
