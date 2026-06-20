# Design System

## Direction

ClaimsOps Agent uses a Framer-inspired dark product system: near-black surfaces, white primary actions, electric blue focus/live state, and magenta, violet, orange, coral, and green accents for visual energy and operational status. The interface should feel like a clickable AI operations demo without sacrificing readability.

## Tokens

- Canvas: `#090909`
- Deep surface: `#050505`
- Panel surface: `#141414`
- Raised surface: `#1c1c1c`
- Graphite state: `#242424`
- Hairline: `#262626`
- Text: `#ffffff`
- Muted text: `#999999`
- Focus/live blue: `#0099ff`
- Magenta accent: `#d44df0`
- Violet accent: `#6a4cf5`
- Orange warning/accent: `#ff7a3d`
- Coral high-severity accent: `#ff5577`
- Success: `#22c55e`

## Typography

Use a restrained product sans stack:

```css
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Rules:

- Letter spacing stays at `0` except short system labels if a future design explicitly needs tracking.
- Use tabular numerals for metrics and queue data.
- Headings should be direct and compact. Avoid oversized landing-page copy inside panels.
- Long operational copy needs comfortable line height and sensible max width.

## Components

- Buttons: 5px radius, white filled primary, dark text, dark secondary/sidebar buttons, visible blue focus outline.
- Inputs and dropdowns: dark panel fill, hairline border, readable selected value in rest, hover, focus, and open states.
- Metric cards: flat panels with hairline borders, no heavy shadows.
- Tabs: compact segmented control, active state signaled by raised surface and subtle bright hairline.
- Status pills: use green, orange, and coral states for low, medium, and high severity.
- Data tables and charts: no nested cards; use one framed surface and stable width.
- Architecture diagram: same black, white, blue, orange, and green palette as the app.

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

- Low-contrast black-on-black states.
- Glassmorphism, decorative glow fields, or accent gradients that make operational text hard to read.
- Gray text on colored backgrounds.
- Button or dropdown text visible only on hover.
- Generic icons or decorative elements that do not help claims operations.

## Acceptance Checks

- `rg` should not find global transitions, removed outlines, or disabled zoom.
- Sidebar sample claim selector and "Load Selected Claim" button must be readable at rest, hover, active, and focus.
- The Streamlit server must return HTTP 200 locally.
- Python files must pass `py_compile`.
- `Prompt Pack` should include both the prompt/tool pack and the agent skill contract.
