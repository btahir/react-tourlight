import type { SpotlightTheme } from './types.ts'

export const lightTheme: SpotlightTheme = {
  overlay: {
    background: 'rgba(0, 0, 0, 0.5)',
  },
  tooltip: {
    background: '#ffffff',
    color: '#1a1a2e',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
    padding: '24px',
    maxWidth: '380px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '8px',
  },
  content: {
    fontSize: '14px',
    color: '#4a4a68',
    lineHeight: '1.6',
  },
  button: {
    background: '#3b82f6',
    color: '#ffffff',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    hoverBackground: '#2563eb',
  },
  buttonSecondary: {
    background: 'transparent',
    color: '#4a4a68',
    border: '1px solid #e2e2e8',
    hoverBackground: '#f5f5f7',
  },
  progress: {
    background: '#e2e2e8',
    fill: '#3b82f6',
    height: '4px',
    borderRadius: '2px',
  },
  arrow: {
    fill: '#ffffff',
  },
  closeButton: {
    color: '#9ca3af',
    hoverColor: '#4a4a68',
  },
}
