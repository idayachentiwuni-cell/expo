import { type NavigatorArgs, type NavigatorEventMapBase } from 'standard-navigation';
import type { StandardNavigationAction } from './index';
type StandardActionHelpers = NavigatorArgs<Record<string, never>, NavigatorEventMapBase>['actions'];
export declare function useStandardActions(navigation: {
    dispatch: (action: StandardNavigationAction) => void;
}): StandardActionHelpers;
export {};
//# sourceMappingURL=useStandardActions.d.ts.map