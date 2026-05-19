// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/**
 Receives notifications about completed HTTP requests observed by `NetworkRequestURLProtocol`.
 */
public protocol NetworkRequestObserverDelegate: AnyObject, Sendable {
  func onNetworkRequestCompleted(_ request: NetworkRequest)
}

/**
 A singleton that aggregates `NetworkRequest` snapshots delivered by the URL protocol observer.

 The monitor is the central seam between the URL-protocol layer (which sees individual tasks
 complete) and whatever future layer routes those observations into telemetry. For now it keeps a
 small in-memory ring buffer of recent requests (useful for debug surfaces and tests) and fans
 each completion out to registered delegates.

 Started eagerly at app launch (see `AppMetricsAppDelegateSubscriber.appDelegateWillBeginInitialization`)
 so that `URLProtocol.registerClass` runs before React Native makes its first fetch.
 */
@AppMetricsActor
public final class NetworkRequestMonitor: Sendable {
  public static let shared = NetworkRequestMonitor()

  /** Maximum number of recent requests retained for debug surfaces. */
  private let recentCapacity = 200

  private var recentRequests: [NetworkRequest] = []
  private var delegates: [WeakDelegate] = []
  private var started = false

  /** Internal so tests can construct dedicated instances; production code uses `shared`. */
  init() {}

  /**
   Registers the URL protocol class globally. Idempotent — subsequent calls are no-ops.
   */
  func start() {
    if started {
      return
    }
    started = true
    NetworkRequestURLProtocol.register()
  }

  /**
   Most recently observed requests, oldest first. Bounded by `recentCapacity`. Intended for
   debug surfaces; not for the dispatch path.
   */
  public var recent: [NetworkRequest] {
    return recentRequests
  }

  /**
   Folds the requests whose `timings.fetchStart` falls within `[start, end]` into a summary.
   Used by the TTI metric to attach a per-launch network rollup. Bounded by the ring buffer:
   under heavy network load the earliest requests in the window may have been evicted, in
   which case the summary undercounts — acceptable for a TTI-attached signal.
   */
  func summarize(start: Date, end: Date) -> NetworkRequestSummary {
    let inWindow = recentRequests.filter { request in
      guard let fetchStart = request.timings.fetchStart else {
        return false
      }
      return fetchStart >= start && fetchStart <= end
    }
    return NetworkRequestSummary.from(inWindow)
  }

  /**
   Adds a delegate that will be notified for each completed request. Delegates are held weakly.
   */
  public func addDelegate(_ delegate: NetworkRequestObserverDelegate) {
    pruneDelegates()
    delegates.append(WeakDelegate(value: delegate))
  }

  public func removeDelegate(_ delegate: NetworkRequestObserverDelegate) {
    delegates.removeAll { $0.value === delegate || $0.value == nil }
  }

  /**
   Records a completed request: appends to the ring buffer and fans it out to delegates. Called
   by `NetworkRequestURLProtocol` from the `AppMetricsActor` context.
   */
  func record(_ request: NetworkRequest) {
    recentRequests.append(request)
    if recentRequests.count > recentCapacity {
      recentRequests.removeFirst(recentRequests.count - recentCapacity)
    }
    pruneDelegates()
    for entry in delegates {
      entry.value?.onNetworkRequestCompleted(request)
    }
  }

  private func pruneDelegates() {
    delegates.removeAll { $0.value == nil }
  }

  private struct WeakDelegate {
    weak var value: NetworkRequestObserverDelegate?
  }
}
