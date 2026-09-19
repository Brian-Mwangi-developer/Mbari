import * as React from 'react';
import {ActivityIndicator, Modal, Pressable, View} from 'react-native';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Text} from '@/components/ui/text';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (url: string) => Promise<void>;
};

/**
 * Paste anything — a blog URL, a Substack homepage, a raw feed address. The
 * backend runs autodiscovery, so the user never has to find the /feed path.
 */
export function AddFeedSheet({visible, onClose, onSubmit}: Props) {
  const [url, setUrl] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reset = () => {
    setUrl('');
    setError(null);
    setBusy(false);
  };

  const submit = async () => {
    const value = url.trim();
    if (!value || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(value);
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add that source.');
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="rounded-t-2xl border-t border-border bg-background px-6 pb-10 pt-7"
          onPress={event => event.stopPropagation()}>
          <Text className="font-serif text-[26px] leading-[32px]">Add a source</Text>
          <Text className="mt-2 text-[15px] leading-[22px] text-muted-foreground">
            A blog, a Substack, or a feed URL. Mbari finds the feed itself.
          </Text>

          <Input
            placeholder="stratechery.com"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!busy}
            onSubmitEditing={submit}
            className="mt-6 h-14 rounded-xl text-[17px]"
          />

          {error && <Text className="mt-3 text-[15px] text-destructive">{error}</Text>}

          <Button
            size="lg"
            className="mt-5 h-14 rounded-xl"
            disabled={!url.trim() || busy}
            onPress={submit}>
            {busy ? <ActivityIndicator /> : <Text className="text-xl font-semibold">Add</Text>}
          </Button>
          <View className="h-1" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
