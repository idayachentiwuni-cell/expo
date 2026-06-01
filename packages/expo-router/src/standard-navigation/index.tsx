import React, { useMemo } from 'react';
import {
  createStandardNavigator,
  type NavigatorArgs,
  type NavigatorDescriptor,
  type NavigatorEventMapBase,
  type NavigatorRoute,
} from 'standard-navigation';

import { useStandardActions } from './useStandardActions';
import { useStandardEmitter } from './useStandardEmitter';
import { useStandardState } from './useStandardState';
import { withLayoutContext } from '../layouts/withLayoutContext';
import {
  useNavigationBuilder,
  type DefaultRouterOptions,
  type NavigationAction,
  type NavigationState,
  type RouterFactory,
  type ScreenListeners,
} from '../react-navigation/core';
import type { GoBackAction, NavigateAction } from '../react-navigation/routers/CommonActions';

export interface StandardRouterNavigatorOptions {
  /**
   * If true, only screens whose names are declared as direct children of the
   * navigator (e.g. `<NativeTabs.Trigger />`) are rendered. Matched-but-not-declared
   * routes are filtered out. Required for tab-style navigators.
   */
  useOnlyUserDefinedScreens?: boolean;
}

export function createStandardRouterNavigator<
  State extends NavigationState,
  NavigatorOptions extends object,
  NavigatorEventMap extends NavigatorEventMapBase,
  NavigatorActions extends NavigationAction,
  NavigatorProps extends object = Record<string, never>,
  RouterOptions extends DefaultRouterOptions = DefaultRouterOptions,
>(
  NavigatorContent: Parameters<
    typeof createStandardNavigator<NavigatorOptions, NavigatorEventMap, NavigatorProps>
  >[0],
  router: RouterFactory<State, NavigatorActions | StandardNavigationAction, RouterOptions>,
  options: StandardRouterNavigatorOptions = {}
) {
  return integrateWithRouter<
    State,
    NavigatorOptions,
    NavigatorEventMap,
    NavigatorActions,
    NavigatorProps,
    RouterOptions
  >(
    createStandardNavigator<NavigatorOptions, NavigatorEventMap, NavigatorProps>(NavigatorContent),
    router,
    options
  );
}

export type StandardNavigationAction = NavigateAction | GoBackAction;

// TODO(@ubax): remove this once we add route info to router state
// https://linear.app/expo/issue/ENG-21483/refactor-state-to-include-all-route-info-information
type NavigatorRouteWithoutHref = Omit<NavigatorRoute, 'href'>;

export interface DefaultRouterNavigationProps<
  State extends NavigationState,
  ScreenOptions extends object,
  NavigatorEventMap extends NavigatorEventMapBase,
  Navigation,
> {
  children: React.ReactNode;

  /**
   * Event listeners for all the screens in the navigator.
   */
  screenListeners?:
    | ScreenListeners<State, NavigatorEventMap>
    | ((props: {
        route: NavigatorRouteWithoutHref;
        navigation: Navigation;
      }) => ScreenListeners<State, NavigatorEventMap>);

  /**
   * Default options for all screens under this navigator.
   */
  screenOptions?:
    | ScreenOptions
    | ((props: {
        route: NavigatorRouteWithoutHref;
        navigation: Navigation;
        theme: ReactNavigation.Theme;
      }) => ScreenOptions);

  // TODO(@ubax): rename and refactor this to cover the protected route case (maybe add similar prop to unstable_settings)
  // unstable_routeNamesChangeBehavior?: 'firstMatch' | 'lastUnhandled';
}

/**
 * Asserts that `navigator` is a standard-navigation navigator this integration supports.
 * Guards against navigators produced by a different (or incompatible version of the) factory,
 * which would otherwise fail in confusing ways deeper in the render tree.
 */
function validateStandardNavigator<
  NavigatorOptions extends object,
  NavigatorEventMap extends NavigatorEventMapBase,
  NavigatorProps extends object = Record<string, never>,
