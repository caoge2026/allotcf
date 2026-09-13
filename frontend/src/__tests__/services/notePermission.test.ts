import { expect, it } from 'vitest'
import http from '../../services/http'

it('preserves the login when the author permission is revoked', async () => {
  localStorage.setItem('token', 'existing-token')
  const failure = { config: { url: '/manage/grammar-notes/12/publish' }, response: { status: 403 } }
  await expect(http.post('/manage/grammar-notes/12/publish', {}, {
    adapter: () => Promise.reject(failure),
  })).rejects.toBe(failure)
  expect(localStorage.getItem('token')).toBe('existing-token')
})
