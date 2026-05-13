import { describe, expect, it, vi } from 'vitest'
import { getApiBaseUrl, getHttpsRedirectUrl, redirectToHttpsIfNeeded } from '../../utils/httpsRedirect'

describe('httpsRedirect', () => {
  it('returns https redirect url for production ip over http', () => {
    const redirectUrl = getHttpsRedirectUrl('http://47.94.88.161/login?from=test#anchor')

    expect(redirectUrl).toBe('https://47.94.88.161/login?from=test#anchor')
  })

  it('returns https redirect url for production domain over http', () => {
    const redirectUrl = getHttpsRedirectUrl('http://allotcf.com/login?from=test#anchor')

    expect(redirectUrl).toBe('https://allotcf.com/login?from=test#anchor')
  })

  it('does not redirect local development urls', () => {
    const redirectUrl = getHttpsRedirectUrl('http://127.0.0.1:5174/login')

    expect(redirectUrl).toBeNull()
  })

  it('forces api requests to https for production ip pages', () => {
    const apiBaseUrl = getApiBaseUrl('http://47.94.88.161/login')

    expect(apiBaseUrl).toBe('https://47.94.88.161/api')
  })

  it('forces api requests to https for production domain pages', () => {
    const apiBaseUrl = getApiBaseUrl('http://allotcf.com/login')

    expect(apiBaseUrl).toBe('https://allotcf.com/api')
  })

  it('keeps relative api path for local pages', () => {
    const apiBaseUrl = getApiBaseUrl('http://127.0.0.1:5174/login')

    expect(apiBaseUrl).toBe('/api')
  })

  it('redirects the page when http production url is detected', () => {
    const replace = vi.fn()

    redirectToHttpsIfNeeded(
      {
        href: 'http://47.94.88.161/login',
      },
      replace,
    )

    expect(replace).toHaveBeenCalledWith('https://47.94.88.161/login')
  })
})
