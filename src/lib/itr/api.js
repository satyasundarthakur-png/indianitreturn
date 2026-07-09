// Stubbed API for standalone deployment (no backend).
// Persists saved profiles in localStorage; AI/DOCX endpoints return friendly errors.

const KEY = 'itax_profiles_v1';

// SSR-safe localStorage (Cloudflare Workers has window but NOT localStorage)
const lsGet = () => {
  try {
    if (typeof localStorage === 'undefined') return [];
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch { return []; }
};
const lsSet = (list) => {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
};

const ok = (data) => Promise.resolve({ data });
const fail = (msg, status = 500) => Promise.reject({ response: { status, data: { error: msg } }, message: msg });

const api = {
  get: async (url) => {
    if (url === '/auth/me') return ok({ user: { name: 'Guest', email: 'guest@local' } });
    if (url === '/profiles') return ok({ profiles: lsGet() });
    const m = url.match(/^\/profiles\/(.+)$/);
    if (m) {
      const p = lsGet().find(p => p.id === m[1]);
      return p ? ok({ profile: p }) : fail('Not found', 404);
    }
    return fail('Not implemented', 404);
  },
  post: async (url, body) => {
    if (url === '/profiles') {
      const list = lsGet();
      const profile = { id: String(Date.now()), label: body.label, state: body.state, updated_at: new Date().toISOString() };
      list.unshift(profile);
      lsSet(list);
      return ok({ profile });
    }
    if (url === '/ai/chat') {
      try {
        const res = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) return fail(json.error || 'AI request failed', res.status);
        return ok(json);
      } catch (e) {
        return fail(e.message || 'Network error');
      }
    }
    if (url === '/export/docx') return fail('DOCX export requires backend');
    return fail('Not implemented');
  },
  put: async (url, body) => {
    const m = url.match(/^\/profiles\/(.+)$/);
    if (m) {
      const list = lsGet();
      const i = list.findIndex(p => p.id === m[1]);
      if (i >= 0) { list[i] = { ...list[i], ...body, updated_at: new Date().toISOString() }; lsSet(list); }
      return ok({ ok: true });
    }
    return fail('Not implemented');
  },
  delete: async (url) => {
    const m = url.match(/^\/profiles\/(.+)$/);
    if (m) { lsSet(lsGet().filter(p => p.id !== m[1])); return ok({ ok: true }); }
    return fail('Not implemented');
  },
};

export default api;
