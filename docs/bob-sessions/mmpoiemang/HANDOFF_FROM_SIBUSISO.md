# Handoff from Sibusiso — Mmopiemang

Please pull the latest `main` branch and use this checklist for your remaining
submission work.

## Do the recordings answer the evidence requirement?

Yes, the recordings are useful supporting evidence, but they are not enough by
themselves. The competition requires Bob task-session evidence in the repo:

1. A screenshot of Bob's **task session consumption summary**.
2. The matching Markdown file exported from Bob with **Export task history**.

The current screenshots in `docs/bob-sessions/mmpoiemang/` show useful workflow
states, but they do not replace those two official artifacts.

## Where to put the official artifacts

Put the files in the root-level folder below, not only under `docs/`:

```text
bob_sessions/mmpoiemang/
  01-task-consumption-summary.png
  01-task-history.md
```

If you are documenting another relevant Bob task, use the next matching pair:

```text
bob_sessions/mmpoiemang/
  02-task-consumption-summary.png
  02-task-history.md
```

In Bob, open **History**, select the task, open the task header, capture the
consumption summary, and then choose **Export task history** for that same task.
Do not create or edit these files by hand: they must be the real Bob outputs.

## What to update in the contribution log

After the files are added, update
`docs/bob-sessions/mmpoiemang/CONTRIBUTIONS.md` with:

- the Bob task date and prompt;
- what Bob actually did and which outputs were produced;
- the exact commit or checkout validated;
- the new screenshot and exported-history filenames;
- the command used to validate the final fixture and its result;
- an unlisted recording link, if you have one.

Do not commit large video files or put them in `README.md`; link to an unlisted
Drive/YouTube/Vimeo recording from the contribution log instead.

## Claims to correct before you mark this complete

- Keep the authoritative finding count aligned with the final recorded run.
  Clearly label historical counts such as 8 bugs, 12 defects, 42 findings, and
  the current 41-finding run instead of combining them.
- Remove the `2–4 hours` manual-investigation claim unless a timed, reproducible
  baseline exists.
- Do not present the existing 60.2-second recall run as speed evidence. If no
  valid blind baseline was measured, say so plainly and report the verified
  swarm result instead.
- Add `demo/sample-project/data/synthetic_input.json` and its local-only
  generation method to `docs/DATA_SOURCES.md`. Also record the origin/licence
  of any visual asset used in the submission.

## Definition of done

- [ ] Official screenshot and matching Bob-exported Markdown are in
  `bob_sessions/mmpoiemang/`.
- [ ] Contribution log records the exact validation command, result, and
  evidence filenames.
- [ ] Claims match the final run and do not imply an unmeasured speedup.
- [ ] Exports contain no API keys, credentials, personal information, private
  paths, or client data.
- [ ] Commit and push the changes, then send Sibusiso the commit hash.

Do not fabricate missing Bob evidence. If Bob cannot export a task history or
consumption summary, report that blocker in the contribution log instead.
