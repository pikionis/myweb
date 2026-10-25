// The pen the line drawings share (StoryArt.astro, ServiceArt.astro): build-time helpers that write SVG as
// strings. Every stroke can draw itself on (`sa-d`, pathLength 1) and small dots fade in (`sa-f`).
type N = number;
export const r1 = (v: N) => Math.round(v * 10) / 10;
/** a circle as a path, so it can be drawn on like any line */
export const C = (cx: N, cy: N, r: N) => `M${r1(cx - r)} ${r1(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
/** a rounded rectangle as a path */
export const R = (x: N, y: N, w: N, h: N, r: N) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;
export const cls = (base: string, extra: string) => (extra ? `${base} ${extra}` : base);
/** a stroke that draws itself */
export const P = (d: string, extra = '', attrs = '') => `<path class="${cls('sa-d', extra)}" pathLength="1" d="${d}"${attrs ? ` ${attrs}` : ''}/>`;
/** a dot that fades in */
export const D = (cx: N, cy: N, r: N, extra = '') => `<circle class="${cls('sa-f', extra)}" cx="${cx}" cy="${cy}" r="${r}"/>`;
export const T = (t: string, inner: string) => `<g transform="${t}">${inner}</g>`;
