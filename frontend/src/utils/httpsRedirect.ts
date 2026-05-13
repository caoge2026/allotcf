const HTTPS_REQUIRED_HOSTS = new Set(['47.94.88.161', 'allotcf.com', 'www.allotcf.com'])

export function getHttpsRedirectUrl(currentUrl: string): string | null {
  const url = new URL(currentUrl)

  if (url.protocol !== 'http:' || !HTTPS_REQUIRED_HOSTS.has(url.hostname)) {
    return null
  }

  url.protocol = 'https:'
  return url.toString()
}

export function redirectToHttpsIfNeeded(
  locationLike: { href: string } = window.location,
  replace: (url: string) => void = (url) => window.location.replace(url),
): void {
  const redirectUrl = getHttpsRedirectUrl(locationLike.href)

  if (redirectUrl) {
    replace(redirectUrl)
  }
}

export function getApiBaseUrl(currentUrl: string = window.location.href): string {
  const url = new URL(currentUrl)

  if (HTTPS_REQUIRED_HOSTS.has(url.hostname)) {
    return `https://${url.host}/api`
  }

  return '/api'
}
