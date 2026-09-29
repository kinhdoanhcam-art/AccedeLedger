import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Clipboard,
  ExternalLink,
  FilePlus2,
  Fingerprint,
  Gavel,
  History,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Wallet,
} from "lucide-react";
import {
  CONTRACT_ADDRESS,
  CONTRACT_EXPLORER_URL,
  EXPLORER_BASE,
  MAX_LABEL_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_TEXT_LENGTH,
  SOURCE_SHA256,
  STUDIONET_CHAIN_ID,
} from "./lib/config";
import { errorMessage } from "./lib/errors";
import {
  connectStudioNet,
  connectedWallet,
  getContestNote,
  getLimits,
  getPerformances,
  getUndertaking,
  readOutcome,
  requestWallet,
  writeContract,
} from "./lib/genlayer";
import { normalizeId, pyStrip, short, undertakingId, validId } from "./lib/id";
import type { Limits, Performance, TxState, Undertaking } from "./lib/types";
import { decideWrite, expectedNewUndertaking } from "./lib/verify";

type View = "ledger" | "open" | "protocol";

const EMPTY_TX: TxState = {
  kind: "idle",
  message: "No transaction submitted in this session.",
};

const ALLOW_DUPLICATE_SEND =
  import.meta.env.VITE_ALLOW_DUPLICATE_SEND === "1" &&
  new URLSearchParams(window.location.search).get("duplicate-proof") === "1";

function stateTone(value: string) {
  if (value === "EFFECTIVE") return "good";
  if (value === "DECLINED") return "bad";
  return "waiting";
}

function copyText(value: string) {
  return navigator.clipboard.writeText(value);
}

