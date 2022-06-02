import { provide, inject } from 'vue'

export function createContext(key, context) {
  provide(key, context)
}

export function useContext(key) {
  return inject(key)
}
