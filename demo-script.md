# Two-minute Release Covenant demo

The [hosted app](https://release-covenant-genlayer-20261020.opalfairy1.chatgpt.site/) defaults to the recorded repair-path covenant. It is a private preview until publication. This is an independent replay of public `facelessuser/pymdown-extensions` history, not an agreement with that project's maintainer.

**0:00–0:25 — State the mechanism.** A maintainer freezes one compatibility promise with a baseline commit and quote. A sponsor puts test GEN at risk. Anyone cites a path and exact quote at a candidate release commit. Validators fetch both commit-pinned files and decide one bounded `BREAK`, `NO_BREAK`, or `INSUFFICIENT` label. Code alone controls deadlines and payouts.

**0:25–0:55 — Show the upheld objection.** On the app's Explore view, identify the baseline `requires-python = ">=3.10"` and candidate release `requires-python = ">=3.11"` quotes. Open both raw GitHub links. The live finalized state should show one open objection and 1 GEN total sponsored. In Recorded proof, open the `upheld Python 3.10 break` [transaction](https://explorer-studio.genlayer.com/tx/0xcbeface54701eac7186b73920893db57bc099b150fa4c68c7d33d77612aac30f). Its result is `BREAK`; the proof verifier checks finality, leader success, agreeing validators, source bytes, and on-chain state.

**0:55–1:25 — Show the repair path.** The [repair-path proof](deploy/proof.json) tracks the first close, one revision commit, the carried objection, a positive repair judgment, settlement, and maintainer pull claim. After the live repair steps finalize, open their explorer links in the manifest. The carried objection must remain until a `REPAIRED` verdict.

**1:25–1:50 — Show the refund path.** The [timeout-path proof](deploy/refund-proof.json) uses a separate 1 GEN covenant with the same upheld break. Its [duplicate challenge](https://explorer-studio.genlayer.com/tx/0xac6f826a85d0b6941bba6e320ddd353bf8aef81fe9ddb0583d198bd95a559133) finalized with leader `ERROR`, rolling back with `promise already has an open challenge`. No revision is submitted. After the deadline, open the `REFUND`, claim, and withdrawal receipts.

**1:50–2:00 — Verify.** Run `pnpm verify:fixture`, `pnpm verify:probe`, `pnpm verify:proof`, `pnpm verify:refund`, and `pnpm verify:late-credit`. The last manifest demonstrates that a late payable sponsorship became a withdrawable credit without entering the sponsor pool.
