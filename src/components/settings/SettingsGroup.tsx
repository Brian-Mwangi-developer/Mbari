import * as React from 'react';
import {View} from 'react-native';

/** Card that hairline-divides whatever rows are placed inside it. */
export function SettingsGroup({children}: {children: React.ReactNode}) {
  const rows = React.Children.toArray(children);
  return (
    <View className="overflow-hidden rounded-lg border border-border bg-card">
      {rows.map((row, index) => (
        <View
          key={index}
          className={index > 0 ? 'border-t border-border' : undefined}>
          {row}
        </View>
      ))}
    </View>
  );
}
