import { Fragment } from 'react';
import { View } from 'react-native';
import { type NavigatorArgs } from 'standard-navigation';

import type { CommonNavigationAction, ParamListBase } from '../../react-navigation/core';
import {
  TabRouter,
  type TabActionType,
  type TabNavigationState,
  type TabRouterOptions,
} from '../../react-navigation/routers';
import { renderRouter } from '../../testing-library';
import { createStandardRouterNavigator } from '../index';

// Integration: useBuildHref through the real useStateForPath → getCachedRouteInfo pipeline, resolving
// hrefs for a real navigator's routes via renderRouter. Isolated nesting logic is unit-tested in
// useBuildHref.test.ios.tsx.
const contentSpy = jest.fn();

function NavigatorContent(args: NavigatorArgs<Record<string, never>, Record<string, never>>) {
  contentSpy(args);
  return (
    <>
      {args.state.routes.map((r) => (
        <Fragment key={r.key}>{args.descriptors[r.key]!.render()}</Fragment>
      ))}
    </>
  );
}

const StandardTabs = createStandardRouterNavigator<
  TabNavigationState<ParamListBase>,
  Record<string, never>,
  Record<string, never>,
  CommonNavigationAction | TabActionType,
  Record<string, never>,
  TabRouterOptions
>(NavigatorContent, TabRouter, { useOnlyUserDefinedScreens: true });

describe('useBuildHref (integration)', () => {
  it('resolves real hrefs (index → /, group segment stripped) for navigator routes', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="(group)/feed" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      '(group)/feed': () => <View testID="feed" />,
    });
    const lastArgs = () =>
      contentSpy.mock.calls.at(-1)![0] as NavigatorArgs<
        Record<string, never>,
        Record<string, never>
      >;

    expect(
      lastArgs()
        .state.routes.map((r) => r.href)
        .sort()
    ).toEqual(['/', '/feed']);
  });
});
