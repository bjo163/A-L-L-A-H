# Moonwitness and SHADOW UI review matrix

Use this matrix to record observed browser results for one exact deployed or
preview SHA. A source check is not a screenshot, and a fixture is not live data.
Do not mark a row verified without recording its browser, viewport, theme,
language, result, and screenshot path.

## Scope and route status

| Surface | Route | Current status |
| --- | --- | --- |
| Public home | / | Implemented Moonwitness experience |
| Public stories | /stories | Implemented explicit not-yet-available state; no published stories claimed |
| System atlas | /systems | Implemented public route |
| Readiness roadmap | /roadmap | Implemented public route |
| Operator workspace | /workspace | Private SHADOW entry; requires an operator session |
| Dedicated public login route | — | Not implemented; login is presented inside /workspace |
| Dedicated dashboard route | — | Not implemented; dashboard is the authenticated /workspace surface |

## Browser acceptance matrix

Run every public page at 1440, 1280, 768, 390, and 320 CSS pixels. Run
/workspace both without a session and with authorized test accounts. Repeat
the relevant flows in Indonesian and English, dark and light themes. Each
surface × viewport × theme × language × auth-state run is a separate evidence
row below; the summary rows here define coverage and are not themselves proof.

| Coverage set | Required observations | Completion |
| --- | --- | --- |
| `/` × five widths × dark/light × ID/EN | Layout/overflow, hero CTA geometry, screenshot | Captured in isolated headless Chrome; no horizontal overflow or sticker/CTA intersection |
| `/stories`, `/systems`, `/roadmap` × five widths × dark/light × ID/EN | Layout/overflow, images, keyboard/focus, touch, screenshot | Pending |
| `/workspace` anonymous × five widths × dark/light × ID/EN | Login surface, no protected data, keyboard/focus; disposable browser profile | Pending |
| `/workspace` authorized × five widths × dark/light × ID/EN × each test role | Actual data, empty/loading/error states, role-specific controls; disposable tenants only | Pending |

## Accessibility and performance checks

| Check | Result / evidence |
| --- | --- |
| UI boundary validator | `pnpm run validate` passed on `bc315e7595c6705b89c2a20494127d58621334cc`; 36 consumer files, no inline style props |
| Shared CSS selector scope | `pnpm run validate` passed on `bc315e7595c6705b89c2a20494127d58621334cc`; 1,814 scoped selectors |
| Theme contrast audit | `pnpm run validate` passed on `bc315e7595c6705b89c2a20494127d58621334cc`; repository token audit passes |
| Keyboard navigation and focus visibility | Pending browser verification |
| Forced-colors mode | Pending browser verification |
| Reduced motion | Static motion audit passes; browser verification pending |
| Touch target sizing | Pending browser measurement |
| Image loading, LCP, and CLS | Pending browser measurement |
| Comparative contact sheet | Pending browser screenshots |

## Evidence log

| Full SHA | Route / state | Width (CSS px) | Theme / language | Browser / environment | Result and defects | Screenshot / evidence path |
| --- | --- | --- | --- | --- | --- | --- |
| pending commit SHA | / anonymous | 1440 | dark / EN | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; desktop nav-toggle hidden; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/1440-dark-en.jpg) |
| pending commit SHA | / anonymous | 1440 | dark / ID | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; desktop nav-toggle hidden; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/1440-dark-id.jpg) |
| pending commit SHA | / anonymous | 1440 | light / EN | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; desktop nav-toggle hidden; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/1440-light-en.jpg) |
| pending commit SHA | / anonymous | 1440 | light / ID | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; desktop nav-toggle hidden; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/1440-light-id.jpg) |
| pending commit SHA | / anonymous | 1280 | dark / EN | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; desktop nav-toggle hidden; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/1280-dark-en.jpg) |
| pending commit SHA | / anonymous | 1280 | dark / ID | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; desktop nav-toggle hidden; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/1280-dark-id.jpg) |
| pending commit SHA | / anonymous | 1280 | light / EN | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; desktop nav-toggle hidden; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/1280-light-en.jpg) |
| pending commit SHA | / anonymous | 1280 | light / ID | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; desktop nav-toggle hidden; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/1280-light-id.jpg) |
| pending commit SHA | / anonymous | 768 | dark / EN | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; nav-toggle contrast 19.39:1; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/768-dark-en.jpg) |
| pending commit SHA | / anonymous | 768 | dark / ID | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; nav-toggle contrast 19.39:1; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/768-dark-id.jpg) |
| pending commit SHA | / anonymous | 768 | light / EN | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; nav-toggle contrast 20.38:1; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/768-light-en.jpg) |
| pending commit SHA | / anonymous | 768 | light / ID | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; nav-toggle contrast 20.38:1; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/768-light-id.jpg) |
| pending commit SHA | / anonymous | 390 | dark / EN | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; nav-toggle contrast 19.39:1; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/390-dark-en.jpg) |
| pending commit SHA | / anonymous | 390 | dark / ID | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; nav-toggle contrast 19.39:1; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/390-dark-id.jpg) |
| pending commit SHA | / anonymous | 390 | light / EN | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; nav-toggle contrast 20.38:1; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/390-light-en.jpg) |
| pending commit SHA | / anonymous | 390 | light / ID | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; nav-toggle contrast 20.38:1; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/390-light-id.jpg) |
| pending commit SHA | / anonymous | 320 | dark / EN | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; nav-toggle contrast 19.39:1; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/320-dark-en.jpg) |
| pending commit SHA | / anonymous | 320 | dark / ID | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; nav-toggle contrast 19.39:1; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/320-dark-id.jpg) |
| pending commit SHA | / anonymous | 320 | light / EN | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; nav-toggle contrast 20.38:1; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/320-light-en.jpg) |
| pending commit SHA | / anonymous | 320 | light / ID | Chromium headless 141.0.7390.37, isolated context, local dev | No horizontal overflow; nav-toggle contrast 20.38:1; sticker/CTA overlap 0 px² | [screenshot](ui-review/evidence/issue13-public-home/320-light-id.jpg) |

Record one row per run. Include the test role (or `anonymous`) in Route / state.
For a failure, link an issue or defect report and leave the relevant coverage
pending until it is fixed and recaptured. For a blocked run, record why and who
owns unblocking it; a blocked row is not a pass.

Never mark the issue complete while screenshot and browser rows remain pending.
