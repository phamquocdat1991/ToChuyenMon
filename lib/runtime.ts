import { database } from './postgres';
import { localStore } from './local-db';

export function storageConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function config() {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Kho tệp Supabase chưa được cấu hình.');
  return {
    url,
    key,
    bucket: process.env.SUPABASE_STORAGE_BUCKET || 'chuyen-mon-files',
  };
}

const bucket = {
  async put(id: string, data: ArrayBuffer) {
    if (storageConfigured()) {
      const c = config();
      const r = await fetch(
        `${c.url}/storage/v1/object/${encodeURIComponent(c.bucket)}/${encodeURIComponent(id)}`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + c.key,
            apikey: c.key,
            'Content-Type': 'application/octet-stream',
            'x-upsert': 'false',
          },
          body: data,
          signal: AbortSignal.timeout(30000),
        }
      );
      if (!r.ok) throw new Error('Không thể lưu tệp vào kho Supabase.');
      return;
    }
    localStore.fileBlobs.set(id, data);
  },
  async get(id: string) {
    if (storageConfigured()) {
      const c = config();
      const r = await fetch(
        `${c.url}/storage/v1/object/authenticated/${encodeURIComponent(c.bucket)}/${encodeURIComponent(id)}`,
        {
          headers: { Authorization: 'Bearer ' + c.key, apikey: c.key },
          cache: 'no-store',
          signal: AbortSignal.timeout(30000),
        }
      );
      if (r.status === 404) return null;
      if (!r.ok) throw new Error('Không thể đọc tệp.');
      return { body: r.body };
    }
    const data = localStore.fileBlobs.get(id);
    if (!data) return null;
    return { body: Buffer.from(data) };
  },
  async delete(id: string) {
    if (storageConfigured()) {
      const c = config();
      const r = await fetch(
        `${c.url}/storage/v1/object/${encodeURIComponent(c.bucket)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer ' + c.key,
            apikey: c.key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prefixes: [id] }),
        }
      );
      if (!r.ok) throw new Error('Không thể thu hồi tệp chưa hoàn tất.');
      return;
    }
    localStore.fileBlobs.delete(id);
  },
};

export const env = {
  DB: database,
  BUCKET: bucket,
  get GEMINI_API_KEY() {
    return process.env.GEMINI_API_KEY;
  },
  get GEMINI_MODEL() {
    return process.env.GEMINI_MODEL;
  },
};

