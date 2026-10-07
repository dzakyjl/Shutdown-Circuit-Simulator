import { InterrupterInfo } from "./sdc";

export const INTERRUPTERS: InterrupterInfo[] = [
  {
    key: "lvms",
    title: "Low Voltage Master Switch (LVMS)",
    ruleRef: "T 11.3",
    description:
      "Disables power from the battery and alternator to the whole LV system. Cycling it clears a BSPD trip.",
    actionLabel: (closed) => (closed ? "Switch Off" : "Switch On"),
  },
  {
    key: "bspd",
    title: "Brake System Plausibility Device (BSPD)",
    ruleRef: "T 11.6",
    description:
      "Standalone, non-programmable device. Opens SDC on hard braking with throttle >25% over idle.",
    isAutoTrip: true,
    actionLabel: () => "Auto Trip",
  },
  {
    key: "cockpit",
    title: "Cockpit SDC",
    ruleRef: "T 11.4",
    description:
      "Red push-rotate or push-pull emergency switch easily reachable by the driver inside the cockpit.",
    actionLabel: (closed) => (closed ? "Press E-Stop" : "Release"),
  },
  {
    key: "right",
    title: "Right SDC",
    ruleRef: "T 11.4",
    description:
      "Red E-Stop switch located on the right side of the car behind the driver at head level.",
    actionLabel: (closed) => (closed ? "Press E-Stop" : "Release"),
  },
  {
    key: "left",
    title: "Left SDC",
    ruleRef: "T 11.4",
    description:
      "Red E-Stop switch located on the left side of the car behind the driver at head level.",
    actionLabel: (closed) => (closed ? "Press E-Stop" : "Release"),
  },
  {
    key: "bots",
    title: "Brake Over-Travel Switch (BOTS)",
    ruleRef: "T 6.2",
    description:
      "Opens when the brake pedal over-travels due to hydraulic failure. Latching switch.",
    actionLabel: (closed) =>
      closed ? "Trigger Over-Travel" : "Reset Mechanical Latch",
  },
  {
    key: "inertia",
    title: "Inertia Switch",
    ruleRef: "T 11.5",
    description:
      "Physical impact sensor that triggers and latches open on high g-force collision.",
    actionLabel: (closed) => (closed ? "Simulate Impact" : "Reset Switch"),
  },
];
