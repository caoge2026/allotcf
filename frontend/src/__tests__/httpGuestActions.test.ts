import { beforeEach, expect, it } from 'vitest'
import http from '../services/http'
import { useUserStore } from '../stores/userStore'
beforeEach(()=>{localStorage.clear();useUserStore.setState({userType:'GUEST',guestActionCount:0,guestActionLimit:10})})
it('counts successful guest writes even when a query string is present',async()=>{
 await http.request({method:'post',url:'/practice-sessions?source=catalog',adapter:async config=>({data:{},status:200,statusText:'OK',headers:{},config})})
 expect(useUserStore.getState().guestActionCount).toBe(1)
})
it('does not count read-only or unrelated requests',async()=>{
 for(const [method,url] of [['get','/practice-sessions?source=catalog'],['post','/api/auth/login']])await http.request({method,url,adapter:async config=>({data:{},status:200,statusText:'OK',headers:{},config})})
 expect(useUserStore.getState().guestActionCount).toBe(0)
})
