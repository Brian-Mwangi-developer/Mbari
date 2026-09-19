import * as React from 'react';
import {ActivityIndicator, Linking, Share, View} from 'react-native';

import * as api from '@/api';
import type {ForwardingRequest} from '@/api';
import {DetailScreen, Section} from '@/components/layout';
import {AddressCard} from '@/components/sources/AddressCard';
import {Button} from '@/components/ui/button';
import {Text} from '@/components/ui/text';
import {FORWARDING_POLL_MS, forwardingStage} from '@/lib/forwarding';
import {CheckIcon, ShareIcon} from '@/lib/icons';
import {useNavigation} from '@/lib/navigation';
import {useAsync} from '@/lib/use-async';

/**
 * Guided setup for forwarding existing newsletters from Gmail.
 *
 * Gmail's forwarding settings exist only on the desktop web, so the user
 * works through this with a computer open and the phone in hand. When Google
 * emails its confirmation to the Mbari address, this screen picks it up
 * within seconds and asks whether the mailbox is theirs.
 */
export function ForwardingSetupScreen() {
  const {closeDetail} = useNavigation();
  const address = useAsync(api.getAddress);
  const [dismissed, setDismissed] = React.useState<string[]>([]);
  const stage = forwardingStage(address.data, dismissed);

  // Keep checking only while waiting for Gmail's email to land.
  const {reload} = address;
  React.useEffect(() => {
    if (stage !== 'waiting' || !address.data) {
      return;
    }
    const timer = setInterval(reload, FORWARDING_POLL_MS);
    return () => clearInterval(timer);
  }, [stage, address.data, reload]);

  return (
    <DetailScreen title="Your address" onBack={closeDetail}>
      {address.loading && !address.data ? (
        <View className="items-center py-16">
          <ActivityIndicator />
        </View>
      ) : address.error && !address.data ? (
        <View className="gap-4">
          <Text className="font-serif text-[22px] leading-[32px]">{address.error}</Text>
          <Button variant="outline" className="h-12 self-start rounded-xl" onPress={reload}>
            <Text>Try again</Text>
          </Button>
        </View>
      ) : address.data ? (
        <>
          <Section title="1 · Your Mbari address">
            <AddressCard address={address.data.address} />
            <Text className="mt-4 text-[15px] leading-[23px] text-muted-foreground">
              For new newsletters, subscribe with this address directly and
              you're done. The steps below bring in the ones you already get
              in Gmail.
            </Text>
          </Section>

          <Section title="2 · Add it in Gmail">
            <Text className="text-[16px] leading-[25px]">
              On a computer, open Gmail →{' '}
              <Text className="font-semibold">Settings</Text> →{' '}
              <Text className="font-semibold">See all settings</Text> →{' '}
              <Text className="font-semibold">Forwarding and POP/IMAP</Text> →{' '}
              <Text className="font-semibold">Add a forwarding address</Text>,
              and paste your address.
            </Text>
            <Text className="mt-3 text-[15px] leading-[23px] text-muted-foreground">
              The Gmail app on your phone doesn't have this setting.
            </Text>
          </Section>

          <Section title="3 · Confirm it's you">
            <ConfirmStep
              stage={stage}
              request={address.data.forwarding}
              onDismiss={id => setDismissed(prev => [...prev, id])}
              onConfirmed={reload}
            />
          </Section>

          <Section title="4 · Send your newsletters">
            <FilterStep enabled={stage === 'confirmed'} />
          </Section>
        </>
      ) : null}
    </DetailScreen>
  );
}

function ConfirmStep({
  stage,
  request,
  onDismiss,
  onConfirmed,
}: {
  stage: ReturnType<typeof forwardingStage>;
  request: ForwardingRequest | null;
  onDismiss: (id: string) => void;
  onConfirmed: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (stage === 'waiting') {
    return (
      <View className="flex-row items-center gap-3 rounded-lg border border-border bg-card px-5 py-5">
        <ActivityIndicator />
        <Text className="flex-1 text-[16px] leading-[24px] text-muted-foreground">
          Waiting for Gmail. This updates by itself a few seconds after you
          add the address.
        </Text>
      </View>
    );
  }

  if (stage === 'confirmed' && request) {
    return (
      <View className="flex-row items-center gap-3 rounded-lg border border-border bg-card px-5 py-5">
        <CheckIcon size={22} className="text-primary" />
        <Text className="flex-1 text-[16px] leading-[24px]">
          Confirmed forwarding from{' '}
          <Text className="font-semibold">{request.requestedBy}</Text>.
        </Text>
      </View>
    );
  }

  if (!request) {
    return null;
  }

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const {confirmUrl} = await api.confirmForwarding(request.id);
      // Google finishes the confirmation on its own page.
      await Linking.openURL(confirmUrl);
      onConfirmed();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not confirm.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="rounded-lg border border-border bg-card px-5 pb-5 pt-6">
      <Text className="text-[17px] leading-[26px]">
        <Text className="font-semibold">{request.requestedBy}</Text> wants to
        forward its mail to your Mbari address.
      </Text>
      <Text className="mt-2 text-[15px] leading-[23px] text-muted-foreground">
        Only confirm if that's your Gmail. Anyone can ask to forward to an
        address, and confirming lets their mail into your picks.
      </Text>

      {error && <Text className="mt-3 text-[15px] text-destructive">{error}</Text>}

      <View className="mt-5 gap-1">
        <Button size="lg" className="h-14 rounded-xl" disabled={busy} onPress={confirm}>
          {busy ? (
            <ActivityIndicator />
          ) : (
            <Text className="text-lg font-semibold">Yes, that's mine</Text>
          )}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="h-14 rounded-xl"
          disabled={busy}
          onPress={() => onDismiss(request.id)}>
          <Text className="text-lg font-medium text-foreground/80">Not me</Text>
        </Button>
      </View>
    </View>
  );
}

function FilterStep({enabled}: {enabled: boolean}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const share = async () => {
    setBusy(true);
    setError(null);
    try {
      const {url} = await api.createGmailFilterLink('newsletters');
      await Share.share({
        message: `Mbari Gmail filter (link works for 15 minutes): ${url}`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the link.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <Text className="text-[16px] leading-[25px]">
        Share a filter file to your computer, then in Gmail open{' '}
        <Text className="font-semibold">Settings</Text> →{' '}
        <Text className="font-semibold">Filters and Blocked Addresses</Text> →{' '}
        <Text className="font-semibold">Import filters</Text>. It forwards
        anything with an unsubscribe link, and you choose here which senders
        to keep.
      </Text>

      {!enabled && (
        <Text className="mt-3 text-[15px] leading-[23px] text-muted-foreground">
          Gmail only accepts this filter after step 3 is confirmed.
        </Text>
      )}
      {error && <Text className="mt-3 text-[15px] text-destructive">{error}</Text>}

      <Button
        variant="outline"
        size="lg"
        className="mt-5 h-14 flex-row gap-3 rounded-xl"
        disabled={!enabled || busy}
        onPress={share}>
        {busy ? (
          <ActivityIndicator />
        ) : (
          <>
            <ShareIcon size={20} className="text-foreground" />
            <Text className="text-lg font-medium">Share filter file</Text>
          </>
        )}
      </Button>
    </View>
  );
}