>(
  navigator: ReturnType<
    typeof createStandardNavigator<NavigatorOptions, NavigatorEventMap, NavigatorProps>
  >
): void {
  if (
    !navigator ||
    typeof navigator !== 'object' ||
    !navigator.type ||
    !navigator.version ||
    !navigator.NavigatorContent
  ) {
    throw new Error(
      'Expo Router could not integrate the navigator because it is not a valid standard-navigation navigator: ' +
        'it must be an object with `type`, `version`, and `NavigatorContent`. ' +
        'Pass the value returned by `createStandardNavigator(...)` from the "standard-navigation" package.'
    );
  }
  if (navigator.type !== 'standard') {
    throw new Error(
      `Expo Router can only integrate "standard" navigators, but received one of type "${navigator.type}". ` +
        'This usually means the navigator was created by a different factory. ' +
        'Create it with `createStandardNavigator(...)` from the "standard-navigation" package.'
    );
  }
  if (navigator.version !== 1) {
    throw new Error(
      `Expo Router supports standard-navigation navigator version 1, but received version ${navigator.version}. ` +
        'This means "standard-navigation" and this version of expo-router are out of sync. ' +
        'Update both to compatible versions.'
    );
  }
}

export function integrateWithRouter<
  State extends NavigationState,
  NavigatorOptions extends object,
  NavigatorEventMap extends NavigatorEventMapBase,
  NavigatorActions extends NavigationAction,
  NavigatorProps extends object = Record<string, never>,
  RouterOptions extends DefaultRouterOptions = DefaultRouterOptions,
>(
  navigator: ReturnType<
    typeof createStandardNavigator<NavigatorOptions, NavigatorEventMap, NavigatorProps>
  >,
  router: RouterFactory<State, NavigatorActions | StandardNavigationAction, RouterOptions>,
  { useOnlyUserDefinedScreens = false }: StandardRouterNavigatorOptions = {}
) {
  type CurrentNavigatorArgsType = NavigatorArgs<NavigatorOptions, NavigatorEventMap>;
  type DefaultProps = DefaultRouterNavigationProps<State, NavigatorOptions, NavigatorEventMap, any>;

  type NavProps = NavigatorProps & DefaultProps & RouterOptions;
  validateStandardNavigator<NavigatorOptions, NavigatorEventMap, NavigatorProps>(navigator);
  const { NavigatorContent } = navigator;

  function Nav(props: NavProps) {
    const { children, screenListeners, screenOptions, initialRouteName, ...extraProps } = props;
    const {
      state: builderState,
      descriptors: builderDescriptors,
      navigation,
      NavigationContent,
    } = useNavigationBuilder<
      State,
      RouterOptions,
      Record<string, never>,
      NavigatorOptions,
      NavigatorEventMap
    >(router, { id: undefined, ...props });

    const actions = useStandardActions(navigation);
    const descriptors = useMemo<CurrentNavigatorArgsType['descriptors']>(() => {
      return Object.fromEntries(
        Object.entries(builderDescriptors).map<[string, NavigatorDescriptor<NavigatorOptions>]>(
          ([key, descriptor]) => [
            key,
            {
              options: descriptor.options,
              render: descriptor.render,
            },
          ]
        )
      );
    }, [builderDescriptors]);
    const emitter = useStandardEmitter<NavigatorEventMap>(navigation);
    const state = useStandardState(builderState);

    // TODO(@ubax): https://linear.app/expo/issue/ENG-21485/simplify-react-navigation-types
    return (
      <NavigationContent>
        <NavigatorContent
          {...(extraProps as unknown as NavigatorProps)}
          actions={actions}
          descriptors={descriptors}
          emitter={emitter}
          state={state}
        />
      </NavigationContent>
    );
  }
  return withLayoutContext(Nav, undefined, useOnlyUserDefinedScreens);
}
