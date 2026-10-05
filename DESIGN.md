# Threvix Product Design System

## Brand Foundation

### Wordmark
Use the lowercase `threvi` wordmark in Geist-based typography. The wordmark is completed by a custom X mark: `threvi` in Ink with the X as the signature accent.

### X Mark
The X mark represents two precise lines meeting at a verification point. It is a standalone signature mark and should remain optically balanced with consistent stroke weight, length, and angle. Do not repeat it decoratively across the interface.

Use the X mark only for:
- Project Rail verification points
- Change alignment
- Artifact review completed
- Synchronized state

### Brand concept
Threvix expresses precise review and alignment: a change moves from request to decision, then into verified artifacts. The X intersection is the visual metaphor for two lines of work meeting at one trusted point.

### Core colors
- **Ink** `#101317` — primary wordmark, headings, and high-emphasis text.
- **Signature** `#3A5092` — verification, alignment, active states, and primary actions.
- **Light** `#F2F2F1` — calm surfaces, light wordmark contexts, and restrained backgrounds.

Signature tints are allowed for interaction states:
- Signature subtle `#EEF1F8`
- Signature tint `#DDE3F2`
- Signature hover `#30447D`
- Signature strong `#2A3A70`

### Dark / Light usage
On dark surfaces, use Light for the wordmark and Signature for the X mark. On light surfaces, use Ink for the wordmark and Signature for the X mark. Keep contrast intentional and avoid turning every surface into a branded blue panel.

### Icon usage
Use icons to explain product state and actions, not as decoration. The X mark is reserved for verification, alignment, completion, and synchronization. Prefer the existing icon library for ordinary navigation and controls.

### Brand tone
Precise, calm, trustworthy, and operational. Use concise labels, clear status language, and restrained visual emphasis. Threvix should feel like a dependable B2B review layer rather than a playful consumer product.

## Product UI rules

- Keep the current information architecture and layout density.
- Use Geist for UI typography and Geist Mono only for technical identifiers or code-like values.
- Use semantic Signature tokens for active, hover, selected, and subtle-background states.
- Do not use arbitrary blue values such as `#2563EB` in product UI.
- Manyfast-style references may inform density and B2B SaaS interaction patterns only; brand identity always follows this foundation.
- Avoid decorative repetition of the X mark.
