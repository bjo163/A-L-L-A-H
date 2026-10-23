# Lost Archives source inventory

Machine-readable source of truth: [`lost-archives.manifest.json`](../../data/moonwitness/lost-archives.manifest.json), validated against [`lost-archives.schema.json`](../../data/moonwitness/lost-archives.schema.json).

## Coverage snapshot

As of 2026-10-23, the manifest records 16 collection/discovery locators listed by epic #68, five user Library filenames from issue #69, one repository-present image, and three retrievable documents in the separately maintained `bjo163/dev-mw-blueprint` repository pinned at commit `cc53d63da1f34f69e20516a0b1c13514fa898725`.

| Measure | Count | Meaning |
| --- | ---: | --- |
| Collection/discovery references | 16 | Conversation/issue references only; not source manuscripts |
| Repo-present files | 1 | One image with SHA-256; story association and rights remain unknown |
| User Library locators | 5 | Filenames only; source bytes are not available in this workspace |
| External verified files | 3 | Public Markdown files pinned to a commit; license/editorial review remains open |
| Authorized private bytes captured | 0 | No private export was provided |
| Text reviewed / editorially approved / published | 0 / 0 / 0 | No archive content is approved or published by this inventory |

The issue titles establish discovery leads, not recovered content. The `GOD-PROMISE` Library filename and the separate public draft are distinct records; the external draft does not prove that it is identical to the private Library artifact. No counts are inferred from filenames or from the existence of a public draft.

## Handoff

1. Ask for authorized exports of private Library artifacts; record exact versions and hashes after receipt.
2. Review attribution, license, consent, privacy and classification before copying any source bytes into this repository.
3. Reconcile aliases and versions under #70; inventory original/derived media under #71; do not associate standalone images with story text without evidence.
4. Pass only reviewed, authorized manifest records to importer work under #39. The inventory does not grant publication approval.

Collection titles and source locators are taken from [epic #68](https://github.com/bjo163/A-L-L-A-H/issues/68), [issue #69](https://github.com/bjo163/A-L-L-A-H/issues/69), and the individual linked issue records. External source paths point to the pinned public repository revision recorded in each manifest entry.
