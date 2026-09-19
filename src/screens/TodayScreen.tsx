import * as React from 'react';
import {Pressable, View} from 'react-native';

import {Drawer} from '@/components/drawer/Drawer';
import {MenuButton} from '@/components/drawer/MenuButton';
import {Screen} from '@/components/layout';
import {ConnectSources} from '@/components/today/ConnectSources';
import {NotificationPrompt} from '@/components/notifications/NotificationPrompt';
import {DeckEnd} from '@/components/today/DeckEnd';
import {SwipeDeck, type SwipeDeckControls} from '@/components/today/SwipeDeck';
import {Text} from '@/components/ui/text';
import {formatShortDate} from '@/lib/date';
import {BackIcon, ChevronRightIcon} from '@/lib/icons';
import {cn} from '@/lib/utils';
import {useDeck} from '@/lib/deck';
import {useNavigation} from '@/lib/navigation';
import {useReader} from '@/lib/reader';
import {useSources} from '@/lib/sources';

export function TodayScreen() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const {openDetail, setTab} = useNavigation();
  const {sources, loading: sourcesLoading, add} = useSources();
  const deck = useDeck();
  const reader = useReader();
  const arrival = React.useRef<'promote' | 'back' | 'none'>('none');
  const controls = React.useRef<SwipeDeckControls | null>(null);

  // Nothing connected yet — the first-run state.
  if (!sourcesLoading && sources.length === 0) {
    return (
      <ConnectSources
        onSetUpAddress={() => openDetail('forwarding')}
        onUseRss={() => {}}
        onAddFeed={add}
      />
    );
  }

  const {state, current, next, previous} = deck;
  const firstLoad = deck.loading && !state.loaded;
  const total = state.cards.length;

  const pass = () => {
    arrival.current = 'promote';
    deck.pass();
  };
  const skip = () => {
    arrival.current = 'promote';
    deck.skip();
  };
  const back = () => {
    arrival.current = 'back';
    deck.back();
  };

  return (
    <>
      <Screen
        title="Today"
        leading={<MenuButton onPress={() => setMenuOpen(true)} />}
        trailing={
          <Text className="text-[19px] text-muted-foreground">
            {formatShortDate(new Date())}
          </Text>
        }>
        {state.loaded ? <NotificationPrompt /> : null}
        <View className="flex-1 px-5 pb-3">
          {firstLoad || sourcesLoading ? (
            <CardPlaceholder />
          ) : current ? (
            <SwipeDeck
              current={current}
              next={next}
              index={state.index}
              total={total}
              readIds={state.read}
              arrival={arrival.current}
              controls={controls}
              onPass={pass}
              onNext={skip}
              onRead={card => reader.open(card.id)}
              onLike={deck.toggleLike}
              onSave={deck.toggleSave}
              onPlay={deck.playTapped}
            />
          ) : (
            <DeckEnd
              state={state}
              loading={deck.loading}
              error={deck.error}
              canGoBack={Boolean(previous)}
              onBack={back}
              onRefresh={deck.reload}
              onReviewSenders={() => setTab('Sources')}
            />
          )}
        </View>

        {/* Arrows for testing on the emulator, where dragging is awkward. */}
        {!firstLoad && state.cards.length > 0 ? (
          <View className="flex-row items-center gap-3 px-5 pb-3">
            <ArrowButton label="Previous card" disabled={!previous} onPress={back}>
              <BackIcon size={24} className={previous ? 'text-foreground' : 'text-muted-foreground'} />
            </ArrowButton>
            <Text className="flex-1 text-center text-[13px] text-muted-foreground">
              {current ? 'Swipe left to pass · right for next' : 'End of the deck'}
            </Text>
            <ArrowButton
              label="Next card"
              disabled={!current}
              onPress={() => (controls.current ? controls.current.next() : skip())}>
              <ChevronRightIcon size={24} className={current ? 'text-foreground' : 'text-muted-foreground'} />
            </ArrowButton>
          </View>
        ) : null}
      </Screen>

      {menuOpen && <Drawer onClose={() => setMenuOpen(false)} />}
    </>
  );
}

function ArrowButton({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      className={cn(
        'h-12 w-12 items-center justify-center rounded-full border border-border bg-card active:opacity-70',
        disabled && 'opacity-40',
      )}>
      {children}
    </Pressable>
  );
}

/** The card's footprint while the first deck is dealt, so nothing jumps when it lands. */
function CardPlaceholder() {
  return (
    <View className="flex-1 rounded-[28px] border border-border bg-card px-7 pt-7">
      <View className="h-3 w-40 rounded-full bg-secondary" />
      <View className="flex-1 justify-center gap-3">
        <View className="h-8 w-[88%] rounded-lg bg-secondary" />
        <View className="h-8 w-[70%] rounded-lg bg-secondary" />
        <View className="my-5 h-[2px] w-12 rounded-full bg-primary/40" />
        <View className="h-4 w-[92%] rounded-full bg-secondary/80" />
        <View className="h-4 w-[84%] rounded-full bg-secondary/80" />
        <View className="h-4 w-[60%] rounded-full bg-secondary/80" />
      </View>
      <Text className="pb-6 text-center font-serif text-[17px] text-muted-foreground">
        Dealing today's cards…
      </Text>
    </View>
  );
}
