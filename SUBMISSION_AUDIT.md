# Submission audit

Checked against the live GenLayer Portal **Builder → Projects** form on 2026-10-20. The form showed two Project slots left for the week, seven required Project Explorer fields, a required website, and a required GitHub Repository evidence link. The Project quality guidance asks for a real trust problem, authoritative data, complete source and docs, a frontend that calls GenLayer and handles the transaction lifecycle, and meaningful differentiation.

## Evidence already established

- The StudioNet evidence probe finalized validator fetches of all three pinned raw GitHub files. `pnpm verify:probe` checks the receipts.
- The first repair attempt missed its revision cutoff and followed the deterministic refund path. The planned timeout path also finalized `REFUND`. Both sponsors claimed and withdrew their full 1 test GEN deposits. `pnpm verify:proof` and `pnpm verify:refund` check every receipt, deployed source byte equality, and final state.
- The repair-path covenant has a byte-identical deployment, sealed promise, 1 test GEN sponsorship, validator-upheld `BREAK`, one finalized revision, affirmative `REPAIRED` verdict, `PAY` settlement, and maintainer withdrawal. `pnpm verify:repair` checks every receipt and the final live state.
- The timeout path has a finalized expected rollback for an attempted duplicate challenge. The negative-evidence path finalized `INSUFFICIENT` for a quote missing from the pinned file and left the promise clean. A connected MetaMask and GenLayer Snap submitted an empty-pool settlement through the public Site; transaction `0x768ff5062fd25aa3c3a9fe43e2c813b4e6a70a37af3e0a6e68f5f3be6208632a` finalized successfully, and the Site displayed the resulting `PAY` state. `pnpm verify:negative` checks the receipts and state. The transaction trail persisted after a browser reload.
- The late-payable path finalized a refundable credit, withdrawal, and an empty-pool settlement. `pnpm verify:late-credit` checks it.
- The public Site's MetaMask and GenLayer Snap flow deployed a covenant, recorded and sealed the pinned promise, funded 0.01 test GEN, received a validator-upheld `BREAK`, settled `REFUND` after the revision cutoff, claimed the sponsor's refund, and withdrew it. All eight browser-wallet writes finalized successfully. `pnpm verify:wallet` checks deployed source bytes, receipts, validator votes, `REFUND` state, and zero remaining deposited and claimable balances.
- The public Site opens outside the owner session. Its Explore view loads latest-finalized StudioNet state without a wallet and labels recorded receipts separately. The app source has native wallet writes, transaction polling across reloads, and native appeal support.
- The [public GitHub repository](https://github.com/smokexbadlines-dot/release-covenant-genlayer) includes the deployed source commit and final proof manifests. The public Site includes a source link. The user explicitly approved public source and Site publication.

## Gates still open

- Native appeal is implemented in the app, but an appealable dispute has not been created solely to exercise that optional path in a browser. The main deploy, fund, challenge, refund, claim, and withdrawal path has finalized through the public browser app.
- The human owner must submit the Portal form. This repository supplies a draft; it does not submit the form.

## Differentiation risk

The user's earlier accepted PACTPROOF also uses validator-read GitHub evidence and deterministic GEN accounting. Release Covenant's claim is the two-round adversarial challenge, carried objection, positive cure judgment, and sponsor-specific timeout refunds. Policy Drift Firewall handles two-party reconsent after material policy revision, not a funded challenge and repair. These distinctions are documented in the README. Steward originality judgment remains external and cannot be guaranteed by tests.
