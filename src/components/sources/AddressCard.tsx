import * as React from 'react';
import {Clipboard, Pressable, View} from 'react-native';

import {Text} from '@/components/ui/text';
import {CheckIcon, CopyIcon} from '@/lib/icons';

const COPIED_FEEDBACK_MS = 2000;

export function AddressCard({address}: {address: string}) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = () => {
    // TODO: swap for @react-native-clipboard/clipboard at the next native build;
    // RN's own Clipboard is deprecated but saves a Gradle rebuild for now.
    Clipboard.setString(address);
    setCopied(true);
  };

  const Icon = copied ? CheckIcon : CopyIcon;

  return (
    <View className="rounded-lg border border-border bg-card px-5 pb-5 pt-6">
      <Text
        selectable
        className="font-mono text-[19px] leading-[26px] tracking-tight">
        {address}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copied ? 'Address copied' : 'Copy address'}
        onPress={copy}
        className="mt-5 min-h-[48px] flex-row items-center gap-3 rounded-full border border-border px-5 active:opacity-70">
        <Icon size={19} className="text-muted-foreground" />
        <Text className="text-[17px] text-muted-foreground">
          {copied ? 'Copied' : 'Copy'}
        </Text>
      </Pressable>

      <Text className="mt-5 text-[14px] leading-[21px] text-muted-foreground">
        Subscribe with this address, or forward to it from your mail app.
      </Text>
    </View>
  );
}
