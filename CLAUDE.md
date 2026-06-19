# Project Sync Instructions for Claude Code

## Git Workflow — CRITICAL

This project is actively synced between two machines via GitHub.
After completing any meaningful change (a feature, a fix, a file edit),
you MUST commit and push immediately so the other machine can pull the
latest state. Do not batch multiple unrelated changes into one commit.

Steps to follow after every completed change:
1. `git add -A`
2. `git commit -m "<short, clear description of what changed>"`
3. `git push origin master`

If `git push` fails due to the remote having newer commits, run
`git pull origin master --rebase` first, resolve any conflicts, then push again.

Never force-push (`git push --force`) without explicit confirmation from the user.

## Classification Engine — Core Design Principle (PERMANENT RULE)

The classification engine's primary job is entity resolution across naming
variants, not literal string matching. This applies to expenses, accounts,
vendors, customers, and employees alike.

Real-world inputs will name the SAME underlying entity in different ways:
- Different accountants (or the same accountant in different files, or even
  within the same file) may phrase it differently
  e.g. "سفر وانتقالات" vs "مصاريف سفر وانتقالات"
- Word order may vary, words like "مصروف"/"مصاريف"/"رسوم" may be added or omitted
- Language may mix — Arabic, English, or partial transliteration
- Abbreviations, plural/singular forms, or minor spelling variants may appear

The engine MUST recognize these as the same entity and classify them under
one unified category/account, the same way it already does for cases like
the marketing/government-fees/stationery merge (item 2, commit 37180e0).

This is the opposite of treating similar-looking names as automatically
distinct "to be safe." Default behavior: if two names plausibly refer to
the same real-world thing, unify their classification.

Important distinction — this is about CLASSIFICATION, not about silently
rewriting source records: underlying transaction records and their original
text should remain traceable to their source. But the classification layer
(which category/account a transaction rolls up into) should treat all
recognized variants as one.

If a naming variant is genuinely ambiguous (could plausibly be a real,
distinct account/entity rather than just a phrasing difference), flag it
for user review with the specific candidates — don't silently guess, and
don't silently keep them split either.
