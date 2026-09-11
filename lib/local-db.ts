import { demoRecords, RecordItem } from './model';

export interface LocalWorkspace {
  id: string;
  owner: string;
  name: string;
  year: string;
  school: string;
}

export interface LocalMembership {
  id: string;
  workspace: string;
  email: string;
  role: string;
  member: string | null;
}

export interface LocalVersion {
  id: string;
  record: string;
  revision: number;
  snapshot: string;
  actor: string;
  created: string;
  note: string;
}

export interface LocalFile {
  id: string;
  workspace: string;
  record: string;
  name: string;
  mime: string;
  size: number;
  created: string;
}

class LocalDatabaseStore {
  workspaces: LocalWorkspace[] = [];
  memberships: LocalMembership[] = [];
  records: RecordItem[] = [];
  versions: LocalVersion[] = [];
  files: LocalFile[] = [];
  fileBlobs: Map<string, ArrayBuffer> = new Map();
  initialized = false;

  constructor() {
    this.initDefaultData();
  }

  initDefaultData() {
    if (this.initialized) return;
    const defaultWsId = 'demo-workspace-id';
    this.workspaces = [
      {
        id: defaultWsId,
        owner: 'demo-lead-user',
        name: 'Tổ Khoa học tự nhiên',
        year: '2026–2027',
        school: 'Trường THCS Lê Quý Đôn'
      }
    ];

    this.memberships = [
      {
        id: 'mem-0',
        workspace: defaultWsId,
        email: 'nguyenthimai@tochuyenmon.edu.vn',
        role: 'Tổ trưởng',
        member: 'm0'
      },
      {
        id: 'mem-1',
        workspace: defaultWsId,
        email: 'nguyenvanan@tochuyenmon.edu.vn',
        role: 'Tổ phó',
        member: 'm1'
      },
      {
        id: 'mem-2',
        workspace: defaultWsId,
        email: 'tranthihuong@tochuyenmon.edu.vn',
        role: 'Giáo viên',
        member: 'm2'
      },
      {
        id: 'mem-bgh',
        workspace: defaultWsId,
        email: 'bgh@tochuyenmon.edu.vn',
        role: 'Ban giám hiệu',
        member: null
      }
    ];

    const demos = demoRecords();
    const now = new Date().toISOString();
    this.records = demos.map(r => ({
      ...r,
      workspace: defaultWsId,
      actor: 'Dữ liệu mẫu',
      updated: r.updated || now,
    } as any));

    this.versions = this.records.map(r => ({
      id: crypto.randomUUID(),
      record: r.id,
      revision: r.revision || 1,
      snapshot: JSON.stringify(r),
      actor: 'Dữ liệu mẫu',
      created: r.updated || now,
      note: 'Phiên bản khởi tạo ban đầu',
    }));

    this.initialized = true;
  }
}

// Global persistent instance in Node runtime
const globalStoreKey = Symbol.for('__TCM_LOCAL_DB_STORE__');
const globalObject = globalThis as any;
if (!globalObject[globalStoreKey]) {
  globalObject[globalStoreKey] = new LocalDatabaseStore();
}
export const localStore: LocalDatabaseStore = globalObject[globalStoreKey];

export class LocalStatement {
  constructor(readonly sql: string, readonly params: unknown[] = []) {}

  bind(...params: unknown[]) {
    return new LocalStatement(this.sql, params);
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const res = await this.all();
    return (res.results[0] as T) || null;
  }

