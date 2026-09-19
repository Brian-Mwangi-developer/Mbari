import * as React from 'react';

import {AddButton} from '@/components/AddButton';

export function AddFeedButton({onPress}: {onPress: () => void}) {
  return <AddButton label="Add a feed" onPress={onPress} />;
}
