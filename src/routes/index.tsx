import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/itr/store";
import Header from "@/components/itr/Header";
import { ProfileTab, IncomeTab, DeductionsTab, CompareTab, FilingTab, AITab } from "@/components/itr/Tabs";

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "Indian Tax Agent — ITR Filing Assistant FY 2025-26" },
      { name: "description", content: "Free Indian income tax calculator. Compare Old vs New regime, compute deductions, and prepare your ITR filing checklist." },
    ],
  }),
  component: Index,
} as any));

const TABS = [
  { id: "profile",    label: "Profile",    icon: "👤", Component: ProfileTab },
  { id: "income",     label: "Income",     icon: "💼", Component: IncomeTab },
  { id: "deductions", label: "Deductions", icon: "📉", Component: DeductionsTab },
  { id: "compare",    label: "Compare",    icon: "⚖️", Component: CompareTab },
  { id: "filing",     label: "Filing",     icon: "📋", Component: FilingTab },
  { id: "ai",         label: "AI Advisor", icon: "🤖", Component: AITab },
];

function App() {
  const tab    = useStore((s: any) => s.tab);
  const setTab = useStore((s: any) => s.setTab);
  const Active = TABS.find(t => t.id === tab)?.Component ?? ProfileTab;

  return (
    <div className="min-h-screen" style={{ background: '#EEF1F6' }}>
      <Header />

      {/* Tab nav */}
      <div className="sticky z-20" style={{ top: 116, background: '#0D1B2A' }}>
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex overflow-x-auto gap-1 py-2" style={{ scrollbarWidth: 'none' }}>
            {TABS.map(({ id, label, icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                  style={active
                    ? { background: '#F5A623', color: '#0D1B2A', boxShadow: '0 2px 10px rgba(245,166,35,0.35)' }
                    : { color: 'rgba(255,255,255,0.55)', background: 'transparent' }
                  }
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 fade-in">
        <Active />
      </main>
    </div>
  );
}

function Index() { return <App />; }
