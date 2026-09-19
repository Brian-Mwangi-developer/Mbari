import * as React from 'react';

type State<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

/**
 * Run an async fetch and track its state, discarding results from a call that
 * has been superseded (or unmounted) so a slow response can't overwrite newer
 * data.
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
): State<T> & {reload: () => void} {
  const [state, setState] = React.useState<State<T>>({
    data: null,
    error: null,
    loading: true,
  });
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setState(prev => ({...prev, loading: true, error: null}));

    fetcher().then(
      data => {
        if (active) {
          setState({data, error: null, loading: false});
        }
      },
      (error: unknown) => {
        if (active) {
          setState({
            data: null,
            error: error instanceof Error ? error.message : 'Something went wrong.',
            loading: false,
          });
        }
      },
    );

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = React.useCallback(() => setNonce(n => n + 1), []);

  return {...state, reload};
}
