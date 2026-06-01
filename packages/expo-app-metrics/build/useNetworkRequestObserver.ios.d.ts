import type { NetworkRequestCompletedEvent, NetworkRequestObserver, NetworkRequestStartedEvent } from './types';
export type UseNetworkRequestObserverOptions = {
    /**
     * Called when a request begins. Fired before any response or timing data exists; correlate
     * with the matching `onCompleted` call via the shared `id`.
     */
    onStarted?: (event: NetworkRequestStartedEvent) => void;
    /**
     * Called when a request finishes (successfully or otherwise). Payload includes status,
     * timings, byte counts, protocol, cache hit, error, and the redirect chain.
     */
    onCompleted?: (event: NetworkRequestCompletedEvent) => void;
};
/**
 * Subscribes to the native network-request observer for the lifetime of the component. Each
 * mount allocates a `NetworkRequestObserver` SharedObject; unmount releases it and the native
 * delegate slot is reclaimed.
 *
 * Callbacks are held in refs so passing fresh closures each render doesn't tear down and
 * re-establish the subscription — only initial mount and unmount touch the event listeners.
 *
 * @platform ios
 */
export declare function useNetworkRequestObserver(options?: UseNetworkRequestObserverOptions): NetworkRequestObserver | null;
//# sourceMappingURL=useNetworkRequestObserver.ios.d.ts.map