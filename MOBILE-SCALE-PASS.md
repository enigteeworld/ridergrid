# RiderGrid Mobile Scale Pass

This release builds on the mobile density/scrolling build and preserves its scrolling fixes.

## Changes
- Mobile (<768px) design scale normalized from a 16px rem baseline to 14px.
- Tablet (768–1023px) uses a 15px baseline.
- This is not CSS `zoom` or `transform: scale()`; component spacing and typography remain normal responsive layout values.
- Rider pages receive an additional compactness pass for cards, section gaps and large empty areas.
- Customer/rider shared mobile headers and bottom navigation are slightly shorter.
- Five-item mobile navigation remains intact.
- Form/touch controls retain minimum tap heights for usability.
- Existing mobile scroll-performance rules remain unchanged.

No database migration is required for this release.
