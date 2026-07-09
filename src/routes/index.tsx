import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/itr/store";
import Header from "@/components/itr/Header";
import { ProfileTab, IncomeTab, DeductionsTab, CompareTab, FilingTab, AITab } from "@/components/itr/Tabs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ITReturn — Indian Income Tax Calculator & Filing Assistant" },
      { name: "description", content: "Free Indian income tax calculator. Compare Old vs New regime, compute deductions, and prepare your ITR filing checklist for FY 2024-25." },
      { property: "og:title", content: "ITReturn — Indian Income Tax Calculator" },
      { property: "og:description", content: "Compare Old vs New tax regimes and prepare your ITR filing with confidence." },
    ],
  }),
  component: Index,
});

const TABS = [
  { id: "profile", label: "👤 Profile", Component: ProfileTab },
  { id: "income", label: "💼 Income", Component: IncomeTab },
  { id: "deductions", label: "📉 Deductions", Component: DeductionsTab },
  { id: "compare", label: "⚖️ Compare", Component: CompareTab },
  { id: "filing", label: "📋 Filing", Component: FilingTab },
  { id: "ai", label: "🤖 AI Advisor", Component: AITab },
];

function App() {
  const tab = useStore((s: any) => s.tab);
  const setTab = useStore((s: any) => s.setTab);
  const Active = TABS.find((t) => t.id === tab)?.Component || ProfileTab;
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="sticky top-[88px] z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex overflow-x-auto gap-1 py-1.5">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  tab === id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Active />
      </main>
    </div>
  );
}

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading ITReturn…</div>;
  }
  return <App />;
}
