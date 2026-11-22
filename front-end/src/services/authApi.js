export class AuthApiError extends Error {
  constructor(message, { status = 0, code = 'REQUEST_FAILED', fields = {} } = {}) {
    super(message)
    this.name = 'AuthApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }
}

export function createAuthApi({ fetchFn = globalThis.fetch } = {}) {
  async function request(path, { method = 'GET', body, signal } = {}) {
    let response
    let data
    try {
      response = await fetchFn(`/api/auth/${path}`, {
        method,
        credentials: 'same-origin',
        cache: 'no-store',
        headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000),
      })
      if (response.status === 204) return null
      data = await response.json()
    } catch (error) {
      if (signal?.aborted) throw error
      if (error.name === 'TimeoutError') {
        throw new AuthApiError('The request took too long. Please try again.', { code: 'REQUEST_TIMEOUT' })
      }
      throw new AuthApiError('Unable to connect to StockSim. Please try again.', {
        status: response?.status || 0,
        code: response ? 'INVALID_RESPONSE' : 'NETWORK_ERROR',
      })
    }
    if (!response.ok) {
      const detail = data?.error
      const fields = Object.fromEntries(Object.entries(detail?.fields || {}).filter(([, message]) => typeof message === 'string'))
      throw new AuthApiError(typeof detail?.message === 'string' ? detail.message : 'The request could not be completed. Please try again.', {
        status: response.status,
        code: detail?.code || 'REQUEST_FAILED',
        fields,
      })
    }
    return data
  }

  function userFrom(data) {
    const user = data?.user
    if (!user || !['id', 'name', 'email', 'createdAt'].every(field => typeof user[field] === 'string') || Number.isNaN(Date.parse(user.createdAt))) {
      throw new AuthApiError('Your session could not be read. Please try again.', { status: 502, code: 'INVALID_RESPONSE' })
    }
    return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }
  }

  return {
    register: body => request('register', { method: 'POST', body }).then(userFrom),
    login: body => request('login', { method: 'POST', body }).then(userFrom),
    me: options => request('me', options).then(userFrom),
    logout: () => request('logout', { method: 'POST' }),
    forgotPassword: body => request('forgot-password', { method: 'POST', body }),
    resetPassword: body => request('reset-password', { method: 'POST', body }),
  }
}

export default createAuthApi()
