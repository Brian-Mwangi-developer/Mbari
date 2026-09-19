import * as React from 'react';
import {ActivityIndicator, Modal, Pressable, View, type ViewProps} from 'react-native';
import {Check, MapPin, type LucideIcon} from 'lucide-react-native';

import {Text} from '@/components/ui/text';
import {COUNTIES} from '@/data/static';
import {useCommunity} from '@/lib/community';
import {useTheme} from '@/lib/theme';
import {cn} from '@/lib/utils';

/** Small capitals label above titles and sections. */
export function Kicker({children, className}: {children: React.ReactNode; className?: string}) {
  return (
    <Text className={cn('text-[11px] font-semibold uppercase tracking-[1.6px] text-muted-foreground', className)}>
      {children}
    </Text>
  );
}

/** The top of a tab: a small label, a serif title, and something on the right. */
export function TabHeader({kicker, title, right}: {kicker: string; title: string; right?: React.ReactNode}) {
  return (
    <View className="flex-row items-end justify-between gap-3 px-5 pb-4 pt-5">
      <View className="flex-1">
        <Kicker>{kicker}</Kicker>
        <Text role="heading" className="mt-1.5 font-serif text-[36px] font-medium leading-[40px] tracking-tight">
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

/** The county picker, as a bottom sheet. */
export function CountyPicker({open, onClose}: {open: boolean; onClose: () => void}) {
  const {county, setCounty} = useCommunity();
  const theme = useTheme();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="rounded-t-[28px] bg-background px-5 pb-8 pt-4" onPress={() => {}}>
          <View className="mb-5 h-1 w-10 self-center rounded-full bg-border" />
          <Kicker>Your county</Kicker>
          <Text className="mb-4 mt-1 font-serif text-[28px] font-medium">Choose a county</Text>
          <Card className="px-4">
            {COUNTIES.map((name, index) => (
              <Pressable
                key={name}
                accessibilityRole="radio"
                accessibilityState={{checked: name === county}}
                onPress={() => {
                  setCounty(name);
                  onClose();
                }}
                className={cn('min-h-[54px] flex-row items-center justify-between py-3', index > 0 && 'border-t border-border')}>
                <Text className="text-[16px] font-semibold">{name}</Text>
                {name === county ? <Check size={20} color={theme.primary} strokeWidth={2.4} /> : null}
              </Pressable>
            ))}
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** The county pill. Tapping it opens the county picker. */
export function LocationPill() {
  const {county} = useCommunity();
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`County: ${county}. Change`}
        onPress={() => setOpen(true)}
        className="mb-1 flex-row items-center gap-1.5 rounded-full bg-secondary py-2 pl-3 pr-3.5 active:opacity-70">
        <MapPin size={15} color={theme.primary} strokeWidth={2.2} />
        <Text className="text-[13.5px] font-semibold">{county}</Text>
      </Pressable>
      <CountyPicker open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** A row of pills where one is chosen: filters, languages. */
export function ChoicePills<T extends string>({options, value, onChange}: {options: readonly T[]; value: T; onChange: (v: T) => void}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map(option => {
        const on = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{checked: on}}
            onPress={() => onChange(option)}
            className={cn('h-10 justify-center rounded-full px-4 active:opacity-70', on ? 'bg-foreground' : 'bg-secondary')}>
            <Text className={cn('text-[13.5px] font-semibold', on && 'text-background')}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A quiet surface panel with a small label: "What to do", "Consent". */
export function Panel({label, icon: Icon, children}: {label: string; icon?: LucideIcon; children: React.ReactNode}) {
  const theme = useTheme();
  return (
    <View className="rounded-[18px] bg-secondary px-4 py-3.5">
      <View className="flex-row items-center gap-1.5">
        {Icon ? <Icon size={14} color={theme.mutedForeground} strokeWidth={2.3} /> : null}
        <Kicker>{label}</Kicker>
      </View>
      <Text className="mt-1.5 text-[15px] leading-[22px]">{children}</Text>
    </View>
  );
}

export function Card({className, ...props}: ViewProps & {className?: string}) {
  return <View className={cn('rounded-[22px] border border-border bg-card', className)} {...props} />;
}

type ButtonProps = {
  label: string;
  icon?: LucideIcon;
  variant?: 'accent' | 'ink' | 'line';
  size?: 'md' | 'lg' | 'sm';
  block?: boolean;
  busy?: boolean;
  onPress?: () => void;
  className?: string;
  leading?: React.ReactNode;
};

/** The pill button: accent (maroon), ink (near-black), or an ink outline. */
export function PillButton({label, icon: Icon, variant = 'accent', size = 'md', block, busy, onPress, className, leading}: ButtonProps) {
  const theme = useTheme();
  const fg = variant === 'accent' ? theme.primaryForeground : variant === 'ink' ? theme.background : theme.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{busy, disabled: busy}}
      disabled={busy}
      onPress={onPress}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-full px-5 active:opacity-80',
        size === 'lg' ? 'h-14' : size === 'sm' ? 'h-10 px-4' : 'h-12',
        variant === 'accent' && 'bg-primary',
        variant === 'ink' && 'bg-foreground',
        variant === 'line' && 'border-[1.5px] border-foreground',
        block && 'w-full',
        className,
      )}>
      {busy ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {leading}
          {Icon ? <Icon size={size === 'sm' ? 16 : 18} color={fg} strokeWidth={2.2} /> : null}
          <Text
            numberOfLines={1}
            style={{color: fg}}
            className={cn('font-semibold', size === 'lg' ? 'text-[16.5px]' : size === 'sm' ? 'text-[14px]' : 'text-[15px]')}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/** A round outlined icon button, like the listen button on a card. */
export function RoundButton({icon: Icon, label, onPress}: {icon: LucideIcon; label: string; onPress?: () => void}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-12 w-12 items-center justify-center rounded-full border border-border active:opacity-70">
      <Icon size={21} color={theme.foreground} strokeWidth={2} />
    </Pressable>
  );
}

export function Avatar({initials, size = 38}: {initials: string; size?: number}) {
  return (
    <View style={{width: size, height: size}} className="items-center justify-center rounded-full bg-secondary">
      <Text className="text-[12.5px] font-bold">{initials}</Text>
    </View>
  );
}

/** A muted line with a small icon: where something came from. */
export function MetaLine({icon: Icon, children, className}: {icon: LucideIcon; children: React.ReactNode; className?: string}) {
  const theme = useTheme();
  return (
    <View className={cn('flex-row items-center gap-1.5', className)}>
      <Icon size={14} color={theme.mutedForeground} strokeWidth={2.2} />
      <Text className="flex-1 text-[12.5px] font-medium text-muted-foreground">{children}</Text>
    </View>
  );
}

/** A grouped list inside a card, with hairlines between rows. */
export function ListCard({children}: {children: React.ReactNode}) {
  const rows = React.Children.toArray(children);
  return (
    <Card className="px-4">
      {rows.map((row, index) => (
        <View key={index} className={cn(index > 0 && 'border-t border-border')}>
          {row}
        </View>
      ))}
    </Card>
  );
}
