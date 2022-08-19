/**
 * @files 创建 local storage
 * @returns storage
 */

 import { isNullOrUndef } from '../is'

 class WebStorage {
   private storage: Storage
   private prefix?: string
 
   constructor() {
     this.storage = localStorage
     this.prefix = ''
   }
 
   getKey(key: string) {
     return `${this.prefix}${key}`.toUpperCase()
   }
 
   get(key: string): any {
     const val = this.storage.getItem(this.getKey(key))
 
     if (!val) return null
 
     try {
       const data = JSON.parse(val)
       const { value, expire } = data
       if (isNullOrUndef(expire) || expire >= new Date().getTime()) {
         return value
       }
       this.remove(key)
     } catch (e: any) {
       console.error(e)
     }
 
     return null
   }
 
   /**
    * @param {string} key
    * @param {*} value
    * @param {*} expire time in ms
    */
   set(key: string, value: any, expire?: number | undefined) {
     const stringData = JSON.stringify({
       value,
       time: Date.now(),
       expire: isNullOrUndef(expire) ? null : new Date().getTime() + expire,
     })
 
     try {
       this.storage.setItem(this.getKey(key), stringData)
     } catch (e: any) {
       console.error(e)
     }
   }
 
   remove(key: string): void {
     this.storage.removeItem(this.getKey(key))
   }
 
   clear(): void {
     this.storage.clear()
   }
 }
 
 export default new WebStorage()
 