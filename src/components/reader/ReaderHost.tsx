import * as React from 'react';

import {ArticleReader} from '@/components/reader/ArticleReader';
import {useReader} from '@/lib/reader';

/** Mounts the reader above the app whenever an article is open. */
export function ReaderHost() {
  const {article, close} = useReader();
  if (!article) {
    return null;
  }
  return <ArticleReader key={article.id} article={article} onClose={close} />;
}
