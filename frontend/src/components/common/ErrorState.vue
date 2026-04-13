<script setup lang="ts">
defineProps<{
  title?: string
  message: string
  retryLabel?: string
  details?: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="panel">
    <h3 v-if="title" class="section-title">{{ title }}</h3>
    <p class="muted">{{ message }}</p>
    <p v-if="details" class="mt-1 text-xs muted">{{ details }}</p>
    <button
      type="button"
      class="mt-3 rounded-lg border border-slate-400 px-3 py-2 text-sm"
      @click="emit('retry')"
    >
      {{ retryLabel ?? 'Retry' }}
    </button>
  </div>
</template>
