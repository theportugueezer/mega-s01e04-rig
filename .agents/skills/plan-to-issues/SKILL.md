---
name: plan-to-issues
description: Split this repo's plan.md into GitHub issues with gh, one per unit of work, after a human has reviewed the split. Use when a plan is ready and has no issues yet.
---

# plan-to-issues

Turns `plan.md` into GitHub issues that workers can pick up cold. Easiest with `gh`, authenticated,
in a shell this agent can run.

## Steps

1. Read `plan.md`, `AGENTS.md` and `docs/adr/`.
2. Draft the split as a table: title · plan section · scope · done when · blocked by.
   One issue per unit of work.
3. **Stop and show the table to the human.** Publish nothing until they approve it.
4. Every issue here carries this, so workers and the reviewer can sort them cold
   (agreed with the human on 2026-11-03; change it here, not in chat):

   - Title: the plan section's own name (`Run log reader`, `Digest page: GET /digest/:night`).
   - Label: `plan:<plan name>` from `plan.md`'s frontmatter (`plan:morning-digest`). Create it
     once with `gh label create`.
   - Body, in this order:

     ```md
     Source: plan.md § <n>

     ## Scope
     <the section's text, as written>

     ## Done when
     <the section's "Done when", as written>

     ## Blocked by
     <#n, …>, or `none`
     ```

   Ask the human only when a plan needs something beyond this.
5. Create each issue in dependency order, so blocked-by can cite real numbers:

   ```sh
   gh issue create --title "<title>" --label "plan:<plan name>" --body-file <tmp.md>
   ```

6. Record every issue URL from gh's output (not from memory) and reply with the list.

## Issues that wait on someone else

An issue whose "Done when" needs the other side (a reviewer's look, a reply, a sign-off) stays
open until they have confirmed, even when our part is sent. The reviewer reads the open issue;
closing it at send time reads as "nothing to look at". The clean-up step that follows (a preview
losing its marker, ADR 0003) is blocked by that confirmation, not by the send.

Closing one, with the closing comment from AGENTS.md:

```sh
gh issue close <n> -c "<closing comment>"
```

## No `gh`

Steps 1–4 hold either way. GitHub reachable another way (a connector, the REST API, the web UI):
the same issues, made that way. GitHub issues out of reach altogether: write them as files in
`docs/issues/`, format in ADR 0004, then commit and push.

## Don'ts

- Don't paste the whole plan into one issue, and don't keep issues only in chat.
- Don't invent sections the plan doesn't have. If the plan is unclear, ask.
