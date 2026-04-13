<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

<template>
  <div class="panel">
    <p class="muted">{{ message ?? 'Loading...' }}</p>
  </div>
</template>
