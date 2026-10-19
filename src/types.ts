export type Network = 'studionet';

export type PromiseState = 'CLEAN' | 'OPEN' | 'CARRIED' | 'REPAIRED';

export interface PromiseRecord {
  statement: string;
  baseline_path: string;
  baseline_quote: string;
  state: PromiseState;
  challenge_path: string;
  challenge_quote: string;
  challenge_sha: string;
}

export interface CovenantSnapshot {
  maintainer: string;
  repo: string;
  baseline_sha: string;
  release_sha: string;
  first_close: number;
  revision_deadline: number;
  final_close: number;
  sealed: boolean;
  round: number;
  outcome: 'PENDING' | 'PAY' | 'REFUND';
  total_sponsored_wei: string;
  promises: PromiseRecord[];
}

export interface AccountSnapshot {
  deposited_wei: string;
  claimable_wei: string;
}

export interface TrackedTransaction {
  hash: `0x${string}`;
  network: Network;
  address: string;
  action: string;
  submittedAt: number;
  status: string;
  execution: string;
}

export type Action =
  | 'add_promise'
  | 'seal'
  | 'sponsor'
  | 'challenge'
  | 'revise'
  | 'verify_repair'
  | 'settle'
  | 'claim_refund'
  | 'withdraw';
