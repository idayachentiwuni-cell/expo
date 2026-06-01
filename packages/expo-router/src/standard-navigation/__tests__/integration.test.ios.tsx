import { Fragment } from 'react';
import { View } from 'react-native';
import { createStandardNavigator, type NavigatorArgs } from 'standard-navigation';

import { router } from '../../imperative-api';
import type { CommonNavigationAction, ParamListBase } from '../../react-navigation/core';
import {
  TabRouter,
  type TabActionType,
  type TabNavigationState,
  type TabRouterOptions,
} from '../../react-navigation/routers';
import { act, renderRouter, screen } from '../../testing-library';
import { createStandardRouterNavigator, integrateWithRouter } from '../index';

type TestOptions = { title?: string };
type TestEventMap = Record<string, { data: object | undefined; canPreventDefault: boolean }>;
// NavigatorActions must cover the router's full action union so TabRouter is assignable.
type TabActions = CommonNavigationAction | TabActionType;

const contentSpy = jest.fn();

function NavigatorContent(args: NavigatorArgs<TestOptions, TestEventMap>) {
  contentSpy(args);
  return (
    <>
      {args.state.routes.map((route) => (
        <Fragment key={route.key}>{args.descriptors[route.key]!.render()}</Fragment>
      ))}
    </>
  );
}

const StandardTabs = createStandardRouterNavigator<
  TabNavigationState<ParamListBase>,
  TestOptions,
  TestEventMap,
  TabActions,
  { tintColor?: string },
  TabRouterOptions
>(NavigatorContent, TabRouter, { useOnlyUserDefinedScreens: true });

// Same navigator, but without restricting to user-defined screens (the default).
const StandardTabsAll = createStandardRouterNavigator<
  TabNavigationState<ParamListBase>,
  TestOptions,
  TestEventMap,
  TabActions,
  Record<string, never>,
  TabRouterOptions
>(NavigatorContent, TabRouter);

const lastArgs = (): NavigatorArgs<TestOptions, TestEventMap> & Record<string, unknown> =>
  contentSpy.mock.calls.at(-1)![0];

const hrefByName = () =>
  Object.fromEntries(lastArgs().state.routes.map((r) => [r.name, r.href] as const));

beforeEach(() => {
  contentSpy.mockClear();
});

