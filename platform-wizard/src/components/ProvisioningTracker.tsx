"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Database, ShieldCheck, Key, Server, Cpu } from "lucide-react";

interface ProvisioningStep {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  durationMs: number;
}

const STEPS: ProvisioningStep[] = [
  {
    id: "tenant-db",
    label: "Allocating PostgreSQL Tenant Partition",
    icon: Database,
    description: "Configuring schema namespace, RLS policies, and isolated tablespace",
    durationMs: 900,
  },
  {
    id: "rbac-roles",
    label: "Seeding Security Roles & Permissions",
    icon: ShieldCheck,
    description: "Initializing Super Admin, Admin, Manager, and Viewer role hierarchies",
    durationMs: 700,
  },
  {
    id: "crypto-keys",
    label: "Minting Enterprise Encryption Keys",
    icon: Key,
    description: "Generating tenant-scoped AES-256 GCM keys and HMAC verification secrets",
    durationMs: 800,
  },
  {
    id: "apps-seed",
    label: "Configuring Industry Module Blueprints",
    icon: Cpu,
    description: "Pre-installing core enterprise apps, workflows, and outbox event streams",
    durationMs: 900,
  },
  {
    id: "workspace-ready",
    label: "Finalizing Multi-Tenant Cloud Mesh",
    icon: Server,
    description: "Connecting edge DNS routing, SSO authentication gates, and telemetry",
    durationMs: 600,
  },
];

interface ProvisioningTrackerProps {
  onComplete: () => void;
  tenantSlug?: string;
  organizationName?: string;
}

export function ProvisioningTracker({ onComplete, tenantSlug, organizationName }: ProvisioningTrackerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [logs, setLogs] = useState<string[]>([
    `[INFO] Initializing provisioning runtime for workspace: ${tenantSlug || "default"}`,
  ]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (currentStepIndex < STEPS.length) {
      const step = STEPS[currentStepIndex];
      timeout = setTimeout(() => {
        setLogs((prev) => [
          ...prev,
          `[SUCCESS] ${step.label} (${step.durationMs}ms)`,
          `[EVENT] ${step.description}`,
        ]);
        const nextIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextIndex);
        setProgress(Math.round(((nextIndex + 1) / (STEPS.length + 1)) * 100));

        if (nextIndex === STEPS.length) {
          setTimeout(() => {
            onComplete();
          }, 800);
        }
      }, step.durationMs);
    }

    return () => clearTimeout(timeout);
  }, [currentStepIndex, onComplete, tenantSlug]);

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.35rem 1rem",
            borderRadius: "9999px",
            background: "rgba(72, 197, 206, 0.1)",
            border: "1px solid rgba(72, 197, 206, 0.3)",
            color: "var(--color-primary)",
            fontSize: "0.82rem",
            fontWeight: 700,
            marginBottom: "1rem",
          }}
        >
          <Loader2 size={14} className="animate-spin" /> Provisioning Real-Time Cloud Infrastructure
        </div>
        <h2
          style={{
            fontSize: "clamp(1.75rem, 3.5vw, 2.35rem)",
            fontWeight: 800,
            fontFamily: "var(--font-display)",
            margin: "0 0 0.5rem",
            letterSpacing: "-0.02em",
          }}
        >
          Setting up {organizationName || "your workspace"}
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem", margin: 0 }}>
          Your dedicated, zero-trust multi-tenant environment is being initialized.
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
          <span>System Initialization Progress</span>
          <span style={{ color: "var(--color-primary)" }}>{progress}%</span>
        </div>
        <div style={{ height: "8px", borderRadius: "9999px", background: "var(--color-bg-sunken)", overflow: "hidden", border: "1px solid var(--color-border)" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #0d7377, #48c5ce)",
              borderRadius: "9999px",
              transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 0 12px rgba(72, 197, 206, 0.4)",
            }}
          />
        </div>
      </div>

      {/* Step Sequence Checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const isPending = idx > currentStepIndex;

          return (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.9rem 1.25rem",
                borderRadius: "14px",
                background: isCurrent ? "rgba(72, 197, 206, 0.08)" : "var(--color-bg-elevated)",
                border: `1px solid ${isCurrent ? "var(--color-primary)" : isDone ? "rgba(16, 185, 129, 0.3)" : "var(--color-border)"}`,
                transition: "all 0.25s ease",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: isDone
                    ? "rgba(16, 185, 129, 0.15)"
                    : isCurrent
                      ? "rgba(72, 197, 206, 0.2)"
                      : "var(--color-bg-sunken)",
                  color: isDone ? "#10b981" : isCurrent ? "var(--color-primary)" : "var(--color-text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isDone ? <CheckCircle2 size={18} /> : isCurrent ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: isPending ? "var(--color-text-secondary)" : "var(--color-text)" }}>
                  {s.label}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                  {s.description}
                </div>
              </div>

              <div>
                {isDone && (
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#10b981", background: "rgba(16, 185, 129, 0.1)", padding: "2px 8px", borderRadius: "6px" }}>
                    COMPLETE
                  </span>
                )}
                {isCurrent && (
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)", background: "rgba(72, 197, 206, 0.15)", padding: "2px 8px", borderRadius: "6px" }}>
                    INITIALIZING
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Log Stream */}
      <div
        style={{
          background: "var(--color-bg-sunken)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "1rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.78rem",
          color: "var(--color-text-secondary)",
          maxHeight: "130px",
          overflowY: "auto",
        }}
      >
        {logs.map((log, index) => (
          <div key={index} style={{ marginBottom: "4px", color: log.startsWith("[SUCCESS]") ? "#10b981" : log.startsWith("[EVENT]") ? "#38bdf8" : "inherit" }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
