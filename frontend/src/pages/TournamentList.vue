<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { tournamentsService } from '@/services/tournaments'
import type { Tournament } from '@/types'

const tournaments = ref<Tournament[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const search = ref('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)

let searchTimer: ReturnType<typeof setTimeout> | null = null

const totalPages = computed(() => {
  if (total.value === 0) {
    return 1
  }

  return Math.ceil(total.value / limit.value)
})

const loadTournaments = async (): Promise<void> => {
  loading.value = true
  error.value = null

  try {
    const result = await tournamentsService.listPaginated({
      page: page.value,
      limit: limit.value,
      search: search.value || undefined,
    })

    tournaments.value = result.items
    total.value = result.pagination?.total ?? result.items.length
  } catch {
    error.value = 'Could not load tournaments right now.'
  } finally {
    loading.value = false
  }
}

const retryLoad = async (): Promise<void> => {
  await loadTournaments()
}

const goToPreviousPage = async (): Promise<void> => {
  if (page.value <= 1) {
    return
  }

  page.value -= 1
  await loadTournaments()
}

const goToNextPage = async (): Promise<void> => {
  if (page.value >= totalPages.value) {
    return
  }

  page.value += 1
  await loadTournaments()
}

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadTournaments()
  }, 350)
})

onMounted(loadTournaments)
</script>

<template>
  <section class="panel">
    <h2 class="section-title">Tournaments</h2>
    <label class="mt-2 grid gap-1">
      <span class="text-sm">Search tournaments</span>
      <input
        v-model="search"
        type="search"
        class="rounded border border-slate-300 px-3 py-2"
        placeholder="Search by tournament name"
        aria-label="Search tournaments"
      />
    </label>

    <p v-if="loading" class="muted">Loading tournaments...</p>
    <div v-else-if="error" class="mt-2 grid gap-2">
      <p class="muted">{{ error }}</p>
      <button type="button" class="rounded border px-3 py-2 text-sm" @click="retryLoad">Retry</button>
    </div>
    <p v-else-if="tournaments.length === 0" class="muted">No tournaments published yet.</p>

    <ul v-else class="mt-3 grid gap-3 md:grid-cols-2">
      <li v-for="tournament in tournaments" :key="tournament.id" class="panel">
        <RouterLink :to="`/tournaments/${tournament.id}`">
          <h3 class="font-semibold text-night">{{ tournament.name }}</h3>
        </RouterLink>
        <p class="text-sm muted">Starts: {{ tournament.startDate }}</p>
        <p class="text-sm muted">Ends: {{ tournament.endDate ?? 'TBD' }}</p>
      </li>
    </ul>

    <div v-if="!loading && !error" class="mt-4 flex items-center justify-between gap-2">
      <button
        type="button"
        class="rounded border px-3 py-2 text-sm disabled:opacity-50"
        :disabled="page <= 1"
        @click="goToPreviousPage"
        aria-label="Go to previous page"
      >
        Previous
      </button>
      <p class="text-sm muted">Page {{ page }} / {{ totalPages }}</p>
      <button
        type="button"
        class="rounded border px-3 py-2 text-sm disabled:opacity-50"
        :disabled="page >= totalPages"
        @click="goToNextPage"
        aria-label="Go to next page"
      >
        Next
      </button>
    </div>
  </section>
</template>
