import type React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { AppWindow } from '../components/AppWindow';
import { ContinuousSpotlight } from '../components/ContinuousSpotlight';
import { MockDashboard } from '../components/MockDashboard';
import { TypeWriter } from '../components/TypeWriter';
import { smoothEntry, snappyEntry } from '../lib/animations';
import { fontBody, fontDisplay, fontDisplayItalic, fontMono } from '../lib/fonts';
import { theme } from '../lib/theme';
import nightDrive from '../assets/night_drive.mp3';

/**
 * Launch video: 1920x1080, 30fps, ~20 seconds (600 frames).
 *
 * Scene 1 (0-2.5s/75f): Hero headline fade in
 * Scene 2 (2.5-6s/105f): Terminal install + code snippet
 * Scene 3 (6-12.5s/195f): Live spotlight demo on mock dashboard
 * Scene 4 (12.5-16s/105f): Comparison flash
 * Scene 5 (16-20s/120f): CTA with install command
 */

// ─── Scene 1: Hero Headline ──────────────────────────────────────────────────

const SceneHeadline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleEntry = spring({ frame, fps, config: smoothEntry, durationInFrames: 15 });
  const subtitleEntry = spring({ frame: frame - 10, fps, config: smoothEntry, durationInFrames: 15 });

  const titleOpacity = interpolate(titleEntry, [0, 1], [0, 1]);
  const titleY = interpolate(titleEntry, [0, 1], [30, 0]);
  const subOpacity = interpolate(subtitleEntry, [0, 1], [0, 1]);
  const subY = interpolate(subtitleEntry, [0, 1], [20, 0]);

  return (
    <AbsoluteFill
      style={{
        background: theme.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '25%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.amberGlow} 0%, transparent 70%)`,
          filter: 'blur(80px)',
          opacity: 0.4,
        }}
      />
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 80,
          fontFamily: fontDisplay,
          color: theme.textPrimary,
          textAlign: 'center',
          lineHeight: 0.95,
        }}
      >
        Onboarding tours
      </div>
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 80,
          fontFamily: fontDisplayItalic,
          fontStyle: 'italic',
          color: theme.amber,
          textAlign: 'center',
          lineHeight: 0.95,
        }}
      >
        that ship.
      </div>
      <div
        style={{
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
          fontSize: 22,
          fontFamily: fontBody,
          color: theme.textSecondary,
          textAlign: 'center',
          maxWidth: 500,
          marginTop: 16,
        }}
      >
        Zero dependencies. WCAG 2.1 AA. Under 5 kB.
        <br />
        The modern React tour library.
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Terminal Install ───────────────────────────────────────────────

const SceneInstall: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowEntry = spring({ frame, fps, config: snappyEntry, durationInFrames: 10 });
  const windowScale = interpolate(windowEntry, [0, 1], [0.95, 1]);
  const windowOpacity = interpolate(windowEntry, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: theme.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ transform: `scale(${windowScale})`, opacity: windowOpacity }}>
        <AppWindow title="terminal" width={700} height={200}>
          <div style={{ padding: 24, background: theme.bg }}>
            <TypeWriter
              text="npm install react-tourlight @floating-ui/react-dom"
              startFrame={8}
              charsPerFrame={2.4}
              fontSize={16}
            />
          </div>
        </AppWindow>

        {/* Code snippet below terminal */}
        <div style={{ marginTop: 24 }}>
          <AppWindow title="App.tsx" width={700} height={240}>
            <div style={{ padding: 20, background: theme.bg }}>
              <TypeWriter
                text={`import { SpotlightProvider, SpotlightTour } from 'react-tourlight'
import 'react-tourlight/styles.css'

const steps = [
  { target: '#welcome', title: 'Welcome!' },
  { target: '#features', title: 'Features' },
]`}
                startFrame={35}
                charsPerFrame={3}
                prefix=""
                fontSize={14}
                color={theme.textPrimary}
              />
            </div>
          </AppWindow>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Live Spotlight Demo ────────────────────────────────────────────

const DEMO_W = 900;
const DEMO_H = 540;

// Layout reference (content area = 900×504):
// Sidebar: 180px. Main starts x=181. Header: 48px. Content padding: 20px.
//   Stats row: (201, 69) → 679px wide, ~73px tall
//   Action buttons: (201, 158) → ~122px wide, ~32px tall
const demoSteps = [
  {
    target: { x: 0, y: 82, width: 180, height: 36 },
    tooltip: { x: 190, y: 78, title: 'Navigation', content: 'Browse your projects from the sidebar.' },
    from: 10,
    to: 58,
  },
  {
    target: { x: 200, y: 68, width: 681, height: 75 },
    tooltip: { x: 320, y: 150, title: 'Live metrics', content: 'Real-time stats update as your data changes.' },
    from: 62,
    to: 118,
  },
  {
    target: { x: 200, y: 156, width: 124, height: 34 },
    tooltip: { x: 340, y: 152, title: 'Quick actions', content: 'Create, import, and manage in one click.' },
    from: 122,
    to: 185,
  },
];

const SceneDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowEntry = spring({ frame, fps, config: snappyEntry, durationInFrames: 10 });
  const windowScale = interpolate(windowEntry, [0, 1], [0.95, 1]);
  const windowOpacity = interpolate(windowEntry, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: theme.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ transform: `scale(${windowScale})`, opacity: windowOpacity }}>
        <AppWindow title="My App — Dashboard" width={DEMO_W} height={DEMO_H}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <MockDashboard />
            <ContinuousSpotlight
              steps={demoSteps}
              containerWidth={DEMO_W}
              containerHeight={DEMO_H - 36}
              tooltipWidth={260}
            />
          </div>
        </AppWindow>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4: Comparison ─────────────────────────────────────────────────────

const ComparisonRow: React.FC<{
  label: string;
  ours: string;
  theirs: string;
  delay: number;
}> = ({ label, ours, theirs, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entry = spring({ frame: frame - delay, fps, config: snappyEntry, durationInFrames: 10 });
  const opacity = interpolate(entry, [0, 1], [0, 1]);
  const x = interpolate(entry, [0, 1], [20, 0]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: `1px solid ${theme.borderSubtle}`,
        opacity,
        transform: `translateX(${x}px)`,
        fontFamily: fontBody,
      }}
    >
      <span style={{ flex: 1, fontSize: 16, color: theme.textSecondary }}>{label}</span>
      <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: theme.amber }}>{ours}</span>
      <span style={{ flex: 1, fontSize: 16, color: theme.textSecondary }}>{theirs}</span>
    </div>
  );
};

const SceneComparison: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleEntry = spring({ frame, fps, config: smoothEntry, durationInFrames: 12 });
  const titleOpacity = interpolate(titleEntry, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: theme.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: 700 }}>
        <div
          style={{
            opacity: titleOpacity,
            fontSize: 40,
            fontFamily: fontDisplay,
            color: theme.textPrimary,
            marginBottom: 32,
          }}
        >
          See the difference.
        </div>

        {/* Column headers */}
        <div
          style={{
            display: 'flex',
            padding: '12px 0',
            borderBottom: `1px solid ${theme.borderAccent}`,
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            letterSpacing: 1,
            fontFamily: fontMono,
          }}
        >
          <span style={{ flex: 1, color: theme.textSecondary }}>Feature</span>
          <span style={{ flex: 1, color: theme.amber }}>react-tourlight</span>
          <span style={{ flex: 1, color: theme.textSecondary }}>Others</span>
        </div>

        <ComparisonRow label="React 19" ours="Fully compatible" theirs="Broken" delay={5} />
        <ComparisonRow label="Bundle size" ours="< 5 kB" theirs="15–50 kB" delay={8} />
        <ComparisonRow label="Dependencies" ours="0" theirs="5–15+" delay={11} />
        <ComparisonRow label="Accessibility" ours="WCAG 2.1 AA" theirs="Partial" delay={14} />
        <ComparisonRow label="License" ours="MIT" theirs="GPL / Paid" delay={17} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 5: CTA ────────────────────────────────────────────────────────────

const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleEntry = spring({ frame, fps, config: smoothEntry, durationInFrames: 15 });
  const titleOpacity = interpolate(titleEntry, [0, 1], [0, 1]);
  const titleY = interpolate(titleEntry, [0, 1], [20, 0]);

  const installEntry = spring({ frame: frame - 15, fps, config: snappyEntry, durationInFrames: 10 });
  const installOpacity = interpolate(installEntry, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: theme.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.amberGlow} 0%, transparent 70%)`,
          filter: 'blur(100px)',
          opacity: 0.3,
        }}
      />

      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontFamily: fontDisplay,
            color: theme.textPrimary,
            lineHeight: 1,
          }}
        >
          Ship onboarding
        </div>
        <div
          style={{
            fontSize: 64,
            fontFamily: fontDisplayItalic,
            fontStyle: 'italic',
            color: theme.amber,
            lineHeight: 1,
          }}
        >
          that converts.
        </div>
      </div>

      <div
        style={{
          opacity: installOpacity,
          marginTop: 16,
          padding: '14px 28px',
          borderRadius: 8,
          background: theme.surface,
          border: `1px solid ${theme.borderSubtle}`,
          fontFamily: fontMono,
          fontSize: 16,
          color: theme.textSecondary,
        }}
      >
        npm install react-tourlight
      </div>
    </AbsoluteFill>
  );
};

// ─── Main Composition ────────────────────────────────────────────────────────

export const LaunchVideo: React.FC = () => {
  return (
    <>
    <Audio src={nightDrive} volume={0.6} />
    <TransitionSeries>
      {/* Scene 1: Headline — 2.5s */}
      <TransitionSeries.Sequence durationInFrames={75}>
        <SceneHeadline />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 10 })}
      />

      {/* Scene 2: Install — 4.5s (linger on complete code) */}
      <TransitionSeries.Sequence durationInFrames={135}>
        <SceneInstall />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 10 })}
      />

      {/* Scene 3: Demo — 6.5s */}
      <TransitionSeries.Sequence durationInFrames={195}>
        <SceneDemo />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-right' })}
        timing={linearTiming({ durationInFrames: 10 })}
      />

      {/* Scene 4: Comparison — 3.5s */}
      <TransitionSeries.Sequence durationInFrames={105}>
        <SceneComparison />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 10 })}
      />

      {/* Scene 5: CTA — holds to end, no fade out */}
      <TransitionSeries.Sequence durationInFrames={130}>
        <SceneCTA />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    </>
  );
};
