import * as React from 'react';
import {ActivityIndicator, BackHandler, Linking, Pressable, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  ChevronLeft,
  CircleCheck,
  Clock,
  ExternalLink,
  FileText,
  Fingerprint,
  Globe,
  Plus,
  Send,
  Sparkles,
  TriangleAlert,
} from 'lucide-react-native';

import * as api from '@/api';
import type {AlertEvidence} from '@/api';
import {Card, Kicker, Panel, PillButton} from '@/components/mbari/parts';
import {Text} from '@/components/ui/text';
import type {Alert} from '@/data/static';
import {formatFetchedTime, shortHash} from '@/lib/alerts';
import {useAppearance} from '@/lib/appearance';
import {useCommunity} from '@/lib/community';
import {useNavigation} from '@/lib/navigation';
import {useTheme} from '@/lib/theme';
import {cn} from '@/lib/utils';

type Evidence = {status: 'loading'} | {status: 'ready'; data: AlertEvidence} | {status: 'error'; message: string};

/**
 * One alert, read in full before anything is sent: what the AI wrote, the
 * government page's own words beside it, and the page itself one tap away.
 */
export function AlertScreen({alertId}: {alertId: string}) {
  const {alerts} = useCommunity();
  const {closeAlert, openSend} = useNavigation();
  const {resolved} = useAppearance();
  const theme = useTheme();
  const alert = alerts.find(a => a.id === alertId);
  const [evidence, setEvidence] = React.useState<Evidence>({status: 'loading'});

  const load = React.useCallback(async () => {
    setEvidence({status: 'loading'});
    try {
      setEvidence({status: 'ready', data: await api.getAlertEvidence(alertId)});
    } catch (e) {
      setEvidence({status: 'error', message: e instanceof Error ? e.message : 'Could not load the source.'});
    }
  }, [alertId]);

  React.useEffect(() => {
    if (alert && !alert.sample) {
      load();
    }
    // Once per alert; `alert` changes identity on every refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertId, load]);

  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeAlert();
      return true;
    });
    return () => sub.remove();
  }, [closeAlert]);

  if (!alert) {
    return null;
  }

  const url = evidence.status === 'ready' ? evidence.data.url : alert.sourceUrl ?? `https://${alert.source}`;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          onPress={closeAlert}
          className="-ml-1 flex-row items-center gap-1 self-start py-3 active:opacity-60">
          <ChevronLeft size={22} color={theme.foreground} />
          <Text className="text-[15px] font-semibold">Home</Text>
        </Pressable>

        <Kicker className="mt-2">
          {alert.topic} · {alert.national ? 'National' : alert.county}
        </Kicker>
        <Text role="heading" className="mt-2 font-serif text-[28px] font-medium leading-[33px] tracking-tight">
          {alert.title}
        </Text>

        <View className="mt-5">
          <OriginNotice alert={alert} />
        </View>

        <Text className="mt-5 font-serif text-[18px] leading-[27px] text-foreground/85">{alert.summary}</Text>

        <View className="mt-5">
          <Panel label="What to do">{alert.action}</Panel>
        </View>

        {alert.sample ? null : <PageWords evidence={evidence} domain={alert.source} onRetry={load} />}

        <Kicker className="mb-2.5 mt-8">Source</Kicker>
        <SourceCard alert={alert} url={url} evidence={evidence.status === 'ready' ? evidence.data : null} />
      </ScrollView>

      <View className="border-t border-border px-5 pb-4 pt-3">
        <SendFooter alert={alert} onSend={() => openSend(alert.id)} />
      </View>
    </SafeAreaView>
  );
}

