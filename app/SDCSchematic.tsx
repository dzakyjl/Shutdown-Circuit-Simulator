"use client";

import React from "react";
import { motion } from "framer-motion";
import { SwitchKey, SwitchStates, ComponentPowerStates } from "./sdc";

interface SDCSchematicProps {
  switches: SwitchStates;
  powerStates: ComponentPowerStates;
  isLoopClosed: boolean;
  onToggleSwitch: (key: SwitchKey) => void;
}

export const SDCSchematic: React.FC<SDCSchematicProps> = ({
  switches,
  powerStates,
  isLoopClosed,
  onToggleSwitch,
}) => {
  const drawWire = (d: string, isLive: boolean) => (
    <motion.path
      d={d}
      fill="none"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{
        stroke: isLive ? "#10b981" : "#1e293b",
        filter: isLive ? "drop-shadow(0px 0px 4px #10b981)" : "none",
      }}
      transition={{ duration: 0.25 }}
    />
  );

  const drawSwitch = (
    x: number,
    y: number,
    title: string,
    key: SwitchKey,
    isAuto = false,
  ) => {
    const isClosed = switches[key];
    const pState = powerStates[key] || {
      poweredBefore: false,
      poweredAfter: false,
    };

    return (
      <g
        transform={`translate(${x}, ${y})`}
        onClick={() => onToggleSwitch(key)}
        className="cursor-pointer group select-none"
      >
        <rect x="0" y="-35" width="100" height="70" fill="transparent" />

        {/* Contacts */}
        <circle
          cx="10"
          cy="0"
          r="4.5"
          fill={pState.poweredBefore ? "#10b981" : "#334155"}
          style={{
            filter: pState.poweredBefore
              ? "drop-shadow(0px 0px 6px #10b981)"
              : "none",
          }}
        />
        <circle
          cx="90"
          cy="0"
          r="4.5"
          fill={pState.poweredAfter ? "#10b981" : "#334155"}
          style={{
            filter: pState.poweredAfter
              ? "drop-shadow(0px 0px 6px #10b981)"
              : "none",
          }}
        />

        {/* Switch Lever Blade */}
        <motion.line
          x1="10"
          y1="0"
          animate={{
            x2: isClosed ? 90 : 75,
            y2: isClosed ? 0 : -22,
            stroke: pState.poweredBefore ? "#10b981" : "#475569",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Label Title */}
        <text
          x="50"
          y="-18"
          textAnchor="middle"
          fill="#f1f5f9"
          style={{
            fontSize: "11px",
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          {title}
        </text>

        {/* Badge Background */}
        <rect
          x="22"
          y="12"
          width="56"
          height="18"
          rx="4"
          fill={isClosed ? "#10b981" : "#ef4444"}
        />
        <text
          x="50"
          y="25"
          textAnchor="middle"
          fill="#ffffff"
          style={{
            fontSize: "9.5px",
            fontWeight: 700,
            fontFamily: "monospace",
            letterSpacing: "0.05em",
          }}
        >
          {isClosed ? "CLOSED" : "OPEN"}
        </text>

        {isAuto && (
          <text
            x="50"
            y="40"
            textAnchor="middle"
            fill="#64748b"
            style={{
              fontSize: "8.5px",
              fontWeight: 600,
              fontFamily: "monospace",
            }}
          >
            AUTO TRIP
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="w-full bg-[#080c14] border border-slate-800 rounded-xl p-4 shadow-inner overflow-hidden">
      <svg viewBox="0 0 850 480" className="w-full h-auto">
        <defs>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Top Rail */}
        {drawWire(
          "M 50 60 L 120 60",
          powerStates["src"]?.poweredAfter ?? false,
        )}
        <g transform="translate(10, 35)">
          <rect
            width="80"
            height="50"
            rx="6"
            fill="#0f172a"
            stroke="#3b82f6"
            strokeWidth="1.5"
          />
          <text
            x="40"
            y="24"
            textAnchor="middle"
            fill="#ffffff"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              fontFamily: "sans-serif",
            }}
          >
            12V LV
          </text>
          <text
            x="40"
            y="38"
            textAnchor="middle"
            fill="#94a3b8"
            style={{ fontSize: "9px", fontFamily: "monospace" }}
          >
            BATTERY
          </text>
        </g>

        {drawSwitch(120, 60, "LVMS", "lvms")}
        {drawWire(
          "M 220 60 L 280 60",
          powerStates["lvms"]?.poweredAfter ?? false,
        )}

        {drawSwitch(280, 60, "BSPD", "bspd", true)}
        {drawWire(
          "M 380 60 L 440 60",
          powerStates["bspd"]?.poweredAfter ?? false,
        )}

        {drawSwitch(440, 60, "COCKPIT SDC", "cockpit")}
        {drawWire(
          "M 540 60 L 760 60 Q 790 60 790 90 L 790 180 Q 790 210 760 210 L 680 210",
          powerStates["cockpit"]?.poweredAfter ?? false,
        )}

        {/* Middle Rail */}
        {drawSwitch(580, 210, "RIGHT SDC", "right")}
        {drawWire(
          "M 580 210 L 520 210",
          powerStates["right"]?.poweredAfter ?? false,
        )}

        {drawSwitch(420, 210, "LEFT SDC", "left")}
        {drawWire(
          "M 420 210 L 360 210",
          powerStates["left"]?.poweredAfter ?? false,
        )}

        {drawSwitch(260, 210, "BOTS", "bots")}
        {drawWire(
          "M 260 210 L 90 210 Q 60 210 60 240 L 60 330 Q 60 360 90 360 L 140 360",
          powerStates["bots"]?.poweredAfter ?? false,
        )}

        {/* Bottom Rail */}
        {drawSwitch(140, 360, "INERTIA SW", "inertia")}
        {drawWire(
          "M 240 360 L 300 360",
          powerStates["inertia"]?.poweredAfter ?? false,
        )}

        {/* Output Box */}
        <g transform="translate(300, 325)">
          <rect
            width="250"
            height="70"
            rx="8"
            fill={isLoopClosed ? "rgba(16, 185, 129, 0.1)" : "#0f172a"}
            stroke={isLoopClosed ? "#10b981" : "#1e293b"}
            strokeWidth="1.5"
            filter={isLoopClosed ? "url(#neon-glow)" : "none"}
          />
          <text
            x="125"
            y="26"
            textAnchor="middle"
            fill="#ffffff"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              fontFamily: "sans-serif",
            }}
          >
            FUEL PUMP, INJECTION
          </text>
          <text
            x="125"
            y="42"
            textAnchor="middle"
            fill="#ffffff"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              fontFamily: "sans-serif",
            }}
          >
            & IGNITION RELAY
          </text>
          <text
            x="125"
            y="58"
            textAnchor="middle"
            fill="#64748b"
            style={{ fontSize: "9px", fontFamily: "monospace" }}
          >
            CV 4.1 INTERRUPTERS
          </text>
        </g>

        {/* Loop Status Indicator */}
        <g transform="translate(300, 425)">
          <circle
            cx="15"
            cy="15"
            r="8"
            fill={isLoopClosed ? "#10b981" : "#334155"}
            style={{
              filter: isLoopClosed
                ? "drop-shadow(0px 0px 8px #10b981)"
                : "none",
            }}
          />
          <text
            x="35"
            y="20"
            fill="#ffffff"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "sans-serif",
            }}
          >
            {isLoopClosed
              ? "LOOP CLOSED — POWER ACTIVE"
              : "LOOP TRIPPED — POWER ISOLATED"}
          </text>
        </g>
      </svg>
    </div>
  );
};
