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
