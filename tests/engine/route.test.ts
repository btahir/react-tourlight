import { getCurrentPath, isRouteActive } from '../../src/engine/route.ts'

describe('route matching', () => {
  describe('isRouteActive', () => {
    it('matches exact paths', () => {
      expect(isRouteActive('/settings', '/settings')).toBe(true)
      expect(isRouteActive('/settings', '/dashboard')).toBe(false)
    })

    it('ignores a trailing slash on either side', () => {
      expect(isRouteActive('/settings/', '/settings')).toBe(true)
      expect(isRouteActive('/settings', '/settings/')).toBe(true)
      expect(isRouteActive('/', '/')).toBe(true)
    })

    it('matches trailing "/*" wildcards on a path boundary', () => {
      expect(isRouteActive('/app/*', '/app')).toBe(true)
      expect(isRouteActive('/app/*', '/app/settings')).toBe(true)
      expect(isRouteActive('/app/*', '/app/settings/deep')).toBe(true)
      expect(isRouteActive('/app/*', '/application')).toBe(false)
    })

    it('matches raw "*" prefix wildcards', () => {
      expect(isRouteActive('/app*', '/application')).toBe(true)
      expect(isRouteActive('/app*', '/app/x')).toBe(true)
      expect(isRouteActive('/app*', '/other')).toBe(false)
    })

    it('matches dynamic ":param" segments', () => {
      expect(isRouteActive('/users/:id', '/users/42')).toBe(true)
      expect(isRouteActive('/users/:id', '/users/abc')).toBe(true)
      expect(isRouteActive('/users/:id', '/users')).toBe(false)
      expect(isRouteActive('/users/:id', '/users/42/edit')).toBe(false)
      expect(isRouteActive('/team/:tid/user/:uid', '/team/7/user/9')).toBe(true)
      expect(isRouteActive('/team/:tid/user/:uid', '/team/7/user')).toBe(false)
    })
  })

  describe('getCurrentPath', () => {
    it('returns the current window pathname', () => {
      expect(getCurrentPath()).toBe(window.location.pathname || '/')
    })
  })
})
