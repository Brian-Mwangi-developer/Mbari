import * as React from 'react';
import {Pressable, StyleSheet, View, type LayoutChangeEvent} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {Pause, Play} from 'lucide-react-native';

import {wave} from '@/components/brand/Tilde';
import {Text} from '@/components/ui/text';
import {useTheme} from '@/lib/theme';
import {cn} from '@/lib/utils';

type Props = {
  /** Length as m:ss. */
  duration: string;
  /** Where it starts, 0 to 1. */
  initial?: number;
  small?: boolean;
};

function seconds(duration: string): number {
  const [m, s] = duration.split(':').map(Number);
  return m * 60 + s;
}

/** Length of one of our waves, measured the way it is drawn. */
function waveLength(width: number, amp: number, steps = 90, periods = 3): number {
  let len = 0;
  let px = 0;
  let py = 0;
  for (let i = 1; i <= steps; i++) {
    const x = (width * i) / steps;
    const y = -amp * Math.sin((2 * Math.PI * periods * i) / steps);
    len += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return len;
}

function clock(total: number): string {
  const s = Math.round(total);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * The voice message player. The progress bar is the tilde, filling with the
 * accent as it plays. No audio yet: it plays through its length silently so
 * the screen behaves as it will.
 */
export function AudioPlayer({duration, initial = 0, small = false}: Props) {
  const theme = useTheme();
  const total = seconds(duration);
  const [progress, setProgress] = React.useState(initial);
  const [playing, setPlaying] = React.useState(false);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    if (!playing) {
      return;
    }
    const step = 0.25 / total;
    const timer = setInterval(() => {
      setProgress(p => {
        if (p + step >= 1) {
          setPlaying(false);
          return 1;
        }
        return p + step;
      });
    }, 250);
    return () => clearInterval(timer);
  }, [playing, total]);

  const toggle = () => {
    if (!playing && progress >= 1) {
      setProgress(0);
    }
    setPlaying(p => !p);
  };

  const amp = small ? 5 : 7;
  const h = amp * 2 + 8;
  const path = width > 0 ? wave(width - 8, amp, 90, 3) : '';
  const length = width > 0 ? waveLength(width - 8, amp) : 0;
  const size = small ? 38 : 52;
  const Icon = playing ? Pause : Play;

  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pause' : 'Play'}
        onPress={toggle}
        style={{width: size, height: size}}
        className="items-center justify-center rounded-full bg-primary active:opacity-80">
        <Icon size={small ? 15 : 20} color={theme.primaryForeground} fill={theme.primaryForeground} style={playing ? undefined : styles.nudge} />
      </Pressable>
      <View className="flex-1" onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 ? (
          <Svg width={width} height={h} viewBox={`-4 ${-h / 2} ${width} ${h}`}>
            <Path d={path} stroke={theme.surface} strokeWidth={small ? 5 : 6} strokeLinecap="round" fill="none" />
            {progress > 0 ? (
              <Path
                d={path}
                stroke={theme.clay}
                strokeWidth={small ? 5 : 6}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={[length * progress, length + 20]}
              />
            ) : null}
          </Svg>
        ) : (
          <View style={{height: h}} />
        )}
        <Text className={cn('self-end font-medium text-muted-foreground', small ? 'text-[11px]' : 'text-[12px]')}>
          {progress > 0 ? `${clock(total * progress)} / ${duration}` : duration}
        </Text>
      </View>
    </View>
  );
}

// A play triangle looks off-centre when centred by its box.
const styles = StyleSheet.create({nudge: {marginLeft: 2}});
