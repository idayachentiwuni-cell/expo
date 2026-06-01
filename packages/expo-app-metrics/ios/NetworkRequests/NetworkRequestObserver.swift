// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation

/** Event names emitted by `NetworkRequestObserver`. Kept at module scope so `AppMetricsModule`'s
 `Events(...)` declaration uses the same string literals. */
let REQUEST_STARTED_EVENT = "requestStarted"
let REQUEST_COMPLETED_EVENT = "requestCompleted"

/**
 JS-facing `SharedObject` that bridges per-instance subscriptions to the singleton
 `NetworkRequestMonitor`. Each JS `new NetworkRequestObserver()` allocates one of these and
 registers it as a delegate; the native instance is released when JS drops the reference, at
 which point `deinit` removes the delegate registration.

 The class only forwards events — it doesn't store request history. Use `NetworkRequestMonitor`'s
 in-process API for that.
 */
public final class NetworkRequestObserver: SharedObject, NetworkRequestObserverDelegate, @unchecked Sendable {
  public override init() {
    super.init()
    AppMetricsActor.isolated { [weak self] in
      guard let self else {
        return
      }
      NetworkRequestMonitor.shared.addDelegate(self)
    }
  }

  // No explicit `deinit` cleanup: `NetworkRequestMonitor` holds delegates weakly and prunes nil
  // entries on every add/record. When this object is released, the delegate slot becomes nil
  // and the next fan-out evicts it.

  // MARK: - NetworkRequestObserverDelegate

  public func onNetworkRequestStarted(_ request: NetworkRequestStarted) {
    emit(event: REQUEST_STARTED_EVENT, payload: [
      "id": request.id.uuidString,
      "url": request.url.absoluteString,
      "method": request.method,
      "startedAt": request.startedAt.ISO8601Format()
    ])
  }

  public func onNetworkRequestCompleted(_ request: NetworkRequest) {
    emit(event: REQUEST_COMPLETED_EVENT, payload: payload(for: request))
  }

  private func payload(for request: NetworkRequest) -> [String: Any?] {
    return [
      "id": request.id.uuidString,
      "url": request.url.absoluteString,
      "method": request.method,
      "statusCode": request.statusCode,
      "networkProtocol": request.networkProtocol,
      "requestBytesSent": request.requestBytesSent,
      "responseBytesReceived": request.responseBytesReceived,
      "wasCached": request.wasCached,
      "errorDescription": request.errorDescription,
      "startedAt": request.timings.fetchStart?.ISO8601Format(),
      "completedAt": request.timings.responseEnd?.ISO8601Format(),
      "totalDuration": request.timings.totalDuration,
      "redirects": request.redirects.map {
        return [
          "url": $0.url.absoluteString,
          "statusCode": $0.statusCode
        ]
      }
    ]
  }
}
