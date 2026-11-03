---
name: preview
description: Put one rig page on a public link for review, check the link like a stranger, and take the lane marker off it once the review is in. Use for a plan's "Preview for review" and "Clean up" issues (ADR 0003).
---

# preview

A preview is one HTML file of a rig page on a public host we can upload over (ADR 0003). This
repo's host is Cloudflare Pages, driven by `wrangler` signed in to the owner's account; any
static host with a CLI works the same way.

## Steps

1. Ask the human before the first upload: what goes up (the page, the template's sample data,
   the lane marker), where (the project and link), who can see it (anyone), and how to undo it
   (delete the project). Ask again before the marker-free upload.
2. Save the page by command, never by a browser's "save as":

   ```sh
   scripts/save-preview.sh 2026-10-28            # -> var/preview/index.html, marker from .env
   ```

3. Upload it. First time only: `wrangler pages project create <project> --production-branch main`.

   ```sh
   wrangler pages deploy var/preview --project-name <project> --branch main --commit-dirty=true
   ```

   The link is `https://<project>.pages.dev/`. Only that link goes to the reviewer; the
   per-deployment link wrangler prints is a second copy that cannot be uploaded over.
4. Check the link like a stranger before you send it: a plain fetch, not signed in, and compare
   the bytes with the saved file. Uploaded is not reachable.

   ```sh
   curl -fsS https://<project>.pages.dev/ | cmp - var/preview/index.html
   ```

5. Send the link. Leave the preview issue open until the reviewer has looked (skill
   `plan-to-issues`, "Issues that wait on someone else").
6. Once the review is in, with the human's yes: save again with the marker unset and upload over
   the same link, then check it again the same way.

   ```sh
   LANE_MARKER= scripts/save-preview.sh 2026-10-28 var/preview-clean/index.html
   wrangler pages deploy var/preview-clean --project-name <project> --branch main --commit-dirty=true
   curl -fsS https://<project>.pages.dev/ | grep -c 'no marker set'
   ```

## Don'ts

- Never commit anything under `var/`; previews never go into the repo, issues or chat.
- `wrangler` cannot delete a deployment. The per-deployment link of a marked upload keeps the
  marker until the human deletes that deployment in the Cloudflare dashboard, so do not share it.
