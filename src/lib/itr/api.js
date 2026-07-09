// Stubbed API for standalone deployment (no backend).
// Persists saved profiles in localStorage; AI/DOCX endpoints return friendly errors.

const KEY = 'itax_profiles_v1';

const readProfiles = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};
const writeProfiles = (list) => localStorage.setItem(KEY, JSON.stringify(list));

const ok = (data) => Promise.resolve({ data });
const fail = (msg, status = 500) => Promise.reject({ response: { status, data: { error: msg } }, message: msg });

const api = {
  get: async (url) => {
    if (url === '/auth/me') return ok({ user: { name: 'Guest', email: 'guest@local' } });
    if (url === '/profiles') return ok({ profiles: readProfiles() });
    const m = url.match(/^\/profiles\/(.+)$/);
    if (m) {
      const p = readProfiles().find(p => p.id === m[1]);
      return p ? ok({ profile: p }) : fail('Not found', 404);
    }
    return fail('Not implemented', 404);
  },
  post: async (url, body) => {
    if (url === '/profiles') {
      const list = readProfiles();
      const profile = { id: String(Date.now()), label: body.label, state: body.state, updated_at: new Date().toISOString() };
      list.unshift(profile);
      writeProfiles(list);
      return ok({ profile });
    }
    if (url === '/ai/chat') {
      return ok({ message: { role: 'assistant', content: 'The AI Advisor requires a backend connection which is not enabled in this deployment. Use the Compare tab for detailed tax analysis.' } });
    }
    if (url === '/export/docx') return fail('DOCX export requires backend');
    return fail('Not implemented');
  },
  put: async (url, body) => {
    const m = url.match(/^\/profiles\/(.+)$/);
    if (m) {
      const list = readProfiles();
      const i = list.findIndex(p => p.id === m[1]);
      if (i >= 0) { list[i] = { ...list[i], ...body, updated_at: new Date().toISOString() }; writeProfiles(list); }
      return ok({ ok: true });
    }
    return fail('Not implemented');
  },
  delete: async (url) => {
    const m = url.match(/^\/profiles\/(.+)$/);
    if (m) { writeProfiles(readProfiles().filter(p => p.id !== m[1])); return ok({ ok: true }); }
    return fail('Not implemented');
  },
};

export default api;
