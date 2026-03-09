# Theming

MeshHub uses **Mantine v9** as its component library. The theme system supports 7 named color palettes and both light/dark color schemes. Theme selection is persisted in Redux (`user.theme`) and survives page refreshes.

---

## Color Themes

**Type:** `src/shared/theme/types.ts`

```ts
type ThemeName =
  | 'deepblue'     // default
  | 'bluegray'
  | 'darkpink'
  | 'skyblue'
  | 'green'
  | 'deeporange'
  | 'magenta';
```

Each `ThemeName` maps to a `ThemeData` object:

```ts
type ThemeData = {
  primaryShade: MantineColorShade;  // which shade index (0–9) is the "primary" shade
  primaryColor: 'primary';          // always 'primary' — Mantine's custom color key
  colors: {
    primary: MantineColorsTuple;    // 10-stop color tuple
  };
};
```

**Files:**
- `src/shared/theme/themes.ts` — defines the `ThemeData` for each `ThemeName`
- `src/shared/theme/colors.ts` — raw color tuples
- `src/shared/theme/index.tsx` — `<Theme>` wrapper component that applies the active theme to Mantine
- `src/shared/theme/_mantine.scss` — Mantine CSS variable overrides
- `src/shared/theme/global.scss` — global base styles

---

## Applying the Theme

The `<Theme>` component (rendered in `App.tsx`) reads the current `ThemeName` from the Redux store and applies it as the Mantine theme:

```tsx
// App.tsx
<Theme>
  <RouterProvider router={router} />
  <Notifications limit={5} />
</Theme>
```

Mantine's `MantineProvider` is configured with `primaryColor: 'primary'` and the 10-stop color tuple from the selected theme. Switching themes dispatches `userActions.setTheme(name)` — the store update triggers a re-render of `<Theme>`, and Mantine re-applies CSS variables.

---

## Color Scheme (Light / Dark)

Light/dark mode is handled by Mantine's built-in color scheme system. The active scheme is stored in a Mantine-managed cookie/localStorage key (not in Redux). Use the `useCurrentColorScheme` hook from `src/shared/hooks/useCurrentColorScheme.ts` to read it:

```ts
const { isLight, isDark, colorScheme } = useCurrentColorScheme();
```

The `ColorSchemeSelect` widget exposes a UI control for switching between `'light'` and `'dark'`.

---

## Theme Switcher Widgets

| Widget | Location | Description |
|---|---|---|
| `ColorThemeSwitcher` | `src/widgets/ColorThemeSwitcher/` | Palette selector — lets user pick one of 7 `ThemeName` values |
| `ColorSchemeSelect` | `src/widgets/ColorSchemeSelect/` | Light / Dark toggle |

---

## SCSS Global Mixins

All SCSS module files have the following injected automatically via `vite.config.ts` `additionalData`:

```ts
// vite.config.ts
additionalData: `@use "src/shared/theme/_mantine" as *;`
```

The `as *` wildcard forwards all variables, functions and mixins from `_mantine.scss` into every SCSS module without a namespace prefix. Do **not** `@use` or `@import` `_mantine.scss` manually in your modules — it is already injected.

### Mixins

```scss
@include light { ... }
// Wraps content in: [data-mantine-color-scheme='light'] & { ... }

@include dark { ... }
// Wraps content in: [data-mantine-color-scheme='dark'] & { ... }

@include hover { ... }
// pointer devices: &:hover; touch devices: &:active

@include rtl { ... }
// Wraps content in: [dir='rtl'] & { ... }

@include ltr { ... }
// Wraps content in: [dir='ltr'] & { ... }
```

### `rem()` Function

```scss
rem(16)   // → 1rem
rem(24)   // → 1.5rem
rem(8)    // → 0.5rem
```

Converts a raw pixel value to `rem` based on a 16px root font size.

### Breakpoint Variables

These match the breakpoints configured in the Mantine theme:

```scss
$mantine-breakpoint-xs   // 36em  ≈ 576px
$mantine-breakpoint-sm   // 48em  ≈ 768px
$mantine-breakpoint-md   // 62em  ≈ 992px
$mantine-breakpoint-lg   // 75em  ≈ 1200px
$mantine-breakpoint-xl   // 88em  ≈ 1408px
```

### Usage Example

```scss
// MyComponent.module.scss
.root {
  background: white;

  @include dark {
    background: #1a1a2e;
  }

  @include hover {
    opacity: 0.8;
  }

  padding: rem(16);

  @media (max-width: $mantine-breakpoint-sm) {
    padding: rem(8);
  }
}
```

