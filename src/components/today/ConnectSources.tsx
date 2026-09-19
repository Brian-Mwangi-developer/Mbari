import * as React from 'react';
import {View} from 'react-native';

import {Mark} from '@/components/brand/Mark';
import {AddFeedSheet} from '@/components/sources/AddFeedSheet';
import {Button} from '@/components/ui/button';
import {Text} from '@/components/ui/text';

type Props = {
  onSetUpAddress: () => void;
  onUseRss: () => void;
  /** Adds a source from a pasted URL; resolves once the backend accepted it. */
  onAddFeed: (url: string) => Promise<void>;
};

/** First-run state of Today: nothing is connected yet. */
export function ConnectSources({onSetUpAddress, onUseRss, onAddFeed}: Props) {
  const [adding, setAdding] = React.useState(false);

  return (
    <View className="flex-1 justify-center px-6 pb-32">
      <Mark width={56} />

      <Text className="mt-8 font-serif text-[23px] leading-[36px] text-foreground/75">
        Point your newsletters here. Each day Mbari reads all of them and
        hands you the one worth your time.
      </Text>

      <View className="mt-8 h-px w-[72px] bg-border" />

      <View className="mt-10 gap-1">
        <Button size="lg" className="h-14 rounded-xl" onPress={onSetUpAddress}>
          <Text className="text-xl font-semibold">Set up my address</Text>
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="h-14 rounded-xl"
          onPress={() => {
            onUseRss();
            setAdding(true);
          }}>
          <Text className="text-lg font-medium text-foreground/80">
            I use RSS
          </Text>
        </Button>
      </View>

      <AddFeedSheet
        visible={adding}
        onClose={() => setAdding(false)}
        onSubmit={onAddFeed}
      />
    </View>
  );
}
