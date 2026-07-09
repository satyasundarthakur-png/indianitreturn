import { useStore } from '../store';
import { derive, INR, CFG } from '../taxEngine';
import api from '../api';

export default function Header() {
  const { user, logout, getState, profile: P } = useStore(s => ({
    user: s.user, logout: s.logout, getState: s.getState, profile: s.profile,
  }));
  const state = useStore(s => ({ profile: s.profile, income: s.income, ded: s.ded }));
  const d = derive(state);
  const cfg = CFG();
  const best = d.savings >= 0;

  const downloadDocx = async () => {
    try {
      const res = await api.post('/export/docx', getState(), { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tax-Computation-${P.name || 'Taxpayer'}-${cfg.label}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert('DOCX generation failed. Check backend connection.'); }
  };

  const downloadPdf = () => {
    // Build print window with computation sheet
    const win = window.open('', '_blank');
    if (!win) { alert('Allow pop-ups to download PDF.'); return; }
    win.document.write(buildPrintHTML(state, d, cfg));
    win.document.close();
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div>
            <div className="font-bold text-slate-800 text-base">🇮🇳 Indian Tax Agent</div>
            <div className="text-xs text-slate-400">{cfg.label} · {cfg.ay} · Deadline: {cfg.deadline}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadDocx}
              className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              📥 .docx
            </button>
            <button onClick={downloadPdf}
              className="hidden sm:flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              📄 PDF
            </button>
            {user && (
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-slate-500 hidden sm:block">{user.name || user.email}</span>
                <button onClick={logout}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors">Sign out</button>
              </div>
            )}
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex gap-2 pb-2 overflow-x-auto">
          <Pill label="Tax (New)"  value={INR(d.totalNew)}         color="red" />
          <Pill label="Tax (Old)"  value={INR(d.totalOld)}         color="amber" />
          <Pill label={best?'New saves':'Old saves'} value={INR(Math.abs(d.savings))} color={best?'green':'red'} />
          <Pill label="Eff. rate"  value={d.effRate.toFixed(1)+'%'} color="blue" />
          <Pill label="ITR form"   value={d.itrForm}               color="purple" />
        </div>
      </div>
    </header>
  );
}

function Pill({ label, value, color }) {
  const colors = {
    red:'bg-red-50 border-red-200 text-red-700',
    amber:'bg-amber-50 border-amber-200 text-amber-700',
    green:'bg-emerald-50 border-emerald-200 text-emerald-700',
    blue:'bg-blue-50 border-blue-200 text-blue-700',
    purple:'bg-violet-50 border-violet-200 text-violet-700',
  };
  return (
    <div className={`flex-shrink-0 border rounded-lg px-2.5 py-1 text-center ${colors[color]}`}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-sm font-bold leading-tight">{value}</div>
    </div>
  );
}

function buildPrintHTML(state, d, cfg) {
  const P = state.profile || {};
  const I = state.income  || {};
  const FF = n => '₹' + Math.round(n||0).toLocaleString('en-IN');
  const today = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});
  const regime = d.totalNew <= d.totalOld ? 'New Regime' : 'Old Regime';
  const age = P.age || 0;
  const cat = age>=80?'Super Senior (80+)':age>=60?'Senior Citizen (60+)':'Individual';

  const row = (l,n,o,alt) =>
    `<tr${alt?' style="background:#f8fafc"':''}><td>${l}</td><td style="text-align:right">${n}</td><td style="text-align:right">${o}</td></tr>`;
  const rowT = (l,n,o) =>
    `<tr style="background:#0f2847;color:white;font-weight:700"><td>${l}</td><td style="text-align:right">${n}</td><td style="text-align:right">${o}</td></tr>`;
  const hdr = (a,b,c) =>
    `<tr style="background:#0f2847;color:white"><th style="text-align:left">${a}</th><th style="text-align:right">${b}</th><th style="text-align:right">${c}</th></tr>`;

  let ir='',ia=false;
  const ta=()=>{ia=!ia;return ia;};
  if(I.grossSalary>0){ir+=row('Gross salary',FF(I.grossSalary),FF(I.grossSalary),ta());ir+=row('Less: Std deduction',`(${FF(Math.min(cfg.stdNew,I.grossSalary))})`,`(${FF(Math.min(cfg.stdOld,I.grossSalary))})`,ta());ir+=row('Net salary',FF(d.netSalNew),FF(d.netSalOld),ta());}
  if(d.hraEx>0) ir+=row('Less: HRA exemption','—',`(${FF(d.hraEx)})`,ta());
  if(d.hpInc!==0) ir+=row('House property income/loss',FF(d.hpInc),FF(d.hpInc),ta());
  if(d.totalBiz>0) ir+=row('Business/professional income',FF(d.totalBiz),FF(d.totalBiz),ta());
  if(I.fnoProfit!==0) ir+=row('F&O profit/(loss)',FF(I.fnoProfit),FF(I.fnoProfit),ta());
  if(I.stcg15>0) ir+=row('STCG equity/MF (20%)',FF(I.stcg15),FF(I.stcg15),ta());
  if(I.ltcg10>0){ir+=row('LTCG equity/MF (12.5%)',FF(I.ltcg10),FF(I.ltcg10),ta());ir+=row('Less: LTCG exemption',`(${FF(cfg.ltcgExempt)})`,`(${FF(cfg.ltcgExempt)})`,ta());ir+=row('Taxable LTCG',FF(d.ltcgTax),FF(d.ltcgTax),ta());}
  if(I.fdInterest>0) ir+=row('FD/RD interest',FF(I.fdInterest),FF(I.fdInterest),ta());
  if(I.savingsInterest>0){ir+=row('Savings interest',FF(I.savingsInterest),FF(I.savingsInterest),ta());ir+=row('Less: 80TTA/TTB',`(${FF(d.savExUsed)})`,`(${FF(d.savExUsed)})`,ta());}
  if(I.dividends>0) ir+=row('Dividends',FF(I.dividends),FF(I.dividends),ta());
  if(I.otherIncome>0) ir+=row('Other income',FF(I.otherIncome),FF(I.otherIncome),ta());
  if(I.onlineGaming>0) ir+=row('Online gaming (30%)',FF(I.onlineGaming),FF(I.onlineGaming),ta());
  ir+=rowT('GROSS TOTAL INCOME',FF(d.gtiNew),FF(d.gtiOld));

  let tx='';
  tx+=row('Tax on slab (before rebate)',FF(d.rNew.slab),FF(d.rOld.slab),true);
  if(d.rNew.rebate>0||d.rOld.rebate>0) tx+=row('Less: Rebate u/s 87A',d.rNew.rebate?`(${FF(d.rNew.rebate)})`:'—',d.rOld.rebate?`(${FF(d.rOld.rebate)})`:'—');
  if(d.rNew.marginalRelief>0) tx+=row('Less: Marginal relief',`(${FF(d.rNew.marginalRelief)})`,'—',true);
  if(d.rNew.sur>0||d.rOld.sur>0) tx+=row('Add: Surcharge',FF(d.rNew.sur||0),FF(d.rOld.sur||0));
  tx+=row('Add: Health & Ed Cess (4%)',FF(d.rNew.cess||0),FF(d.rOld.cess||0),true);
  if(d.spCess>0) tx+=row('Add: Capital gains tax',FF(d.spCess),FF(d.spCess));
  if(d.gamingTax>0) tx+=row('Add: Online gaming tax',FF(d.gamingTax),FF(d.gamingTax),true);
  tx+=rowT('TOTAL TAX LIABILITY',FF(d.totalNew),FF(d.totalOld));
  if(I.tdsPaid>0){tx+=row('Less: TDS / advance tax paid',`(${FF(I.tdsPaid)})`,`(${FF(I.tdsPaid)})`);tx+=rowT(d.netPayableNew>=0?'BALANCE TAX PAYABLE':'REFUND DUE',FF(Math.abs(d.netPayableNew)),FF(Math.abs(d.netPayableOld)));}

  const tbl=(header,body)=>`<table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:11px"><thead>${header}</thead><tbody>${body}</tbody></table>`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Tax Computation</title><style>
