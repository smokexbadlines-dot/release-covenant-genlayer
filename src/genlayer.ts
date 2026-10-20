import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import type { TransactionHash } from 'genlayer-js/types';
import type { AccountSnapshot, CovenantSnapshot, Network } from './types';
import contractCode from '../contracts/release_covenant.py?raw';

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window { ethereum?: EthereumProvider }
}

const chains = { studionet } as const;
const addresses = /^0x[0-9a-fA-F]{40}$/;
const hashes = /^0x[0-9a-fA-F]{64}$/;

export function validAddress(value: string): value is `0x${string}` {
  return addresses.test(value);
}

export function validHash(value: string): value is `0x${string}` {
  return hashes.test(value);
}

export function chainFor(network: Network) { return chains[network]; }

export function readClient(network: Network) {
  return createClient({ chain: chainFor(network) });
}

export async function walletClient(network: Network, account: `0x${string}`) {
  if (!window.ethereum) throw new Error('No browser wallet was found. Install or open an EIP-1193 wallet.');
  const client = createClient({ chain: chainFor(network), account, provider: window.ethereum });
  await client.connect(network);
  return client;
}

export async function connectWallet(network: Network): Promise<`0x${string}`> {
  if (!window.ethereum) throw new Error('No browser wallet was found. Install or open an EIP-1193 wallet.');
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const account = Array.isArray(accounts) ? accounts[0] : undefined;
  if (typeof account !== 'string' || !validAddress(account)) throw new Error('Wallet did not return a valid address.');
  await walletClient(network, account);
  return account;
}

function parseJson<T>(value: unknown): T {
  if (typeof value !== 'string') throw new Error('Unexpected contract read format.');
  return JSON.parse(value) as T;
}

export async function readCovenant(network: Network, address: `0x${string}`): Promise<CovenantSnapshot> {
  const value = await readClient(network).readContract({
    address,
    functionName: 'get_snapshot',
    args: [],
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
  const snapshot = parseJson<CovenantSnapshot>(value);
  if (!snapshot.repo || !Array.isArray(snapshot.promises) || !snapshot.release_sha) {
    throw new Error('The address did not return a Release Covenant snapshot.');
  }
  return snapshot;
}

export async function readAccount(network: Network, address: `0x${string}`, account: `0x${string}`): Promise<AccountSnapshot> {
  const value = await readClient(network).readContract({
    address,
    functionName: 'get_account',
    args: [account],
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
  return parseJson<AccountSnapshot>(value);
}

export async function submitWrite(
  network: Network,
  address: `0x${string}`,
  account: `0x${string}`,
  functionName: string,
  args: (string | number | bigint)[],
  value = 0n,
): Promise<`0x${string}`> {
  const client = await walletClient(network, account);
  const result: unknown = await client.writeContract({ address, functionName, args, value });
  const hash = typeof result === 'string' ? result :
    result && typeof result === 'object' ?
      ('hash' in result ? result.hash : 'txId' in result ? result.txId : 'transactionHash' in result ? result.transactionHash : undefined) : undefined;
  if (typeof hash !== 'string' || !validHash(hash)) {
    throw new Error('Wallet submitted a write but did not return a recognizable GenLayer transaction ID. Inspect the wallet before retrying.');
  }
  return hash;
}

export async function deployCovenant(
  network: Network,
  account: `0x${string}`,
  args: (string | number)[],
): Promise<`0x${string}`> {
  const client = await walletClient(network, account);
  const result: unknown = await client.deployContract({ code: contractCode, args });
  if (typeof result !== 'string' || !validHash(result)) {
    throw new Error('Deployment may have been submitted, but the wallet did not return a recognizable transaction ID. Inspect the wallet before retrying.');
  }
  return result;
}

export async function transactionStatus(network: Network, hash: `0x${string}`) {
  const tx = await readClient(network).getTransaction({ hash: hash as TransactionHash });
  const decoded = tx.txDataDecoded;
  const contractAddress = decoded && 'contractAddress' in decoded ? decoded.contractAddress : tx.recipient;
  const receipts = (tx.consensus_data as { leader_receipt?: Array<{ mode?: string; execution_result?: string }> } | undefined)?.leader_receipt;
  const leader = receipts?.find(receipt => receipt.mode === 'leader');
  return {
    status: tx.statusName ?? 'UNKNOWN',
    execution: leader?.execution_result ?? 'UNKNOWN',
    contractAddress: typeof contractAddress === 'string' && validAddress(contractAddress) ? contractAddress : undefined,
  };
}

export async function appeal(network: Network, account: `0x${string}`, txId: `0x${string}`) {
  const client = await walletClient(network, account);
  const allowed = await client.canAppeal({ txId });
  if (!allowed) throw new Error('This transaction is not in an appealable state.');
  const charge = await client.getMinAppealBond({ txId });
  await client.appealTransaction({ txId, value: charge });
  return charge;
}

export function rawGitHub(repo: string, sha: string, path: string) {
  return `https://raw.githubusercontent.com/${repo}/${sha}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export function formatGen(wei: string) {
  try {
    const amount = BigInt(wei);
    const whole = amount / 10n ** 18n;
    const fraction = (amount % 10n ** 18n).toString().padStart(18, '0').slice(0, 4).replace(/0+$/, '');
    return `${whole}${fraction ? `.${fraction}` : ''} GEN`;
  } catch { return '—'; }
}

export function parseGen(value: string): bigint {
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(value)) throw new Error('Enter a valid GEN amount with up to 18 decimals.');
  const [whole, decimals = ''] = value.split('.');
  const wei = BigInt(whole) * 10n ** 18n + BigInt(decimals.padEnd(18, '0'));
  if (wei <= 0n) throw new Error('Amount must be greater than zero.');
  return wei;
}
