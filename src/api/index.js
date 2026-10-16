/* Single entry point for all data access.
   VITE_USE_MOCK=true  → mock API (browser storage, sample data)
   VITE_USE_MOCK=false → real backend via HTTP (VITE_API_BASE_URL)            */
import { httpApi } from './http';
import { mockApi } from './mock/mockApi';
import { fileToDataUrl } from '../lib/utils';

export const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false';

// The mock keeps photos as small data-URLs; the real API receives the files (multipart).
async function filesToFields(fields, files = {}) {
  const photos = [];
  for (const f of files.photos || []) { const d = await fileToDataUrl(f); if (d) photos.push(d); }
  return { ...fields, photos, idProofName: files.idProof?.name };
}
const mock = {
  ...mockApi,
  register: async (fields, files) => mockApi.register(await filesToFields(fields, files)),
  createMember: async (fields, files) => mockApi.createMember(await filesToFields(fields, files)),
  replacePhoto: async (id, index, file) => {
    const m = await mockApi.getMember(id); const photos = [...m.photos]; photos[index] = await fileToDataUrl(file);
    return mockApi.updateMember(id, { photos });
  }
};

export const api = USE_MOCK ? mock : httpApi;
export default api;
