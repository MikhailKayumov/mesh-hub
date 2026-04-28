---
name: tiptap-extension
description: Use when adding or configuring a Tiptap extension for the WysiwygEditor widget — toolbar buttons, marks/nodes, schema rules, sanitization. The repo uses Tiptap 3 + @mantine/tiptap.
---

# Add a Tiptap extension to WysiwygEditor

Anchor: [client/src/widgets/WysiwygEditor/](../../../client/src/widgets/WysiwygEditor/) (`WysiwygEditor.module.scss`, `index.tsx`).

Stack: `@tiptap/react@3`, `@tiptap/starter-kit@3`, `@tiptap/pm@3` (ProseMirror), `@mantine/tiptap@9` (Mantine-styled toolbar wrappers). Already installed extensions per `client/package.json`: `link`, `highlight`, `placeholder`, `subscript`, `superscript`, `text-align`, `underline`.

## Adding a built-in or community extension

1. **Install** — if not already a dep:
   ```bash
   cd client && npm install @tiptap/extension-<name>
   ```

2. **Register** in the editor instance creation (in `WysiwygEditor/index.tsx`):
   ```ts
   import <Name> from '@tiptap/extension-<name>';

   const editor = useEditor({
     extensions: [
       StarterKit,
       <Name>.configure({ /* options */ }),
       // ...
     ],
   });
   ```
   `StarterKit` already includes basic marks and nodes (Bold, Italic, Strike, Heading, Bullet/Ordered List, Code, Blockquote, etc.) — don't double-register them.

3. **Toolbar control** — add a button in the toolbar JSX:
   ```tsx
   <RichTextEditor.Control
     onClick={() => editor?.chain().focus().toggle<Name>().run()}
     active={editor?.isActive('<name>')}
     aria-label="<Name>"
     title="<Name>"
   >
     <IconFromTablerIcons size={16} />
   </RichTextEditor.Control>
   ```

4. **Keyboard shortcut** — many extensions ship with one. If adding a custom binding, configure via the extension's options or via a `addKeyboardShortcuts()` override.

5. **Styling** — Tiptap renders standard HTML; style via the editor's container CSS. Add rules to `WysiwygEditor.module.scss` if needed.

## Custom extensions (writing your own)

Use `@tiptap/core`'s `Node.create` / `Mark.create` / `Extension.create`. Place the file under `widgets/WysiwygEditor/extensions/<name>.ts` (create the folder). Pattern:

```ts
import { Node } from '@tiptap/core';

export const MyNode = Node.create({
  name: 'myNode',
  group: 'block',
  content: 'inline*',
  parseHTML() { return [{ tag: '<tag>' }]; },
  renderHTML({ HTMLAttributes }) { return ['<tag>', HTMLAttributes, 0]; },
});
```

## Hard rules

- **Sanitization.** Anything user-generated that's rendered elsewhere (model description, comment) must be sanitized server-side before storage or before render. Tiptap's output is HTML — assume it's untrusted from the server's perspective. Use a server-side allow-list filter or a client-side sanitizer (DOMPurify) when rendering.
- **Don't roll a parallel editor.** Use the existing `WysiwygEditor` widget; if it doesn't fit, extend it via extensions, not by adding a second Tiptap instance.
- **Bundle size.** Each extension adds bundle weight. Audit before adding seldom-used ones. `@tiptap/extension-image` is a common gotcha — pull it in only if image support is genuinely required.

## Verify

- `cd client && npm run lint && npm run tscheck`
- `npm run dev`, exercise the editor: type, apply the new extension's command, save the content (HTML), reload, confirm round-trip.
