"use client";

import React from "react";

interface Item {
  k: string;
  n: string;
  d: string;
  a?: string;
  b?: string;
}

interface CircuitDiagramProps {
  items: Item[];
  switches: Record<string, number>;
  onToggle: (k: string) => void;
  isLoopClosed: boolean;
}

export default function CircuitDiagram({
  items,
  switches,
  onToggle,
  isLoopClosed,
}: CircuitDiagramProps) {
  // Compute power propagation node by node through the series loop
  let currentPowered = true;
  const itemPowerState: Record<
    string,
    { poweredBefore: boolean; poweredAfter: boolean }
  > = {};

  items.forEach((item) => {
    const isClosed = !(item.k in switches) || switches[item.k] === 1;
    const poweredBefore = currentPowered;
    const poweredAfter = currentPowered && isClosed;
    itemPowerState[item.k] = { poweredBefore, poweredAfter };
    currentPowered = poweredAfter;
  });

  return (
    <div className="svg-container">
      <svg
        viewBox="0 0 850 560"
        className="w-full h-auto select-none"
        style={{ fontFamily: "'Barlow', sans-serif" }}
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- Top Rail (Power Input) --- */}
        <path
          d="M 50 60 L 120 60"
          className={`wire ${itemPowerState["src"].poweredAfter ? "live" : "dead"}`}
        />
        {/* Power Source Box */}
        <g transform="translate(10, 35)">
          <rect
            width="80"
            height="50"
            rx="6"
            className="component-box source"
          />
          <text x="50" y="25" className="lbl-title">
            12V LV
          </text>
          <text x="50" y="38" className="lbl-sub">
            Battery
          </text>
        </g>

        {/* --- Loop Items (LVMS -> BSPD -> Cockpit -> Right -> Left -> BOTS -> Inertia) --- */}
        {/* 1. LVMS */}
        <SwitchNode
          x={120}
          y={60}
          title="LVMS"
          itemKey="lvms"
          switches={switches}
          power={itemPowerState["lvms"]}
          onToggle={onToggle}
        />
        <path
          d="M 220 60 L 280 60"
          className={`wire ${itemPowerState["lvms"].poweredAfter ? "live" : "dead"}`}
        />

        {/* 2. BSPD */}
        <SwitchNode
          x={280}
          y={60}
          title="BSPD"
          itemKey="bspd"
          switches={switches}
          power={itemPowerState["bspd"]}
          onToggle={onToggle}
          isAutomatic
        />
        <path
          d="M 380 60 L 440 60"
          className={`wire ${itemPowerState["bspd"].poweredAfter ? "live" : "dead"}`}
        />

        {/* 3. Cockpit Button */}
        <SwitchNode
          x={440}
          y={60}
          title="Cockpit"
          itemKey="cockpit"
          switches={switches}
          power={itemPowerState["cockpit"]}
          onToggle={onToggle}
        />
        {/* Top-Right Corner Wire Bend */}
        <path
          d="M 540 60 L 760 60 Q 790 60 790 90 L 790 180 Q 790 210 760 210 L 680 210"
          className={`wire ${itemPowerState["cockpit"].poweredAfter ? "live" : "dead"}`}
        />

        {/* --- Middle Rail (Right -> Left -> BOTS) --- */}
        {/* 4. Right Shutdown Button */}
        <SwitchNode
          x={580}
          y={210}
          title="Right E-Stop"
          itemKey="right"
          switches={switches}
          power={itemPowerState["right"]}
          onToggle={onToggle}
        />
        <path
          d="M 580 210 L 520 210"
          className={`wire ${itemPowerState["right"].poweredAfter ? "live" : "dead"}`}
        />

        {/* 5. Left Shutdown Button */}
        <SwitchNode
          x={420}
          y={210}
          title="Left E-Stop"
          itemKey="left"
          switches={switches}
          power={itemPowerState["left"]}
          onToggle={onToggle}
        />
        <path
          d="M 420 210 L 360 210"
          className={`wire ${itemPowerState["left"].poweredAfter ? "live" : "dead"}`}
        />

        {/* 6. BOTS */}
        <SwitchNode
          x={260}
          y={210}
          title="BOTS"
          itemKey="bots"
          switches={switches}
          power={itemPowerState["bots"]}
          onToggle={onToggle}
        />
        {/* Middle-Left Corner Wire Bend */}
        <path
          d="M 260 210 L 90 210 Q 60 210 60 240 L 60 330 Q 60 360 90 360 L 140 360"
          className={`wire ${itemPowerState["bots"].poweredAfter ? "live" : "dead"}`}
        />

        {/* --- Bottom Rail (Inertia Switch -> Relays) --- */}
        {/* 7. Inertia Switch */}
        <SwitchNode
          x={140}
          y={360}
          title="Inertia Switch"
          itemKey="inertia"
          switches={switches}
          power={itemPowerState["inertia"]}
          onToggle={onToggle}
        />
        <path
          d="M 240 360 L 320 360"
          className={`wire ${itemPowerState["inertia"].poweredAfter ? "live" : "dead"}`}
        />

        {/* Relays & Actuators Output Box */}
        <g transform="translate(320, 325)">
          <rect
            width="220"
            height="70"
            rx="8"
            className={`component-box sink ${isLoopClosed ? "active" : ""}`}
            filter={isLoopClosed ? "url(#glow)" : undefined}
          />
          <text x="110" y="30" className="lbl-title">
            Shutdown Relays (CV 4.1)
          </text>
          <text x="110" y="50" className="lbl-sub">
            Fuel Pump • Injectors • Ignition
          </text>
        </g>

        {/* Bus indicator status */}
        <g transform="translate(320, 430)">
          <circle
            cx="20"
            cy="20"
            r="10"
            className={`status-led ${isLoopClosed ? "on" : "off"}`}
          />
          <text x="40" y="25" className="lbl-status">
            {isLoopClosed
              ? "CIRCUIT CLOSED — ENGINE READY"
              : "CIRCUIT OPEN — SDC POWER CUT"}
          </text>
        </g>
      </svg>
    </div>
  );
}

