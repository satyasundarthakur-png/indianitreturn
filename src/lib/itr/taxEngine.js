export function CFG() {
  return {
    label:'FY 2025-26',ay:'AY 2026-27',budget:'Budget 2025',
    deadline:'31 Jul 2026',belated:'31 Dec 2026',
    adv1:'15 Jun 2025',adv2:'15 Sep 2025',adv3:'15 Dec 2025',adv4:'15 Mar 2026',
    stdNew:75000,stdOld:50000,
    rebateNew:1200000,rebateOldGeneral:500000,
    ltcgExempt:125000,ltcgRate:0.125,stcgRate:0.20,ltcgOtherRate:0.20,gamingRate:0.30,
    newSlabs:[[400000,0],[800000,0.05],[1200000,0.10],[1600000,0.15],[2000000,0.20],[2400000,0.25],[Infinity,0.30]],
    oldGeneral:[[250000,0],[500000,0.05],[1000000,0.20],[Infinity,0.30]],
    oldSenior: [[300000,0],[500000,0.05],[1000000,0.20],[Infinity,0.30]],
    oldSuper:  [[500000,0],[1000000,0.20],[Infinity,0.30]],
    surBrackets:[[5000000,0],[10000000,0.10],[20000000,0.15],[50000000,0.25],[Infinity,0.25]],
    surOld:     [[5000000,0],[10000000,0.10],[20000000,0.15],[50000000,0.25],[Infinity,0.37]],
    c80CMax:150000,nps1BMax:50000,c80EEAMax:150000,
  };
}

function slabTax(income,slabs){
  let tax=0,prev=0;
  for(const[upper,rate] of slabs){
    if(income<=prev)break;
    tax+=Math.min(income,upper===Infinity?income:upper)*rate-prev*rate;
    prev=upper===Infinity?income:upper;
    if(upper===Infinity)break;
  }
  return Math.max(0,tax);
}

function computeRegime(taxable,slabs,surBrackets,rebateLimit,isNri){
  const slab=slabTax(taxable,slabs);
  const rebate=(!isNri&&taxable<=rebateLimit)?slab:0;
  const afterRebate=slab-rebate;
  let sur=0;
  for(let i=surBrackets.length-1;i>=0;i--){
    const[limit,rate]=surBrackets[i];
    const prev=i>0?surBrackets[i-1][0]:0;
    if(afterRebate>prev){sur=afterRebate*rate;break;}
  }
  let marginalRelief=0;
  if(!isNri&&taxable>1200000&&taxable<=1275000){
    const excessIncome=taxable-1200000;
    const currentTax=afterRebate+sur;
    marginalRelief=Math.max(0,currentTax-excessIncome);
    sur=0;
  }
  const taxAfterMR=Math.max(0,afterRebate-marginalRelief);
  const cess=Math.round((taxAfterMR+sur)*0.04);
  return{slab,rebate,sur,cess,marginalRelief};
}

