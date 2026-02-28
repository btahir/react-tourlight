export interface SpotlightTheme {
  overlay: { background: string }
  tooltip: {
    background: string
    color: string
    borderRadius: string
    boxShadow: string
    padding: string
    maxWidth: string
  }
  title: { fontSize: string; fontWeight: string; color: string; marginBottom: string }
  content: { fontSize: string; color: string; lineHeight: string }
  button: {
    background: string
    color: string
    borderRadius: string
    padding: string
    fontSize: string
    fontWeight: string
    border: string
    cursor: string
    hoverBackground: string
  }
  buttonSecondary: {
    background: string
    color: string
    border: string
    hoverBackground: string
  }
  progress: { background: string; fill: string; height: string; borderRadius: string }
  arrow: { fill: string }
  closeButton: { color: string; hoverColor: string }
}