  async all(): Promise<{ results: any[] }> {
    const s = this.sql.trim();
    const p = this.params;

    // 1. SELECT * FROM memberships WHERE email=?
    if (/SELECT \* FROM memberships WHERE email=\?/i.test(s)) {
      const email = String(p[0] || '').toLowerCase().trim();
      let mem = localStore.memberships.find(m => m.email.toLowerCase() === email);
      if (!mem && email) {
        // Tự động gán quyền Tổ trưởng cho tài khoản mới nếu chưa có tổ
        const ws = localStore.workspaces[0];
        mem = {
          id: crypto.randomUUID(),
          workspace: ws ? ws.id : 'demo-workspace-id',
          email,
          role: 'Tổ trưởng',
          member: null
        };
        localStore.memberships.push(mem);
      }
      return { results: mem ? [{ ...mem }] : [] };
    }

    // 2. SELECT * FROM workspaces WHERE id=?
    if (/SELECT \* FROM workspaces WHERE id=\?/i.test(s)) {
      const id = String(p[0]);
      const ws = localStore.workspaces.find(w => w.id === id) || localStore.workspaces[0];
      return { results: ws ? [{ ...ws }] : [] };
    }

    // 3. SELECT * FROM records WHERE id=? AND workspace=? AND kind=?
    if (/SELECT \* FROM records WHERE id=\? AND workspace=\? AND kind=\?/i.test(s)) {
      const [id, wsId, kind] = p;
      const rec = localStore.records.find(r => r.id === id && (r as any).workspace === wsId && r.kind === kind);
      return { results: rec ? [{ ...rec }] : [] };
    }

    // 4. SELECT * FROM records WHERE id=? AND workspace=?
    if (/SELECT \* FROM records WHERE id=\? AND workspace=\?/i.test(s)) {
      const [id, wsId] = p;
      const rec = localStore.records.find(r => r.id === id && (r as any).workspace === wsId);
      return { results: rec ? [{ ...rec }] : [] };
    }

    // 5. SELECT id FROM records WHERE id=? AND kind=? AND workspace=?
    if (/SELECT id FROM records WHERE id=\? AND kind=\? AND workspace=\?/i.test(s)) {
      const [id, kind, wsId] = p;
      const rec = localStore.records.find(r => r.id === id && r.kind === kind && (r as any).workspace === wsId);
      return { results: rec ? [{ id: rec.id }] : [] };
    }

    if (/SELECT id FROM records WHERE id=\? AND workspace=\? AND kind=\?/i.test(s)) {
      const [id, wsId, kind] = p;
      const rec = localStore.records.find(r => r.id === id && r.kind === kind && (r as any).workspace === wsId);
      return { results: rec ? [{ id: rec.id }] : [] };
    }


    // 6. SELECT id,kind FROM records WHERE id=? AND workspace=?
    if (/SELECT id,kind FROM records WHERE id=\? AND workspace=\?/i.test(s)) {
      const [id, wsId] = p;
      const rec = localStore.records.find(r => r.id === id && (r as any).workspace === wsId);
      return { results: rec ? [{ id: rec.id, kind: rec.kind }] : [] };
    }

    // 7. SELECT * FROM versions WHERE record=? ORDER BY revision DESC
    if (/SELECT \* FROM versions WHERE record=\?/i.test(s)) {
      const recordId = String(p[0]);
      const rows = localStore.versions
        .filter(v => v.record === recordId)
        .sort((a, b) => b.revision - a.revision);
      return { results: rows.map(v => ({ ...v })) };
    }

    // 8. SELECT id,name,mime,size,created FROM files WHERE record=?
    if (/SELECT id,name,mime,size,created FROM files WHERE record=\?/i.test(s)) {
      const recordId = String(p[0]);
      const rows = localStore.files
        .filter(f => f.record === recordId)
        .map(f => ({ id: f.id, name: f.name, mime: f.mime, size: f.size, created: f.created }));
      return { results: rows };
    }

    // 9. SELECT * FROM files WHERE id=? AND workspace=?
    if (/SELECT \* FROM files WHERE id=\? AND workspace=\?/i.test(s)) {
      const [id, wsId] = p;
      const file = localStore.files.find(f => f.id === id && f.workspace === wsId);
      return { results: file ? [{ ...file }] : [] };
    }

    // 10. SELECT COUNT(*) AS n FROM records WHERE workspace=?
    if (/SELECT COUNT\(\*\) AS n FROM records WHERE workspace=\?/i.test(s)) {
      const wsId = String(p[0]);
      const count = localStore.records.filter(r => (r as any).workspace === wsId).length;
      return { results: [{ n: count }] };
    }

    // 11. SELECT kind,title,status,due,body,assignee FROM records WHERE workspace=? AND year=?
    if (/SELECT kind,title,status,due,body,assignee FROM records WHERE workspace=\? AND year=\?/i.test(s)) {
      const [wsId, yr] = p;
      const filtered = localStore.records
        .filter(r => (r as any).workspace === wsId && (r.year === yr || r.kind === 'member'))
        .slice(0, 120)
        .map(r => ({
          kind: r.kind,
          title: r.title,
          status: r.status,
          due: r.due,
          body: r.body,
          assignee: r.assignee
        }));
      return { results: filtered };
    }

    // 12. SELECT * FROM records WHERE workspace=? ORDER BY updated DESC
    if (/SELECT \* FROM records WHERE workspace=\?/i.test(s)) {
      const wsId = String(p[0]);
      const filtered = localStore.records
        .filter(r => (r as any).workspace === wsId || !wsId)
        .sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
      return { results: filtered.map(r => ({ ...r })) };
    }

    return { results: [] };
  }

