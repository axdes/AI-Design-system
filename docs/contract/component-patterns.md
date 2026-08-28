# How a component is written here

*Reference for `packages/design-system/AGENTS.md`. The contract stays short enough to read
in full on every task; this is what it points at when a task needs it.*

## Component patterns

```tsx
// Wrapping a CSS class with a React component
export function Button({ variant, size, className, ...rest }: Props) {
  return <button
    className={cn('btn', className)}
    data-variant={variant}
    data-size={size}
    {...rest}
  />
}
```
CSS does the work:
```css
.btn { /* base */ }
.btn[data-variant="secondary"] { /* override */ }
.btn[data-size="lg"]           { /* override */ }
```
