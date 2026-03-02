import type React from 'react';
import { AbsoluteFill } from 'remotion';
import { fontBody, fontDisplay, fontMono } from '../lib/fonts';
import { theme } from '../lib/theme';

/**
 * Side-by-side comparison image: React Joyride (broken) vs react-tourlight.
 * 1440x720, static (1 frame). Used for README.
 */

const MockSidebar: React.FC<{ variant: 'joyride' | 'tourlight' }> = ({ variant }) => {
  const isJoyride = variant === 'joyride';
  const accent = isJoyride ? '#818cf8' : theme.amber;
  const bg = isJoyride ? '#1e1e2e' : theme.bg;
  const surface = isJoyride ? '#28283a' : theme.surface;
  const border = isJoyride ? 'rgba(255,255,255,0.08)' : theme.borderSubtle;
  const textDim = isJoyride ? '#8888aa' : theme.textSecondary;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: bg,
        fontFamily: fontBody,
        color: '#fafaf9',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 140,
          borderRight: `1px solid ${border}`,
          padding: '12px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flexShrink: 0,
        }}
      >
        {['Dashboard', 'Projects', 'Messages', 'Settings'].map((item, i) => (
          <div
            key={item}
            style={{
              padding: '6px 12px',
              fontSize: 11,
              color: i === 0 ? '#fafaf9' : textDim,
              background: i === 0 ? 'rgba(255,255,255,0.04)' : 'transparent',
              borderLeft: i === 0 ? `2px solid ${accent}` : '2px solid transparent',
            }}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: 16 }}>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['Users', 'Revenue', 'Growth'].map((label) => (
            <div
              key={label}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 6,
                border: `1px solid ${border}`,
                background: surface,
              }}
            >
              <div style={{ fontSize: 9, color: textDim, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>1,234</div>
            </div>
          ))}
        </div>

        {/* Table-like rows */}
        {['Website Redesign', 'Mobile App', 'API Migration'].map((row) => (
          <div
            key={row}
            style={{
              padding: '8px 12px',
              borderBottom: `1px solid ${border}`,
              fontSize: 11,
              color: textDim,
            }}
          >
            {row}
          </div>
        ))}
      </div>

      {/* Spotlight overlay */}
      {isJoyride ? (
        /* Joyride: broken mix-blend-mode overlay with ugly black blob */
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              mixBlendMode: 'hard-light',
            }}
          />
          {/* The broken cutout — irregular dark blob */}
          <div
            style={{
              position: 'absolute',
              top: 22,
              left: 128,
              width: 160,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(128,128,128,0.7)',
              mixBlendMode: 'hard-light',
              filter: 'blur(12px)',
            }}
          />
        </>
      ) : (
        /* Tourlight: clean clip-path cutout */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            clipPath:
              'polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%, 141px 10px, 141px 80px, 440px 80px, 440px 10px, 141px 10px)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        style={{
          position: 'absolute',
          top: isJoyride ? 90 : 88,
          left: isJoyride ? 140 : 160,
          background: isJoyride ? '#ffffff' : theme.surface,
          border: `1px solid ${isJoyride ? '#e5e5e5' : theme.borderAccent}`,
          borderRadius: isJoyride ? 4 : 10,
          padding: isJoyride ? '12px 14px' : '14px 16px',
          width: isJoyride ? 180 : 200,
          boxShadow: isJoyride
            ? '0 2px 8px rgba(0,0,0,0.15)'
            : '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: isJoyride ? '#1a1a1a' : '#fafaf9',
            marginBottom: 4,
          }}
        >
          Dashboard
        </div>
        <div
          style={{
            fontSize: 11,
            color: isJoyride ? '#666' : theme.textSecondary,
            lineHeight: 1.4,
          }}
        >
          This is an example of an onboarding step.
        </div>

        {/* Progress */}
        <div style={{ marginTop: 10 }}>
          {isJoyride ? (
            <div style={{ fontSize: 10, color: '#999' }}>Step 2 of 3</div>
          ) : (
            <>
              <div
                style={{
                  width: '100%',
                  height: 3,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.06)',
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    width: '66%',
                    height: '100%',
                    borderRadius: 2,
                    background: theme.amber,
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: theme.textSecondary }}>2 / 3</div>
            </>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: isJoyride ? 3 : 6,
              fontSize: 11,
              color: isJoyride ? '#666' : theme.textSecondary,
              border: isJoyride ? '1px solid #ddd' : 'none',
              background: isJoyride ? '#fff' : 'transparent',
            }}
          >
            {isJoyride ? '<< Back' : 'Back'}
          </div>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: isJoyride ? 3 : 6,
              fontSize: 11,
              fontWeight: 600,
              color: isJoyride ? '#fff' : theme.bg,
              background: isJoyride ? '#818cf8' : theme.amber,
            }}
          >
            {isJoyride ? 'Next >>' : 'Next →'}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ComparisonCard: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: '#08080a',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fontBody,
        gap: 32,
        padding: 48,
      }}
    >
      {/* Left side: Joyride */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
        <div
          style={{
            fontSize: 22,
            fontFamily: fontDisplay,
            color: '#ef4444',
            textAlign: 'center',
          }}
        >
          React Joyride
        </div>
        <div
          style={{
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
            height: 320,
            position: 'relative',
          }}
        >
          <MockSidebar variant="joyride" />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            fontSize: 11,
            color: theme.textSecondary,
            fontFamily: fontMono,
          }}
        >
          <span>mix-blend-mode</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span>~30KB</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span style={{ color: '#ef4444' }}>Broken on React 19</span>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 360,
          background: 'rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      />

      {/* Right side: react-tourlight */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
        <div
          style={{
            fontSize: 22,
            fontFamily: fontDisplay,
            color: theme.amber,
            textAlign: 'center',
          }}
        >
          react-tourlight
        </div>
        <div
          style={{
            borderRadius: 12,
            overflow: 'hidden',
            border: `1px solid ${theme.borderAccent}`,
            height: 320,
            position: 'relative',
          }}
        >
          <MockSidebar variant="tourlight" />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            fontSize: 11,
            color: theme.textSecondary,
            fontFamily: fontMono,
          }}
        >
          <span>clip-path</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span>~5KB</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span style={{ color: theme.green }}>React 19 compatible</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
