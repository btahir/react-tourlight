import type { SpotlightTheme } from './types.ts'

export const darkTheme: SpotlightTheme = {
  overlay: {
    background: 'rgba(0, 0, 0, 0.7)',
  },
  tooltip: {
    background: 'rgba(30, 30, 46, 0.95)',
    color: '#e4e4ef',
    borderRadius: '12px',
    boxShadow:
      '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
    padding: '24px',
    maxWidth: '380px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#f0f0f8',
    marginBottom: '8px',
  },
  content: {
    fontSize: '14px',
    color: '#a0a0be',
    lineHeight: '1.6',
  },
  button: {
    background: '#6366f1',
    color: '#ffffff',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    hoverBackground: '#4f46e5',
  },
  buttonSecondary: {
    background: 'transparent',
    color: '#a0a0be',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    hoverBackground: 'rgba(255, 255, 255, 0.06)',
  },
  progress: {
    background: 'rgba(255, 255, 255, 0.1)',
    fill: '#6366f1',
    height: '4px',
    borderRadius: '2px',
  },
  arrow: {
    fill: 'rgba(30, 30, 46, 0.95)',
  },
  closeButton: {
    color: 'rgba(255, 255, 255, 0.4)',
    hoverColor: '#e4e4ef',
  },
}
