"use client";

import React, { useState } from "react";
import {
  Building2,
  Palette,
  Layers,
  Users,
  Rocket,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Plus,
  Trash2,
  Shield,
  LayoutGrid,
  SlidersHorizontal,
  PenTool,
  Store,
  Code2,
} from "lucide-react";
import { ProvisioningTracker } from "./ProvisioningTracker";
import { IndustryAppSelector } from "./IndustryAppSelector";
import { provisionWorkspace } from "@/lib/workspace-service";

interface OnboardingFlowProps {
  initialSlug?: string;
  initialName?: string;
  initialIndustry?: string;
  onFinish?: () => void;
}

interface TeamInvite {
  email: string;
  name: string;
  role: string;
}

const ACCENT_PRESETS = [
  { label: "Meridian Teal", value: "#48c5ce" },
  { label: "Sapphire Blue", value: "#38bdf8" },
  { label: "Emerald Green", value: "#10b981" },
  { label: "Royal Violet", value: "#a855f7" },
  { label: "Amber Glow", value: "#f59e0b" },
  { label: "Coral Signal", value: "#f97316" },
];

export function OnboardingFlow({
  initialSlug = "workspace",
  initialName = "My Organization",
  initialIndustry = "manufacturing",
  onFinish,
}: OnboardingFlowProps) {
  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Workspace Profile State
  const [orgName, setOrgName] = useState(initialName);
  const [logoText, setLogoText] = useState(initialName.charAt(0).toUpperCase() || "U");
  const [brandAccent, setBrandAccent] = useState("#48c5ce");
  const [fiscalYearStart, setFiscalYearStart] = useState("January");

  // Apps State
  const [selectedApps, setSelectedApps] = useState<string[]>([
    "finance",
    "crm",
    "hr",
    "inventory",
    "manufacturing",
    "documents",
  ]);

  // Invites State
  const [invites, setInvites] = useState<TeamInvite[]>([
    { email: "", name: "", role: "ADMIN" },
  ]);

  const handleAddInvite = () => {
    setInvites([...invites, { email: "", name: "", role: "MEMBER" }]);
  };

  const handleRemoveInvite = (index: number) => {
    setInvites(invites.filter((_, i) => i !== index));
  };

  const handleUpdateInvite = (index: number, field: keyof TeamInvite, val: string) => {
    const updated = [...invites];
    updated[index][field] = val;
    setInvites(updated);
  };

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "var(--space-8) var(--space-4)",
        minHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* Step Nav Bar (Phases 2-5) */}
      {currentPhase > 1 && (
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "var(--color-primary)",
                  color: "#14171a",
                  fontWeight: 900,
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {currentPhase}
              </span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text)" }}>
                {currentPhase === 2 && "Branding & Workspace Profile"}
                {currentPhase === 3 && "Industry Module Blueprint"}
                {currentPhase === 4 && "Invite Team & Stakeholders"}
                {currentPhase === 5 && "Workspace Launchpad Ready"}
              </span>
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-secondary)" }}>
              Step {currentPhase} of 5
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: "6px",
                  borderRadius: "4px",
                  background: i <= currentPhase ? "var(--color-primary)" : "var(--color-bg-sunken)",
                  border: "1px solid var(--color-border)",
                  transition: "background 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Phase Container */}
      <div
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl, 24px)",
          padding: "clamp(1.5rem, 4vw, 2.75rem)",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* PHASE 1: Real-Time Provisioning Sequence */}
        {currentPhase === 1 && (
          <ProvisioningTracker
            tenantSlug={initialSlug}
            organizationName={orgName}
            onComplete={() => setCurrentPhase(2)}
          />
        )}

        {/* PHASE 2: Brand & Workspace Profile */}
        {currentPhase === 2 && (
          <div>
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text)", margin: "0 0 0.5rem" }}>
                Brand & Corporate Identity
              </h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.92rem", margin: 0 }}>
                Configure your workspace look and fiscal defaults across all 10 UniERP platforms.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.75rem", marginBottom: "2rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.4rem" }}>
                  Workspace Display Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    if (e.target.value.length > 0) setLogoText(e.target.value.charAt(0).toUpperCase());
                  }}
                  style={{
                    width: "100%",
                    padding: "0.85rem 1rem",
                    borderRadius: "12px",
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.4rem" }}>
                  Fiscal Year Starting Month
                </label>
                <select
                  value={fiscalYearStart}
                  onChange={(e) => setFiscalYearStart(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.85rem 1rem",
                    borderRadius: "12px",
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                    fontSize: "0.95rem",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {["January", "April", "July", "October"].map((m) => (
                    <option key={m} value={m}>
                      {m} (Standard Cycle)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Brand Accent Palette */}
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.75rem" }}>
                Primary Brand Color Accent
              </label>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {ACCENT_PRESETS.map((preset) => {
                  const isSelected = brandAccent === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setBrandAccent(preset.value)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.6rem 1rem",
                        borderRadius: "12px",
                        background: isSelected ? "var(--color-bg-sunken)" : "var(--color-bg)",
                        border: `1.5px solid ${isSelected ? preset.value : "var(--color-border)"}`,
                        color: "var(--color-text)",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: preset.value }} />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Header Logo Preview */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderRadius: "14px",
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: brandAccent,
                  color: "#14171a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "1.4rem",
                  boxShadow: `0 4px 16px ${brandAccent}66`,
                }}
              >
                {logoText}
              </div>
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text)" }}>{orgName}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                  https://{initialSlug}.unierp.io · Enterprise Tenant Partition
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 3: Industry App Blueprint */}
        {currentPhase === 3 && (
          <IndustryAppSelector
            industry={initialIndustry}
            selectedApps={selectedApps}
            onChange={setSelectedApps}
          />
        )}

        {/* PHASE 4: Invite Team */}
        {currentPhase === 4 && (
          <div>
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text)", margin: "0 0 0.5rem" }}>
                Invite Key Collaborators
              </h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.92rem", margin: 0 }}>
                Give department heads and managers immediate access to their workspaces.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.5rem" }}>
              {invites.map((inv, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr 1fr auto",
                    gap: "0.75rem",
                    alignItems: "center",
                    background: "var(--color-bg)",
                    padding: "0.75rem 1rem",
                    borderRadius: "12px",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inv.email}
                    onChange={(e) => handleUpdateInvite(idx, "email", e.target.value)}
                    style={{
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      background: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={inv.name}
                    onChange={(e) => handleUpdateInvite(idx, "name", e.target.value)}
                    style={{
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      background: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                  <select
                    value={inv.role}
                    onChange={(e) => handleUpdateInvite(idx, "role", e.target.value)}
                    style={{
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      background: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                      fontSize: "0.9rem",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="ADMIN">Admin (Full Control)</option>
                    <option value="MANAGER">Manager (Module Lead)</option>
                    <option value="MEMBER">Member (Standard User)</option>
                    <option value="VIEWER">Viewer (Read Only)</option>
                  </select>
                  {invites.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveInvite(idx)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddInvite}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "0.65rem 1.25rem",
                borderRadius: "10px",
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Plus size={16} /> Add Another Teammate
            </button>
          </div>
        )}

        {/* PHASE 5: Launch Celebration & Hub */}
        {currentPhase === 5 && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #0d7377, #48c5ce)",
                color: "#14171a",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1.5rem",
                boxShadow: "0 8px 30px rgba(72, 197, 206, 0.4)",
              }}
            >
              <Rocket size={32} />
            </div>

            <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.5rem)", fontWeight: 900, color: "var(--color-text)", margin: "0 0 0.5rem" }}>
              Your UniERP Workspace is Live!
            </h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "1.05rem", maxWidth: "600px", margin: "0 auto 2.5rem" }}>
              <strong>{orgName}</strong> is fully provisioned with {selectedApps.length} active enterprise modules. Choose where you want to start:
            </p>

            {/* Launch Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1.25rem",
                textAlign: "left",
                marginBottom: "2.5rem",
              }}
            >
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "1.5rem",
                  borderRadius: "16px",
                  background: "var(--color-bg)",
                  border: "1.5px solid var(--color-primary)",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 10px 25px rgba(72, 197, 206, 0.15)",
                }}
              >
                <div>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(72, 197, 206, 0.15)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                    <LayoutGrid size={22} />
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "0.25rem" }}>
                    Tenant ERP Suite (P3)
                  </div>
                  <div style={{ fontSize: "0.84rem", color: "var(--color-text-secondary)" }}>
                    Access your General Ledger, CRM, HR, and Inventory operations.
                  </div>
                </div>
                <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-primary)" }}>
                  Launch ERP <ArrowRight size={14} />
                </div>
              </a>

              <a
                href="http://localhost:3002"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "1.5rem",
                  borderRadius: "16px",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                    <SlidersHorizontal size={22} />
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "0.25rem" }}>
                    Tenant Admin Portal (P6)
                  </div>
                  <div style={{ fontSize: "0.84rem", color: "var(--color-text-secondary)" }}>
                    Manage users, subscriptions, billing, and system audits.
                  </div>
                </div>
                <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", fontWeight: 700, color: "#f59e0b" }}>
                  Launch Admin <ArrowRight size={14} />
                </div>
              </a>

              <a
                href="http://localhost:3004"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "1.5rem",
                  borderRadius: "16px",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(168, 85, 247, 0.15)", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                    <PenTool size={22} />
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "0.25rem" }}>
                    Web Studio Builder (P5)
                  </div>
                  <div style={{ fontSize: "0.84rem", color: "var(--color-text-secondary)" }}>
                    Design custom landing pages and visual customer portals.
                  </div>
                </div>
                <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", fontWeight: 700, color: "#a855f7" }}>
                  Launch Studio <ArrowRight size={14} />
                </div>
              </a>
            </div>

            <button
              type="button"
              onClick={async () => {
                await provisionWorkspace({
                  organizationName: orgName,
                  slug: initialSlug || orgName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                  industry: initialIndustry,
                  brandAccent,
                  fiscalYearStart,
                  selectedApps,
                  teamInvites: invites,
                });
                if (onFinish) onFinish();
                else window.open("http://localhost:3000", "_blank", "noopener,noreferrer");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "1rem 2.5rem",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #0d7377, #48c5ce)",
                border: "none",
                color: "#14171a",
                fontWeight: 900,
                fontSize: "1.1rem",
                cursor: "pointer",
                boxShadow: "0 6px 25px rgba(72, 197, 206, 0.4)",
              }}
            >
              <span>Enter Workspace Dashboard</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Phase Navigation Buttons (Phases 2-4) */}
        {currentPhase > 1 && currentPhase < 5 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "2rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <button
              type="button"
              onClick={() => setCurrentPhase((p) => Math.max(p - 1, 2) as any)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "0.75rem 1.5rem",
                borderRadius: "10px",
                background: "transparent",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                fontSize: "0.92rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <button
              type="button"
              onClick={() => setCurrentPhase((p) => Math.min(p + 1, 5) as any)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "0.85rem 2rem",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #0d7377, #48c5ce)",
                border: "none",
                color: "#14171a",
                fontSize: "0.95rem",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(72, 197, 206, 0.3)",
              }}
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
