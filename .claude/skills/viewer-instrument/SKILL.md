---
name: viewer-instrument
description: Use when adding performance / health instrumentation to the 3D viewer — frame time, GPU draw call count, memory pressure, GLTF load time, post-processing pass cost. For diagnostics; pair with the `viewer-perf` agent.
---

# Add instrumentation to the 3D viewer

The viewer already exposes some instrumentation hooks (`Renderer.getInfo()` returns `renderer.info` from Three.js, `renderer.info.autoReset = false` is set so per-frame stats accumulate cleanly). This skill extends measurement to specific use cases.

## What's available out of the box

- `renderer.info.render.calls` — draw call count for the last frame
- `renderer.info.render.triangles` — triangles rendered
- `renderer.info.memory.geometries` / `.textures` — GPU resource counts
- `renderer.info.programs.length` — shader program count

## Common metrics to add

1. **Frame time histogram.** In a render callback, sample `delta` (already in seconds) and accumulate into a fixed-size ring buffer. Compute p50/p95/p99 every N seconds. Expose via a debug overlay or via a callback.
2. **GLTF load timing.** Wrap `Loader.load`: record `performance.now()` before and after. Bucket by file size, file extension, cache hit vs miss.
3. **Post-process cost.** Measure GPU time per pass. WebGL exposes `EXT_disjoint_timer_query_webgl2` — wrap each `pass.render` in a query. Expensive to set up; only do this when investigating a specific complaint.
4. **Memory pressure.** Snapshot `performance.memory.usedJSHeapSize` every N seconds (Chrome only — degrade gracefully on other browsers). Pair with `renderer.info.memory.*`.
5. **Idle vs active.** Track time between user input events and render frames. If the renderer keeps drawing while the scene is static, you're wasting GPU.

## Where to put the code

- **In `Renderer`**: a metrics aggregator that subscribes to its own callbacks. Expose a `getMetrics()` method.
- **Outside `Renderer` (recommended for non-trivial)**: a separate `PerfMonitor` class under `widgets/Model3DViewer/classes/PerfMonitor/` that takes `Renderer` and `World` references. Keeps `Renderer` lean.
- **Debug UI**: a dev-mode-only overlay component, gated by an env flag or a hidden URL query param. Don't ship the overlay in production builds.

## Hard rules

- **Do not allocate in the render callback to capture metrics.** Preallocate ring buffers and counters. `delta` is already a number; appending to a `number[]` and slicing is fine for ring buffers — use a fixed-size `Float32Array` for hot paths.
- **Do not log every frame.** Aggregate and emit at human-readable cadence (e.g. once per second).
- **Do not enable timer queries in production.** They add GPU sync points and can hide real perf issues.
- **Disposal.** Any added GPU resources (timer query objects) need cleanup in `Renderer.destroy`.

## Workflow

1. Pick the smallest set of metrics that addresses the current complaint.
2. Wire the metrics, gate behind a flag, ship a debug overlay or a console-API hook (e.g. `window.__viewerMetrics()` in dev).
3. Reproduce the perf issue, capture metrics, hand to `viewer-perf` agent for analysis.
4. Once analysis is done, decide what to keep (often: nothing — instrumentation served its purpose). Remove the rest.

## Don't

- Don't keep all instrumentation forever — every metric has a maintenance cost.
- Don't expose timer-query overlays to non-dev users — they confuse and can spook QA.
- Don't measure "what feels slow" — measure what `viewer-perf` is asking for.
