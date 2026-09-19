import * as React from 'react';
import {Modal, Pressable, ScrollView, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Text} from '@/components/ui/text';
import {BackIcon} from '@/lib/icons';

type Props = {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  /**
   * Rendered above the page inside its window — e.g. the reader, which would
   * otherwise open underneath this Modal.
   */
  overlay?: React.ReactNode;
};


export function DetailScreen({title, onBack, children, overlay}: Props) {
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onBack}
      statusBarTranslucent>
      <SafeAreaView className="flex-1 bg-background">
        {/* Three columns so the centred title can never overlap the button. */}
        <View className="h-14 flex-row items-center border-b border-border px-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onBack}
            className="h-12 w-12 items-center justify-center rounded-full active:opacity-60">
            <BackIcon size={26} className="text-foreground" />
          </Pressable>
          <Text
            role="heading"
            className="flex-1 text-center text-[19px] font-semibold">
            {title}
          </Text>
          <View className="w-12" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-9 px-6 pb-12 pt-8"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
      {overlay}
    </Modal>
  );
}
