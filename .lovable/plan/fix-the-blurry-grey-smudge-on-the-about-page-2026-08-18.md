# Fix the blurry grey smudge on the About page

## What's wrong

The decorative "liquid chrome" glow on `/about` is a heavily blurred photo layered in screen blend mode. Two things make it look dirty instead of smooth:

1. Its section uses `overflow-hidden`, and the glow (46rem tall, offset from the top) runs past the section's bottom edge. The overflow clip cuts the soft blur with a straight horizontal line — the hard grey band visible under the paragraph text.
2. The blurred photo still has uneven bright patches, so at low opacity it reads as a dirty rectangular smudge behind the copy rather than a light haze.

## The fix

- Keep the glow fully inside its section so nothing gets clipped: reduce the blob size and reposition it away from the section edges on the About hero and statement sections.
- Strengthen the fade so the glow dissolves into black well before any edge: soften the radial mask (fade starting nearer the centre) and increase the blur.
- Lower the glow opacity on About so it sits behind the text as a faint haze, never as a visible panel.
- Result: the same chrome-haze mood, but smooth with no visible rectangle or hard cut lines.

## Technical notes

- `src/routes/about.tsx`: adjust the two `<LiquidChrome />` instances (size, position, `opacity`, `blur`); ensure the glow bounds stay inside the `overflow-hidden` sections, or drop `overflow-hidden` where nothing else needs clipping.
- `src/components/site/LiquidChrome.tsx`: soften the radial mask stop (e.g. `#000 20%` → transparent) so the edges always fade out; unchanged for other pages except a gentler falloff.
- No changes to typography, layout, copy, data, or other routes.