describe('integrateWithRouter / createStandardRouterNavigator', () => {
  it('renders declared screens and exposes a well-formed state', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="second" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(lastArgs().state.routes.map((r) => r.name)).toEqual(['index', 'second']);
    expect(lastArgs().state.index).toBe(0);
  });

  it('builds an href for every route', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="second" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(hrefByName()).toEqual({ index: '/', second: '/second' });
  });

  it('updates state when navigating imperatively', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="second" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    act(() => router.navigate('/second'));

    expect(lastArgs().state.routes[lastArgs().state.index]!.name).toBe('second');
  });

  it('switches the focused route via actions.navigate', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="second" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    act(() => lastArgs().actions.navigate('second'));

    expect(lastArgs().state.routes[lastArgs().state.index]!.name).toBe('second');
  });

  it('returns to the first tab via actions.back', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="second" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    act(() => lastArgs().actions.navigate('second'));
    expect(lastArgs().state.index).toBe(1);

    act(() => lastArgs().actions.back());

    expect(lastArgs().state.index).toBe(0);
  });

  it('forwards screen options to descriptors and drops route/navigation', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" options={{ title: 'Home' }} />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
    });

    const key = lastArgs().state.routes[0]!.key;
    expect(lastArgs().descriptors[key]!.options).toMatchObject({ title: 'Home' });
    expect(Object.keys(lastArgs().descriptors[key]!).sort()).toEqual(['options', 'render']);
  });

  it('passes extra navigator props through to NavigatorContent', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs tintColor="rebeccapurple">
          <StandardTabs.Screen name="index" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(lastArgs().tintColor).toBe('rebeccapurple');
  });

  it('respects useOnlyUserDefinedScreens by filtering undeclared routes', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(lastArgs().state.routes.map((r) => r.name)).toEqual(['index']);
  });

  it('includes undeclared matched routes when useOnlyUserDefinedScreens is false', () => {
    renderRouter({
      _layout: () => (
        <StandardTabsAll>
          <StandardTabsAll.Screen name="index" />
        </StandardTabsAll>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(
      lastArgs()
        .state.routes.map((r) => r.name)
        .sort()
    ).toEqual(['index', 'second']);
  });

  it('filters out Protected screens whose guard is false', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Protected guard={false}>
            <StandardTabs.Screen name="second" />
          </StandardTabs.Protected>
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(lastArgs().state.routes.map((r) => r.name)).toEqual(['index']);
  });

  it('propagates route params into state and href', () => {
    renderRouter(
      {
        _layout: () => (
          <StandardTabs>
            <StandardTabs.Screen name="[id]" />
          </StandardTabs>
        ),
        '[id]': () => <View testID="id" />,
      },
      { initialUrl: '/42' }
    );

    const idRoute = lastArgs().state.routes.find((r) => r.name === '[id]')!;
    expect(idRoute.params).toMatchObject({ id: '42' });
    expect(idRoute.href).toBe('/42');
  });

  it('runs screenListeners (function form) with route + navigation on focus change', () => {
    const focused = jest.fn();
    renderRouter({
      _layout: () => (
        <StandardTabs
          screenListeners={({ route, navigation }) => ({
            focus: () => focused({ name: route.name, hasNavigate: typeof navigation.navigate }),
          })}>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="second" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    act(() => router.navigate('/second'));

    expect(focused).toHaveBeenCalledWith({ name: 'second', hasNavigate: 'function' });
  });

  it('runs screenListeners (object form) on focus change', () => {
    const focused = jest.fn();
    renderRouter({
      _layout: () => (
        <StandardTabs screenListeners={{ focus: () => focused() }}>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="second" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    act(() => router.navigate('/second'));

    expect(focused).toHaveBeenCalled();
  });

  // initialRouteName is a router option, not a NavigatorContent prop: it is destructured out of the
  // props spread so it never reaches the content component (the focused route itself is URL-driven).
  it('does not leak initialRouteName to NavigatorContent', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs initialRouteName="second">
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="second" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(lastArgs().initialRouteName).toBeUndefined();
  });
});

describe('validateStandardNavigator (via integrateWithRouter)', () => {
  // Kept in sync with the messages thrown in validateStandardNavigator (index.tsx).
  const INVALID_NAVIGATOR_MESSAGE =
    'Expo Router could not integrate the navigator because it is not a valid standard-navigation navigator: ' +
    'it must be an object with `type`, `version`, and `NavigatorContent`. ' +
    'Pass the value returned by `createStandardNavigator(...)` from the "standard-navigation" package.';
  const wrongTypeMessage = (type: string) =>
    `Expo Router can only integrate "standard" navigators, but received one of type "${type}". ` +
    'This usually means the navigator was created by a different factory. ' +
    'Create it with `createStandardNavigator(...)` from the "standard-navigation" package.';
  const wrongVersionMessage = (version: number) =>
    `Expo Router supports standard-navigation navigator version 1, but received version ${version}. ` +
    'This means "standard-navigation" and this version of expo-router are out of sync. ' +
    'Update both to compatible versions.';

  it('throws when the navigator is null', () => {
    expect(() => integrateWithRouter(null as any, TabRouter)).toThrow(
      new Error(INVALID_NAVIGATOR_MESSAGE)
    );
  });

  it('throws when required fields are missing', () => {
    expect(() => integrateWithRouter({} as any, TabRouter)).toThrow(
      new Error(INVALID_NAVIGATOR_MESSAGE)
    );
  });

  it('throws when NavigatorContent is missing', () => {
    expect(() => integrateWithRouter({ type: 'standard', version: 1 } as any, TabRouter)).toThrow(
      new Error(INVALID_NAVIGATOR_MESSAGE)
    );
  });

  it('throws when the navigator type is not "standard"', () => {
    expect(() =>
      integrateWithRouter(
        { type: 'weird', version: 1, NavigatorContent: () => null } as any,
        TabRouter
      )
    ).toThrow(new Error(wrongTypeMessage('weird')));
  });

  it('throws when the navigator version is unsupported', () => {
    expect(() =>
      integrateWithRouter(
        { type: 'standard', version: 2, NavigatorContent: () => null } as any,
        TabRouter
      )
    ).toThrow(new Error(wrongVersionMessage(2)));
  });

  it('treats a falsy version (0) as a missing required field', () => {
    // `!navigator.version` catches 0 before the version-mismatch branch, so the only versions that
    // reach the "version 1" error are >= 2.
    expect(() =>
      integrateWithRouter(
        { type: 'standard', version: 0, NavigatorContent: () => null } as any,
        TabRouter
      )
    ).toThrow(new Error(INVALID_NAVIGATOR_MESSAGE));
  });

  it('accepts a navigator produced by the real createStandardNavigator', () => {
    expect(() =>
      integrateWithRouter(
        createStandardNavigator(() => null),
        TabRouter
      )
    ).not.toThrow();
  });
});
