# NOFO.bio

**NOFO** = Notice of Funding Opportunity. The federal term NIH, NSF, ARPA-H, and BARDA use for a published funding announcement.

Funding for healthtech founders and biomedical PIs — grants, SBIRs, fellowships, accelerators, prizes, credit programs. Medical, healthcare, digital health, AI. US, UK, EU.

## What it is

A single-file static HTML page — no build step, no backend, no dependencies. Open `index.html` in a browser, or visit the live site at [nofo.bio](https://nofo.bio).

Each entry tags the opportunity type, the domain, and the region. Specific NOFOs/RFAs with hard deadlines are flagged separately from standing programs. Entries with no region tag default to `us` at render time.

## How it's maintained

- AI-assisted research, human-reviewed before each entry lands.
- Every entry links to the funder's source page — that's the authoritative record.
- `LAST_UPDATED` in the script reflects the most recent verification.
- Specific calls capture the official NOFO/RFA ID in the title.
- Passed-deadline cards are hidden by default. Switch the **Status** filter to "Show passed too" to see them.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
