import * as React from 'react';
import {Pressable, View} from 'react-native';
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';

import type {DeckCard} from '@/api';
import {Text} from '@/components/ui/text';
import {useAppearance} from '@/lib/appearance';
import {LikeIcon, PlayIcon, SaveIcon} from '@/lib/icons';
import {THEME} from '@/lib/theme';
import {cn} from '@/lib/utils';

type Props = {
  card: DeckCard;
  /** Position in this session's deck, from 0. */
  index: number;
  total: number;
  read: boolean;
  /** Behind the top card: drawn, but not interactive. */
  inert?: boolean;
  onRead?: () => void;
  onLike?: () => void;
  onSave?: () => void;
  onPlay?: () => void;
};

/** Long titles step down a size rather than shrink to fit, so every line keeps its leading. */
function titleClass(title: string): string {
  if (title.length > 95) {
    return 'text-[26px] leading-[32px]';
  }
  if (title.length > 60) {
    return 'text-[30px] leading-[36px]';
  }
  return 'text-[34px] leading-[40px]';
}

/**
 * One card of the Today deck: the piece, why it is worth the time, and what
 * to do with it. Save sits on the left, Like on the right, so both are under
 * a thumb without reaching.
 */
export function DeckCardFace({card, index, total, read, inert = false, onRead, onLike, onSave, onPlay}: Props) {
  const {resolved} = useAppearance();
  const theme = THEME[resolved];
  const [soon, setSoon] = React.useState(false);

  React.useEffect(() => {
    if (!soon) {
      return;
    }
    const timer = setTimeout(() => setSoon(false), 2200);
    return () => clearTimeout(timer);
  }, [soon]);

  const byline = card.author && card.author !== card.source ? `${card.source} · ${card.author}` : card.source;

  return (
    <View
      pointerEvents={inert ? 'none' : 'auto'}
      className="flex-1 overflow-hidden rounded-[28px] border border-border bg-card">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${card.title}, from ${card.source}. Read`}
        onPress={onRead}
        className="flex-1 px-7 pt-7 active:opacity-90">
        <View className="flex-row items-center gap-4">
          <Text
            numberOfLines={1}
            className="flex-1 text-[12px] font-semibold uppercase tracking-[2px] text-muted-foreground">
            {byline}
          </Text>
          <Text
            className="text-[13px] font-medium text-muted-foreground"
            style={{fontVariant: ['tabular-nums']}}>
            {index + 1} of {Math.max(total, index + 1)}
          </Text>
        </View>

        <View className="flex-1 justify-center py-5">
          <Text
            role="heading"
            numberOfLines={5}
            className={cn('font-serif font-medium tracking-tight', titleClass(card.title))}>
            {card.title}
          </Text>
          <View className="my-6 h-[2px] w-12 rounded-full bg-primary" />
          <Text numberOfLines={6} className="font-serif text-[19px] leading-[29px] text-foreground/75">
            {card.why}
          </Text>
        </View>

        <View className="flex-row flex-wrap items-center gap-2 pb-5">
          {card.topics.map(topic => (
            <View key={topic} className="rounded-full bg-secondary px-3 py-1.5">
              <Text className="text-[12px] font-medium text-foreground/70">{topic}</Text>
            </View>
          ))}
          <Text className="ml-auto text-[13px] text-muted-foreground">
            {card.readMinutes} min{read ? ' · Opened' : ''}
          </Text>
        </View>
      </Pressable>

      {soon ? (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(200)}
          pointerEvents="none"
          className="absolute bottom-[92px] self-center rounded-full bg-foreground px-4 py-2">
          <Text className="text-[13px] font-medium text-background">Listening arrives soon</Text>
        </Animated.View>
      ) : null}

      <View className="flex-row items-center gap-3 border-t border-border px-5 py-4">
        <RoundButton
          label={card.saved ? 'Saved. Remove from saved' : 'Save for later'}
          selected={card.saved}
          onPress={onSave}>
          <SaveIcon size={21} color={card.saved ? theme.primary : theme.mutedForeground} fill={card.saved ? theme.primary : 'transparent'} />
        </RoundButton>

        <RoundButton
          label="Listen"
          accent
          onPress={() => {
            setSoon(true);
            onPlay?.();
          }}>
          {/* Nudged right: a play triangle looks off-centre when centred by its box. */}
          <View className="ml-0.5">
            <PlayIcon size={19} color={theme.primary} fill={theme.primary} />
          </View>
        </RoundButton>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={read ? 'Keep reading' : 'Read'}
          onPress={onRead}
          className="h-[52px] flex-1 items-center justify-center rounded-full bg-primary active:opacity-85">
          <Text className="text-[17px] font-semibold text-primary-foreground">{read ? 'Keep reading' : 'Read'}</Text>
        </Pressable>

        <RoundButton label={card.liked ? 'Liked. Remove like' : 'Like'} selected={card.liked} onPress={onLike}>
          <LikeIcon size={21} color={card.liked ? theme.primary : theme.mutedForeground} fill={card.liked ? theme.primary : 'transparent'} />
        </RoundButton>
      </View>
    </View>
  );
}

function RoundButton({
  label,
  selected = false,
  accent = false,
  onPress,
  children,
}: {
  label: string;
  selected?: boolean;
  accent?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{selected}}
      onPress={onPress}
      hitSlop={6}
      className={cn(
        'h-[52px] w-[52px] items-center justify-center rounded-full border active:opacity-70',
        selected || accent ? 'border-primary/60' : 'border-border',
        selected && 'bg-primary/10',
      )}>
      {children}
    </Pressable>
  );
}
