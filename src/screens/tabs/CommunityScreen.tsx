import * as React from 'react';
import {Pressable, ScrollView, View} from 'react-native';
import {ChevronRight, Plus, ShieldCheck} from 'lucide-react-native';

import {Avatar, Card, ListCard, LocationPill, Panel, PillButton, TabHeader} from '@/components/mbari/parts';
import {Text} from '@/components/ui/text';
import {GROUPS} from '@/data/static';
import {useCommunity} from '@/lib/community';
import {useTheme} from '@/lib/theme';

/** Community: the groups you send to in this county, and how consent works. */
export function CommunityScreen() {
  const {county} = useCommunity();
  const theme = useTheme();
  const groups = GROUPS.filter(g => g.county === county);
  const people = groups.reduce((sum, g) => sum + g.people, 0);

  return (
    <ScrollView className="flex-1" contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
      <TabHeader
        kicker={groups.length ? `${groups.length} ${groups.length === 1 ? 'group' : 'groups'} · ${people} people` : 'No groups yet'}
        title="Community"
        right={<LocationPill />}
      />
      <View className="gap-3 px-4">
        {groups.length ? (
          <ListCard>
            {groups.map(group => (
              <Pressable key={group.id} accessibilityRole="button" className="min-h-[72px] flex-row items-center gap-3 py-3.5 active:opacity-70">
                <Avatar initials={group.initials} size={42} />
                <View className="flex-1">
                  <Text className="text-[15.5px] font-semibold">{group.name}</Text>
                  <Text className="mt-0.5 text-[13px] text-muted-foreground">
                    {group.people} people · {group.language}
                  </Text>
                </View>
                <ChevronRight size={19} color={theme.mutedForeground} />
              </Pressable>
            ))}
          </ListCard>
        ) : (
          <Card className="px-6 py-8">
            <Text className="text-center font-serif text-[21px] font-medium">No groups in {county} yet</Text>
            <Text className="mt-2 text-center text-[15px] leading-[22px] text-muted-foreground">
              Add the people you want to reach, and they will get a call whenever you send an update.
            </Text>
          </Card>
        )}
        <Panel label="Consent" icon={ShieldCheck}>
          Everyone here agreed to be called. Pressing 9 on any call removes them straight away.
        </Panel>
        <PillButton label="Add people" icon={Plus} variant="line" block className="mt-3" />
      </View>
    </ScrollView>
  );
}
