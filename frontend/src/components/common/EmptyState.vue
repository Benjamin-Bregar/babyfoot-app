<script setup lang="ts">
defineProps<{
  title: string
  message?: string
}>()
</script>

<template>
  <div class="panel">
    <h3 class="section-title">{{ title }}</h3>
    <p class="muted">{{ message ?? 'No data available yet.' }}</p>
  </div>
</template>
