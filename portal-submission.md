# Portal submission draft

**Contribution type:** Builder → Projects. The live Portal form showed two Project slots left this week when checked on 2026-10-20. The user submits the Portal form.

**Project name:** Release Covenant

**Primary tag:** Dispute Resolution

**Optional topic tags:** Evidence Assessment; Escrow Claims.

**One-liner:** A GenLayer release covenant lets validators uphold a specific compatibility break, carries the objection through one repair attempt, then deterministically pays or refunds test GEN.

**Description (under 1,000 characters):** Release Covenant turns a public software compatibility promise into a two-round challenge protocol. A maintainer pins baseline and release commits; sponsors fund test GEN. A challenger supplies an exact quote and file path at the release commit. GenLayer validators independently fetch both pinned files, confirm the quotes, and judge one bounded break. An upheld objection stays open through a single revision until validators affirmatively verify repair. Code controls the windows and pull payments. The live historical replay proves an upheld Python 3.10 break, a carried objection, an affirmative repair, `PAY` settlement and 1 test GEN withdrawal. Separate cases prove an expected duplicate-challenge rollback, missing-quote rejection, and two completed refunds. It interprets quoted source, not runtime behavior or upstream endorsement.

**Reviewer steps:** Open the app without a wallet. Read recorded proof and the live finalized covenant state. Open the raw-file links. Follow the `BREAK`, revision, `REPAIRED`, `PAY`, and withdrawal receipts, then the separate refund and rejection cases. The Browser wallet flow card shows an independently finalized deploy, fund, challenge, refund, claim, and withdrawal through the public app. Run the read-only proof commands in the README against StudioNet.

**How-to steps for the Project Explorer form:**

1. Open the public app. Its Explore view loads the recorded covenant from finalized StudioNet state without a wallet.
2. Inspect the promise, baseline and release quotes, one-GEN pool, and current outcome. Open the raw commit-pinned evidence links.
3. Open the challenge, revision, repair, settlement, and withdrawal receipts from the Recorded proof panel. Check transaction finality and leader execution separately. Inspect the two refund cases and expected duplicate rollback.
4. Open the public repository; run `pnpm install`, then the `verify:fixture`, `verify:probe`, `verify:repair`, `verify:proof`, `verify:refund`, `verify:negative`, `verify:late-credit`, and `verify:wallet` scripts for independent read-only checks.

**Expected outcome:** The repair-path covenant carried an objection into round two, accepted an affirmative `REPAIRED` verdict, settled `PAY`, and let the maintainer withdraw exactly 1 test GEN. The two separate missed-revision cases left objections open, settled `REFUND`, and let sponsors claim and withdraw exact deposits. The duplicate challenge finalized as an expected rollback with no changed state.

**Evidence links:**

- App: https://release-covenant-genlayer-20261020.opalfairy1.chatgpt.site/
- Browser-wallet contract: https://explorer-studio.genlayer.com/address/0x4d0a6f9e3998e14C3f7e48EE54560f9Fb6cbB2f9
- Browser-wallet `REFUND` settlement: https://explorer-studio.genlayer.com/tx/0x83415929bea547fcd32c52c7b69dc8ed21fc5586590f212eb783781b0f8bd893
- Browser-wallet refund withdrawal: https://explorer-studio.genlayer.com/tx/0xc59662a5e6c3fc63a76ee1d11d6980acc96fc2fbaac9a6476540d90925f5546a
- Fresh repair contract: https://explorer-studio.genlayer.com/address/0x73F1Fc96b0bb6B07E7D6158Cc50c7C2cC58c01cD

- Missed-revision refund contract: https://explorer-studio.genlayer.com/address/0xA001240a6DFA94492678F11Aed8FC23f7c4600f3
- Timeout refund contract: https://explorer-studio.genlayer.com/address/0x4a91df32Cad47C5a2FBac95C9C396Ffda05584A4
- Upheld fresh challenge: https://explorer-studio.genlayer.com/tx/0x0560564724b64940b3fc565bcfbadef8d435e34699629732c04ae1c085125078
- Pinned repair revision: https://explorer-studio.genlayer.com/tx/0x41272b62e6b60e1d77bb8856d482de6897a97f28ca3f92d10a805ca000212006
- Affirmative repair: https://explorer-studio.genlayer.com/tx/0xc9de117e53a1b6e272377b527fa35c817479d1f5d21c0d31ef883f562baa4a69
- PAY settlement: https://explorer-studio.genlayer.com/tx/0xcfd8fc53499adfadeb724b7fc67df76186c25006ee3f800f4ac06a0fa0484d6e
- Maintainer withdrawal: https://explorer-studio.genlayer.com/tx/0xad886ccb56cf521f29999658fb64c2ef48e86f6ebf4d2a468e34e0eb094a2cd9
- Expected duplicate rollback: https://explorer-studio.genlayer.com/tx/0xac6f826a85d0b6941bba6e320ddd353bf8aef81fe9ddb0583d198bd95a559133
- Public repository: https://github.com/smokexbadlines-dot/release-covenant-genlayer
- Deployed source commit: https://github.com/smokexbadlines-dot/release-covenant-genlayer/commit/be7aaabf1c2510b95a5951f73300edacff2415fd

The user submits the Portal form after reviewing this draft.
