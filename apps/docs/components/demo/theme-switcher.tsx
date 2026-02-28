'use client'

import { useState } from 'react'

const themes = ['light', 'dark', 'auto'] as const

export function ThemeSwitcher() {
  const [active, setActive] = useState<(typeof themes)[number]>('dark')

  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
      {themes.map((theme) => (
        <button
          key={theme}
          onClick={() => setActive(theme)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: active === theme ? '2px solid #6366f1' : '2px solid transparent',
            background: active === theme ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.05)',
            color: active === theme ? '#818cf8' : '#a0a0be',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 150ms ease',
            textTransform: 'capitalize',
          }}
        >
          {theme}
        </button>
      ))}
      <span
        style={{
          marginLeft: '12px',
          fontSize: '13px',
          color: '#6b7280',
          alignSelf: 'center',
        }}
      >
        Active: <code style={{ color: '#818cf8' }}>{active}</code>
      </span>
    </div>
  )
}
