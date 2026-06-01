"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStandardRouterNavigator = createStandardRouterNavigator;
exports.integrateWithRouter = integrateWithRouter;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const standard_navigation_1 = require("standard-navigation");
const useStandardActions_1 = require("./useStandardActions");
const useStandardEmitter_1 = require("./useStandardEmitter");
const useStandardState_1 = require("./useStandardState");
const withLayoutContext_1 = require("../layouts/withLayoutContext");
const core_1 = require("../react-navigation/core");
function createStandardRouterNavigator(NavigatorContent, router, options = {}) {
    return integrateWithRouter((0, standard_navigation_1.createStandardNavigator)(NavigatorContent), router, options);
}
/**
 * Asserts that `navigator` is a standard-navigation navigator this integration supports.
 * Guards against navigators produced by a different (or incompatible version of the) factory,
 * which would otherwise fail in confusing ways deeper in the render tree.
 */
function validateStandardNavigator(navigator) {
    if (!navigator ||
        typeof navigator !== 'object' ||
        !navigator.type ||
        !navigator.version ||
        !navigator.NavigatorContent) {
        throw new Error('Expo Router could not integrate the navigator because it is not a valid standard-navigation navigator: ' +
            'it must be an object with `type`, `version`, and `NavigatorContent`. ' +
            'Pass the value returned by `createStandardNavigator(...)` from the "standard-navigation" package.');
    }
    if (navigator.type !== 'standard') {
        throw new Error(`Expo Router can only integrate "standard" navigators, but received one of type "${navigator.type}". ` +
            'This usually means the navigator was created by a different factory. ' +
            'Create it with `createStandardNavigator(...)` from the "standard-navigation" package.');
    }
    if (navigator.version !== 1) {
        throw new Error(`Expo Router supports standard-navigation navigator version 1, but received version ${navigator.version}. ` +
            'This means "standard-navigation" and this version of expo-router are out of sync. ' +
            'Update both to compatible versions.');
    }
}
function integrateWithRouter(navigator, router, { useOnlyUserDefinedScreens = false } = {}) {
    validateStandardNavigator(navigator);
    const { NavigatorContent } = navigator;
    function Nav(props) {
        const { children, screenListeners, screenOptions, initialRouteName, ...extraProps } = props;
        const { state: builderState, descriptors: builderDescriptors, navigation, NavigationContent, } = (0, core_1.useNavigationBuilder)(router, { id: undefined, ...props });
        const actions = (0, useStandardActions_1.useStandardActions)(navigation);
        const descriptors = (0, react_1.useMemo)(() => {
            return Object.fromEntries(Object.entries(builderDescriptors).map(([key, descriptor]) => [
                key,
                {
                    options: descriptor.options,
                    render: descriptor.render,
                },
            ]));
        }, [builderDescriptors]);
        const emitter = (0, useStandardEmitter_1.useStandardEmitter)(navigation);
        const state = (0, useStandardState_1.useStandardState)(builderState);
        // TODO(@ubax): https://linear.app/expo/issue/ENG-21485/simplify-react-navigation-types
        return ((0, jsx_runtime_1.jsx)(NavigationContent, { children: (0, jsx_runtime_1.jsx)(NavigatorContent, { ...extraProps, actions: actions, descriptors: descriptors, emitter: emitter, state: state }) }));
    }
    return (0, withLayoutContext_1.withLayoutContext)(Nav, undefined, useOnlyUserDefinedScreens);
}
//# sourceMappingURL=index.js.map