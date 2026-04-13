import { ref } from 'vue'
import { defineStore } from 'pinia'
import { toast } from 'vue3-toastify'

export const useUiStore = defineStore('ui', () => {
  const isGlobalLoading = ref(false)
  const activeModal = ref<string | null>(null)

  const setGlobalLoading = (value: boolean): void => {
    isGlobalLoading.value = value
  }

  const openModal = (modalId: string): void => {
    activeModal.value = modalId
  }

  const closeModal = (): void => {
    activeModal.value = null
  }

  const notifySuccess = (message: string): void => {
    toast.success(message)
  }

  const notifyError = (message: string): void => {
    toast.error(message)
  }

  const notifyInfo = (message: string): void => {
    toast.info(message)
  }

  return {
    isGlobalLoading,
    activeModal,
    setGlobalLoading,
    openModal,
    closeModal,
    notifySuccess,
    notifyError,
    notifyInfo,
  }
})
