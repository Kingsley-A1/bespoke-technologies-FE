# Bespoke AI design QA

- Source visual truth: user-provided Bespoke AI desktop reference image in the conversation (`752 x 564` px). Its dark frame is intentionally adapted to the requested Bespoke white-and-blue product palette.
- Implementation route: `/bespoke-ai`.
- Implementation screenshots: `qa/ai/bespoke-ai-empty-desktop.png` and `qa/ai/bespoke-ai-empty-mobile.png`.
- Desktop comparison viewport: `752 x 564` CSS px, device scale factor `1`; both source and implementation are `752 x 564` px, so no density normalization was needed.
- Mobile responsive viewport: `390 x 844` CSS px, device scale factor `1`.
- State: anonymous public empty state, first rotating greeting, no conversation history open.
- Browser: Microsoft Edge (headless CDP).

**Full-view comparison evidence**

The reference and Edge-rendered desktop capture were reviewed at the matching `752 x 564` composition. The implementation preserves the reference hierarchy—quiet workspace frame, visual focal point above the greeting, three distinct suggestion choices, and an immediately available composer—while applying the user-requested white/blue Bespoke interpretation. The source’s dark sidebar/frame is intentionally omitted below the desktop rail breakpoint so the public entry state remains clear on smaller desktop windows.

**Focused-region comparison evidence**

The hero, three quick-start cards, and composer were inspected as the focused regions because they carry the core task. No separate crop was needed: all controls remain legible and fully visible in the full-size desktop capture.

**Required fidelity surfaces**

- Fonts and typography: clear display hierarchy, compact UI label scale, and no truncation in the desktop or mobile capture.
- Spacing and layout rhythm: the 56 px header and short-desktop composition keep the composer within view; mobile stacks the three cards without horizontal overflow.
- Colors and visual tokens: white canvas, Bespoke blue action accents, slate text hierarchy, and restrained translucent blue art are consistent with the requested palette.
- Image quality and asset fidelity: the generated translucent blue orb is a real raster asset (`public/ai/bespoke-ai-glass-orb.png`), remains sharp at desktop scale, and is correctly cropped rather than recreated with CSS art.
- Copy and content: the public greeting is direct, motivational, and supported by exactly three plain-language starting paths.

**Findings**

- [Resolved P2] Composer was clipped below the supplied desktop reference viewport.
  Location: public AI empty state at `752 x 564`.
  Evidence: first Edge capture had the composer bottom at `592 px` for a `564 px` viewport.
  Fix: made the empty state fill its available flex region and added a compact short-desktop layout for its spacing, suggestions, and textarea.
  Post-fix evidence: final Edge capture places the composer at `381–538 px`, fully within the `564 px` viewport.

No actionable P0/P1/P2 differences remain. The white/blue palette and reduced chrome are intentional adaptations requested for Bespoke rather than fidelity drift from the dark visual reference.

**Primary interactions and browser checks**

- Confirmed exactly three quick-start controls.
- Confirmed the message input has an associated accessible label and accepts typed text.
- Confirmed composer visibility and no horizontal overflow at desktop and mobile viewports.
- Checked browser console: no errors or warnings.

**Implementation Checklist**

- [x] Empty-state hierarchy and three quick starts.
- [x] Composer remains visible at the reference desktop viewport.
- [x] Mobile stack remains usable.
- [x] Edge console is clean.

**Follow-up Polish**

- [P3] Validate streamed response and API-error visuals once a local Google AI key is available; this pass intentionally stayed on the anonymous empty state so it could remain credential-independent.

final result: passed
