import { createContext, useContext } from './useContext'

let movie: any

const key = Symbol()

export function createPagContext() {
  function setMovieInstance(m: any) {
    movie = m
  }
  function getMovieInstance() {
    return movie
  }
  createContext(key, { setMovieInstance, getMovieInstance })
}

export function usePagContext() {
  return useContext(key)
}
