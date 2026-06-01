import React from 'react';
import { createStandardNavigator, type NavigatorEventMapBase, type NavigatorRoute } from 'standard-navigation';
import { type DefaultRouterOptions, type NavigationAction, type NavigationState, type RouterFactory, type ScreenListeners } from '../react-navigation/core';
import type { GoBackAction, NavigateAction } from '../react-navigation/routers/CommonActions';
export interface StandardRouterNavigatorOptions {
    /**
     * If true, only screens whose names are declared as direct children of the
     * navigator (e.g. `<NativeTabs.Trigger />`) are rendered. Matched-but-not-declared
     * routes are filtered out. Required for tab-style navigators.
     */
    useOnlyUserDefinedScreens?: boolean;
}
export declare function createStandardRouterNavigator<State extends NavigationState, NavigatorOptions extends object, NavigatorEventMap extends NavigatorEventMapBase, NavigatorActions extends NavigationAction, NavigatorProps extends object = Record<string, never>, RouterOptions extends DefaultRouterOptions = DefaultRouterOptions>(NavigatorContent: Parameters<typeof createStandardNavigator<NavigatorOptions, NavigatorEventMap, NavigatorProps>>[0], router: RouterFactory<State, NavigatorActions | StandardNavigationAction, RouterOptions>, options?: StandardRouterNavigatorOptions): React.ForwardRefExoticComponent<React.PropsWithoutRef<import("..").PickPartial<NavigatorProps & DefaultRouterNavigationProps<State, NavigatorOptions, NavigatorEventMap, any> & RouterOptions, "children">> & React.RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<object, Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("../react-navigation").NavigationRoute<import("../react-navigation").ParamListBase, string>[];
        type: string;
        stale: false;
    }>, import("../react-navigation").EventMapBase>) => null;
    Protected: typeof import("../views/Protected").Protected;
};
export type StandardNavigationAction = NavigateAction | GoBackAction;
type NavigatorRouteWithoutHref = Omit<NavigatorRoute, 'href'>;
export interface DefaultRouterNavigationProps<State extends NavigationState, ScreenOptions extends object, NavigatorEventMap extends NavigatorEventMapBase, Navigation> {
    children: React.ReactNode;
    /**
     * Event listeners for all the screens in the navigator.
     */
    screenListeners?: ScreenListeners<State, NavigatorEventMap> | ((props: {
        route: NavigatorRouteWithoutHref;
        navigation: Navigation;
    }) => ScreenListeners<State, NavigatorEventMap>);
    /**
     * Default options for all screens under this navigator.
     */
    screenOptions?: ScreenOptions | ((props: {
        route: NavigatorRouteWithoutHref;
        navigation: Navigation;
        theme: ReactNavigation.Theme;
    }) => ScreenOptions);
}
export declare function integrateWithRouter<State extends NavigationState, NavigatorOptions extends object, NavigatorEventMap extends NavigatorEventMapBase, NavigatorActions extends NavigationAction, NavigatorProps extends object = Record<string, never>, RouterOptions extends DefaultRouterOptions = DefaultRouterOptions>(navigator: ReturnType<typeof createStandardNavigator<NavigatorOptions, NavigatorEventMap, NavigatorProps>>, router: RouterFactory<State, NavigatorActions | StandardNavigationAction, RouterOptions>, { useOnlyUserDefinedScreens }?: StandardRouterNavigatorOptions): React.ForwardRefExoticComponent<React.PropsWithoutRef<import("..").PickPartial<NavigatorProps & DefaultRouterNavigationProps<State, NavigatorOptions, NavigatorEventMap, any> & RouterOptions, "children">> & React.RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<object, Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("../react-navigation").NavigationRoute<import("../react-navigation").ParamListBase, string>[];
        type: string;
        stale: false;
    }>, import("../react-navigation").EventMapBase>) => null;
    Protected: typeof import("../views/Protected").Protected;
};
export {};
//# sourceMappingURL=index.d.ts.map