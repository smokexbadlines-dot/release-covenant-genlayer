import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight, ArrowUpRight, Check, Clock3, Code2, ExternalLink,
  GitBranch, Layers3, Link2, LockKeyhole, RefreshCcw, ShieldCheck, Wallet,
} from 'lucide-react';
import {
  appeal, connectWallet, deployCovenant, formatGen, parseGen, rawGitHub,
  readAccount, readCovenant, submitWrite, transactionStatus, validAddress,
} from './genlayer';
import type { AccountSnapshot, Action, CovenantSnapshot, Network, TrackedTransaction } from './types';
import './styles.css';

const TX_KEY = 'release-covenant-transactions-v1';
const ADDRESS_KEY = 'release-covenant-address-v1';
const networkNames: Record<Network, string> = { studionet: 'StudioNet' };
const explorerBase: Record<Network, string> = {
  studionet: 'https://explorer-studio.genlayer.com',
};

function restoreTransactions(): TrackedTransaction[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(TX_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 40) : [];
  } catch { return []; }
}

function short(value: string, size = 8) {
  return value.length > size * 2 ? `${value.slice(0, size)}…${value.slice(-size)}` : value;
}

function date(value: number) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value * 1000));
}

function datetimeInput(days: number) {
  const d = new Date(Date.now() + days * 86400_000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const actionLabels: Record<Action, string> = {
  add_promise: 'Add promise', seal: 'Seal covenant', sponsor: 'Sponsor release',
  challenge: 'Challenge a promise', revise: 'Submit revision',
  verify_repair: 'Verify a repair', settle: 'Settle covenant',
  claim_refund: 'Claim refund', withdraw: 'Withdraw GEN',
};

function App() {
  const network: Network = 'studionet';
  const [addressInput, setAddressInput] = useState(localStorage.getItem(ADDRESS_KEY) || '');
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [snapshot, setSnapshot] = useState<CovenantSnapshot | null>(null);
  const [accountState, setAccountState] = useState<AccountSnapshot | null>(null);
  const [transactions, setTransactions] = useState<TrackedTransaction[]>(restoreTransactions);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState<'explore' | 'create'>('explore');
  const [action, setAction] = useState<Action>('challenge');
  const [copied, setCopied] = useState(false);

  useEffect(() => { localStorage.setItem(TX_KEY, JSON.stringify(transactions)); }, [transactions]);

  const refresh = useCallback(async (nextAddress = address, nextNetwork = network, nextAccount = account) => {
    if (!nextAddress) return;
    setLoading(true);
    setError('');
    try {
      const result = await readCovenant(nextNetwork, nextAddress);
      setSnapshot(result);
      setAccountState(nextAccount ? await readAccount(nextNetwork, nextAddress, nextAccount) : null);
    } catch (cause) {
      setSnapshot(null);
      setAccountState(null);
      setError(cause instanceof Error ? cause.message : 'Could not read the contract.');
    } finally { setLoading(false); }
  }, [address, network, account]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const candidate = params.get('contract') || localStorage.getItem(ADDRESS_KEY) || '';
    if (validAddress(candidate)) {
      setAddress(candidate);
      setAddressInput(candidate);
    }
  }, []);

  useEffect(() => { if (address) void refresh(address, network, account); }, [address, network, account, refresh]);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      const pending = transactions.filter(tx => !['FINALIZED', 'CANCELED', 'UNDETERMINED'].includes(tx.status));
      if (!pending.length) return;
      const updates = await Promise.all(pending.map(async tx => {
        try { return { hash: tx.hash, ...(await transactionStatus(tx.network, tx.hash)) }; }
        catch { return null; }
      }));
      if (!alive) return;
      setTransactions(previous => previous.map(tx => {
        const found = updates.find(item => item?.hash === tx.hash);
        return found ? { ...tx, status: found.status, execution: found.execution } : tx;
      }));
      for (const item of updates) {
        if (item?.status === 'FINALIZED' && item.execution === 'FINISHED_WITH_RETURN') {
          if (item.contractAddress && validAddress(item.contractAddress)) {
            setAddress(item.contractAddress);
            setAddressInput(item.contractAddress);
            localStorage.setItem(ADDRESS_KEY, item.contractAddress);
          }
          if (address) void refresh(address, network, account);
        }
      }
    };
    void poll();
    const timer = setInterval(() => void poll(), 8000);
    return () => { alive = false; clearInterval(timer); };
  }, [transactions, address, network, account, refresh]);

  const latest = transactions.filter(tx => tx.network === network && (!address || tx.address === address || tx.address === 'deployment')).slice(0, 6);
  const isMaintainer = Boolean(account && snapshot && account.toLowerCase() === snapshot.maintainer.toLowerCase());
  const openCount = snapshot?.promises.filter(item => item.state === 'OPEN' || item.state === 'CARRIED').length ?? 0;
  const finalStatus = snapshot?.outcome === 'PAY' ? 'Released' : snapshot?.outcome === 'REFUND' ? 'Refunding' : snapshot?.round === 2 ? 'Revision round' : 'Challenge round';

  const availableActions = useMemo<Action[]>(() => {
    if (!snapshot) return [];
    const now = Date.now() / 1000;
    const values: Action[] = [];
    if (snapshot.outcome === 'PENDING') {
      if (!snapshot.sealed && isMaintainer && now < snapshot.first_close) values.push('add_promise', 'seal');
      if (snapshot.sealed && now < snapshot.first_close) values.push('sponsor');
      if (snapshot.sealed && now < (snapshot.round === 1 ? snapshot.first_close : snapshot.final_close)) {
        if (snapshot.promises.some(item => item.state === 'CLEAN' || item.state === 'REPAIRED')) values.push('challenge');
        if (snapshot.round === 2 && snapshot.promises.some(item => item.state === 'CARRIED')) values.push('verify_repair');
      }
      if (isMaintainer && snapshot.round === 1 && now >= snapshot.first_close && now < snapshot.revision_deadline && openCount) values.push('revise');
      if (snapshot.sealed && (snapshot.round === 1 ? now >= snapshot.first_close && (!openCount || now >= snapshot.revision_deadline) : now >= snapshot.final_close)) values.push('settle');
    }
    if (snapshot.outcome === 'REFUND' && accountState && BigInt(accountState.deposited_wei) > 0n) values.push('claim_refund');
    if (accountState && BigInt(accountState.claimable_wei) > 0n) values.push('withdraw');
    return values;
  }, [snapshot, isMaintainer, openCount, accountState]);

  useEffect(() => {
    if (availableActions.length && !availableActions.includes(action)) setAction(availableActions[0]);
  }, [availableActions, action]);

  const selectablePromises = snapshot?.promises.map((item, index) => ({ item, index })).filter(({ item }) =>
    action === 'verify_repair' ? item.state === 'CARRIED' : item.state === 'CLEAN' || item.state === 'REPAIRED',
  ) ?? [];

  const track = (hash: `0x${string}`, label: string, contractAddress = address || 'deployment') => {
    setTransactions(previous => [{
      hash, network, address: contractAddress, action: label, submittedAt: Date.now(),
      status: 'PENDING', execution: 'UNKNOWN',
    }, ...previous.filter(tx => tx.hash !== hash)].slice(0, 40));
    setNotice(`Submitted ${label.toLowerCase()}. Finality can take several minutes; tracking continues after reload.`);
  };

  const loadContract = (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(''); setError('');
    const candidate = addressInput.trim();
    if (!validAddress(candidate)) { setError('Enter a valid 0x contract address.'); return; }
    setAddress(candidate);
    localStorage.setItem(ADDRESS_KEY, candidate);
    const params = new URLSearchParams(location.search);
    params.set('contract', candidate);
    history.replaceState(null, '', `${location.pathname}?${params}`);
    setMode('explore');
  };

  const handleConnect = async () => {
    setError('');
    try { setAccount(await connectWallet(network)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not connect wallet.'); }
  };

  const handleDeploy = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setNotice('');
    if (!account) { setError('Connect a wallet to deploy.'); return; }
    const fields = new FormData(event.currentTarget);
    const repo = String(fields.get('repo') || '').trim();
    const baseline = String(fields.get('baseline') || '').trim();
    const release = String(fields.get('release') || '').trim();
    const times = ['first', 'revision', 'final'].map(key => Math.floor(new Date(String(fields.get(key))).getTime() / 1000));
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) { setError('Use a GitHub owner/repository path.'); return; }
    if (![baseline, release].every(value => /^[0-9a-fA-F]{40}$/.test(value))) { setError('Use full 40-character commit SHAs.'); return; }
    if (times.some(value => !Number.isFinite(value)) || !(Date.now() / 1000 + 3600 <= times[0] && times[0] < times[1] && times[1] < times[2])) {
      setError('Choose ordered deadlines, with the first at least one hour from now.'); return;
    }
    setBusy(true);
    try { track(await deployCovenant(network, account, [repo, baseline, release, ...times]), 'Deploy covenant', 'deployment'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Deployment failed.'); }
    finally { setBusy(false); }
  };

  const handleAction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setNotice('');
    if (!address || !account) { setError('Load a contract and connect a wallet first.'); return; }
    const fields = new FormData(event.currentTarget);
    const string = (key: string) => String(fields.get(key) || '').trim();
    const index = Number(string('index'));
    let args: (string | number | bigint)[] = [];
    let value = 0n;
    try {
      if (action === 'add_promise') args = [string('statement'), string('path'), string('quote')];
      if (action === 'sponsor') value = parseGen(string('amount'));
      if (action === 'challenge' || action === 'verify_repair') {
        if (!Number.isInteger(index) || index < 0 || index >= (snapshot?.promises.length ?? 0)) throw new Error('Choose a promise.');
        args = [index, string('path'), string('quote')];
      }
      if (action === 'revise') args = [string('sha')];
      if (['add_promise', 'challenge', 'verify_repair'].includes(action) && (!string('path') || !string('quote'))) throw new Error('File path and exact quote are required.');
      if (action === 'revise' && !/^[0-9a-fA-F]{40}$/.test(string('sha'))) throw new Error('Use a full 40-character commit SHA.');
      setBusy(true);
      track(await submitWrite(network, address, account, action, args, value), actionLabels[action]);
      event.currentTarget.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Transaction could not be submitted.');
    } finally { setBusy(false); }
  };

  const handleAppeal = async (hash: `0x${string}`) => {
    setError(''); setNotice('');
    if (!account) { setError('Connect a wallet to appeal.'); return; }
    setBusy(true);
    try { const charge = await appeal(network, account, hash); setNotice(`Native appeal submitted. Quoted charge: ${formatGen(charge.toString())}.`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Appeal failed.'); }
    finally { setBusy(false); }
  };

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Layers3 size={19} strokeWidth={2.4} /></span><span>release<span className="brand-accent">covenant</span></span></div>
      <div className="topbar-actions">
        <span className="network-select"><span className="network-dot" /><span>StudioNet</span></span>
        <button className="wallet-button" onClick={handleConnect}><Wallet size={15} />{account ? short(account, 5) : 'Connect wallet'}</button>
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> GENLAYER NATIVE · RELEASE ASSURANCE</div>
          <h1>Make every release<br /><em>answerable.</em></h1>
          <p>Fund a public software promise. Challenge a breaking release with pinned evidence. Let independent validators judge the claim and its repair.</p>
          <div className="hero-buttons"><button className="primary-button" onClick={() => { setMode('explore'); document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' }); }}>Explore a covenant <ArrowRight size={17} /></button><button className="text-button" onClick={() => { setMode('create'); document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' }); }}>Create new <ArrowUpRight size={16} /></button></div>
        </div>
        <div className="hero-art" aria-label="Challenge to repair protocol diagram">
          <div className="art-grid" />
          <div className="art-label top">THE RELEASE PROTOCOL <span>01 / 03</span></div>
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="art-core"><ShieldCheck size={36} strokeWidth={1.4} /><span>ONE<br />PROMISE</span></div>
          <div className="art-node node-a"><span className="node-number">01</span><strong>Freeze</strong><small>public promise</small></div>
          <div className="art-node node-b"><span className="node-number">02</span><strong>Challenge</strong><small>pinned evidence</small></div>
          <div className="art-node node-c"><span className="node-number">03</span><strong>Repair</strong><small>verified revision</small></div>
          <div className="art-label bottom">INTERPRETATION BY VALIDATORS <span>·</span> SETTLEMENT BY CODE</div>
        </div>
      </section>

      <section className="stats-strip" aria-label="Protocol principles"><div><span className="stat-icon"><GitBranch size={18} /></span><span><b>Commit-pinned</b><small>Evidence stays verifiable</small></span></div><div><span className="stat-icon"><ShieldCheck size={18} /></span><span><b>Validator judged</b><small>One claim per transaction</small></span></div><div><span className="stat-icon"><LockKeyhole size={18} /></span><span><b>Code settled</b><small>Fixed deadlines and refunds</small></span></div></section>

      <section id="workspace" className="workspace">
        <div className="section-heading"><div><div className="section-kicker">THE WORKSPACE</div><h2>Release desk<span className="green-dot">.</span></h2><p>Finalized on-chain state is shown separately from transaction progress.</p></div><div className="view-tabs"><button className={mode === 'explore' ? 'active' : ''} onClick={() => setMode('explore')}>Explore</button><button className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>Create</button></div></div>

        {error && <div className="alert error" role="alert"><span>{error}</span><button onClick={() => setError('')}>Dismiss</button></div>}
        {notice && <div className="alert notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')}>Dismiss</button></div>}

        {mode === 'create' ? <div className="workspace-grid create-grid"><div className="panel create-panel"><div className="panel-top"><span className="panel-tag">01 · NEW COVENANT</span><Code2 size={18} /></div><h3>Commit to a release.</h3><p className="panel-intro">Deploy a covenant, then add up to four promises and seal it before the first challenge window closes.</p><form onSubmit={handleDeploy} className="field-grid"><label className="full">GitHub repository <span>owner/repo</span><input name="repo" placeholder="your-org/your-project" required /></label><label>Baseline commit SHA<input name="baseline" placeholder="40-character SHA" minLength={40} maxLength={40} required /></label><label>Candidate release SHA<input name="release" placeholder="40-character SHA" minLength={40} maxLength={40} required /></label><label>First challenge closes<input name="first" type="datetime-local" defaultValue={datetimeInput(1)} required /></label><label>Revision deadline<input name="revision" type="datetime-local" defaultValue={datetimeInput(2)} required /></label><label className="full">Final challenge closes<input name="final" type="datetime-local" defaultValue={datetimeInput(3)} required /></label><div className="form-footer"><span>Wallet deploys on {networkNames[network]}. Transactions require test GEN.</span><button className="primary-button" disabled={busy}>{busy ? 'Waiting for wallet…' : 'Deploy covenant'} <ArrowRight size={16} /></button></div></form></div><aside className="panel aside-panel"><div className="panel-tag">HOW IT WORKS</div><div className="mini-step"><span>01</span><div><strong>Publish the terms</strong><p>Freeze a baseline commit and clear compatibility promises.</p></div></div><div className="mini-step"><span>02</span><div><strong>Open to challenge</strong><p>Sponsors fund. Anyone cites a precise breaking change at the release commit.</p></div></div><div className="mini-step"><span>03</span><div><strong>Repair or refund</strong><p>One new commit gets another challenge round. Unresolved objections refund sponsors.</p></div></div><p className="aside-note">The contract checks cited quotes and asks validators to interpret a narrow contradiction. It does not audit all code.</p></aside></div> : <>
          <div className="load-row"><form onSubmit={loadContract} className="address-form"><Link2 size={17} /><input aria-label="Contract address" placeholder="Paste a Release Covenant contract address (0x…)" value={addressInput} onChange={event => setAddressInput(event.target.value)} /><button disabled={loading}>{loading ? 'Loading…' : 'Load contract'} <ArrowRight size={15} /></button></form>{snapshot && <button className="refresh-button" aria-label="Refresh finalized state" onClick={() => void refresh()}><RefreshCcw size={17} /></button>}</div>
          {snapshot ? <div className="workspace-grid">
            <div className="main-column"><div className="panel covenant-panel"><div className="panel-top"><span className="panel-tag">FINALIZED CONTRACT STATE</span><span className={`status-pill ${snapshot.outcome.toLowerCase()}`}><span />{finalStatus}</span></div><div className="covenant-title"><div><h3>{snapshot.repo}</h3><p>Release commitment · Round {snapshot.round} of 2</p></div><button onClick={copyAddress} className="copy-button">{copied ? <Check size={14} /> : <Link2 size={14} />}{short(address || '')}</button></div><div className="metric-row"><div><small>SPONSOR POOL</small><strong>{formatGen(snapshot.total_sponsored_wei)}</strong></div><div><small>OPEN OBJECTIONS</small><strong>{openCount.toString().padStart(2, '0')}</strong></div><div><small>PROMISES</small><strong>{snapshot.promises.length.toString().padStart(2, '0')} / 04</strong></div></div><div className="commit-grid"><div><small>BASELINE COMMIT</small><a href={`https://github.com/${snapshot.repo}/tree/${snapshot.baseline_sha}`} target="_blank" rel="noreferrer">{short(snapshot.baseline_sha, 7)} <ExternalLink size={12} /></a></div><div><small>CURRENT RELEASE COMMIT</small><a href={`https://github.com/${snapshot.repo}/tree/${snapshot.release_sha}`} target="_blank" rel="noreferrer">{short(snapshot.release_sha, 7)} <ExternalLink size={12} /></a></div></div></div>
              <div className="promise-header"><div><div className="section-kicker">THE PUBLIC TERMS</div><h3>Promises & objections</h3></div><span>{snapshot.promises.length} total</span></div>
              {snapshot.promises.length ? snapshot.promises.map((item, index) => <article className="promise-card" key={index}><div className="promise-top"><span className="promise-index">P{String(index + 1).padStart(2, '0')}</span><span className={`promise-state ${item.state.toLowerCase()}`}>{item.state === 'CLEAN' ? 'No open objection' : item.state === 'OPEN' ? 'Break upheld' : item.state === 'CARRIED' ? 'Repair check due' : 'Repair verified'}</span></div><h4>{item.statement}</h4><div className="evidence-block"><span>BASELINE EVIDENCE</span><p>“{item.baseline_quote}”</p><a href={rawGitHub(snapshot.repo, snapshot.baseline_sha, item.baseline_path)} target="_blank" rel="noreferrer">{item.baseline_path} <ArrowUpRight size={13} /></a></div>{item.challenge_path && <div className="evidence-block challenge-evidence"><span>{item.state === 'REPAIRED' ? 'REPAIR EVIDENCE' : 'CHALLENGE EVIDENCE'}</span><p>“{item.challenge_quote}”</p><a href={rawGitHub(snapshot.repo, item.challenge_sha || snapshot.release_sha, item.challenge_path)} target="_blank" rel="noreferrer">{item.challenge_path} <ArrowUpRight size={13} /></a></div>}</article>) : <div className="empty-promises">The maintainer has not added promises yet.</div>}
            </div>
            <aside className="side-column"><div className="panel timeline-panel"><div className="panel-tag">SETTLEMENT CLOCK</div><div className="timeline-row"><span className="timeline-marker" /><div><strong>First challenge close</strong><small>{date(snapshot.first_close)}</small></div></div><div className="timeline-row"><span className="timeline-marker" /><div><strong>Revision cutoff</strong><small>{date(snapshot.revision_deadline)}</small></div></div><div className="timeline-row"><span className="timeline-marker" /><div><strong>Final close</strong><small>{date(snapshot.final_close)}</small></div></div><div className="timeline-foot"><Clock3 size={15} /> Times are displayed in your local timezone.</div></div>
              {accountState && <div className="panel account-panel"><div className="panel-tag">YOUR FINALIZED BALANCE</div><div><span>Sponsored</span><strong>{formatGen(accountState.deposited_wei)}</strong></div><div><span>Claimable</span><strong>{formatGen(accountState.claimable_wei)}</strong></div></div>}
              <div className="panel action-panel"><div className="panel-tag">TAKE ACTION</div><h3>Move the covenant.</h3>{availableActions.length ? <form onSubmit={handleAction}><label>Action<select value={action} onChange={event => setAction(event.target.value as Action)}>{availableActions.map(item => <option key={item} value={item}>{actionLabels[item]}</option>)}</select></label>{action === 'add_promise' && <><label>Promise statement<textarea name="statement" placeholder="The documented CSV export remains available to existing users." required minLength={20} maxLength={240} /></label><label>Baseline file path<input name="path" placeholder="docs/api.md" required /></label><label>Exact baseline quote<textarea name="quote" placeholder="Copy verbatim from the pinned file" required /></label></>}{action === 'sponsor' && <label>Amount in GEN<input name="amount" inputMode="decimal" placeholder="0.01" required /></label>}{(action === 'challenge' || action === 'verify_repair') && <><label>Promise<select name="index" required>{selectablePromises.map(({ item, index }) => <option key={index} value={index}>P{String(index + 1).padStart(2, '0')} · {item.statement.slice(0, 44)}</option>)}</select></label><label>File path at current release commit<input name="path" placeholder="docs/api.md" required /></label><label>Exact quote from that file<textarea name="quote" placeholder="Copy verbatim; validators fetch and verify it" required /></label></>}{action === 'revise' && <label>New release commit SHA<input name="sha" placeholder="40-character SHA" minLength={40} maxLength={40} required /></label>}<button className="primary-button action-submit" disabled={busy || !account}>{busy ? 'Waiting for wallet…' : account ? actionLabels[action] : 'Connect wallet first'} <ArrowRight size={16} /></button></form> : <p className="no-action">No action is currently available for this covenant and connected account.</p>}<p>Each write is tracked below. A submitted or accepted write is not shown as final proof.</p></div>
            </aside>
          </div> : <div className="empty-workspace"><div className="empty-symbol"><GitBranch size={33} strokeWidth={1.3} /></div><div className="section-kicker">READY TO EXPLORE</div><h3>Enter a contract address<br />to see its live state.</h3><p>Read finalized promises, funding, objections, and claims without connecting a wallet. A wallet is needed only to write or appeal.</p><div className="empty-note"><ShieldCheck size={15} /> No demo receipts are presented as live proof.</div></div>}
        </>}
      </section>

      <section className="activity-section"><div className="activity-heading"><div><div className="section-kicker">CONSENSUS ACTIVITY</div><h2>Transaction trail<span className="green-dot">.</span></h2><p>Saved in this browser so pending transactions resume after reload.</p></div><span className="activity-count">{latest.length} RECENT</span></div>{latest.length ? <div className="activity-list">{latest.map(tx => <div className="activity-item" key={tx.hash}><div className={`activity-icon ${tx.status.toLowerCase()}`}>{tx.status === 'FINALIZED' && tx.execution === 'FINISHED_WITH_RETURN' ? <Check size={18} /> : <Clock3 size={18} />}</div><div className="activity-main"><strong>{tx.action}</strong><small>{new Date(tx.submittedAt).toLocaleString()} · {short(tx.hash, 9)}</small></div><div className="activity-state"><strong>{tx.status.replaceAll('_', ' ')}</strong><small>{tx.execution.replaceAll('_', ' ')}</small></div><div className="activity-links"><a href={`${explorerBase[tx.network]}/transactions/${tx.hash}`} target="_blank" rel="noreferrer" aria-label="View transaction in explorer"><ArrowUpRight size={17} /></a>{tx.status === 'ACCEPTED' && <button disabled={busy} onClick={() => void handleAppeal(tx.hash)}>Appeal</button>}</div></div>)}</div> : <div className="activity-empty">No locally tracked transactions yet. Submitted writes will appear here.</div>}</section>

      <section className="closing-strip"><div><div className="section-kicker">DESIGNED FOR ACCOUNTABILITY</div><h2>Every objection has a path.<br /><em>Every path has an end.</em></h2></div><div><p>Validators interpret a bounded public claim. The contract enforces one revision, two challenge windows, and deterministic payment or refunds.</p><a href="https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/non-deterministic-operations-handling" target="_blank" rel="noreferrer">How GenLayer judges <ArrowUpRight size={16} /></a></div></section>
    </main>
    <footer><div className="brand"><span className="brand-mark"><Layers3 size={16} /></span><span>release<span className="brand-accent">covenant</span></span></div><span>Built for GenLayer · Source and contract included</span><span>Protocol preview · No deployment proof recorded</span></footer>
  </div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
