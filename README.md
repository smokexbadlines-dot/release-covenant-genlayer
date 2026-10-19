# Release Covenant

Release Covenant is a GenLayer Native app for a public software release promise. A sponsor funds a covenant, anyone can challenge one documented promise with commit-pinned GitHub evidence, and validators judge whether that exact evidence shows a break. The maintainer gets one revision round. An upheld objection must be positively repaired at the revised commit; unresolved objections trigger pull refunds at the deadline.

**Current state:** frontend and contract source are built; six direct-mode tests pass. StudioNet parsed the pinned-runner contract schema. No contract is deployed, no validator transaction is finalized, and `deploy/proof.json` deliberately records `not_deployed`. The hosted frontend is a private preview until on-chain proof exists.

## Mechanism

```mermaid
flowchart LR
  M[Maintainer: baseline and release commits] --> C[ReleaseCovenant]
  S[Sponsors: GEN] --> C
  X[Challenger: path and exact quote] --> J[GenLayer validators]
  C --> J
  J -->|BREAK / NO_BREAK / INSUFFICIENT| C
  C -->|upheld objection| R[One revision commit]
  R --> V[Validator repair check]
  V -->|affirmatively restored| C
  C -->|no open objection at close| P[Maintainer pull claim]
  C -->|unresolved at deadline| F[Sponsor pull refunds]
```

The model only returns a bounded label. Validators independently fetch both raw GitHub files at 40-character commits, verify the submitted quotes, and repeat the narrow judgment. The contract compares the entire state-affecting result: the label. File paths and quotes come from transaction inputs and are stored only after a `BREAK` verdict. A repair must receive `REPAIRED`, which requires affirmative evidence of restored behavior. Deterministic code controls deadlines, the one-revision limit, and every wei of the sponsor pool.

The initial round ends at `first_close`. With no upheld objection, anyone can settle and credit the maintainer. With an open objection, the maintainer may provide one new commit before `revision_deadline`. Each upheld objection is carried to round two and must be rechecked against the new commit. New challenges remain possible until `final_close`. Unresolved `OPEN` or `CARRIED` states cause refunds. A revision never silently clears an objection.

## Run locally

Requires Node.js 20+ and Python 3.12+.

```sh
pnpm install
pnpm dev
pnpm build
python -m pip install genlayer-test
python -m pytest tests/test_direct.py -q
```

The app uses the stable `genlayer-js` 1.1 line and StudioNet. A wallet and StudioNet test GEN are needed to deploy and write. The Create form deploys the included contract source; then the maintainer adds up to four promises and seals the covenant. Paste a deployed address into the Explore form for finalized reads. Submitted transaction IDs are kept in browser local storage and polled every eight seconds across reloads. The app checks status and execution separately and exposes native appeals during an appealable accepted state.

`node deploy/probe.mjs` asks StudioNet to parse the pinned-runner contract schema without signing or deploying. `pnpm verify:proof` checks source equality, finality, successful execution, and final state once `deploy/proof.json` has real receipts. It exits with `NO LIVE PROOF` today.

## Evidence contract

- Repository is a public `owner/repo` path. Baseline and release commits are full SHAs; paths are bounded and cannot contain traversal segments.
- Files must be UTF-8, HTTP 200, and at most 24 KB raw. Quotes must be exact substrings. Failure returns `INSUFFICIENT`, without opening or clearing an objection.
- The judgment concerns a **documented compatibility promise**. It does not prove runtime behavior, project ownership, or that an unchallenged promise is true.
- Anyone may instantiate a covenant naming any public GitHub repository. Sponsors should inspect the maintainer wallet, baseline quote, terms, and deadlines before funding.
- Raw GitHub reachability from a local browser does not prove validator reachability. Test it with an on-network fetch before relying on a demo repository.
- The Site preview is private and contains no fabricated on-chain receipts. A public GitHub repository and live deployment are separate publication steps.

## Safety and accounting

The contract accepts late or premature payable sponsorship into a direct refundable credit, avoiding trapped value if a failed payable call still credits the ghost contract. Valid sponsorship is recorded per address. Successful settlement credits the maintainer exactly the total sponsored amount. Refund settlement lets each sponsor move its exact recorded deposit into a pull credit. `withdraw()` clears the credit before emitting a finalized external transfer to the caller.

All consensus-critical source values are copied to locals before the nondeterministic closure. The validator re-fetches and re-judges; it rejects forged labels. External content is explicitly treated as untrusted prompt data. The contract has finite promise count, evidence size, windows, and revision count.

## What remains before a live release

1. Select a real public repository with three suitable pinned commits, then probe the exact raw files from StudioNet validators.
2. Deploy with a funded wallet, record `FINALIZED` and `FINISHED_WITH_RETURN` for deployment and each demonstration transaction, and read back finalized state.
3. Exercise funding, valid and invalid challenge, carried repair, native appeal, settlement, refund, and withdrawal in a real browser wallet.
4. Fill `deploy/proof.json` with the deployed address, SHA-256 of the exact source, transaction IDs, and expected snapshot; run the read-only verifier. Publish a source-linked repository only after the evidence is complete.

For a code walk-through, see [tutorial.md](tutorial.md). GenLayer API references: [nondeterministic operations](https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/non-deterministic-operations-handling), [storage](https://docs.genlayer.com/developers/intelligent-contracts/storage), [value transfers](https://docs.genlayer.com/developers/intelligent-contracts/features/value-transfers), [StudioNet](https://docs.genlayer.com/developers/networks), [direct-mode testing](https://docs.genlayer.com/developers/intelligent-contracts/testing).
