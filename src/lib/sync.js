// Đồng bộ tiến trình thủ công: nén → chuỗi ngắn → mã / link / QR → gộp.
// Không qua máy chủ: phần sau dấu # không được gửi đi, chạy tốt trên hosting tĩnh.

const enc = new TextEncoder();
const dec = new TextDecoder();

const MAGIC0 = 0x4b; // 'K'
const MAGIC1 = 0x50; // 'P'
const VERSION = 1;

const EPOCH = Date.UTC(2000, 0, 1);
const DAY = 86400000;

const dayOff = (s) => {
  const [y, m, d] = String(s).split("-").map(Number);
  if (!y || !m || !d) return 0;
  return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / DAY);
};
const dateOf = (o) => new Date(EPOCH + o * DAY).toISOString().slice(0, 10);

class W {
  constructor() {
    this.a = [];
  }
  u8(n) {
    this.a.push(n & 255);
  }
  v(n) {
    n = Math.max(0, Math.floor(n)) >>> 0;
    while (n > 127) {
      this.a.push((n & 127) | 128);
      n = Math.floor(n / 128);
    }
    this.a.push(n);
  }
  bytes(u8) {
    for (let i = 0; i < u8.length; i++) this.a.push(u8[i]);
  }
  str(s) {
    const u = enc.encode(String(s ?? ""));
    this.v(u.length);
    this.bytes(u);
  }
  bitset(ids, size) {
    const b = new Uint8Array((size + 7) >> 3);
    for (const id of ids) {
      if (id >= 0 && id < size) b[id >> 3] |= 1 << (id & 7);
    }
    this.v(size);
    this.bytes(b);
  }
  out() {
    return new Uint8Array(this.a);
  }
}

class R {
  constructor(u8) {
    this.u = u8;
    this.i = 0;
  }
  need(n) {
    if (this.i + n > this.u.length) throw new Error("Chuỗi đồng bộ bị cắt ngắn");
  }
  u8() {
    this.need(1);
    return this.u[this.i++];
  }
  v() {
    let r = 0;
    let s = 0;
    for (;;) {
      this.need(1);
      const b = this.u[this.i++];
      r += (b & 127) * 2 ** s;
      if (!(b & 128)) break;
      s += 7;
      if (s > 35) throw new Error("Số varint không hợp lệ");
    }
    return r;
  }
  bytes(n) {
    this.need(n);
    const out = this.u.subarray(this.i, this.i + n);
    this.i += n;
    return out;
  }
  str() {
    return dec.decode(this.bytes(this.v()));
  }
  bitset() {
    const size = this.v();
    const b = this.bytes((size + 7) >> 3);
    const ids = [];
    for (let id = 0; id < size; id++) {
      if (b[id >> 3] & (1 << (id & 7))) ids.push(id);
    }
    return { size, ids };
  }
}