export function derive(state){
  const cfg=CFG();
  const I=state.income||{},D=state.ded||{},P=state.profile||{};
  const age=P.age||0;
  const cat=age>=80?'super':age>=60?'senior':'general';
  const isNri=P.residential==='nri';

  const gross=I.grossSalary||0;
  const stdNew=Math.min(cfg.stdNew,gross);
  const stdOld=Math.min(cfg.stdOld,gross);

  let hraEx=0;
  if(I.hra>0&&I.rentPaid>0&&I.basic>0){
    const basic=I.basic||0,da=I.da||0;
    const metro=I.isMetro?0.50:0.40;
    hraEx=Math.max(0,Math.min(I.hra,I.rentPaid-0.10*(basic+da),metro*(basic+da)));
  }
  const netSalNew=Math.max(0,gross-stdNew);
  const netSalOld=Math.max(0,gross-stdOld-hraEx-(I.lta||0));

  let hpInc=0;
  if(I.selfOccupied){
    hpInc=-Math.min(I.homeLoanInterestHP||0,200000);
  }else{
    const gav=(I.annualRent||0)-(I.municipalTax||0);
    hpInc=gav-gav*0.30-(I.homeLoanInterestHP||0);
  }

  let profNet=0;
  if(I.presumptive&&I.grossProfessional>0){
    profNet=I.grossProfessional*((I.presumptiveRate||50)/100);
  }
  const booksNet=(I.grossProfessionalReceipts||0)-(I.professionalExpenses||0)+(I.professionalIncome||0);
  const totalBiz=profNet+booksNet+(I.businessIncome||0);

  const ltcgTax=Math.max(0,(I.ltcg10||0)-cfg.ltcgExempt);
  const hasCG=(I.stcg15||0)+(I.ltcg10||0)+(I.stcgOther||0)+(I.ltcgOther||0)>0;
  const hasFnO=(I.fnoProfit||0)!==0;
  const hasPresumptive=!!(I.presumptive&&I.grossProfessional>0);

  const spGains=(I.stcg15||0)*cfg.stcgRate+ltcgTax*cfg.ltcgRate+(I.ltcgOther||0)*cfg.ltcgOtherRate;
  const spCess=Math.round(spGains*1.04);
  const gamingTax=Math.round((I.onlineGaming||0)*cfg.gamingRate*1.04);

  const savMax=cat==='senior'?50000:10000;
  const savExUsed=Math.min(I.savingsInterest||0,savMax);

  const normalComponents=netSalOld+hpInc+totalBiz+(I.fnoProfit||0)+(I.stcgOther||0)
    +(I.fdInterest||0)+((I.savingsInterest||0)-savExUsed)+(I.dividends||0)+(I.otherIncome||0);

  const gtiNew=Math.max(0,netSalNew+hpInc+totalBiz+(I.fnoProfit||0)+(I.stcgOther||0)
    +(I.fdInterest||0)+((I.savingsInterest||0)-savExUsed)+(I.dividends||0)+(I.otherIncome||0));
  const gtiOld=Math.max(0,normalComponents);

  const c80C=Math.min(D.c80C||0,cfg.c80CMax);
  const c80CCD1B=Math.min(D.c80CCD1B||0,cfg.nps1BMax);
  const c80CCD2=D.c80CCD2||0;
  const c80Dself=Math.min(D.c80D_self||0,cat==='senior'?50000:25000);
  const c80Dpar=Math.min(D.c80D_par||0,cat==='senior'?50000:25000);
  const c80D=c80Dself+c80Dpar;
  const c80EEA=Math.min(D.c80EEA||0,cfg.c80EEAMax);
  const c80CCD1BNet=Math.min(c80CCD1B,gtiOld-c80C);
  const totalDed=c80C+c80CCD1BNet+c80D+(D.c80E||0)+c80EEA+(D.c80G||0);

  const normalNew=Math.max(0,gtiNew-c80CCD2);
  const normalOld=Math.max(0,gtiOld-totalDed-c80CCD2);

  const oldSlabs=cat==='super'?cfg.oldSuper:cat==='senior'?cfg.oldSenior:cfg.oldGeneral;
  const oldRebateLimit=cat==='general'?cfg.rebateOldGeneral:0;

  const rNew=computeRegime(normalNew,cfg.newSlabs,cfg.surBrackets,cfg.rebateNew,isNri);
  const rOld=computeRegime(normalOld,oldSlabs,cfg.surOld,oldRebateLimit,isNri);

  const taxNew=Math.round(rNew.slab-rNew.rebate-rNew.marginalRelief+rNew.sur+rNew.cess);
  const taxOld=Math.round(rOld.slab-rOld.rebate+rOld.sur+rOld.cess);
  const totalNew=Math.max(0,taxNew)+spCess+gamingTax;
  const totalOld=Math.max(0,taxOld)+spCess+gamingTax;
  const savings=totalOld-totalNew;
  const effRate=(totalNew/Math.max(1,gtiNew))*100;
  const netPayableNew=totalNew-(I.tdsPaid||0);
  const netPayableOld=totalOld-(I.tdsPaid||0);

  let itrForm='ITR-1',itrReason='';
  const over50L=gtiNew>5000000;
  if(hasFnO||totalBiz>0){itrForm='ITR-3';itrReason='Business/F&O income';}
  else if(hasCG||isNri||over50L||I.grossProfessional>0){
    itrForm='ITR-2';
    itrReason=over50L?'Income > ₹50L':hasCG?'Capital gains':isNri?'Non-resident':'Professional';
  }

  return{
    cat,isNri,hraEx,hpInc,netSalNew,netSalOld,profNet,totalBiz,ltcgTax,
    hasCG,hasFnO,hasPresumptive,spCess,gamingTax,savExUsed,gtiNew,gtiOld,
    c80C,c80CCD1B,c80CCD2,c80D,c80EEA,totalDed,normalNew,normalOld,
    rNew,rOld,totalNew,totalOld,savings,effRate,netPayableNew,netPayableOld,
    itrForm,itrReason,auditeWarn:(I.grossProfessional||0)>7500000,over50L,
    doubleEntryWarn:(I.grossSalary>0)&&((I.grossProfessional>0)||(I.grossProfessionalReceipts>0)),
    cfg,
  };
}

export const FF=n=>'₹'+Math.round(n||0).toLocaleString('en-IN');
export const INR=n=>{const r=Math.round(n||0);return r>=10000000?'₹'+(r/10000000).toFixed(1)+'Cr':r>=100000?'₹'+(r/100000).toFixed(1)+'L':r>=1000?'₹'+(r/1000).toFixed(0)+'K':'₹'+r;};
