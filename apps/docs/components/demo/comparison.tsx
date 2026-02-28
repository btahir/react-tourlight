'use client'

const rows = [
  { feature: 'React 19', spotlight: true, joyride: false, shepherd: false, driver: null, intro: null },
  { feature: 'MIT License', spotlight: true, joyride: true, shepherd: false, driver: true, intro: false },
  { feature: 'Bundle < 10KB', spotlight: true, joyride: false, shepherd: false, driver: true, intro: false },
  { feature: 'React-native', spotlight: true, joyride: true, shepherd: false, driver: false, intro: false },
  { feature: 'Dark mode', spotlight: true, joyride: false, shepherd: true, driver: true, intro: null },
  { feature: 'WCAG 2.1 AA', spotlight: true, joyride: false, shepherd: false, driver: false, intro: false },
  { feature: 'Focus trap', spotlight: true, joyride: false, shepherd: false, driver: false, intro: false },
  { feature: 'Async elements', spotlight: true, joyride: false, shepherd: null, driver: false, intro: false },
  { feature: 'Custom tooltips', spotlight: true, joyride: true, shepherd: null, driver: null, intro: null },
  { feature: 'Zero deps', spotlight: true, joyride: false, shepherd: false, driver: true, intro: false },
]

function Cell({ value }: { value: boolean | null }) {
  if (value === true) return <span style={{ color: '#22c55e' }}>&#10003;</span>
  if (value === false) return <span style={{ color: '#ef4444' }}>&#10007;</span>
  return <span style={{ color: '#f59e0b' }}>~</span>
}

export function Comparison() {
  const headerStyle: React.CSSProperties = {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: 600,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    whiteSpace: 'nowrap',
  }

  const cellStyle: React.CSSProperties = {
    padding: '10px 14px',
    textAlign: 'center',
    fontSize: '14px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
        }}
      >
        <thead>
          <tr>
            <th style={{ ...headerStyle, textAlign: 'left' }}>Feature</th>
            <th style={{ ...headerStyle, textAlign: 'center', color: '#818cf8' }}>react-spotlight</th>
            <th style={{ ...headerStyle, textAlign: 'center' }}>Joyride</th>
            <th style={{ ...headerStyle, textAlign: 'center' }}>Shepherd</th>
            <th style={{ ...headerStyle, textAlign: 'center' }}>Driver.js</th>
            <th style={{ ...headerStyle, textAlign: 'center' }}>Intro.js</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature}>
              <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 500 }}>{row.feature}</td>
              <td style={{ ...cellStyle, background: 'rgba(99, 102, 241, 0.04)' }}>
                <Cell value={row.spotlight} />
              </td>
              <td style={cellStyle}><Cell value={row.joyride} /></td>
              <td style={cellStyle}><Cell value={row.shepherd} /></td>
              <td style={cellStyle}><Cell value={row.driver} /></td>
              <td style={cellStyle}><Cell value={row.intro} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
