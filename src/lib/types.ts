export type Undertaking = {
  undertaking_id: string;
  creator: string;
  counterparty_wallet: string;
  counterparty_label: string;
  text: string;
  outcome_code: number;
  outcome: string;
  state: string;
  contested: boolean;
  acceded_by: string;
  performance_count: number;
};

export type Performance = {
  index: number;
  note: string;
};

export type Limits = {
  contract_name: string;
  version: string;
  semantic_outcomes: string[];
  state_labels: string[];
  max_text_length: number;
  max_label_length: number;
  max_note_length: number;
  max_performances: number;
  max_page_size: number;
  global_admin: boolean;
  clock_used: boolean;
  external_web_used: boolean;
  money_used: boolean;
  preview_endpoint_exposed: boolean;
  wallet_identity_verified: boolean;
  rubric_hash: string;
};

export type TxState = {
  kind: "idle" | "signing" | "submitted" | "success" | "error";
  message: string;
  hash?: string;
};
