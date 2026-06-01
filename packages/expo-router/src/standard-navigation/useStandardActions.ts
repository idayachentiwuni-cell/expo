import { useMemo } from 'react';
import { type NavigatorArgs, type NavigatorEventMapBase } from 'standard-navigation';

import type { StandardNavigationAction } from './index';

type StandardActionHelpers = NavigatorArgs<Record<string, never>, NavigatorEventMapBase>['actions'];

export function useStandardActions(navigation: {
  dispatch: (action: StandardNavigationAction) => void;
}): StandardActionHelpers {
  return useMemo<StandardActionHelpers>(
    () => ({
      back: () => {
        navigation.dispatch({ type: 'GO_BACK' } satisfies StandardNavigationAction);
      },
      navigate: (name, params) => {
        navigation.dispatch({
          type: 'NAVIGATE',
          payload: { name, params },
        } satisfies StandardNavigationAction);
      },
    }),
    [navigation]
  );
}
