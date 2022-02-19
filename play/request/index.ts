import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

export default axios.create({
  baseURL: '/',

  headers: {
    Accept: 'application/json',
    'content-type': 'application/json;charset=utf-8',
  },

})
