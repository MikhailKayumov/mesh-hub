# STEP-11 — Embed Frontend

**Block:** 3 — Embed Viewer
**Prerequisites:** STEP-10 (backend running), STEP-4 (org frontend for project management)
**Parallel with:** STEP-13/14

---

## Goal

Create the standalone `EmbedViewer` page (iframe target) and the `EmbedProject` management
page (for customers to configure embed code, domains, and branding).

---

## 1. RTK Query Tags & API Module

**`client/src/app/api/tags.ts`** — Add:
```ts
EmbedProject: 'EmbedProject',
EmbedProjects: 'EmbedProjects',
```

**`client/src/app/api/embed.ts`** — New file:

Endpoints:
- `embedViewer` — GET `/embed/:modelId?apiKey=<key>` — but since API key goes in
  `X-Api-Key` header (not query param), use RTK Query `prepareHeaders`:
  ```ts
  query: ({ modelId, apiKey }) => ({
    url: `embed/${modelId}`,
    headers: { 'X-Api-Key': apiKey },
  })
  ```
  This endpoint is called from `EmbedViewer` page on load.
- `embedProjects` — GET `/embed/projects?orgId=`, provides `EmbedProjects`.
- `createEmbedProject` — POST `/embed/projects`, invalidates `EmbedProjects`.
- `updateEmbedProject` — PATCH `/embed/projects/:id`, invalidates `EmbedProject`.
- `addEmbedDomain` — POST `/embed/projects/:id/domains`, invalidates `EmbedProject`.
- `removeEmbedDomain` — DELETE `/embed/projects/:id/domains/:domain`, invalidates `EmbedProject`.
- `embedAnalytics` — GET `/embed/projects/:id/analytics`, provides `EmbedProject`.

Export all hooks.

**`client/src/app/api/urls.ts`** — Add `Embed: 'embed'`.

---

## 2. `pages/EmbedViewer/`

**Route:** `/embed/:modelId`
**No layout** — no Header, no Footer; full-screen canvas.

Files:
```
pages/EmbedViewer/
├── index.tsx
├── EmbedViewerPage.tsx
├── EmbedViewerPage.module.scss
└── hooks/
    ├── useEmbedConfig.ts
    └── useEmbedPostMessage.ts
```

### `useEmbedConfig.ts`

Parses URL query params to configure the viewer:
```ts
export function useEmbedConfig() {
  const [searchParams] = useSearchParams();
  return {
    apiKey: searchParams.get('apiKey') ?? '',
    theme: searchParams.get('theme') ?? 'dark',
    autoRotate: searchParams.get('autoRotate') === '1',
    bg: searchParams.get('bg') ?? 'transparent',
  };
}
```

The `apiKey` is passed as a query param by the embedding site; the frontend then
forwards it as the `X-Api-Key` header when calling the API.

### `useEmbedPostMessage.ts`

```ts
export function useEmbedPostMessage(viewer: Viewer | null, allowedOrigins: string[]) {
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Security: validate origin against allowedOrigins whitelist
      if (!allowedOrigins.includes(event.origin) && !allowedOrigins.includes('*')) return;

      switch (event.data?.type) {
        case 'RESET_CAMERA': viewer?.camera.reset(); break;
        case 'SET_AUTO_ROTATE': viewer?.camera.setAutoRotate(event.data.value); break;
        case 'TAKE_SCREENSHOT': {
          const dataUrl = viewer?.renderer.takeScreenshot();
          event.source?.postMessage({ type: 'SCREENSHOT_RESULT', dataUrl }, { targetOrigin: event.origin });
          break;
        }
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [viewer, allowedOrigins]);
}
```

### `EmbedViewerPage.tsx`

1. Extract `modelId` from route params, call `useEmbedConfig()`.
2. Call `useEmbedViewerQuery({ modelId, apiKey })` — get model data + branding config + `allowedOrigins`.
3. Show full-screen `<Model3DViewer>` widget (reuse existing).
4. Apply `brandingConfig`: if `showBadge`, render a small "Powered by MeshHub" overlay.
5. Apply `primaryColor` to background.
6. Call `useEmbedPostMessage(viewer, allowedOrigins)`.
7. Loading state: centered spinner.
8. Error state (invalid API key, wrong origin): "Embed not authorized" message.

**SCSS:** `EmbedViewerPage.module.scss` — full-screen styles, badge position.

---

## 3. `pages/EmbedProject/`

**Route:** `/org/:orgId/embed/:projectId`
Uses standard `BaseLayout` (Header + Footer).

Files:
```
pages/EmbedProject/
├── index.tsx
├── EmbedProjectPage.tsx
├── EmbedProjectPage.module.scss
└── components/
    ├── EmbedCodeGenerator.tsx
    ├── DomainWhitelist.tsx
    ├── BrandingEditor.tsx
    └── ViewsChart.tsx
```

### `EmbedCodeGenerator.tsx`

Generates the iframe snippet. Props: `modelId`, `apiKey` (user selects from their org's API keys).

```html
<iframe
  src="https://app.meshhub.io/embed/{modelId}?apiKey={selectedKey}&autoRotate=1"
  width="800"
  height="600"
  frameborder="0"
  allowfullscreen
></iframe>
```

Show Mantine `Code` block with a copy button. Let user configure width/height numerically.

### `DomainWhitelist.tsx`

List of whitelisted domains. TextInput + "Add" button. Remove button per item.
Calls `useAddEmbedDomainMutation`, `useRemoveEmbedDomainMutation`.

### `BrandingEditor.tsx`

- `showBadge` toggle (Mantine `Switch`).
- `primaryColor` — Mantine `ColorInput` (hex picker).
- Logo upload — small `FileInput` (PNG/SVG, max 500 KB). On upload, sends as FormData
  to a new endpoint `POST /embed/projects/:id/logo`. (Add this endpoint to the backend:
  save file to `files/embed/<projectId>/logo.<ext>`, store URL in `brandingConfig.logoUrl`.)

### `ViewsChart.tsx`

Display 30-day view data from `useEmbedAnalyticsQuery`.
Use Mantine's `BarChart` or a simple SVG sparkline (keep it lightweight).
Show total views count + top 3 origins as stat cards.

---

## 4. Router Updates

Add to the router:
```ts
// No layout:
{ path: '/embed/:modelId', element: lazy(() => import('@/pages/EmbedViewer')) }
// Under authenticated + org layout:
{ path: '/org/:orgId/embed/:projectId', element: lazy(() => import('@/pages/EmbedProject')) }
```

---

## Verification

1. Navigate to `/embed/<modelId>?apiKey=<validKey>` → model renders full-screen.
2. Parent page posts `{ type: 'RESET_CAMERA' }` via `postMessage` → camera resets.
3. Message from non-whitelisted origin → ignored (no error, no action).
4. `EmbedCodeGenerator` copy button → copied iframe HTML to clipboard.
5. Add domain to whitelist → appears in list; remove → disappears.
6. Analytics chart shows data after embed has been viewed.