/** Says plainly who wrote the words above, so nobody forwards AI text unread. */
function OriginNotice({alert}: {alert: Alert}) {
  const theme = useTheme();
  if (alert.sample) {
    return (
      <View className="flex-row gap-3 rounded-[18px] border border-dashed border-border px-4 py-3.5">
        <FileText size={18} color={theme.mutedForeground} strokeWidth={2.2} />
        <View className="flex-1">
          <Text className="text-[15px] font-semibold">Sample content</Text>
          <Text className="mt-0.5 text-[14px] leading-[20px] text-muted-foreground">
            Shipped with the app to show how an update looks. It is not a real notice.
          </Text>
        </View>
      </View>
    );
  }
  if (!alert.aiGenerated) {
    return (
      <View className="flex-row gap-3 rounded-[18px] bg-secondary px-4 py-3.5">
        <FileText size={18} color={theme.mutedForeground} strokeWidth={2.2} />
        <View className="flex-1">
          <Text className="text-[15px] font-semibold">Copied from the page</Text>
          <Text className="mt-0.5 text-[14px] leading-[20px] text-muted-foreground">
            These are the lines the page added. No AI rewrote them.
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View
      accessibilityRole="alert"
      className="flex-row gap-3 rounded-[18px] border border-primary/40 bg-primary/10 px-4 py-3.5">
      <Sparkles size={18} color={theme.primary} strokeWidth={2.2} />
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-primary">Written by AI: check it before you send</Text>
        <Text className="mt-0.5 text-[14px] leading-[20px] text-foreground/80">
          Mbarĩ summarised this from a government page. AI can misread a page. Compare it with the page's own words below,
          or open the page, then decide.
        </Text>
      </View>
    </View>
  );
}

/** The government page's own text: lines that back the summary, and what the latest change added. */
function PageWords({evidence, domain, onRetry}: {evidence: Evidence; domain: string; onRetry: () => void}) {
  const theme = useTheme();

  if (evidence.status === 'loading') {
    return (
      <View className="mt-8 flex-row items-center gap-2">
        <ActivityIndicator color={theme.mutedForeground} />
        <Text className="text-[14px] text-muted-foreground">Loading what the page says…</Text>
      </View>
    );
  }
  if (evidence.status === 'error') {
    return (
      <View className="mt-8">
        <Kicker className="mb-2.5">What the page says</Kicker>
        <Text className="text-[14px] text-destructive">{evidence.message}</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} className="mt-2 self-start py-1 active:opacity-60">
          <Text className="text-[14px] font-semibold underline">Try again</Text>
        </Pressable>
      </View>
    );
  }

  const {quotes, added} = evidence.data;
  // Additions already shown as quotes are not repeated.
  const extra = added.filter(line => !quotes.some(q => q.text === line));

  return (
    <>
      <Kicker className="mb-2.5 mt-8">What the page says</Kicker>
      {quotes.length > 0 ? (
        <Card className="gap-3.5 px-4 py-4">
          {quotes.map(quote => (
            <QuoteLine key={quote.text} text={quote.text} url={quote.url} />
          ))}
          <Text className="text-[12.5px] text-muted-foreground">Exact text from {domain}, as fetched.</Text>
        </Card>
      ) : (
        <View className="flex-row gap-3 rounded-[18px] bg-secondary px-4 py-3.5">
          <TriangleAlert size={18} color={theme.mutedForeground} strokeWidth={2.2} />
          <Text className="flex-1 text-[14px] leading-[20px]">
            No line on the page matches this summary closely. Open the page and check it yourself before sending.
          </Text>
        </View>
      )}

      {extra.length > 0 ? (
        <>
          <Kicker className="mb-2.5 mt-6">What changed on the page</Kicker>
          <Card className="gap-2.5 px-4 py-4">
            {extra.map(line => (
              <View key={line} className="flex-row gap-2">
                <Plus size={15} color={theme.primary} strokeWidth={2.6} style={styles.plus} />
                <Text selectable className="flex-1 text-[14.5px] leading-[21px]">
                  {line}
                </Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </>
  );
}

/** Where it came from, when, and a way to check the page is the one we read. */
function SourceCard({alert, url, evidence}: {alert: Alert; url: string; evidence: AlertEvidence | null}) {
  const theme = useTheme();
  const [openError, setOpenError] = React.useState<string | null>(null);
  // The notice itself when the page links to it (often a PDF); otherwise the page we read.
  const notice = evidence?.itemUrl ?? null;
  const target = notice ?? url;

  const open = async (link: string) => {
    setOpenError(null);
    try {
      await Linking.openURL(link);
    } catch {
      setOpenError('No app on this phone can open the link.');
    }
  };

  return (
    <Card className="overflow-hidden">
      <View className="px-4 pb-4 pt-4">
        <View className="flex-row items-center gap-2.5">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <Globe size={17} color={theme.foreground} strokeWidth={2.1} />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-semibold">{evidence?.sourceName ?? alert.source}</Text>
            <Text className="text-[13px] text-muted-foreground">{alert.source}</Text>
          </View>
        </View>

        <LinkBox label={notice ? (isPdf(notice) ? 'The notice (PDF)' : 'The notice') : 'The page'} url={target} onOpen={open} />
        {notice ? <LinkBox label="Listed on" url={url} onOpen={open} quiet /> : null}

        <PillButton
          label={notice ? (isPdf(notice) ? 'Open the notice (PDF)' : 'Read the notice in full') : 'Read the full page'}
          icon={ExternalLink}
          variant="line"
          block
          onPress={() => open(target)}
          className="mt-3"
        />
        {openError ? <Text className="mt-2 text-[13px] text-destructive">{openError}</Text> : null}
      </View>

      {evidence ? (
        <View className="border-t border-border px-4 py-1">
          <Row label="Fetched" value={formatFetchedTime(evidence.fetchedAt)} />
          {evidence.previousCheckAt ? <Row label="Checked before" value={formatFetchedTime(evidence.previousCheckAt)} /> : null}
          <Row label="Summary by" value={evidence.aiGenerated ? 'AI, from the page (Firecrawl)' : "The page's own text"} />
          <View className="py-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Fingerprint size={14} color={theme.mutedForeground} strokeWidth={2.2} />
                <Text className="text-[13.5px] text-muted-foreground">Page fingerprint</Text>
              </View>
              <Text selectable className="font-mono text-[13px]">
                {shortHash(evidence.contentHash)}
              </Text>
            </View>
            <Text className="mt-1.5 text-[12.5px] leading-[18px] text-muted-foreground">
              A code unique to the page as we read it. If the page is edited, the code changes.
            </Text>
          </View>
        </View>
      ) : (
        <View className="border-t border-border px-4 py-3">
          <Row label="Fetched" value={alert.fetchedAt} last />
        </View>
      )}
    </Card>
  );
}

const isPdf = (link: string) => /\.pdf(\?|#|$)/i.test(link);

/** A labelled, tappable link, shown in full so the reader sees exactly where it goes. */
function LinkBox({label, url, onOpen, quiet}: {label: string; url: string; onOpen: (link: string) => void; quiet?: boolean}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${label}: ${url}`}
      accessibilityHint="Opens it in your browser"
      onPress={() => onOpen(url)}
      className={cn('mt-3 rounded-xl px-3.5 py-3 active:opacity-70', quiet ? 'border border-border' : 'bg-secondary')}>
      <Kicker>{label}</Kicker>
      <Text selectable className={cn('mt-1 text-[14px] leading-[20px] underline', quiet ? 'text-muted-foreground' : 'text-primary')}>
        {url}
      </Text>
    </Pressable>
  );
}

/** One line of the page in its own words; tapping it opens what the line links to. */
function QuoteLine({text, url}: {text: string; url: string | null}) {
  const theme = useTheme();
  const body = (
    <View className="border-l-[3px] border-primary/60 pl-3">
      <Text selectable className="text-[15px] leading-[22px]">
        “{text}”
      </Text>
      {url ? (
        <View className="mt-1 flex-row items-center gap-1">
          <ExternalLink size={12} color={theme.primary} strokeWidth={2.4} />
          <Text className="text-[12.5px] font-semibold text-primary">{isPdf(url) ? 'Open the notice (PDF)' : 'Open the notice'}</Text>
        </View>
      ) : null}
    </View>
  );
  if (!url) {
    return body;
  }
  return (
    <Pressable accessibilityRole="link" accessibilityHint="Opens the notice in your browser" onPress={() => Linking.openURL(url).catch(() => {})} className="active:opacity-70">
      {body}
    </Pressable>
  );
}

function Row({label, value, last}: {label: string; value: string; last?: boolean}) {
  return (
    <View className={cn('flex-row items-center justify-between gap-4 py-3', !last && 'border-b border-border')}>
      <Text className="text-[13.5px] text-muted-foreground">{label}</Text>
      <Text className="flex-1 text-right text-[13.5px] font-medium">{value}</Text>
    </View>
  );
}

function SendFooter({alert, onSend}: {alert: Alert; onSend: () => void}) {
  const theme = useTheme();
  if (alert.status === 'sent') {
    return (
      <View className="h-14 flex-row items-center justify-center gap-2">
        <CircleCheck size={20} color={theme.foreground} />
        <Text className="text-[16px] font-semibold">Sent to your community</Text>
      </View>
    );
  }
  if (alert.status === 'waiting') {
    return (
      <View className="h-14 flex-row items-center justify-center gap-2">
        <Clock size={20} color={theme.mutedForeground} />
        <Text className="text-[16px] font-semibold text-muted-foreground">Waiting for an approver</Text>
      </View>
    );
  }
  return <PillButton label="Send to community" icon={Send} size="lg" block onPress={onSend} />;
}

const styles = StyleSheet.create({plus: {marginTop: 3}});