const b64u = (bytes) => {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const unb64u = (str) => {
  const s = atob(String(str).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
};

function packProgress(p, opts = {}) {
  const sizes = { kanji: 0, vocab: 0, ...(opts.sizes || {}) };
  const known = p.known || {};
  const w = new W();
  w.u8(MAGIC0);
  w.u8(MAGIC1);
  w.u8(VERSION);
  w.v(Math.floor((p.updatedAt || Date.now()) / 1000));

  for (const sec of ["kanji", "vocab"]) {
    const keys = Object.keys(known[sec] || {});
    const size = sizes[sec] || 0;
    const ids = [];
    const extras = [];
    for (const k of keys) {
      const n = Number(k);
      if (Number.isFinite(n) && n >= 0 && n < size) ids.push(n);
      else extras.push(k);
    }
    w.bitset(ids, size);
    w.v(extras.length);
    for (const k of extras) w.str(k);
  }

  const otherSecs = Object.keys(known).filter((s) => s !== "kanji" && s !== "vocab");
  w.v(otherSecs.length);
  for (const sec of otherSecs) {
    const keys = Object.keys(known[sec] || {});
    w.str(sec);
    w.v(keys.length);
    for (const k of keys) w.str(k);
  }

  const wrong = Object.entries(p.wrong || {});
  w.v(wrong.length);
  for (const [wk, n] of wrong) {
    const i = wk.indexOf(":");
    w.str(i < 0 ? "" : wk.slice(0, i));
    w.str(i < 0 ? wk : wk.slice(i + 1));
    w.v(n || 0);
  }

  for (const map of [p.days || {}, p.timeSec || {}]) {
    const es = Object.entries(map).filter(([, n]) => n > 0);
    w.v(es.length);
    for (const [d, n] of es) {
      w.v(dayOff(d));
      w.v(n);
    }
  }

  const stats = Object.entries(p.stats || {}).filter(([, s]) => s && (s.ok || s.total));
  w.v(stats.length);
  for (const [sec, s] of stats) {
    w.str(sec);
    w.v(s.ok || 0);
    w.v(s.total || 0);
  }

  w.str(JSON.stringify({ settings: p.settings || {}, profile: opts.profile || null, write: p.write || {} }));
  return w.out();
}

function unpackProgress(u8) {
  const r = new R(u8);
  if (r.u8() !== MAGIC0 || r.u8() !== MAGIC1) throw new Error("Không phải mã đồng bộ HirataLearn");
  const ver = r.u8();
  if (ver !== VERSION) throw new Error("Mã đồng bộ được tạo bởi phiên bản app khác");

  const updatedAt = r.v() * 1000;
  const known = {};

  for (const sec of ["kanji", "vocab"]) {
    const { ids } = r.bitset();
    const set = {};
    for (const id of ids) set[String(id)] = true;
    const nExtra = r.v();
    for (let i = 0; i < nExtra; i++) set[r.str()] = true;
    known[sec] = set;
  }

  const nOther = r.v();
  for (let i = 0; i < nOther; i++) {
    const sec = r.str();
    const n = r.v();
    const set = {};
    for (let j = 0; j < n; j++) set[r.str()] = true;
    known[sec] = set;
  }

  const wrong = {};
  const nWrong = r.v();
  for (let i = 0; i < nWrong; i++) {
    const sec = r.str();
    const key = r.str();
    const n = r.v();
    wrong[sec ? `${sec}:${key}` : key] = n;
  }

  const readDayMap = () => {
    const map = {};
    const n = r.v();
    for (let i = 0; i < n; i++) {
      const off = r.v();
      map[dateOf(off)] = r.v();
    }
    return map;
  };
  const days = readDayMap();
  const timeSec = readDayMap();

  const stats = {};
  const nStats = r.v();
  for (let i = 0; i < nStats; i++) {
    const sec = r.str();
    stats[sec] = { ok: r.v(), total: r.v() };
  }

  const tail = JSON.parse(r.str() || "{}");
  return {
    progress: {
      known,
      wrong,
      days,
      timeSec,
      stats,
      settings: tail.settings || {},
      write: tail.write || {},
      updatedAt,
    },
    profile: tail.profile || null,
  };
}

const encodeSync = (p, opts) => b64u(packProgress(p, opts));
const decodeSync = (code) => unpackProgress(unb64u(code));

const maxMap = (a = {}, b = {}) => {
  const o = { ...a };
  for (const [k, v] of Object.entries(b)) o[k] = Math.max(o[k] || 0, v);
  return o;
};

// Gộp hai bản: đã thuộc = hợp, hay sai / lịch học = lấy số lớn hơn,
// cài đặt & hồ sơ = bản lưu gần nhất.
function mergeProgress(a, b) {
  const known = {};
  for (const sec of new Set([...Object.keys(a.known || {}), ...Object.keys(b.known || {})])) {
    known[sec] = { ...(a.known?.[sec] || {}), ...(b.known?.[sec] || {}) };
  }
  const wrong = { ...(a.wrong || {}) };
  for (const [k, v] of Object.entries(b.wrong || {})) wrong[k] = Math.max(wrong[k] || 0, v);

  const stats = {};
  for (const sec of new Set([...Object.keys(a.stats || {}), ...Object.keys(b.stats || {})])) {
    const s1 = a.stats?.[sec] || { ok: 0, total: 0 };
    const s2 = b.stats?.[sec] || { ok: 0, total: 0 };
    stats[sec] = { ok: Math.max(s1.ok || 0, s2.ok || 0), total: Math.max(s1.total || 0, s2.total || 0) };
  }

  const newerB = (b.updatedAt || 0) >= (a.updatedAt || 0);
  const settings = newerB
    ? { ...(a.settings || {}), ...(b.settings || {}) }
    : { ...(b.settings || {}), ...(a.settings || {}) };
  const profile = newerB
    ? b.profile || a.profile || null
    : a.profile || b.profile || null;

  return {
    progress: {
      known,
      wrong,
      days: maxMap(a.days, b.days),
      timeSec: maxMap(a.timeSec, b.timeSec),
      write: maxMap(a.write, b.write),
      stats,
      settings,
      updatedAt: Math.max(a.updatedAt || 0, b.updatedAt || 0),
    },
    profile,
  };
}

const countKnown = (known = {}) =>
  Object.values(known).reduce((n, s) => n + Object.keys(s || {}).length, 0);

function syncSummary(decoded) {
  const pr = decoded.progress || {};
  return {
    known: countKnown(pr.known),
    wrong: Object.keys(pr.wrong || {}).length,
    days: Object.keys(pr.days || {}).length,
    updatedAt: pr.updatedAt || 0,
  };
}

const MAX_CODE = 2200; // QR tối đa ~2953 byte; chừa dư cho URL

function buildSyncUrl(code) {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}#/profile?sync=${code}`;
}

function extractSyncCode(text) {
  const t = String(text || "").trim();
  if (!t) return null;
  if (/^[A-Za-z0-9_-]{16,}$/.test(t)) return t;
  const m = t.match(/sync=([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

export {
  encodeSync,
  decodeSync,
  mergeProgress,
  syncSummary,
  buildSyncUrl,
  extractSyncCode,
  MAX_CODE,
};
