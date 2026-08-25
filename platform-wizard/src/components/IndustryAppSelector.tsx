"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Users,
  Package,
  Hammer,
  BarChart3,
  ShoppingCart,
  Truck,
  Briefcase,
  Store,
  FileText,
  Heart,
  GraduationCap,
  Building2,
  Wrench,
  Cpu,
  CheckCircle2,
  Plus,
  Check,
  ShieldCheck,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

export interface AppModuleItem {
  id: string;
  name: string;
  category: "core" | "operations" | "industry" | "developer";
  description: string;
  icon: LucideIcon;
  accent: string;
  recommendedFor: string[];
}

export const ALL_APPS: AppModuleItem[] = [
  {
    id: "pcc",
    name: "Provider Control Center (PCC)",
    category: "operations",
    description: "Platform operations, multi-cloud fleets, security intelligence, FinOps & SRE runbooks (22 apps)",
    icon: ShieldCheck,
    accent: "#475569",
    recommendedFor: ["all"],
  },
  {
    id: "occ",
    name: "Organization Control Center (OCC)",
    category: "operations",
    description: "Workforce directory, access governance, organization entitlements, extensions & AI policies (22 apps)",
    icon: SlidersHorizontal,
    accent: "#f59e0b",
    recommendedFor: ["all"],
  },
  {
    id: "finance",
    name: "Finance & Accounting",
    category: "core",
    description: "General Ledger, AR/AP, Multi-Currency, Automatic Revaluation & Tax Compliance",
    icon: CreditCard,
    accent: "#34d399",
    recommendedFor: ["all"],
  },
  {
    id: "crm",
    name: "CRM & Sales Pipeline",
    category: "core",
    description: "Lead management, deal stages, CPQ quotation builder & customer timeline",
    icon: BarChart3,
    accent: "#38bdf8",
    recommendedFor: ["all"],
  },
  {
    id: "hr",
    name: "HR & Payroll",
    category: "core",
    description: "Employee directory, leave approvals, payroll runs, attendance & benefits",
    icon: Users,
    accent: "#a78bfa",
    recommendedFor: ["all"],
  },
  {
    id: "inventory",
    name: "Inventory & Warehouse",
    category: "operations",
    description: "Multi-location stock, barcode scanning, lot/batch tracking & replenishment",
    icon: Package,
    accent: "#f97316",
    recommendedFor: ["manufacturing", "retail", "field-service"],
  },
  {
    id: "manufacturing",
    name: "Manufacturing (MRP II)",
    category: "operations",
    description: "Bill of Materials (BOM), work orders, routing, scrap & capacity planning",
    icon: Hammer,
    accent: "#fbbf24",
    recommendedFor: ["manufacturing"],
  },
  {
    id: "procurement",
    name: "Procurement & SCM",
    category: "operations",
    description: "Purchase requisitions, vendor RFQ comparisons, POs & 3-way matching",
    icon: ShoppingCart,
    accent: "#06b6d4",
    recommendedFor: ["manufacturing", "retail", "services"],
  },
  {
    id: "projects",
    name: "Projects & Portfolios",
    category: "operations",
    description: "Gantt charts, Agile sprint boards, EVM cost tracking & timesheets",
    icon: Briefcase,
    accent: "#ec4899",
    recommendedFor: ["services", "tech-saas", "real-estate"],
  },
  {
    id: "pos",
    name: "Point of Sale (POS)",
    category: "operations",
    description: "Offline-first retail register, receipt printer support & shift balances",
    icon: Store,
    accent: "#10b981",
    recommendedFor: ["retail"],
  },
  {
    id: "documents",
    name: "Drive & Document Vault",
    category: "core",
    description: "Versioned file storage, PDF signing, OCR indexing & audit history",
    icon: FileText,
    accent: "#8b5cf6",
    recommendedFor: ["all"],
  },
  {
    id: "healthcare",
    name: "Clinical & Health Mgmt",
    category: "industry",
    description: "Patient charts, doctor appointment calendar & medical asset control",
    icon: Heart,
    accent: "#ef4444",
    recommendedFor: ["healthcare"],
  },
  {
    id: "real-estate",
    name: "Property & Real Estate",
    category: "industry",
    description: "Unit leasing, rent roll invoicing, maintenance tickets & listings",
    icon: Building2,
    accent: "#f59e0b",
    recommendedFor: ["real-estate"],
  },
  {
    id: "field-service",
    name: "Field Service Dispatch",
    category: "industry",
    description: "Mobile dispatch queue, technician routing & signature captures",
    icon: Wrench,
    accent: "#14b8a6",
    recommendedFor: ["field-service"],
  },
];

interface IndustryAppSelectorProps {
  industry?: string;
  selectedApps: string[];
  onChange: (apps: string[]) => void;
}

export function IndustryAppSelector({ industry = "manufacturing", selectedApps, onChange }: IndustryAppSelectorProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const toggleApp = (id: string) => {
    if (selectedApps.includes(id)) {
      onChange(selectedApps.filter((a) => a !== id));
    } else {
      onChange([...selectedApps, id]);
    }
  };

  const filtered = ALL_APPS.filter((app) => {
    if (filterCategory === "all") return true;
    return app.category === filterCategory;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: "0 0 0.25rem", color: "var(--color-text)" }}>
            Select Active Applications
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: 0 }}>
            {selectedApps.length} modules selected for your workspace. You can add more later in the Marketplace.
          </p>
        </div>

        <div style={{ display: "flex", gap: "6px", background: "var(--color-bg-sunken)", padding: "4px", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
          {["all", "core", "operations", "industry"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              style={{
                background: filterCategory === cat ? "var(--color-bg-elevated)" : "transparent",
                border: filterCategory === cat ? "1px solid var(--color-border)" : "1px solid transparent",
                color: filterCategory === cat ? "var(--color-text)" : "var(--color-text-secondary)",
                padding: "4px 10px",
                borderRadius: "7px",
                fontSize: "0.78rem",
                fontWeight: 700,
                textTransform: "capitalize",
                cursor: "pointer",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
          maxHeight: "420px",
          overflowY: "auto",
          paddingRight: "4px",
        }}
      >
        {filtered.map((app) => {
          const Icon = app.icon;
          const isSelected = selectedApps.includes(app.id);
          const isRecommended = app.recommendedFor.includes("all") || app.recommendedFor.includes(industry);

          return (
            <div
              key={app.id}
              onClick={() => toggleApp(app.id)}
              style={{
                padding: "1.25rem",
                borderRadius: "16px",
                background: isSelected ? "rgba(72, 197, 206, 0.08)" : "var(--color-bg-elevated)",
                border: `1.5px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: `linear-gradient(135deg, ${app.accent}26, ${app.accent}10)`,
                      border: `1px solid ${app.accent}40`,
                      color: app.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={20} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {isRecommended && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "rgba(249, 115, 22, 0.15)",
                          color: "#f97316",
                          border: "1px solid rgba(249, 115, 22, 0.3)",
                        }}
                      >
                        Recommended
                      </span>
                    )}
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: isSelected ? "var(--color-primary)" : "var(--color-bg-sunken)",
                        color: isSelected ? "#14171a" : "var(--color-text-secondary)",
                        border: isSelected ? "none" : "1px solid var(--color-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isSelected ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "0.3rem" }}>
                  {app.name}
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: 1.45 }}>
                  {app.description}
                </div>
              </div>

              <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {app.category}
                </span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: isSelected ? "var(--color-primary)" : "var(--color-text-secondary)" }}>
                  {isSelected ? "Active" : "Click to add"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
