# Portal submission draft

**Contribution type:** Project / deployed Intelligent Contract. A public source repository and reviewable app URL are still required before using this draft.

**One-liner:** A GenLayer release covenant lets validators uphold a specific compatibility break, carries the objection through one repair attempt, then deterministically pays or refunds test GEN.

**Description (under 1,000 characters):** Release Covenant turns a public software compatibility promise into a two-round challenge protocol. A maintainer pins baseline and release commits; sponsors fund test GEN. A challenger supplies an exact quote and file path at the release commit. GenLayer validators independently fetch both pinned files, confirm the quotes, and judge one bounded break. An upheld objection stays open through a single revision until validators affirmatively verify repair. Code controls the windows and pull payments. The live historical replay shows an upheld Python 3.10 compatibility break, a guarded duplicate challenge, and separate repair and timeout-refund paths. It demonstrates interpretation of quoted source, not runtime behavior or endorsement by the upstream project.

**Reviewer steps:** Open the app without a wallet. Read the recorded proof and the live finalized covenant state. Open baseline and release raw-file links. Follow the challenge receipt to its `BREAK` verdict, then the repair and refund receipts in their manifests. Run the read-only proof commands in the README against StudioNet. Use the app's wallet controls only if you want to create or challenge a new test covenant.

**Expected outcome:** The repair-path covenant should carry an objection into round two, accept an affirmative repair, settle `PAY`, and let the maintainer withdraw the exact sponsor total. The timeout-path covenant should leave the objection open, settle `REFUND`, and let the sponsor claim and withdraw the exact deposit. The duplicate challenge should finalize as an expected rollback with no changed state.

**Evidence links:**

- App: https://release-covenant-genlayer-20261020.opalfairy1.chatgpt.site/
- Repair contract: https://explorer-studio.genlayer.com/address/0xA001240a6DFA94492678F11Aed8FC23f7c4600f3
- Timeout refund contract: https://explorer-studio.genlayer.com/address/0x4a91df32Cad47C5a2FBac95C9C396Ffda05584A4
- Upheld challenge: https://explorer-studio.genlayer.com/tx/0xcbeface54701eac7186b73920893db57bc099b150fa4c68c7d33d77612aac30f
- Expected duplicate rollback: https://explorer-studio.genlayer.com/tx/0xac6f826a85d0b6941bba6e320ddd353bf8aef81fe9ddb0583d198bd95a559133
- Public repository and source permalink: pending explicit visibility approval.

The user submits the Portal form after reviewing this draft.