// Helper Sub-Component for individual switches in SVG
function SwitchNode({
  x,
  y,
  title,
  itemKey,
  switches,
  power,
  onToggle,
  isAutomatic = false,
}: {
  x: number;
  y: number;
  title: string;
  itemKey: string;
  switches: Record<string, number>;
  power: { poweredBefore: boolean; poweredAfter: boolean };
  onToggle: (k: string) => void;
  isAutomatic?: boolean;
}) {
  const isOpen = switches[itemKey] === 0;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={() => onToggle(itemKey)}
      style={{ cursor: "pointer" }}
      className="switch-node"
    >
      {/* Node Click Hitbox */}
      <rect x="0" y="-35" width="100" height="70" fill="transparent" />

      {/* Switch Contacts */}
      <circle
        cx="10"
        cy="0"
        r="4"
        className={`contact ${power.poweredBefore ? "live" : "dead"}`}
      />
      <circle
        cx="90"
        cy="0"
        r="4"
        className={`contact ${power.poweredAfter ? "live" : "dead"}`}
      />

      {/* Lever arm (Angles up when open) */}
      <line
        x1="10"
        y1="0"
        x2={isOpen ? "75" : "90"}
        y2={isOpen ? "-22" : "0"}
        className={`lever ${power.poweredBefore ? "live" : "dead"}`}
      />

      {/* Switch Title */}
      <text x="50" y="-18" className="lbl-node">
        {title}
      </text>

      {/* Status Badge */}
      <rect
        x="20"
        y="12"
        width="60"
        height="18"
        rx="4"
        className={`badge ${isOpen ? "open" : "closed"}`}
      />
      <text x="50" y="25" className="lbl-badge">
        {isOpen ? "OPEN" : "CLOSED"}
      </text>

      {/* Auto badge tag for BSPD */}
      {isAutomatic && (
        <text x="50" y="40" className="lbl-auto">
          (Auto Trip)
        </text>
      )}
    </g>
  );
}