  async run(): Promise<{ success: boolean; meta: { changes: number } }> {
    const s = this.sql.trim();
    const p = this.params;

    // 1. UPDATE workspaces SET name=?,year=?,school=? WHERE id=?
    if (/UPDATE workspaces SET name=\?,year=\?,school=\? WHERE id=\?/i.test(s)) {
      const [name, year, school, id] = p as string[];
      const ws = localStore.workspaces.find(w => w.id === id);
      if (ws) {
        ws.name = name;
        ws.year = year;
        ws.school = school;
        return { success: true, meta: { changes: 1 } };
      }
    }

    // 2. INSERT OR IGNORE INTO workspaces
    if (/INSERT.*INTO workspaces/i.test(s)) {
      const [id, owner, name, year, school] = p as string[];
      if (!localStore.workspaces.some(w => w.id === id)) {
        localStore.workspaces.push({ id, owner, name, year, school });
      }
      return { success: true, meta: { changes: 1 } };
    }

    // 3. INSERT / UPSERT memberships
    if (/INSERT INTO memberships/i.test(s)) {
      const [id, workspace, email, role, member] = p as [string, string, string, string, string | null];
      const existing = localStore.memberships.find(m => m.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        existing.role = role;
        existing.member = member;
      } else {
        localStore.memberships.push({ id, workspace, email: email.toLowerCase(), role, member });
      }
      return { success: true, meta: { changes: 1 } };
    }

    // 4. INSERT INTO records
    if (/INSERT INTO records/i.test(s)) {
      const [id, workspace, kind, year, title, status, due, assignee, parent, category, body, details, revision, updated, actor] = p as any[];
      const idx = localStore.records.findIndex(r => r.id === id);
      const parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;
      const rec: any = {
        id,
        workspace,
        kind,
        year,
        title,
        status,
        due,
        assignee,
        parent,
        category,
        body,
        details: parsedDetails,
        revision: Number(revision) || 1,
        updated,
        actor
      };
      if (idx >= 0) {
        localStore.records[idx] = rec;
      } else {
        localStore.records.unshift(rec);
      }
      return { success: true, meta: { changes: 1 } };
    }

    // 5. UPDATE records ... WHERE id=? AND workspace=? AND revision=?
    if (/UPDATE records SET title=\?,status=\?,due=\?,assignee=\?,parent=\?,category=\?,body=\?,details=\?,year=\?,revision=\?,updated=\?,actor=\? WHERE id=\? AND workspace=\? AND revision=\?/i.test(s)) {
      const [title, status, due, assignee, parent, category, body, details, year, revision, updated, actor, id, wsId, oldRev] = p as any[];
      const rec = localStore.records.find(r => r.id === id && (r as any).workspace === wsId);
      if (rec) {
        rec.title = title;
        rec.status = status;
        rec.due = due;
        rec.assignee = assignee;
        rec.parent = parent;
        rec.category = category;
        rec.body = body;
        rec.details = typeof details === 'string' ? JSON.parse(details) : details;
        rec.year = year;
        rec.revision = Number(revision);
        rec.updated = updated;
        rec.actor = actor;
        return { success: true, meta: { changes: 1 } };
      }
    }

    // 6. UPDATE records SET status=?,revision=?,updated=?,actor=? WHERE id=? AND revision=?
    if (/UPDATE records SET status=\?,revision=\?,updated=\?,actor=\? WHERE id=\? AND revision=\?/i.test(s)) {
      const [status, revision, updated, actor, id, oldRev] = p as any[];
      const rec = localStore.records.find(r => r.id === id);
      if (rec) {
        rec.status = status;
        rec.revision = Number(revision);
        rec.updated = updated;
        rec.actor = actor;
        return { success: true, meta: { changes: 1 } };
      }
    }

    // 7. INSERT INTO versions
    if (/INSERT INTO versions/i.test(s)) {
      const [id, record, revision, snapshot, actor, created, note] = p as any[];
      localStore.versions.unshift({
        id,
        record,
        revision: Number(revision),
        snapshot,
        actor,
        created,
        note
      });
      return { success: true, meta: { changes: 1 } };
    }

    // 8. INSERT INTO files
    if (/INSERT INTO files/i.test(s)) {
      const [id, workspace, record, name, mime, size, created] = p as any[];
      localStore.files.unshift({
        id,
        workspace,
        record,
        name,
        mime,
        size: Number(size),
        created
      });
      return { success: true, meta: { changes: 1 } };
    }

    return { success: true, meta: { changes: 0 } };
  }
}

export const localDatabase = {
  prepare(sql: string) {
    return new LocalStatement(sql);
  },
  async batch(statements: LocalStatement[]) {
    const results = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return results;
  }
};
