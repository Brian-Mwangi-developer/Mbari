import * as React from 'react';
import {Pressable, ScrollView, View} from 'react-native';
import {Bell, ChevronRight, Globe, LogOut, MapPin, Moon, PhoneCall, Sun, type LucideIcon} from 'lucide-react-native';

import {Avatar, CountyPicker, Kicker, ListCard, TabHeader} from '@/components/mbari/parts';
import {Text} from '@/components/ui/text';
import {APPROVER} from '@/data/static';
import {useAppearance, type Appearance} from '@/lib/appearance';
import {useCommunity} from '@/lib/community';
import {useSession} from '@/lib/session';
import {useTheme} from '@/lib/theme';

const NEXT_APPEARANCE: Record<Appearance, Appearance> = {system: 'light', light: 'dark', dark: 'system'};
const APPEARANCE_LABEL: Record<Appearance, string> = {system: 'System', light: 'Light', dark: 'Dark'};

/** Settings: your county, language and topics; calls; the app. */
export function SettingsScreen() {
  const {county} = useCommunity();
  const {appearance, setAppearance} = useAppearance();
  const {account, signOut} = useSession();
  const [picking, setPicking] = React.useState(false);
  const name = account?.name && account.name !== 'You' ? account.name : APPROVER.name;

  return (
    <ScrollView className="flex-1" contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
      <TabHeader kicker="Your account" title="Settings" />
      <View className="px-4">
        <View className="mb-2 flex-row items-center gap-3 rounded-[22px] border border-border bg-card px-4 py-4">
          <Avatar initials={APPROVER.initials} size={46} />
          <View className="flex-1">
            <Text className="text-[16px] font-semibold">{name}</Text>
            <Text className="text-[13px] text-muted-foreground">Approver · Kiambu Farmers Network</Text>
          </View>
        </View>

        <Kicker className="mb-2 ml-1 mt-5">Your community</Kicker>
        <ListCard>
          <Row icon={MapPin} label="County" value={county} onPress={() => setPicking(true)} />
          <Row icon={Globe} label="Voice language" value="Gĩkũyũ" />
          <Row icon={Bell} label="Topics" value="5" />
        </ListCard>

        <Kicker className="mb-2 ml-1 mt-5">Calls</Kicker>
        <ListCard>
          <Row icon={PhoneCall} label="Approver" value="You" />
          <Row icon={Moon} label="Quiet hours" value="9 pm – 7 am" />
        </ListCard>

        <Kicker className="mb-2 ml-1 mt-5">App</Kicker>
        <ListCard>
          <Row
            icon={Sun}
            label="Appearance"
            value={APPEARANCE_LABEL[appearance]}
            onPress={() => setAppearance(NEXT_APPEARANCE[appearance])}
          />
          <Row icon={LogOut} label="Sign out" onPress={() => signOut().catch(() => {})} />
        </ListCard>
      </View>
      <CountyPicker open={picking} onClose={() => setPicking(false)} />
    </ScrollView>
  );
}

function Row({icon: Icon, label, value, onPress}: {icon: LucideIcon; label: string; value?: string; onPress?: () => void}) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="min-h-[56px] flex-row items-center gap-3.5 py-3 active:opacity-70">
      <Icon size={20} color={theme.mutedForeground} strokeWidth={2} />
      <Text className="flex-1 text-[15.5px] font-semibold">{label}</Text>
      {value ? <Text className="text-[14px] text-muted-foreground">{value}</Text> : null}
      <ChevronRight size={18} color={theme.mutedForeground} />
    </Pressable>
  );
}
