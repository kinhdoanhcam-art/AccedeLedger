export const CONTRACT_ADDRESS = (
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  "0x043F8e52461165BEfe5b8fE66F1de8F4F0C92C35"
) as `0x${string}`;

export const RPC_PATH = import.meta.env.VITE_RPC_PATH || "/api/rpc";
export const STUDIONET_CHAIN_ID = 61999;
export const STUDIONET_CHAIN_HEX = "0xf22f";
export const STUDIO_WALLET_RPC = "https://studio.genlayer.com/api";
export const EXPLORER_BASE = "https://explorer-studio.genlayer.com";
export const CONTRACT_EXPLORER_URL = `${EXPLORER_BASE}/address/${CONTRACT_ADDRESS}`;
export const SOURCE_SHA256 = "6a0442d9156d99dbf7471ba5aa08f1428b7b3746d25f57df6c2a2beeb212ab28";

export const MAX_TEXT_LENGTH = 600;
export const MAX_LABEL_LENGTH = 80;
export const MAX_NOTE_LENGTH = 300;
export const MAX_PERFORMANCES = 20;

export const KNOWN_EMPTY_MESSAGE = "No undertaking is loaded.";