body{font-family:-apple-system,sans-serif;font-size:12px;color:#0f172a;padding:24px;max-width:900px;margin:0 auto}
h2{color:#1d4ed8;font-size:13px;margin:20px 0 8px;border-bottom:2px solid #bfdbfe;padding-bottom:4px}
table td,table th{padding:5px 8px;border:1px solid #e2e8f0}
@media print{@page{margin:1.2cm;size:A4}body{padding:8px}}
</style></head><body>
<div style="background:linear-gradient(135deg,#1e3a5f,#0f2847);color:white;padding:16px;border-radius:8px;text-align:center;margin-bottom:20px">
<div style="font-size:16px;font-weight:700">TAX COMPUTATION SHEET</div>
<div style="font-size:10px;opacity:.8;margin-top:4px">Indian Tax Agent · ${cfg.label} (${cfg.ay}) · ${cfg.budget} · Generated: ${today}</div>
</div>
<h2>1. Taxpayer Profile</h2>
<table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:11px">
<tr style="background:#f8fafc"><td style="width:40%;padding:5px 8px;border:1px solid #e2e8f0;font-weight:600">Name</td><td style="padding:5px 8px;border:1px solid #e2e8f0">${P.name||'—'}</td></tr>
<tr><td style="padding:5px 8px;border:1px solid #e2e8f0;font-weight:600">PAN</td><td style="padding:5px 8px;border:1px solid #e2e8f0">${P.pan||'—'}</td></tr>
<tr style="background:#f8fafc"><td style="padding:5px 8px;border:1px solid #e2e8f0;font-weight:600">Age / Category</td><td style="padding:5px 8px;border:1px solid #e2e8f0">${age} years — ${cat}</td></tr>
<tr><td style="padding:5px 8px;border:1px solid #e2e8f0;font-weight:600">ITR Form</td><td style="padding:5px 8px;border:1px solid #e2e8f0">${d.itrForm}${d.itrReason?' — '+d.itrReason:''}</td></tr>
<tr style="background:#f8fafc"><td style="padding:5px 8px;border:1px solid #e2e8f0;font-weight:600">Recommended Regime</td><td style="padding:5px 8px;border:1px solid #e2e8f0;color:#065f46;font-weight:700">${regime} (saves ${FF(Math.abs(d.savings||0))})</td></tr>
</table>
<h2>2. Income Details</h2>${tbl(hdr('Head of Income','New Regime','Old Regime'),ir)}
<h2>3. Tax Computation</h2>${tbl(hdr('Particulars','New Regime','Old Regime'),tx)}
<h2>4. Regime Comparison</h2>${tbl(hdr('Metric','New Regime','Old Regime'),
  row('Taxable income',FF(d.normalNew),FF(d.normalOld),true)+
  row('Total tax liability',FF(d.totalNew),FF(d.totalOld))+
  row('Effective rate',d.effRate.toFixed(2)+'%','—',true)+
  rowT('RECOMMENDED REGIME',d.savings>=0?'✔ BETTER':'—',d.savings<0?'✔ BETTER':'—'))}
<p style="font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px;margin-top:16px">Disclaimer: For reference only. Verify with a qualified CA before filing your ITR.</p>
<script>window.onload=()=>{setTimeout(()=>{window.print();window.onafterprint=()=>window.close();},400);}</script>
</body></html>`;
}
