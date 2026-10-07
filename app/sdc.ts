export type SwitchKey =
  | "lvms"
  | "bspd"
  | "cockpit"
  | "right"
  | "left"
  | "bots"
  | "inertia";

export interface InterrupterInfo {
  key: SwitchKey;
  title: string;
  ruleRef: string;
  description: string;
  isAutoTrip?: boolean;
  actionLabel: (isClosed: boolean) => string;
}

export type SwitchStates = Record<SwitchKey, boolean>;

export interface PowerState {
  poweredBefore: boolean;
  poweredAfter: boolean;
}

export type ComponentPowerStates = Record<string, PowerState>;