export default function App() {
  const [view, setView] = useState<View>("ledger");
  const [account, setAccount] = useState("");
  const [limits, setLimits] = useState<Limits | null>(null);
  const [protocolError, setProtocolError] = useState("");

  const [idInput, setIdInput] = useState("");
  const [record, setRecord] = useState<Undertaking | null>(null);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [contestNote, setContestNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tx, setTx] = useState<TxState>(EMPTY_TX);

  const [counterparty, setCounterparty] = useState("");
  const [label, setLabel] = useState("");
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [contest, setContest] = useState("");

  useEffect(() => {
    connectedWallet().then(setAccount).catch(() => undefined);
    getLimits()
      .then(setLimits)
      .catch((error) => setProtocolError(errorMessage(error)));

    if (!window.ethereum?.on) return;
    const onAccounts = (accounts: string[]) => {
      setAccount(accounts?.[0] ?? "");
      setTx({ kind: "idle", message: "Wallet changed. Reload state before writing." });
    };
    const onChain = () => {
      setRecord(null);
      setPerformances([]);
      setContestNote("");
      setTx({ kind: "idle", message: "Network changed. Load the undertaking again." });
    };
    window.ethereum.on("accountsChanged", onAccounts as any);
    window.ethereum.on("chainChanged", onChain as any);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", onAccounts as any);
      window.ethereum?.removeListener?.("chainChanged", onChain as any);
    };
  }, []);

  const roles = useMemo(() => {
    const wallet = account.toLowerCase();
    return {
      creator: Boolean(record && wallet && record.creator.toLowerCase() === wallet),
      counterparty: Boolean(
        record && wallet && record.counterparty_wallet.toLowerCase() === wallet
      ),
    };
  }, [account, record]);

  async function connect() {
    try {
      const wallet = await requestWallet();
      await connectStudioNet();
      setAccount(wallet);
      setTx({ kind: "success", message: "Wallet connected to StudioNet." });
    } catch (error) {
      setTx({ kind: "error", message: errorMessage(error) });
    }
  }

  async function readRecord(id: string, announce = true): Promise<Undertaking> {
    const normalized = normalizeId(id);
    if (!validId(normalized)) throw new Error("Enter a valid 64-character undertaking ID.");
    const next = await getUndertaking(normalized);
    const [nextPerformances, nextContest] = await Promise.all([
      getPerformances(normalized),
      getContestNote(normalized),
    ]);
    setIdInput(normalized);
    setRecord(next);
    setPerformances(nextPerformances);
    setContestNote(nextContest);
    if (announce) setTx({ kind: "success", message: "Accepted on-chain state loaded." });
    return next;
  }

  async function loadRecord() {
    setLoading(true);
    try {
      await readRecord(idInput);
    } catch (error) {
      setTx({ kind: "error", message: errorMessage(error) });
      setRecord(null);
      setPerformances([]);
      setContestNote("");
    } finally {
      setLoading(false);
    }
  }

  async function verifyWrite(
    hash: string,
    id: string,
    accepted: (next: Undertaking) => boolean
  ) {
    const decision = await decideWrite({
      hash,
      readOutcome,
      readRecord: () => readRecord(id, false),
      accepted,
    });
    setTx({ ...decision, hash });

    // Refresh a stale record only for display after a rollback. decideWrite has
    // already rejected the receipt and never uses this state as success proof.
    if (decision.kind === "error" && decision.message.startsWith("Transaction rolled back:")) {
      await readRecord(id, false).catch(() => undefined);
    }
  }

  async function runWrite(
    method: string,
    args: unknown[],
    id: string,
    accepted: (next: Undertaking) => boolean
  ) {
    if (!account) {
      setTx({ kind: "error", message: "Connect a wallet first." });
      return;
    }
    if (busy) return;
    setBusy(true);
    setTx({ kind: "signing", message: "Confirm the transaction in MetaMask." });
    try {
      await connectStudioNet();
      const hash = await writeContract(account, method, args);
      setIdInput(id);
      setView("ledger");
      setTx({
        kind: "submitted",
        hash,
        message: "Submitted. Waiting for consensus and accepted-state proof.",
      });
      await verifyWrite(hash, id, accepted);
    } catch (error) {
      setTx({ kind: "error", message: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  async function openUndertaking() {
    if (!account) return setTx({ kind: "error", message: "Connect the author wallet first." });
    const submittedWallet = counterparty.trim().toLowerCase();
    const submittedLabel = pyStrip(label);
    const submittedText = pyStrip(text);
    if (!/^0x[0-9a-fA-F]{40}$/.test(submittedWallet)) {
      return setTx({ kind: "error", message: "Enter a valid counterparty wallet." });
    }
    if (!submittedLabel || [...submittedLabel].length > MAX_LABEL_LENGTH) {
      return setTx({ kind: "error", message: `Counterparty label must be 1–${MAX_LABEL_LENGTH} characters.` });
    }
    if (!submittedText || [...submittedText].length > MAX_TEXT_LENGTH) {
      return setTx({ kind: "error", message: `Undertaking text must be 1–${MAX_TEXT_LENGTH} characters.` });
    }
    const id = undertakingId(account, text);

    if (!ALLOW_DUPLICATE_SEND) {
      const existing = await getUndertaking(id).catch(() => null);
      if (existing?.undertaking_id === id) {
        setIdInput(id);
        setView("ledger");
        await readRecord(id, false).catch(() => {
          setRecord(existing);
          setPerformances([]);
          setContestNote("");
        });
        setTx({
          kind: "error",
          message:
            `You already opened an undertaking with this exact text (counterparty ${short(existing.counterparty_wallet)}). ` +
            "The id is derived from your address and the text only, so the same text cannot be opened twice. " +
            "Change the wording to bind a different counterparty.",
        });
        return;
      }
    }

    await runWrite(
      "open_undertaking",
      [submittedWallet, submittedLabel, submittedText],
      id,
      expectedNewUndertaking({
        id,
        account,
        wallet: submittedWallet,
        label: submittedLabel,
        text: submittedText,
      })
    );
  }

  async function accede() {
    if (!record) return;
    // Receipt success is the first gate; this predicate proves the caller-specific post-state.
    await runWrite("accede", [record.undertaking_id], record.undertaking_id, (next) =>
      next.state === "EFFECTIVE" && next.acceded_by.toLowerCase() === account.toLowerCase()
    );
  }

  async function decline() {
    if (!record) return;
    // Receipt success is the first gate; this predicate proves the deterministic post-state.
    await runWrite("decline", [record.undertaking_id], record.undertaking_id, (next) =>
      next.state === "DECLINED" && next.acceded_by === ""
    );
  }

  async function recordPerformance() {
    if (!record) return;
    if (!note.trim() || note.trim().length > MAX_NOTE_LENGTH) {
      return setTx({ kind: "error", message: `Performance note must be 1–${MAX_NOTE_LENGTH} characters.` });
    }
    const before = record.performance_count;
    await runWrite(
      "record_performance",
      [record.undertaking_id, note.trim()],
      record.undertaking_id,
      (next) => next.performance_count === before + 1
    );
    setNote("");
  }

  async function contestUndertaking() {
    if (!record) return;
    if (!contest.trim() || contest.trim().length > MAX_NOTE_LENGTH) {
      return setTx({ kind: "error", message: `Contest note must be 1–${MAX_NOTE_LENGTH} characters.` });
    }
    // Receipt success is the first gate; this predicate cannot rescue a rolled-back repeat.
    await runWrite(
      "contest",
      [record.undertaking_id, contest.trim()],
      record.undertaking_id,
      (next) => next.contested
    );
    setContest("");
  }

  const txUrl = tx.hash ? `${EXPLORER_BASE}/tx/${tx.hash}` : "";

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("ledger")} aria-label="AccedeLedger home">
          <img src="/accedeledger-mark.svg" alt="" />
          <span>
            <strong>AccedeLedger</strong>
            <small>OUTSIDE DUTY CONTROL</small>
          </span>
        </button>
        <nav aria-label="Primary">
          <button className={view === "ledger" ? "active" : ""} onClick={() => setView("ledger")}>Ledger</button>
          <button className={view === "open" ? "active" : ""} onClick={() => setView("open")}>Open</button>
          <button className={view === "protocol" ? "active" : ""} onClick={() => setView("protocol")}>Protocol</button>
        </nav>
        <button className="wallet-button" onClick={connect}>
          <Wallet size={17} /> {account ? short(account, 6, 4) : "Connect wallet"}
        </button>
      </header>

      <div className="network-strip">
        <span><i /> StudioNet / {STUDIONET_CHAIN_ID}</span>
        <a href={CONTRACT_EXPLORER_URL} target="_blank" rel="noreferrer">
          Project contract {short(CONTRACT_ADDRESS)} <ExternalLink size={13} />
        </a>
      </div>

      <main>
        {view === "ledger" && (
          <>
            <section className="hero compact">
              <div>
                <p className="eyebrow">READ-ONLY BEFORE WALLET</p>
                <h1>One undertaking.<br /><em>One accountable edge.</em></h1>
                <p className="hero-copy">Load any undertaking ID to see who authored it, whether another wallet must accede, and which consequences are still available.</p>
              </div>
              <div className="load-panel">
                <label htmlFor="undertaking-id">Undertaking ID</label>
                <div className="input-action">
                  <input
                    id="undertaking-id"
                    value={idInput}
                    onChange={(event) => setIdInput(event.target.value)}
                    placeholder="64-character id"
                  />
                  <button className="primary" onClick={loadRecord} disabled={loading}>
                    {loading ? <LoaderCircle className="spin" size={18} /> : <BookOpen size={18} />}
                    Load
                  </button>
                </div>
                <p>No wallet is required to inspect accepted state.</p>
              </div>
            </section>

            <TxBanner tx={tx} txUrl={txUrl} />

            {!record ? (
              <section className="empty-ledger">
                <Fingerprint size={30} />
                <h2>No undertaking loaded</h2>
                <p>Paste an existing ID, or open a new undertaking from the Open tab.</p>
                <button className="text-button" onClick={() => setView("open")}>Open an undertaking <ArrowRight size={16} /></button>
              </section>
            ) : (
              <section className="ledger-grid">
                <article className="record-card">
                  <div className="record-head">
                    <div>
                      <p className="eyebrow">ACCEPTED STATE</p>
                      <h2>{record.counterparty_label}</h2>
                    </div>
                    <button className="icon-button" onClick={() => copyText(record.undertaking_id)} title="Copy ID"><Clipboard size={17} /></button>
                  </div>
                  <blockquote>{record.text}</blockquote>
                  <div className="status-row">
                    <Status label={record.outcome} tone={record.outcome === "AUTHOR_ONLY" ? "neutral" : "accent"} />
                    <Status label={record.state} tone={stateTone(record.state)} />
                    {record.contested && <Status label="CONTESTED" tone="bad" />}
                  </div>
                  <dl className="facts">
                    <div><dt>Author</dt><dd>{short(record.creator)}</dd></div>
                    <div><dt>Counterparty</dt><dd>{short(record.counterparty_wallet)}</dd></div>
                    <div><dt>Acceded by</dt><dd>{record.acceded_by ? short(record.acceded_by) : "—"}</dd></div>
                    <div><dt>Performance records</dt><dd>{record.performance_count}</dd></div>
                  </dl>
                  <button className="refresh-button" onClick={() => readRecord(record.undertaking_id)} disabled={loading || busy}>
                    <RefreshCw size={16} /> Refresh accepted state
                  </button>
                </article>

                <aside className="action-stack">
                  <section className="role-card">
                    <p className="eyebrow">CONNECTED ROLE</p>
                    <h3>{!account ? "Wallet not connected" : roles.creator ? "Author" : roles.counterparty ? "Named counterparty" : "Observer"}</h3>
                    <p>The contract—not this interface—enforces every role and transition.</p>
                  </section>

                  {record.state === "AWAITING_ACCESSION" && (
                    <section className="action-card">
                      <UserCheck size={22} />
                      <div><h3>Counterparty decision</h3><p>Accede to activate, or decline irreversibly.</p></div>
                      <div className="dual-buttons">
                        <button className="primary" onClick={accede} disabled={busy || !roles.counterparty}>Accede</button>
                        <button className="danger-outline" onClick={decline} disabled={busy || !roles.counterparty}>Decline</button>
                      </div>
                    </section>
                  )}

                  <section className="action-card">
                    <History size={22} />
                    <div><h3>Record performance</h3><p>Available only to the author while effective and uncontested.</p></div>
                    <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="What performance occurred?" maxLength={MAX_NOTE_LENGTH} />
                    <button className="primary" onClick={recordPerformance} disabled={busy || !roles.creator || record.state !== "EFFECTIVE" || record.contested}>Record</button>
                  </section>

                  <section className="action-card">
                    <Gavel size={22} />
                    <div><h3>Contest undertaking</h3><p>The named counterparty may contest once after effectiveness.</p></div>
                    <textarea value={contest} onChange={(event) => setContest(event.target.value)} placeholder="Why is this contested?" maxLength={MAX_NOTE_LENGTH} />
                    <button className="danger-outline" onClick={contestUndertaking} disabled={busy || !roles.counterparty || record.state !== "EFFECTIVE" || record.contested}>Contest</button>
                  </section>
                </aside>

                <article className="history-card">
                  <div className="section-title"><History size={19} /><h2>Performance ledger</h2><span>{performances.length}</span></div>
                  {performances.length === 0 ? <p className="muted">No performance has been recorded.</p> : (
                    <ol>{performances.map((item) => <li key={item.index}><span>{String(item.index + 1).padStart(2, "0")}</span><p>{item.note}</p></li>)}</ol>
                  )}
                </article>

                <article className={`contest-card ${record.contested ? "is-contested" : ""}`}>
                  <div className="section-title"><Gavel size={19} /><h2>Contest status</h2></div>
                  <strong>{record.contested ? "Contested" : "Not contested"}</strong>
                  <p>{contestNote || "No contest note is stored."}</p>
                </article>
              </section>
            )}
          </>
        )}

        {view === "open" && (
          <section className="form-layout">
            <div className="form-intro">
              <p className="eyebrow">SEMANTIC ENTRY POINT</p>
              <h1>Open the text.<br /><em>Let the burden decide.</em></h1>
              <p>Only this first write uses GenLayer consensus. The contract stores the exact author, named wallet, text, semantic outcome, and resulting state.</p>
              <div className="flow-notes">
                <span><b>AUTHOR_ONLY</b> → effective now</span>
                <span><b>BINDS_OUTSIDE</b> → awaiting accession</span>
              </div>
            </div>
            <div className="form-card">
              <label>Named counterparty wallet<input value={counterparty} onChange={(event) => setCounterparty(event.target.value)} placeholder="0x…" /></label>
              <label>Counterparty label<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. the Supplier" maxLength={MAX_LABEL_LENGTH} /></label>
              <label>Undertaking text<textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Describe one undertaking in complete language." maxLength={MAX_TEXT_LENGTH} rows={7} /></label>
              <div className="form-footer"><span>{text.length}/{MAX_TEXT_LENGTH}</span><button className="primary large" onClick={openUndertaking} disabled={busy}><FilePlus2 size={18} /> Open undertaking</button></div>
              {!account && <p className="form-hint">Connect the author wallet before submitting.</p>}
            </div>
          </section>
        )}

        {view === "protocol" && (
          <section className="protocol-layout">
            <div className="protocol-intro">
              <p className="eyebrow">SOURCE-BOUND DEPLOYMENT</p>
              <h1>Semantic judgment.<br /><em>Deterministic consequence.</em></h1>
              <p>AccedeLedger is the Project interface. Its frozen Intelligent Contract remains internally named OutsideDutyBind.</p>
              <a className="primary link-button" href={CONTRACT_EXPLORER_URL} target="_blank" rel="noreferrer">Inspect contract <ExternalLink size={17} /></a>
            </div>
            <div className="protocol-grid">
              <Metric icon={<ShieldCheck />} label="Protocol" value={limits ? `${limits.contract_name} v${limits.version}` : "Loading…"} />
              <Metric icon={<Fingerprint />} label="Contract" value={short(CONTRACT_ADDRESS, 9, 7)} />
              <Metric icon={<BookOpen />} label="Semantic outputs" value={limits?.semantic_outcomes.join(" / ") || "—"} />
              <Metric icon={<CheckCircle2 />} label="Money / clock / web" value={limits ? `${limits.money_used ? "YES" : "NO"} / ${limits.clock_used ? "YES" : "NO"} / ${limits.external_web_used ? "YES" : "NO"}` : "—"} />
              <div className="wide-metric"><span>Frozen source SHA-256</span><code>{SOURCE_SHA256}</code></div>
              <div className="wide-metric"><span>Rubric hash</span><code>{limits?.rubric_hash || "Loading accepted state…"}</code></div>
              {protocolError && <div className="protocol-error"><CircleAlert size={18} /> {protocolError}</div>}
            </div>
          </section>
        )}
      </main>

      <footer>
        <span>AccedeLedger / StudioNet</span>
        <span>State comes from contract reads and user-signed transactions.</span>
      </footer>
    </div>
  );
}

function Status({ label, tone }: { label: string; tone: string }) {
  return <span className={`status ${tone}`}>{label}</span>;
}

function TxBanner({ tx, txUrl }: { tx: TxState; txUrl: string }) {
  if (tx.kind === "idle") return null;
  const duplicateRollback = tx.kind === "error" && Boolean(tx.hash) && tx.message.includes("Undertaking already exists");
  return (
    <section className={`tx-banner ${tx.kind}`}>
      {tx.kind === "signing" || tx.kind === "submitted" ? <LoaderCircle className="spin" size={18} /> : tx.kind === "success" ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
      {tx.kind === "error" && tx.hash ? (
        <div className="tx-failure">
          <strong>Why this failed</strong>
          <p>{tx.message}</p>
          {duplicateRollback && (
            <small>The id is derived from your address and the text only. Opening the same text again — even for a different counterparty — is a duplicate.</small>
          )}
        </div>
      ) : <p>{tx.message}</p>}
      {txUrl && <a href={txUrl} target="_blank" rel="noreferrer">Explorer <ExternalLink size={14} /></a>}
    </section>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="metric"><span className="metric-icon">{icon}</span><small>{label}</small><strong>{value}</strong></div>;
}
