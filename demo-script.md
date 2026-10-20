# Two-minute Release Covenant demo

The [public app](https://release-covenant-genlayer-20261020.opalfairy1.chatgpt.site/) defaults to the completed repair path. This is an independent replay of public `facelessuser/pymdown-extensions` history, not an agreement with that project's maintainer. Every step is recorded in `deploy/repair-proof.json`.

**0:00–0:25 — State the mechanism.** A maintainer freezes a compatibility promise with a baseline commit and quote. A sponsor puts test GEN at risk. Anyone cites a path and exact quote at a candidate release commit. Validators fetch both commit-pinned files and decide one bounded `BREAK`, `NO_BREAK`, or `INSUFFICIENT` label. Code controls deadlines and payouts.

**0:25–0:55 — Show the upheld objection.** In Explore, identify the baseline `requires-python = ">=3.10"` and candidate release `requires-python = ">=3.11"` quotes. Open both raw GitHub links. The latest finalized state shows the current covenant. In Recorded proof, open the fresh [challenge transaction](https://explorer-studio.genlayer.com/tx/0x0560564724b64940b3fc565bcfbadef8d435e34699629732c04ae1c085125078). It finalized with `BREAK` and agreeing validators.

**0:55–1:25 — Show the timeout consequence.** The [planned timeout proof](deploy/refund-proof.json) is a separate 1 GEN covenant with the same upheld break. Its [duplicate challenge](https://explorer-studio.genlayer.com/tx/0xac6f826a85d0b6941bba6e320ddd353bf8aef81fe9ddb0583d198bd95a559133) finalized with leader `ERROR` and no state change. No revision was submitted. Open its finalized `REFUND`, claim, and withdrawal receipts. The [first repair attempt](deploy/proof.json) missed the revision cutoff and also refunded; it is labeled as such.

**1:25–1:50 — Show the cure gate.** The [repair proof](deploy/repair-proof.json) shows the maintainer's revision after first close, the carried objection's separate `REPAIRED` verdict, `PAY` settlement after final close, and the 1 test GEN withdrawal. Open each finalized receipt.

**1:50–2:00 — Verify.** Run `pnpm verify:fixture`, `pnpm verify:probe`, `pnpm verify:repair`, `pnpm verify:proof`, `pnpm verify:refund`, `pnpm verify:negative`, and `pnpm verify:late-credit`. These commands read StudioNet; they do not submit transactions.
