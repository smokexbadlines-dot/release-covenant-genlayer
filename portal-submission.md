# Portal submission draft

**Contribution type:** Builder → Projects. The live Portal form showed two Project slots left this week when checked on 2026-10-20. Complete the live repair path and public source links before using this draft. The user submits the Portal form.

**Project name:** Release Covenant

**Primary tag:** Dispute Resolution

**One-liner:** A GenLayer release covenant lets validators uphold a specific compatibility break, carries the objection through one repair attempt, then deterministically pays or refunds test GEN.

**Description (under 1,000 characters):** Release Covenant turns a public software compatibility promise into a two-round challenge protocol. A maintainer pins baseline and release commits; sponsors fund test GEN. A challenger supplies an exact quote and file path at the release commit. GenLayer validators independently fetch both pinned files, confirm the quotes, and judge one bounded break. An upheld objection stays open through a single revision until validators affirmatively verify repair. Code controls the windows and pull payments. The live historical replay proves an upheld Python 3.10 compatibility break, a guarded duplicate challenge, and two completed timeout refunds. A fresh repair attempt is in progress. It demonstrates interpretation of quoted source, not runtime behavior or endorsement by the upstream project.

**Reviewer steps:** Open the app without a wallet. Read the recorded proof and the live finalized covenant state. Open baseline and release raw-file links. Follow the challenge receipt to its `BREAK` verdict and the completed refund receipts. After the fresh repair path finishes, follow its revision, repair, settlement, and payout receipts. Run the read-only proof commands in the README against StudioNet.

**How-to steps for the Project Explorer form:**

1. Open the public app. Its Explore view loads the recorded covenant from finalized StudioNet state without a wallet.
2. Inspect the promise, baseline and release quotes, one-GEN pool, and current outcome. Open the raw commit-pinned evidence links.
3. Open the challenge, settlement, claim, and withdrawal receipts from the Recorded proof panel. The repair attempt is labeled in progress until its own receipts finalize. Check transaction finality and leader execution separately.
4. Open the public repository; run `pnpm install`, then `pnpm verify:fixture`, `pnpm verify:probe`, `pnpm verify:proof`, `pnpm verify:refund`, and `pnpm verify:repair` for independent read-only checks.

**Expected outcome:** The fresh repair-path covenant should carry an objection into round two, accept an affirmative repair, settle `PAY`, and let the maintainer withdraw the exact sponsor total. This remains a pending live gate. The two completed timeout cases left objections open, settled `REFUND`, and let sponsors claim and withdraw exact deposits. The duplicate challenge finalized as an expected rollback with no changed state.

**Evidence links:**

- App: https://release-covenant-genlayer-20261020.opalfairy1.chatgpt.site/
- Fresh repair contract: https://explorer-studio.genlayer.com/address/0x73F1Fc96b0bb6B07E7D6158Cc50c7C2cC58c01cD

- Missed-revision refund contract: https://explorer-studio.genlayer.com/address/0xA001240a6DFA94492678F11Aed8FC23f7c4600f3
- Timeout refund contract: https://explorer-studio.genlayer.com/address/0x4a91df32Cad47C5a2FBac95C9C396Ffda05584A4
- Upheld fresh challenge: https://explorer-studio.genlayer.com/tx/0x0560564724b64940b3fc565bcfbadef8d435e34699629732c04ae1c085125078
- Expected duplicate rollback: https://explorer-studio.genlayer.com/tx/0xac6f826a85d0b6941bba6e320ddd353bf8aef81fe9ddb0583d198bd95a559133
- Public repository: https://github.com/smokexbadlines-dot/release-covenant-genlayer
- Deployed source commit: https://github.com/smokexbadlines-dot/release-covenant-genlayer/commit/be7aaabf1c2510b95a5951f73300edacff2415fd

The user submits the Portal form after reviewing this draft.
