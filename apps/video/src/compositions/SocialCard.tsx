import type React from 'react';
import { AbsoluteFill } from 'remotion';
import { fontBody, fontDisplay, fontDisplayItalic, fontMono } from '../lib/fonts';
import { theme } from '../lib/theme';

/**
 * Social card / OG image: 1200x630, static (1 frame).
 * Amber gradient glow, Instrument Serif branding, tagline + stats.
 */
export const SocialCard: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: theme.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fontBody,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow — top right */}
      <div
        style={{
          position: 'absolute',
          top: -100,
          right: -50,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.amber} 0%, transparent 70%)`,
          opacity: 0.15,
          filter: 'blur(60px)',
        }}
      />

      {/* Cool glow — bottom left */}
      <div
        style={{
          position: 'absolute',
          bottom: -100,
          left: -50,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)',
          opacity: 0.08,
          filter: 'blur(60px)',
        }}
      />

      {/* Package name */}
      <div
        style={{
          fontFamily: fontMono,
          fontSize: 14,
          color: theme.amber,
          letterSpacing: 2,
          textTransform: 'uppercase' as const,
          marginBottom: 20,
        }}
      >
        react-tourlight
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: 56,
          fontFamily: fontDisplay,
          color: theme.textPrimary,
          lineHeight: 1,
          textAlign: 'center',
        }}
      >
        Onboarding tours
      </div>
      <div
        style={{
          fontSize: 56,
          fontFamily: fontDisplayItalic,
          fontStyle: 'italic',
          color: theme.amber,
          lineHeight: 1,
          textAlign: 'center',
          marginTop: 4,
        }}
      >
        that ship.
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 18,
          color: theme.textSecondary,
          marginTop: 24,
          textAlign: 'center',
          maxWidth: 500,
          lineHeight: 1.5,
        }}
      >
        The modern React tour library. Beautiful by default, fully accessible, MIT licensed.
      </div>

      {/* Stats strip */}
      <div
        style={{
          display: 'flex',
          gap: 40,
          marginTop: 40,
          padding: '16px 0',
          borderTop: `1px solid ${theme.borderSubtle}`,
        }}
      >
        {[
          { value: '~5KB', label: 'gzipped' },
          { value: '0', label: 'dependencies' },
          { value: 'AA', label: 'WCAG 2.1' },
          { value: 'MIT', label: 'licensed' },
        ].map((stat) => (
          <div key={stat.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span
              style={{
                fontSize: 28,
                fontFamily: fontDisplay,
                color: theme.textPrimary,
                fontWeight: 400,
              }}
            >
              {stat.value}
            </span>
            <span style={{ fontSize: 13, color: theme.textSecondary }}>{stat.label}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
