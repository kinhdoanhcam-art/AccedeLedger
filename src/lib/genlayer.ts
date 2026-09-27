import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import {
  CONTRACT_ADDRESS,
  RPC_PATH,
  STUDIONET_CHAIN_HEX,
  STUDIONET_CHAIN_ID,
  STUDIO_WALLET_RPC,
} from "./config";
import type { Limits, Performance, Undertaking } from "./types";

function projectChain() {
  const chain: any = studionet as any;
  return {
    ...chain,
    rpcUrls: {
      ...(chain.rpcUrls ?? {}),
      default: { http: [RPC_PATH] },
      public: { http: [RPC_PATH] },
    },
  };
}

const readClient: any = createClient({ chain: projectChain() } as any);

function provider() {
  if (!window.ethereum) throw new Error("MetaMask was not found.");
  return window.ethereum;
}

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.trim()) return Number(value);
  return 0;
}

function normalizeUndertaking(raw: any): Undertaking {
  return {
    undertaking_id: String(raw?.undertaking_id ?? ""),
    creator: String(raw?.creator ?? ""),
    counterparty_wallet: String(raw?.counterparty_wallet ?? ""),
    counterparty_label: String(raw?.counterparty_label ?? ""),
    text: String(raw?.text ?? ""),
    outcome_code: asNumber(raw?.outcome_code),
    outcome: String(raw?.outcome ?? "NONE"),
    state: String(raw?.state ?? "UNKNOWN"),
    contested: Boolean(raw?.contested),
    acceded_by: String(raw?.acceded_by ?? ""),
    performance_count: asNumber(raw?.performance_count),
  };
}

function normalizePerformances(raw: any): Performance[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => ({
    index: asNumber(item?.index),
    note: String(item?.note ?? ""),
  }));
}

function normalizeLimits(raw: any): Limits {
  return {
    contract_name: String(raw?.contract_name ?? ""),
    version: String(raw?.version ?? ""),
    semantic_outcomes: Array.isArray(raw?.semantic_outcomes) ? raw.semantic_outcomes.map(String) : [],
    state_labels: Array.isArray(raw?.state_labels) ? raw.state_labels.map(String) : [],
    max_text_length: asNumber(raw?.max_text_length),
    max_label_length: asNumber(raw?.max_label_length),
    max_note_length: asNumber(raw?.max_note_length),
    max_performances: asNumber(raw?.max_performances),
    max_page_size: asNumber(raw?.max_page_size),
    global_admin: Boolean(raw?.global_admin),
    clock_used: Boolean(raw?.clock_used),
    external_web_used: Boolean(raw?.external_web_used),
    money_used: Boolean(raw?.money_used),
    preview_endpoint_exposed: Boolean(raw?.preview_endpoint_exposed),
    wallet_identity_verified: Boolean(raw?.wallet_identity_verified),
    rubric_hash: String(raw?.rubric_hash ?? ""),
  };
}

export async function connectedWallet(): Promise<string> {
  if (!window.ethereum) return "";
  const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[];
  return accounts?.[0] ?? "";
}

export async function requestWallet(): Promise<string> {
  const accounts = (await provider().request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts?.[0]) throw new Error("No wallet account was returned.");
  return accounts[0];
}

export async function connectStudioNet(): Promise<void> {
  const ethereum = provider();
  const currentHex = (await ethereum.request({ method: "eth_chainId" })) as string;
  if (Number.parseInt(currentHex, 16) === STUDIONET_CHAIN_ID) return;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: STUDIONET_CHAIN_HEX }],
    });
    return;
  } catch (error: any) {
    if (Number(error?.code) === 4001) throw new Error("Network switch was rejected.");
    if (Number(error?.code) !== 4902) throw error;
  }

  await ethereum.request({
    method: "wallet_addEthereumChain",
    params: [{
      chainId: STUDIONET_CHAIN_HEX,
      chainName: (studionet as any).name ?? "GenLayer Studio Network",
      rpcUrls: [STUDIO_WALLET_RPC],
      nativeCurrency: (studionet as any).nativeCurrency ?? {
        name: "GEN Token",
        symbol: "GEN",
        decimals: 18,
      },
    }],
  });
  await ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: STUDIONET_CHAIN_HEX }],
  });
}

function walletClient(account: string): any {
  provider();
  return createClient({
    chain: projectChain(),
    account: account as `0x${string}`,
    provider: window.ethereum as any,
  } as any);
}

export async function getLimits(): Promise<Limits> {
  const raw = await readClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_limits",
    args: [],
    stateStatus: "accepted",
  });
  return normalizeLimits(raw);
}

export async function getUndertaking(id: string): Promise<Undertaking> {
  const raw = await readClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_undertaking",
    args: [id],
    stateStatus: "accepted",
  });
  return normalizeUndertaking(raw);
}

export async function getPerformances(id: string): Promise<Performance[]> {
  const raw = await readClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_performances",
    args: [id, 0, 20],
    stateStatus: "accepted",
  });
  return normalizePerformances(raw);
}

export async function getContestNote(id: string): Promise<string> {
  return String(await readClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_contest_note",
    args: [id],
    stateStatus: "accepted",
  }));
}

export async function writeContract(account: string, functionName: string, args: unknown[]): Promise<string> {
  return (await walletClient(account).writeContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    value: 0n,
  })) as string;
}

export async function rollbackReason(hash: string): Promise<string | undefined> {
  try {
    const tx: any = await readClient.getTransaction({ hash });
    const consensus = tx?.consensus_data ?? tx?.consensusData;
    let leader = consensus?.leader_receipt ?? consensus?.leaderReceipt;
    if (Array.isArray(leader)) {
      leader = leader.find((receipt: any) => String(receipt?.mode ?? "").toUpperCase() === "LEADER") ?? leader[0];
    }
    const result = String(leader?.execution_result ?? leader?.executionResult ?? "").toUpperCase();
    if (result !== "ERROR" && result !== "FINISHED_WITH_ERROR") return undefined;
    for (const field of [leader?.error, leader?.message, leader?.return_data, leader?.returnData]) {
      if (typeof field === "string" && field.trim()) return field.trim();
    }
    return "Contract execution rolled back.";
  } catch {
    return undefined;
  }
}
