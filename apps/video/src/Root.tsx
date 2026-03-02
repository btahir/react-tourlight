import { Composition } from 'remotion';
import { ComparisonCard } from './compositions/ComparisonCard';
import { HeroGif } from './compositions/HeroGif';
import { LaunchVideo } from './compositions/LaunchVideo';
import { SocialCard } from './compositions/SocialCard';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Hero GIF for README — 800×500, 30fps, ~4s */}
      <Composition
        id="HeroGif"
        component={HeroGif}
        durationInFrames={120}
        fps={30}
        width={800}
        height={500}
      />

      {/* Launch video — 1920×1080, 30fps, ~19s */}
      <Composition
        id="LaunchVideo"
        component={LaunchVideo}
        durationInFrames={570}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Comparison card for README — 1440×720, static */}
      <Composition
        id="ComparisonCard"
        component={ComparisonCard}
        durationInFrames={1}
        fps={1}
        width={1440}
        height={720}
      />

      {/* Social card / OG image — 1200×630, static */}
      <Composition
        id="SocialCard"
        component={SocialCard}
        durationInFrames={1}
        fps={1}
        width={1200}
        height={630}
      />
    </>
  );
};
