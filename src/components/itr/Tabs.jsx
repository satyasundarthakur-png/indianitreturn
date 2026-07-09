import { useState, useRef, useEffect } from 'react';
import { useStore as _useStore } from '@/lib/itr/store';
import { useShallow } from 'zustand/react/shallow';
const useStore = (sel) => _useStore(useShallow(sel));
import { derive, CFG, FF, INR } from '@/lib/itr/taxEngine';
import { NumField, Toggle, Section, Box, Grid2 } from './shared/Fields';
import api from '@/lib/itr/api';

/* ─── PROFILE ─────────────────────────────────────────────────────────────── */
export function ProfileTab() {
  const { profile, setProfile, savedProfiles, setSavedProfiles, loadState, getState, setCurrentProfileId, currentProfileId, token } = useStore(s => s);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (token) api.get('/profiles').then(r => setSavedProfiles(r.data.profiles)).catch(() => {});
  }, [token]);

  const saveProfile = async () => {
    setSaving(true); setMsg('');
    try {
      const state = getState();
      if (currentProfileId) {
        await api.put(`/profiles/${currentProfileId}`, { label: profile.name || 'My Profile', state });
        setMsg('Profile updated ✓');
      } else {
        const r = await api.post('/profiles', { label: profile.name || 'My Profile', state });
        setCurrentProfileId(r.data.profile.id);
        setMsg('Profile saved ✓');
      }
      const list = await api.get('/profiles');
      setSavedProfiles(list.data.profiles);
    } catch { setMsg('Save failed'); }
    setSaving(false);
  };

  const loadProfile = async (id) => {
    try {
      const r = await api.get(`/profiles/${id}`);
      loadState(r.data.profile.state);
      setCurrentProfileId(id);
    } catch { alert('Failed to load profile'); }
  };

  const deleteProfile = async (id) => {
    if (!confirm('Delete this profile?')) return;
    await api.delete(`/profiles/${id}`).catch(() => {});
    setSavedProfiles(savedProfiles.filter(p => p.id !== id));
    if (currentProfileId === id) setCurrentProfileId(null);
  };

  const cfg = CFG();

  return (
    <div>
      {savedProfiles.length > 0 && (
        <Section title="💾 Saved Profiles">
          <div className="space-y-2">
            {savedProfiles.map(p => (
              <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${currentProfileId===p.id?'border-blue-400 bg-blue-50':'border-slate-200 hover:border-slate-300'}`}>
                <span onClick={() => loadProfile(p.id)} className="flex-1 font-medium text-slate-700">{p.label}</span>
                <span className="text-xs text-slate-400 mr-3">{new Date(p.updated_at).toLocaleDateString('en-IN')}</span>
                <button onClick={() => deleteProfile(p.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="👤 Taxpayer Details">
        <Grid2>
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">Full name</label>
            <input value={profile.name} onChange={e => setProfile({ name: e.target.value })}
              placeholder="Rajesh Kumar"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">PAN (optional)</label>
            <input value={profile.pan} onChange={e => setProfile({ pan: e.target.value.toUpperCase() })}
              placeholder="ABCDE1234F" maxLength={10}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
        </Grid2>
        <Grid2>
          <NumField label="Age (as of 31 March 2026)" value={profile.age} onChange={v => setProfile({ age: v })} hint="Affects slab, rebate, and 80TTB eligibility" max={120} />
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">Residential status</label>
            <select value={profile.residential} onChange={e => setProfile({ residential: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="resident">Resident (ROR / RNOR)</option>
              <option value="nri">Non-Resident (NRI)</option>
            </select>
          </div>
        </Grid2>
        {profile.residential === 'nri' && <Box type="warning">NRI: Must file ITR-2. Only India-sourced income is taxable. Rebate 87A not available.</Box>}
      </Section>

      <Section title={`📅 Key Dates — ${cfg.label}`}>
        <div className="grid grid-cols-2 gap-3">
          {[
            [cfg.deadline, 'Filing deadline (non-audit)', 'green'],
            [cfg.deadline.replace('Jul','Oct'), 'Audit cases (ITR-3)', 'amber'],
            [cfg.belated, 'Belated / revised return', 'blue'],
            [cfg.adv1, 'Advance tax — 1st instalment (15%)', 'slate'],
          ].map(([date, label, color]) => (
            <div key={date} className={`rounded-lg p-3 border border-${color}-200 bg-${color}-50`}>
              <div className={`text-sm font-bold text-${color}-700`}>{date}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </Section>

      <div className="flex items-center gap-3 mt-2">
        <button onClick={saveProfile} disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
          {saving ? 'Saving…' : currentProfileId ? '💾 Update Profile' : '💾 Save Profile'}
        </button>
        {msg && <span className={`text-sm ${msg.includes('✓') ? 'text-emerald-600' : 'text-red-500'}`}>{msg}</span>}
      </div>
    </div>
  );
}

/* ─── INCOME ──────────────────────────────────────────────────────────────── */
export function IncomeTab() {
  const { income: I, setIncome } = useStore(s => ({ income: s.income, setIncome: s.setIncome }));
  const state = useStore(s => ({ profile: s.profile, income: s.income, ded: s.ded }));
  const d = derive(state);
  const cfg = CFG();

  return (
    <div>
      <Section title="💼 Salary / Pension">
        <NumField label="Gross salary (total CTC)" value={I.grossSalary} onChange={v=>setIncome({grossSalary:v})} hint="Include basic, DA, HRA, all allowances and perquisites" />
        {d.doubleEntryWarn && <Box type="danger">⚠️ Possible double entry: both salary and professional receipts entered. Confirm these are separate income sources.</Box>}
        <Grid2>
          <NumField label="Basic salary" value={I.basic} onChange={v=>setIncome({basic:v})} hint="Used for HRA exemption calculation" />
          <NumField label="DA (dearness allowance)" value={I.da} onChange={v=>setIncome({da:v})} hint="Government employees" />
          <NumField label="HRA received" value={I.hra} onChange={v=>setIncome({hra:v})} />
          <NumField label="Annual rent paid" value={I.rentPaid} onChange={v=>setIncome({rentPaid:v})} />
        </Grid2>
        <Toggle label="Metro city? (Mumbai / Delhi / Chennai / Kolkata)" checked={I.isMetro} onChange={v=>setIncome({isMetro:v})} />
        {I.hra>0&&I.rentPaid>0 && <Box type="success">✓ HRA exemption (old regime): {FF(d.hraEx)} = min(HRA, Rent−10% basic, {I.isMetro?'50%':'40%'} of basic+DA)</Box>}
        <NumField label="LTA (leave travel allowance)" value={I.lta} onChange={v=>setIncome({lta:v})} hint="Old regime only. 2 journeys in 4-year block." />
        <Box type={I.grossSalary>0?'info':'warning'}>
          {I.grossSalary>0
            ? `Standard deduction: ₹${Math.min(cfg.stdNew,I.grossSalary).toLocaleString('en-IN')} (new) · ₹${Math.min(cfg.stdOld,I.grossSalary).toLocaleString('en-IN')} (old)`
            : '⚠️ Standard deduction applies to salary income only. Not available for pure professional income.'}
        </Box>
      </Section>

      <Section title="🏠 House Property">
        <Toggle label="Self-occupied property?" checked={I.selfOccupied} onChange={v=>setIncome({selfOccupied:v})} />
        {I.selfOccupied
          ? <NumField label="Home loan interest (Sec 24b)" value={I.homeLoanInterestHP} onChange={v=>setIncome({homeLoanInterestHP:v})} hint="Max deduction ₹2,00,000 for self-occupied" max={200000} />
          : <>
              <NumField label="Annual rent received" value={I.annualRent} onChange={v=>setIncome({annualRent:v})} />
              <NumField label="Municipal tax paid" value={I.municipalTax} onChange={v=>setIncome({municipalTax:v})} />
              <NumField label="Home loan interest (let-out)" value={I.homeLoanInterestHP} onChange={v=>setIncome({homeLoanInterestHP:v})} hint="No ceiling for let-out property" />
            </>}
        <Box type={d.hpInc<0?'warning':'info'}>{d.hpInc<0?`Loss on HP: ${FF(d.hpInc)} — can offset salary up to ₹2L (old regime)`:`HP income: ${FF(d.hpInc)}`}</Box>
      </Section>

      <Section title="🧾 Business / Profession / F&O">
        <Toggle label="Presumptive taxation (44AD / 44ADA)?" checked={I.presumptive} onChange={v=>setIncome({presumptive:v})} />
        {I.presumptive ? (
          <>
            <NumField label="Gross professional/business receipts" value={I.grossProfessional} onChange={v=>setIncome({grossProfessional:v})} hint="Doctors, CAs, lawyers → 44ADA max ₹75L" />
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Presumptive rate</label>
              <select value={I.presumptiveRate} onChange={e=>setIncome({presumptiveRate:Number(e.target.value)})}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                <option value={50}>50% — Section 44ADA (professionals)</option>
                <option value={6}>6% — Section 44AD (digital transactions)</option>
                <option value={8}>8% — Section 44AD (cash business)</option>
              </select>
            </div>
            {I.grossProfessional>0 && <Box type="success">✓ Net presumptive income: {FF(d.profNet)}</Box>}
          </>
        ) : (
          <>
            <NumField label="Business income (net profit)" value={I.businessIncome} onChange={v=>setIncome({businessIncome:v})} hint="P&L as per books" />
            <Grid2>
              <NumField label="Gross professional receipts" value={I.grossProfessionalReceipts} onChange={v=>setIncome({grossProfessionalReceipts:v})} />
              <NumField label="Professional expenses" value={I.professionalExpenses} onChange={v=>setIncome({professionalExpenses:v})} />
            </Grid2>
          </>
        )}
        <NumField label="F&O profit / loss (net)" value={I.fnoProfit} onChange={v=>setIncome({fnoProfit:v})} hint="Futures & Options = non-speculative business. Must use ITR-3." />
        {d.hasFnO && <Box type="warning">⚠️ F&O income requires ITR-3. Cannot use ITR-1, 2, or 4.</Box>}
      </Section>

      <Section title="📈 Capital Gains (Budget 2024)">
        <Box type="info">Listed equity/MF: STCG @ 20% · LTCG @ 12.5% with ₹1.25L exemption (holding &gt;12 months)</Box>
        <Grid2>
          <NumField label="STCG — listed equity/MF (Sec 111A)" value={I.stcg15} onChange={v=>setIncome({stcg15:v})} hint="Short-term ≤12 months — 20%" />
          <NumField label="STCG — other assets" value={I.stcgOther} onChange={v=>setIncome({stcgOther:v})} hint="Debt MF, property — slab rate" />
          <NumField label="LTCG — listed equity/MF (Sec 112A)" value={I.ltcg10} onChange={v=>setIncome({ltcg10:v})} hint="12.5% on gains > ₹1.25L" />
          <NumField label="LTCG — other assets" value={I.ltcgOther} onChange={v=>setIncome({ltcgOther:v})} hint="Property, gold — 20%" />
        </Grid2>
        {I.ltcg10>0 && <Box type="success">✓ LTCG exempt: {FF(cfg.ltcgExempt)} | Taxable LTCG: {FF(d.ltcgTax)} @ 12.5%</Box>}
        {d.hasCG && !d.hasFnO && <Box type="warning">⚠️ Capital gains requires ITR-2 (not ITR-1).</Box>}
      </Section>

      <Section title="💰 Other Sources">
        <Grid2>
          <NumField label="FD / RD interest" value={I.fdInterest} onChange={v=>setIncome({fdInterest:v})} hint="TDS @10% if >₹40K (₹50K for seniors)" />
          <NumField label="Savings account interest" value={I.savingsInterest} onChange={v=>setIncome({savingsInterest:v})} hint={`₹${d.cat==='senior'?'50,000 exempt u/s 80TTB':'10,000 exempt u/s 80TTA'} (auto-applied)`} />
          <NumField label="Dividends" value={I.dividends} onChange={v=>setIncome({dividends:v})} hint="Taxable at slab rate" />
          <NumField label="Other income" value={I.otherIncome} onChange={v=>setIncome({otherIncome:v})} />
        </Grid2>
        <NumField label="Online gaming winnings" value={I.onlineGaming} onChange={v=>setIncome({onlineGaming:v})} hint="Taxed at flat 30% + cess. No deduction allowed." />
        <NumField label="TDS deducted (from 26AS / AIS)" value={I.tdsPaid} onChange={v=>setIncome({tdsPaid:v})} hint="Total TDS by employer, banks, etc. — do NOT include advance tax here" />
        <NumField label="Advance tax self-deposited (challans)" value={I.advTaxPaid} onChange={v=>setIncome({advTaxPaid:v})} hint="Total paid via income tax challan 280 during FY 2025-26" />
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{color:'#6B7A99',letterSpacing:'0.06em'}}>
            Self-assessment tax payment date
          </label>
          <input type="date" value={I.selfAssessDate||'2026-07-10'} min="2026-04-01" max="2027-03-31"
            onChange={e=>setIncome({selfAssessDate:e.target.value})}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold"
            style={{background:'#F7F9FC',border:'1.5px solid #D8DEE8',color:'#0D1B2A'}} />
          <p className="text-xs mt-1.5" style={{color:'#9AAABB'}}>Used to calculate 234B interest (1%/month from 1 Apr 2026 to this date)</p>
        </div>
      </Section>
    </div>
  );
}

/* ─── DEDUCTIONS ──────────────────────────────────────────────────────────── */
export function DeductionsTab() {
  const { ded: D, setDed } = useStore(s => ({ ded: s.ded, setDed: s.setDed }));
  const state = useStore(s => ({ profile: s.profile, income: s.income, ded: s.ded }));
  const d = derive(state);
  const P = state.profile;

  const rows = [
    ['Sec 80C', d.c80C],
    ['Sec 80CCD(1B) — NPS self', d.c80CCD1B],
    ['Sec 80CCD(2) — Employer NPS (both regimes)', d.c80CCD2],
    ['Sec 80D — Health insurance', d.c80D],
    ['Sec 80E — Education loan interest', D.c80E||0],
    ['Sec 80EEA — Affordable housing', d.c80EEA],
    ['Sec 80G — Donations', D.c80G||0],
    [P.age>=60?'Sec 80TTB — Savings/FD interest (auto)':'Sec 80TTA — Savings interest (auto)', d.savExUsed],
  ].filter(([,v]) => v > 0);

  return (
    <div>
      <Box type="info">ℹ️ Deductions are available <strong>only under Old Regime</strong>. New regime allows only Sec 80CCD(2) — Employer NPS contribution.</Box>

      <Section title="Sec 80C (max ₹1,50,000)">
        <NumField label="80C investments & payments" value={D.c80C} onChange={v=>setDed({c80C:v})} hint="EPF, PPF, ELSS, LIC, NSC, tuition fees, home loan principal" max={150000} />
        {D.c80C>150000 && <Box type="warning">80C deduction capped at ₹1,50,000</Box>}
      </Section>

      <Section title="Sec 80CCD — NPS">
        <NumField label="80CCD(1B) — NPS self-contribution (max ₹50,000)" value={D.c80CCD1B} onChange={v=>setDed({c80CCD1B:v})} hint="Additional deduction over 80C limit. Old regime only." max={50000} />
        <NumField label="80CCD(2) — Employer NPS contribution" value={D.c80CCD2} onChange={v=>setDed({c80CCD2:v})} hint="Both regimes. Max 10% of salary (central govt: 14%). No upper limit in new regime." />
      </Section>

      <Section title="Sec 80D — Health Insurance">
        <Grid2>
          <NumField label="Self/spouse/children (max ₹25,000 / ₹50,000 sr)" value={D.c80D_self} onChange={v=>setDed({c80D_self:v})} max={P.age>=60?50000:25000} />
          <NumField label="Parents premium (max ₹25,000 / ₹50,000 sr)" value={D.c80D_par} onChange={v=>setDed({c80D_par:v})} max={P.age>=60?50000:25000} hint="₹50,000 if parents are senior citizens" />
        </Grid2>
      </Section>

      <Section title="Other Deductions">
        <NumField label="Sec 80E — Education loan interest" value={D.c80E} onChange={v=>setDed({c80E:v})} hint="No upper limit. Only interest portion. 8 consecutive years." />
        <NumField label="Sec 80EEA — Affordable housing interest" value={D.c80EEA} onChange={v=>setDed({c80EEA:v})} hint="Additional ₹1.5L for first-time buyers. Stamp duty ≤ ₹45L. Loan: Apr 2019 – Mar 2022." max={150000} />
        <NumField label="Sec 80G — Donations" value={D.c80G} onChange={v=>setDed({c80G:v})} hint="50% or 100% depending on institution. Subject to 10% of GTI cap." />
      </Section>

      {rows.length > 0 && (
        <Section title="📋 Old Regime Deduction Summary">
          {rows.map(([k,v]) => (
            <div key={k} className="flex justify-between items-center py-1.5 border-b border-slate-100 text-sm">
              <span className="text-slate-600">{k}</span>
              <span className="font-semibold text-emerald-700">{FF(v)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center py-2 mt-1 font-bold text-sm">
            <span>Total old-regime deductions</span>
            <span className="text-emerald-700">{FF(d.totalDed + d.c80CCD2 + d.savExUsed)}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
            <span>New regime (only 80CCD(2))</span>
            <span>{FF(d.c80CCD2)}</span>
          </div>
        </Section>
      )}
    </div>
  );
}

/* ─── COMPARE ─────────────────────────────────────────────────────────────── */
/* ─── INTEREST PANEL (234B + 234C) ───────────────────────────────────────── */
function InterestPanel({ s234B, s234C, totalTax, tds, advTax, netPayable }) {
  const prepaid = tds + advTax;
  const rows = [
    ['Total tax liability', FF(totalTax), ''],
    ['Less: TDS deducted', `(${FF(tds)})`, 'text-emerald-700'],
    ...(advTax > 0 ? [['Less: Advance tax paid', `(${FF(advTax)})`, 'text-emerald-700']] : []),
    ['Balance before interest', FF(Math.max(0, totalTax - prepaid)), 'font-bold'],
    ...(s234B.applicable ? [['Add: Interest u/s 234B', `+${FF(s234B.interest)}`, 'text-red-600']] : []),
    ...(s234C.applicable ? [['Add: Interest u/s 234C', `+${FF(s234C.interest)}`, 'text-red-600']] : []),
  ];

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl p-3 text-center" style={{background:'#FFF7ED',border:'1.5px solid #FED7AA'}}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{color:'#C2410C'}}>234B Interest</div>
          <div className="text-xl font-black tabular" style={{color:'#9A3412'}}>{FF(s234B.interest)}</div>
          {s234B.applicable
            ? <div className="text-xs mt-1" style={{color:'#C2410C'}}>{s234B.months} month{s234B.months!==1?'s':''} × 1%</div>
            : <div className="text-xs mt-1" style={{color:'#16A34A'}}>Not applicable</div>}
        </div>
        <div className="rounded-xl p-3 text-center" style={{background:'#FFF7ED',border:'1.5px solid #FED7AA'}}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{color:'#C2410C'}}>234C Interest</div>
          <div className="text-xl font-black tabular" style={{color:'#9A3412'}}>{FF(s234C.interest)}</div>
          {s234C.applicable
            ? <div className="text-xs mt-1" style={{color:'#C2410C'}}>4 installments</div>
            : <div className="text-xs mt-1" style={{color:'#16A34A'}}>Not applicable</div>}
        </div>
        <div className="rounded-xl p-3 text-center" style={{
          background: netPayable>0 ? '#FEF2F2' : '#F0FDF4',
          border: `1.5px solid ${netPayable>0?'#FECACA':'#BBF7D0'}`}}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{color:netPayable>0?'#991B1B':'#14532D'}}>
            {netPayable > 0 ? 'Total Payable' : 'Refund Due'}
          </div>
          <div className="text-xl font-black tabular" style={{color:netPayable>0?'#7F1D1D':'#14532D'}}>{FF(Math.abs(netPayable))}</div>
          <div className="text-xs mt-1" style={{color:netPayable>0?'#991B1B':'#14532D'}}>
            {netPayable>0 ? 'pay now' : 'claim refund'}
          </div>
        </div>
      </div>

      {/* Computation waterfall */}
      <div className="rounded-xl overflow-hidden mb-4" style={{border:'1.5px solid #E8EDF4'}}>
        <table className="w-full text-xs">
          <tbody>
            {rows.map(([label, value, cls], i) => (
              <tr key={label} style={{background: i%2===0?'#F7F9FC':'white'}}>
                <td className="px-3 py-2" style={{color:'#374151'}}>{label}</td>
                <td className={`px-3 py-2 text-right font-bold tabular ${cls}`}>{value}</td>
              </tr>
            ))}
            <tr style={{background:'#0D1B2A'}}>
              <td className="px-3 py-2 font-bold text-white">{netPayable>=0?'NET TAX PAYABLE':'REFUND DUE'}</td>
              <td className="px-3 py-2 text-right font-black tabular text-white">{FF(Math.abs(netPayable))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 234B detail */}
      {s234B.applicable && (
        <div className="rounded-xl p-3 mb-3" style={{background:'#FFFBEB',border:'1.5px solid #FDE68A'}}>
          <div className="text-xs font-bold mb-2" style={{color:'#92400E'}}>📌 Section 234B — Default in Advance Tax</div>
          <div className="grid grid-cols-2 gap-2 text-xs" style={{color:'#78350F'}}>
            <div>Deficit (tax − prepaid)</div><div className="text-right font-bold tabular">{FF(s234B.deficit)}</div>
            <div>Interest base (↓ to ₹100)</div><div className="text-right font-bold tabular">{FF(s234B.base)}</div>
            <div>Period (1 Apr 2026 → pay date)</div><div className="text-right font-bold">{s234B.months} month{s234B.months!==1?'s':''}</div>
            <div>Interest = base × 1% × months</div><div className="text-right font-bold tabular text-red-700">{FF(s234B.interest)}</div>
          </div>
        </div>
      )}
      {!s234B.applicable && (
        <Box type="success">✓ 234B exempt — {s234B.reason}</Box>
      )}

      {/* 234C detail */}
      {s234C.applicable && s234C.breakdown?.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-3" style={{border:'1.5px solid #FDE68A'}}>
          <div className="px-3 py-2 text-xs font-bold" style={{background:'#FFFBEB',color:'#92400E'}}>
            📌 Section 234C — Deferment of Installments (Advance tax base: {FF(s234C.advBase)})
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{background:'#FEF9C3'}}>
                <th className="px-3 py-1.5 text-left" style={{color:'#713F12'}}>Due date</th>
                <th className="px-3 py-1.5 text-right" style={{color:'#713F12'}}>Required</th>
                <th className="px-3 py-1.5 text-right" style={{color:'#713F12'}}>Paid</th>
                <th className="px-3 py-1.5 text-right" style={{color:'#713F12'}}>Shortfall</th>
                <th className="px-3 py-1.5 text-right" style={{color:'#713F12'}}>Interest</th>
              </tr>
            </thead>
            <tbody>
              {s234C.breakdown.map((row, i) => (
                <tr key={row.label} style={{background:i%2===0?'white':'#FFFBEB'}}>
                  <td className="px-3 py-1.5" style={{color:'#374151'}}>{row.label}</td>
                  <td className="px-3 py-1.5 text-right tabular" style={{color:'#374151'}}>{FF(row.required)}</td>
                  <td className="px-3 py-1.5 text-right tabular" style={{color:'#16A34A'}}>{FF(row.paid)}</td>
                  <td className="px-3 py-1.5 text-right tabular" style={{color:'#DC2626'}}>{FF(row.shortfall)}</td>
                  <td className="px-3 py-1.5 text-right tabular font-bold" style={{color:'#9A3412'}}>{FF(row.interest)}</td>
                </tr>
              ))}
              <tr style={{background:'#FEF9C3'}}>
                <td colSpan={4} className="px-3 py-1.5 font-bold text-right" style={{color:'#713F12'}}>Total 234C Interest</td>
                <td className="px-3 py-1.5 text-right font-black tabular" style={{color:'#9A3412'}}>{FF(s234C.interest)}</td>
              </tr>
            </tbody>
          </table>
          <div className="px-3 py-2 text-xs" style={{color:'#92400E',background:'#FFFBEB'}}>
            * Assumes advance tax was paid as lump sum at/after 15 Mar 2026. If paid in earlier installments, actual 234C will be lower.
          </div>
        </div>
      )}
      {!s234C.applicable && (
        <Box type="success">✓ 234C exempt — {s234C.reason}</Box>
      )}
    </div>
  );
}

export function CompareTab() {
  const state = useStore(s => ({ profile: s.profile, income: s.income, ded: s.ded }));
  const d = derive(state);
  const cfg = CFG();
  const { totalNew: rn, totalOld: ro, savings: sv } = d;
  const best = sv >= 0;
  const mrNew = d.rNew.marginalRelief || 0;

  return (
    <div>
      {/* Regime cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label:'New Regime', tax:rn, sub:`on ${INR(d.normalNew)} taxable`, extra:`Std ₹75K · No Chap VI-A`, rebate:d.rNew.rebate, isBest:best },
          { label:'Old Regime', tax:ro, sub:`on ${INR(d.normalOld)} taxable`, extra:`Std ₹50K · HRA/80C/80D`, rebate:d.rOld.rebate, isBest:!best },
        ].map(({ label, tax, sub, extra, rebate, isBest }) => (
          <div key={label} className={`rounded-xl p-4 border-2 relative ${isBest?'border-emerald-400 bg-emerald-50':'border-slate-200 bg-white'}`}>
            {isBest && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">Better choice</div>}
            <div className="text-xs text-slate-500 mb-1">{label}</div>
            <div className={`text-2xl font-bold ${isBest?'text-emerald-700':'text-slate-800'}`}>{FF(tax)}</div>
            <div className="text-xs text-slate-500 mt-1">{sub}</div>
            <div className="text-xs text-slate-400 mt-1">{extra}</div>
            {rebate > 0 && <div className="text-xs text-emerald-600 mt-1">Rebate 87A: {FF(rebate)}</div>}
            {mrNew > 0 && label==='New Regime' && (
              <span className="inline-block bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs px-2 py-0.5 rounded-full mt-1">Marginal relief: {FF(mrNew)}</span>
            )}
          </div>
        ))}
      </div>

      {/* Savings banner */}
      <div className={`rounded-xl p-4 mb-4 text-center border ${best?'bg-emerald-50 border-emerald-200':'bg-blue-50 border-blue-200'}`}>
        <div className="text-xs text-slate-500">{best?'New regime saves you':'Old regime saves you'}</div>
        <div className={`text-3xl font-bold mt-1 ${best?'text-emerald-700':'text-blue-700'}`}>{FF(Math.abs(sv))}</div>
        <div className="text-xs text-slate-400 mt-1">per year</div>
      </div>

      {mrNew > 0 && <Box type="warning">⚡ Marginal relief applied: Income ({INR(d.normalNew)}) just above ₹12L threshold. Tax capped so you don't pay more than the excess over ₹12L.</Box>}
      {d.isNri && <Box type="warning">⚠️ NRI: Rebate 87A not available. New regime may not apply if business income from India.</Box>}

      {/* Breakdown table */}
      <Section title="Tax Computation Breakdown">
        <table className="w-full text-xs">
          <thead><tr className="bg-slate-800 text-white"><th className="text-left p-2">Component</th><th className="text-right p-2">New</th><th className="text-right p-2">Old</th></tr></thead>
          <tbody>
            {[
              ['Slab tax (before rebate)', FF(d.rNew.slab), FF(d.rOld.slab)],
              ...(d.rNew.rebate||d.rOld.rebate?[['Rebate 87A', d.rNew.rebate?`−${FF(d.rNew.rebate)}`:'—', d.rOld.rebate?`−${FF(d.rOld.rebate)}`:'—']]:[]),
              ...(mrNew?[['Marginal relief', `−${FF(mrNew)}`, '—']]:[]),
              ...(d.rNew.sur||d.rOld.sur?[['Surcharge', FF(d.rNew.sur||0), FF(d.rOld.sur||0)]]:[]),
              ['Health & Ed Cess (4%)', FF(d.rNew.cess||0), FF(d.rOld.cess||0)],
              ...(d.spCess?[['Capital gains tax', FF(d.spCess), FF(d.spCess)]]:[]),
              ...(d.gamingTax?[['Online gaming tax (30%)', FF(d.gamingTax), FF(d.gamingTax)]]:[]),
            ].map(([l,n,o],i) => (
              <tr key={l} className={i%2===0?'bg-slate-50':''}>
                <td className="p-2">{l}</td><td className="p-2 text-right font-mono">{n}</td><td className="p-2 text-right font-mono">{o}</td>
              </tr>
            ))}
            <tr className="bg-slate-800 text-white font-bold">
              <td className="p-2">Total Tax Liability</td><td className="p-2 text-right">{FF(rn)}</td><td className="p-2 text-right">{FF(ro)}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Slab tables */}
      <Section title={`New Regime Slabs — ${cfg.label}`}>
        <table className="w-full text-xs">
          <thead><tr className="bg-slate-800 text-white"><th className="text-left p-2">Income Range</th><th className="text-right p-2">Rate</th></tr></thead>
          <tbody>
            {cfg.newSlabs.map(([u,r],i,arr) => {
              const prev=i>0?arr[i-1][0]:0;
              const label=u===Infinity?`Above ₹${(prev/100000).toFixed(0)}L`:`₹${(prev/100000).toFixed(0)||'0'} – ₹${(u/100000).toFixed(0)}L`;
              return <tr key={i} className={i%2===0?'bg-slate-50':''}><td className="p-2">{label}</td><td className="p-2 text-right font-semibold">{(r*100).toFixed(0)}%</td></tr>;
            })}
          </tbody>
        </table>
        <Box type="success">✓ {cfg.note||`Rebate u/s 87A: Zero tax up to ₹12L income. Marginal relief up to ₹12.75L.`}</Box>
      </Section>

      {/* Advance tax schedule */}
      {rn > 10000 && (
        <Section title="🗓 Advance Tax Installment Schedule (New Regime)">
          {(() => {
            const advBase = Math.max(0, rn - (state.income.tdsPaid||0));
            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {[[cfg.adv1,'15%',advBase*.15],[cfg.adv2,'45%',advBase*.45],[cfg.adv3,'75%',advBase*.75],[cfg.adv4,'100%',advBase]].map(([dt,p,a]) => (
                    <div key={dt} className="rounded-xl p-3 text-center" style={{background:'#F0F4FA',border:'1.5px solid #D8DEE8'}}>
                      <div className="text-xs" style={{color:'#9AAABB'}}>{dt}</div>
                      <div className="text-xs font-semibold mt-0.5" style={{color:'#6B7A99'}}>{p} due</div>
                      <div className="text-sm font-black mt-1" style={{color:'#0D1B2A'}}>{FF(a)}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs mb-1" style={{color:'#9AAABB'}}>
                  Advance tax base = Total tax ({FF(rn)}) − TDS ({FF(state.income.tdsPaid||0)}) = <strong>{FF(advBase)}</strong>
                </p>
              </>
            );
          })()}
        </Section>
      )}

      {/* 234B / 234C Interest Computation */}
      {rn > 10000 && (
        <Section title="⏱ Interest u/s 234B & 234C — New Regime">
          <InterestPanel s234B={d.s234B_new} s234C={d.s234C_new} totalTax={rn}
            tds={state.income.tdsPaid||0} advTax={state.income.advTaxPaid||0}
            netPayable={d.netPayableNew} />
        </Section>
      )}
      {ro > 10000 && (
        <Section title="⏱ Interest u/s 234B & 234C — Old Regime">
          <InterestPanel s234B={d.s234B_old} s234C={d.s234C_old} totalTax={ro}
            tds={state.income.tdsPaid||0} advTax={state.income.advTaxPaid||0}
            netPayable={d.netPayableOld} />
        </Section>
      )}
    </div>
  );
}

/* ─── FILING ──────────────────────────────────────────────────────────────── */
export function FilingTab() {
  const state = useStore(s => ({ profile: s.profile, income: s.income, ded: s.ded }));
  const d = derive(state);
  const I = state.income, D = state.ded;

  const docs = [
    ['Form 16', 'TDS certificate from employer. Part A: TDS summary. Part B: salary breakup.'],
    ['Form 26AS / AIS / TIS', 'Download from IT portal. Shows all tax credits and high-value transactions. Mandatory to review.'],
    d.hasCG && ['Capital gain statements', 'Broker statement (Zerodha/Groww) or CAMS/KFintech for MF — full year.'],
    d.hasFnO && ['P&L statement (F&O)', 'Download from broker. Include all open/closed positions.'],
    d.hasPresumptive && ['Bank statement (full year)', 'For 44ADA/44AD: show total receipts and digital vs cash split.'],
    I.homeLoanInterestHP>0 && ['Home loan interest certificate', 'From bank — interest paid in FY 2025-26 separately from principal.'],
    D.c80C>0 && ['80C proofs', 'PPF passbook, ELSS statement, LIC premium receipts, EPF passbook.'],
    (D.c80D_self>0||D.c80D_par>0) && ['Health insurance premium receipts', 'For 80D claim. Include policy schedule.'],
    D.c80E>0 && ['Education loan certificate', 'From bank — interest paid in FY 2025-26.'],
    ['Aadhaar + PAN', 'Link Aadhaar-PAN if not done (incometax.gov.in). Mandatory for filing.'],
    ['Bank account details', 'IFSC + account number. Pre-validate on IT portal for refund.'],
  ].filter(Boolean);

  const steps = [
    ['Register / Login', 'incometax.gov.in → Login with PAN. New users: Register first.'],
    ['Download AIS / 26AS', 'e-File → Income Tax Return → check pre-filled data. Reconcile with Form 16.'],
    ['Select ITR form', `e-File → File Income Tax Return → ${d.itrForm} → Online → AY 2026-27`],
    ['Fill income details', 'Enter each head. Pre-filled data may have errors — verify carefully.'],
    ['Claim deductions', 'Old regime: enter 80C, 80D, HRA etc. New regime: only 80CCD(2) applies.'],
    ['Choose regime', 'Salaried: can switch every year. Business owners: switching from old regime is one-time.'],
    ['Compute & pay tax', 'If tax payable > ₹0 after TDS, pay self-assessment tax via Challan 280 first.'],
    ['e-Verify', 'Verify within 30 days via Aadhaar OTP / net banking / DSC. Unverified = not filed.'],
  ];

  return (
    <div>
      <Box type={d.itrForm==='ITR-1'?'success':'info'}>
        📄 Your ITR form: <strong>{d.itrForm}</strong>{d.itrReason?` — ${d.itrReason}`:''}
      </Box>

      <Section title={`📁 Documents Checklist — ${d.itrForm}`}>
        {docs.map(([doc, desc]) => (
          <div key={doc} className="flex gap-3 py-2 border-b border-slate-100 last:border-0">
            <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</div>
            <div className="text-sm"><strong>{doc}</strong> — <span className="text-slate-500">{desc}</span></div>
          </div>
        ))}
      </Section>

      <Section title="📋 Step-by-Step Filing Guide">
        {steps.map(([step, desc], i) => (
          <div key={step} className="flex gap-3 py-2 border-b border-slate-100 last:border-0">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</div>
            <div className="text-sm"><strong>{step}</strong><div className="text-slate-400 text-xs mt-0.5">{desc}</div></div>
          </div>
        ))}
      </Section>

      <Section title="⚠️ Common Mistakes to Avoid">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          {['Not reporting FD interest — TDS deducted but interest still taxable in full',
            'Skipping capital gains — even small ELSS/MF redemptions must be reported',
            'Not reconciling AIS — mismatches trigger scrutiny notices',
            'Choosing wrong ITR form — using ITR-1 when ITR-2 or ITR-3 is required',
            'Not e-verifying within 30 days — return treated as not filed',
            'Missing advance tax — 234B / 234C interest applies even for small defaults',
            '44ADA: if receipts > ₹75L, presumptive scheme is not available',
          ].map(e => <div key={e} className="text-xs text-red-700 py-1 border-b border-red-100 last:border-0">• {e}</div>)}
        </div>
      </Section>
    </div>
  );
}

/* ─── AI ADVISOR ──────────────────────────────────────────────────────────── */
export function AITab() {
  const { messages, aiLoading, userInput, setMessages, setAiLoading, setUserInput } = useStore(s => s);
  const state = useStore(s => ({ profile: s.profile, income: s.income, ded: s.ded }));
  const d = derive(state);
  const cfg = CFG();
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, aiLoading]);

  const buildSystem = () => {
    const P = state.profile, I = state.income;
    return `You are an expert Indian tax advisor for ${cfg.label} (${cfg.ay}). Be concise, use ₹ amounts, refer to the user's actual numbers below.

PROFILE: Name: ${P.name||'User'} | Age: ${P.age} | Status: ${P.residential}${d.isNri?' — NRI (rebate 87A not available)':''}
INCOME: Salary: ${FF(I.grossSalary)} | HRA exempt (old): ${FF(d.hraEx)} | HP: ${FF(d.hpInc)} | Business: ${FF(d.totalBiz)} | F&O: ${FF(I.fnoProfit||0)} | STCG: ${FF(I.stcg15||0)} | LTCG: ${FF(I.ltcg10||0)} | FD interest: ${FF(I.fdInterest||0)} | GTI new: ${FF(d.gtiNew)} | GTI old: ${FF(d.gtiOld)}
DEDUCTIONS: 80C: ${FF(d.c80C)} | 80CCD(1B): ${FF(d.c80CCD1B)} | 80CCD(2): ${FF(d.c80CCD2)} | 80D: ${FF(d.c80D)}
TAX: New regime: ${FF(d.normalNew)} taxable → ${FF(d.totalNew)}${d.rNew.rebate>0?' | 87A rebate: '+FF(d.rNew.rebate):''} | Old regime: ${FF(d.normalOld)} taxable → ${FF(d.totalOld)} | ${d.savings>=0?'New regime BETTER by '+FF(d.savings):'Old regime BETTER by '+FF(-d.savings)} | ITR: ${d.itrForm}`;
  };

  const sendMessage = async () => {
    const q = userInput.trim();
    if (!q || aiLoading) return;
    const updated = [...messages, { role: 'user', content: q }];
    setMessages(updated); setUserInput(''); setAiLoading(true);
    try {
      const { data } = await api.post('/ai/chat', { messages: updated, systemPrompt: buildSystem() });
      setMessages([...updated, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages([...updated, { role: 'assistant', content: `⚠️ ${err.response?.data?.error || err.message}` }]);
    }
    setAiLoading(false);
  };

  const chips = [
    'Which regime suits me?', 'How to save more tax?', `Documents for ${d.itrForm}?`,
    'Explain my 80C options', 'What is marginal relief?', 'When to pay advance tax?',
    'Is F&O income taxable?', 'What is 44ADA?', 'How is HRA exemption computed?',
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Banner */}
      <div className="rounded-xl bg-gradient-to-br from-indigo-900 to-slate-900 p-4 mb-4 text-white">
        <div className="font-bold text-base">🤖 AI Tax Advisor</div>
        <div className="text-xs text-indigo-300 mt-0.5">Powered by Groq · Llama 3.3 70B · Context-aware with your income profile</div>
        <div className="flex flex-wrap gap-2 mt-2">
          {[d.itrForm, d.gtiNew>0?`GTI: ${INR(d.gtiNew)}`:null, d.savings>=0?'New regime better':'Old regime better'].filter(Boolean).map(t=>(
            <span key={t} className="bg-indigo-700/60 text-indigo-200 text-xs px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      </div>

      {/* Quick chips */}
      <div className="flex gap-2 flex-wrap mb-3">
        {chips.map(q => (
          <button key={q} onClick={() => setUserInput(q)}
            className="bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-slate-600 text-xs px-3 py-1.5 rounded-full transition-colors">
            {q}
          </button>
        ))}
      </div>

      {/* Chat */}
      <div ref={chatRef} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-64 max-h-96 overflow-y-auto mb-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 py-12">
            <div className="text-3xl mb-2">🤖</div>
            <div className="font-medium">Ask me anything about your taxes</div>
            <div className="text-xs mt-1">I have your income profile as context</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role==='user'?'flex-row-reverse':''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${m.role==='user'?'bg-blue-600 text-white':'bg-indigo-900 text-white'}`}>{m.role==='user'?'👤':'🤖'}</div>
            <div className={`max-w-xs sm:max-w-sm lg:max-w-md text-xs leading-relaxed rounded-xl px-3 py-2 ${m.role==='user'?'bg-blue-600 text-white':'bg-white border border-slate-200 text-slate-700'}`}
              dangerouslySetInnerHTML={{ __html: (m.content || '').replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>') }} />
          </div>
        ))}
        {aiLoading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-900 text-white flex items-center justify-center text-xs">🤖</div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex gap-1">
              {[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input value={userInput} onChange={e=>setUserInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMessage()}
          placeholder="Ask about deductions, ITR form, regime choice…"
          className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        <button onClick={sendMessage} disabled={aiLoading||!userInput.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl transition-colors">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  );
}
