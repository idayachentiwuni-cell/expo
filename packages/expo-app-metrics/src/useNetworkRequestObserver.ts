import type {
  NetworkRequestCompletedEvent,
  NetworkRequestObserver,
  NetworkRequestStartedEvent,
} from './types';

export type UseNetworkRequestObserverOptions = {
  /** Called when a request begins. iOS only — never fires on other platforms. */
  onStarted?: (event: NetworkRequestStartedEvent) => void;
  /** Called when a request finishes. iOS only — never fires on other platforms. */
  onCompleted?: (event: NetworkRequestCompletedEvent) => void;
};

/**
 * No-op fallback on platforms other than iOS. The native interceptor only ships on iOS, so
 * neither `onStarted` nor `onCompleted` will ever fire here. Returns `null` so cross-platform
 * callers can guard on the result if they need to react differently.
 */
export function useNetworkRequestObserver(
  _options: UseNetworkRequestObserverOptions = {}
): NetworkRequestObserver | null {
  return null;
}
