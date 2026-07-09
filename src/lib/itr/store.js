import { create } from 'zustand';

const defaultIncome = {
  grossSalary:0,basic:0,da:0,hra:0,rentPaid:0,isMetro:false,lta:0,
  selfOccupied:true,homeLoanInterestHP:0,annualRent:0,municipalTax:0,
  presumptive:false,grossProfessional:0,presumptiveRate:50,
  grossProfessionalReceipts:0,professionalExpenses:0,professionalIncome:0,
  businessIncome:0,fnoProfit:0,
  stcg15:0,stcgOther:0,ltcg10:0,ltcgOther:0,
  fdInterest:0,savingsInterest:0,dividends:0,otherIncome:0,onlineGaming:0,
  tdsPaid:0,
};

const defaultDed = {
  c80C:0,c80CCD1B:0,c80CCD2:0,c80D_self:0,c80D_par:0,
  c80E:0,c80EEA:0,c80G:0,
};

const defaultProfile = {
  name:'',pan:'',age:30,residential:'resident',
};

export const useStore = create((set, get) => ({
  // Auth
  user: null,
  token: (typeof window !== 'undefined' && localStorage.getItem('itax_token')) || 'local',
  setAuth: (user, token) => {
    localStorage.setItem('itax_token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('itax_token');
    set({ user: null, token: null });
  },

  // Tax state
  tab: 'profile',
  profile: { ...defaultProfile },
  income:  { ...defaultIncome },
  ded:     { ...defaultDed },
  messages: [],
  aiLoading: false,
  userInput: '',

  setTab: tab => set({ tab }),

  setProfile: patch => set(s => ({ profile: { ...s.profile, ...patch } })),
  setIncome:  patch => set(s => ({ income:  { ...s.income,  ...patch } })),
  setDed:     patch => set(s => ({ ded:     { ...s.ded,     ...patch } })),

  setMessages:  messages  => set({ messages }),
  setAiLoading: aiLoading => set({ aiLoading }),
  setUserInput: userInput => set({ userInput }),

  // Saved profiles list
  savedProfiles: [],
  setSavedProfiles: p => set({ savedProfiles: p }),
  currentProfileId: null,
  setCurrentProfileId: id => set({ currentProfileId: id }),

  getState: () => ({ profile: get().profile, income: get().income, ded: get().ded }),

  loadState: (state) => set({
    profile: { ...defaultProfile, ...(state.profile || {}) },
    income:  { ...defaultIncome,  ...(state.income  || {}) },
    ded:     { ...defaultDed,     ...(state.ded     || {}) },
  }),

  reset: () => set({ profile: { ...defaultProfile }, income: { ...defaultIncome }, ded: { ...defaultDed }, messages: [] }),
}));
