import type { Undertaking } from "./types";

export type TxOutcome =
  | { status: "success" }
  | { status: "error"; reason: string }
  | { status: "pending" };

export type WriteDecision = {
  kind: "success" | "error" | "submitted";
  message: string;
};

type ExpectedNewUndertakingArgs = {
  id: string;
  account: string;
  wallet: string;
  label: string;
  text: string;
};

type DecideWriteOptions = {
  readOutcome: (hash: string) => Promise<TxOutcome>;
  readRecord: () => Promise<Undertaking>;
  accepted: (next: Undertaking) => boolean;
  hash: string;
  outcomeWaits?: number[];
  stateWaits?: number[];
  sleep?: (milliseconds: number) => Promise<void>;
};

const defaultSleep = (milliseconds: number) =>
  new Promise<void>((resolve) => globalThis.setTimeout(resolve, milliseconds));

export function txOutcomeFromTransaction(tx: any): TxOutcome {
  const consensus = tx?.consensus_data ?? tx?.consensusData;
  let leader = consensus?.leader_receipt ?? consensus?.leaderReceipt;
  if (Array.isArray(leader)) {
    leader = leader.find((receipt: any) =>
      String(receipt?.mode ?? "").toUpperCase() === "LEADER"
    ) ?? leader[0];
  }

  const raw = String(
    leader?.execution_result ?? leader?.executionResult ?? ""
  ).toUpperCase();
  if (!raw) return { status: "pending" };
  if (raw === "SUCCESS" || raw === "FINISHED_WITH_RETURN") {
    return { status: "success" };
  }

  for (const field of [
    leader?.error,
    leader?.message,
    leader?.return_data,
    leader?.returnData,
  ]) {
    if (typeof field === "string" && field.trim()) {
      return { status: "error", reason: field.trim() };
    }
  }
  return { status: "error", reason: "Contract execution rolled back." };
}

export function expectedNewUndertaking({
  id,
  account,
  wallet,
  label,
  text,
}: ExpectedNewUndertakingArgs): (next: Undertaking) => boolean {
  const expectedCreator = account.toLowerCase();
  const expectedWallet = wallet.toLowerCase();

  return (next) =>
    next.undertaking_id === id &&
    next.creator.toLowerCase() === expectedCreator &&
    next.counterparty_wallet.toLowerCase() === expectedWallet &&
    next.counterparty_label === label &&
    next.text === text &&
    (next.outcome === "AUTHOR_ONLY" || next.outcome === "BINDS_OUTSIDE") &&
    next.outcome_code === (next.outcome === "AUTHOR_ONLY" ? 1 : 2) &&
    next.state === (next.outcome === "AUTHOR_ONLY" ? "EFFECTIVE" : "AWAITING_ACCESSION") &&
    next.contested === false &&
    next.acceded_by === "" &&
    next.performance_count === 0;
}

export async function decideWrite({
  readOutcome,
  readRecord,
  accepted,
  hash,
  outcomeWaits = [6000, 9000, 12000, 15000, 18000],
  stateWaits = [3000, 6000, 12000],
  sleep = defaultSleep,
}: DecideWriteOptions): Promise<WriteDecision> {
  let outcome: TxOutcome = { status: "pending" };
  for (const wait of outcomeWaits) {
    await sleep(wait);
    try {
      outcome = await readOutcome(hash);
    } catch {
      outcome = { status: "pending" };
    }
    if (outcome.status !== "pending") break;
  }

  if (outcome.status === "error") {
    return {
      kind: "error",
      message: `Transaction rolled back: ${outcome.reason}`,
    };
  }

  if (outcome.status === "pending") {
    return {
      kind: "submitted",
      message: "Submitted — confirmation delayed. Inspect it on Explorer, then refresh once finalized.",
    };
  }

  for (const wait of stateWaits) {
    await sleep(wait);
    try {
      const next = await readRecord();
      if (accepted(next)) {
        return {
          kind: "success",
          message: "Transaction succeeded and the new record matches what was submitted.",
        };
      }
    } catch {
      // Accepted-state indexing may lag behind a successful transaction.
    }
  }

  return {
    kind: "error",
    message: "The transaction succeeded but the accepted state does not match what was submitted. Do not treat this as a completed write.",
  };
}
