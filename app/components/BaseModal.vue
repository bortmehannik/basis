<script setup lang="ts">
import { useId } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  description?: string
}>()

const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLElement | null>(null)
const modalId = useId()
const titleId = `${modalId}-title`
const descriptionId = `${modalId}-description`
let previousFocus: HTMLElement | null = null

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function focusFirst(): void {
  const first = dialog.value?.querySelector<HTMLElement>('[data-autofocus], ' + focusableSelector)
  ;(first ?? dialog.value)?.focus()
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.open) return

  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    emit('close')
    return
  }
  if (event.key !== 'Tab' || !dialog.value) return

  const focusable = [...dialog.value.querySelectorAll<HTMLElement>(focusableSelector)]
  if (focusable.length === 0) {
    event.preventDefault()
    dialog.value.focus()
    return
  }

  const first = focusable[0]
  const last = focusable.at(-1)
  const activeElement = document.activeElement

  if (!dialog.value.contains(activeElement)) {
    event.preventDefault()
    ;(event.shiftKey ? last : first)?.focus()
  }
  else if (event.shiftKey && activeElement === first) {
    event.preventDefault()
    last?.focus()
  }
  else if (!event.shiftKey && activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

function onFocusIn(event: FocusEvent): void {
  if (!props.open || !dialog.value || dialog.value.contains(event.target as Node)) return
  focusFirst()
}

function addDocumentListeners(): void {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('focusin', onFocusIn)
}

function removeDocumentListeners(): void {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('focusin', onFocusIn)
}

watch(() => props.open, async (open) => {
  if (open) {
    previousFocus = document.activeElement as HTMLElement | null
    document.body.classList.add('is-modal-open')
    addDocumentListeners()
    await nextTick()
    focusFirst()
  }
  else {
    removeDocumentListeners()
    document.body.classList.remove('is-modal-open')
    if (previousFocus?.isConnected) previousFocus.focus()
  }
}, { immediate: true })

onBeforeUnmount(() => {
  removeDocumentListeners()
  document.body.classList.remove('is-modal-open')
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-layer" @mousedown.self="emit('close')">
        <section
          ref="dialog"
          class="modal"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descriptionId : undefined"
          tabindex="-1"
        >
          <h2 :id="titleId" class="modal__title">{{ title }}</h2>
          <p v-if="description" :id="descriptionId" class="modal__description">
            {{ description }}
          </p>
          <div class="modal__content"><slot /></div>
          <div class="modal__actions"><slot name="actions" /></div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
