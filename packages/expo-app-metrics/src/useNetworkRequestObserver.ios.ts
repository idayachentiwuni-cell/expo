import { useReleasingSharedObject } from 'expo-modules-core';
import { useEffect, useRef } from 'react';

import AppMetrics from './module';
import type {
  NetworkRequestCompletedEvent,
  NetworkRequestObserver,
  NetworkRequestStartedEvent,
} from './types';

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
export function useNetworkRequestObserver(
  options: UseNetworkRequestObserverOptions = {}
): NetworkRequestObserver | null {
  const onStartedRef = useRef(options.onStarted);
  const onCompletedRef = useRef(options.onCompleted);
  onStartedRef.current = options.onStarted;
  onCompletedRef.current = options.onCompleted;

  const observer = useReleasingSharedObject(() => new AppMetrics.NetworkRequestObserver!(), []);

  useEffect(() => {
    const startedSub = observer.addListener('requestStarted', (event) => {
      onStartedRef.current?.(event);
    });
    const completedSub = observer.addListener('requestCompleted', (event) => {
      onCompletedRef.current?.(event);
    });
    return () => {
      startedSub.remove();
      completedSub.remove();
    };
  }, [observer]);

  return observer;
}
