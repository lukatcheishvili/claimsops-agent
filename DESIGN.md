# Design System

## Direction

ClaimsOps Agent uses an operations-grade dark system inspired by Impeccable's product-first guidance: warm lacquer surfaces, kinpaku-style gold for primary actions, and patina teal for focus, live state, and secondary signal. The interface should feel precise, compact, and deliberate.

## Tokens

- Canvas: `#11100c`
- Deep surface: `#080704`
- Panel surface: `#191812`
- Raised surface: `#242219`
- Graphite state: `#302d22`
- Text: `#ede8dc`
- Body text: `#d8d1c2`
- Muted text: `#aaa18f`
- Primary action: `#e3b64b`
- Primary hover: `#f0cf79`
- Secondary state and focus: `#5fc3bc`
- Warning: `#c76a45`
- Success: `#6dcc8b`

## Typography

Use a restrained product sans stack:

```css
"Aptos", "Avenir Next", "Albert Sans", "Segoe UI", ui-sans-serif, system-ui, sans-serif
```

Rules:

- Letter spacing stays at `0` except short system labels if a future design explicitly needs tracking.
- Use tabular numerals for metrics and queue data.
- Headings should be direct and compact. Avoid oversized landing-page copy inside panels.
- Long operational copy needs comfortable line height and sensible max width.

## Components

- Buttons: 5px radius, gold filled primary, transparent gold outline for sidebar and secondary actions, visible patina focus outline.
- Inputs and dropdowns: dark panel fill, hairline border, readable selected value in rest, hover, focus, and open states.
- Metric cards: flat panels with hairline borders, no heavy shadows.
- Tabs: compact segmented control, active state signaled by raised surface and gold hairline.
- Status pills: use success, gold, and warning states for low, medium, and high severity.
- Data tables and charts: no nested cards; use one framed surface and stable width.
- Architecture diagram: same warm dark, gold, patina, and muted text palette as the app.

## Layout

- The first viewport is the working product, not a landing page.
- Keep page sections unframed unless they are a functional tool, table, chart, form, or repeated item.
- Do not put cards inside cards.
- Keep radii at 8px or below unless Streamlit internals make that impractical.
- Use full-width tool surfaces with constrained inner content instead of decorative floating cards.
- Text must truncate or wrap cleanly for long claim IDs, customer names, and recommendations.

## Motion

- Keep transitions short and list explicit properties.
- Animate transform, opacity, color, background-color, border-color, and shadow only when useful.
- Respect `prefers-reduced-motion`.
- No bounce or elastic easing.

## Anti-Patterns

- Pure black or pure white UI surfaces.
- Purple-blue AI gradients, neon cyan-on-black, glassmorphism, decorative glow fields, or floating gradient blobs.
- Gray text on colored backgrounds.
- Button or dropdown text visible only on hover.
- Generic icons or decorative elements that do not help claims operations.

## Acceptance Checks

- `rg` should not find global transitions, removed outlines, disabled zoom, or old Framer palette leftovers.
- Sidebar sample claim selector and "Load Selected Claim" button must be readable at rest, hover, active, and focus.
- The Streamlit server must return HTTP 200 locally.
- Python files must pass `py_compile`.
- `Prompt Pack` should include both the prompt/tool pack and the agent skill contract.
