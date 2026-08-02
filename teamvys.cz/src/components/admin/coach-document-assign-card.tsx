'use client';

import { FileSignature, FileText, Plus, Trash2, UserCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
    type CoachDocument,
    type DocumentTemplate,
    attachCoachDocument,
    deleteCoachDocument,
    listCoachDocuments,
    listDocumentTemplates,
} from '@/lib/api-client';

export function CoachDocumentAssignCard({ coaches }: { coaches: Array<{ id: string; name: string }> }) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [coachId, setCoachId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [docs, setDocs] = useState<CoachDocument[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(false);

  useEffect(() => {
    listDocumentTemplates().then((r) => setTemplates(r.templates)).catch(() => setTemplates([]));
  }, []);

  const loadDocs = useCallback(async (id: string) => {
    if (!id) {
      setDocs([]);
      return;
    }
    try {
      const r = await listCoachDocuments(id);
      setDocs(r.documents);
    } catch {
      setDocs([]);
    }
  }, []);

  useEffect(() => {
    void loadDocs(coachId);
  }, [coachId, loadDocs]);

  function flash(ok: boolean, text: string) {
    setMessageOk(ok);
    setMessage(text);
  }

  async function handleAttach() {
    if (!coachId) return flash(false, 'Vyber trenéra.');
    if (!templateId) return flash(false, 'Vyber dokument.');
    setBusy(true);
    setMessage(null);
    try {
      const { document } = await attachCoachDocument(coachId, templateId);
      setDocs((prev) => [document, ...prev.filter((d) => d.id !== document.id)]);
      setTemplateId('');
      flash(true, 'Dokument přiřazen trenérovi.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Přiřazení se nezdařilo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(doc: CoachDocument) {
    setBusy(true);
    try {
      await deleteCoachDocument(doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      flash(true, 'Odebráno.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Odebrání se nezdařilo.');
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    'w-full rounded-[14px] border border-brand-purple/15 bg-brand-paper px-3 py-2 text-sm font-bold text-brand-ink outline-none focus:border-brand-purple';

  return (
    <section className="rounded-brand-lg border bg-white p-6" style={{ borderColor: 'rgba(20,14,38,0.08)', boxShadow: 'var(--shadow-card)' }}>
      <div className="mb-4">
        <p className="text-brand-pink text-xs font-black uppercase tracking-[0.16em]">Dokumenty trenérů</p>
        <h2 className="text-xl font-black text-brand-ink mt-1">Přiřadit dokument trenérovi</h2>
        <p className="text-[#5C5474] text-sm leading-6 mt-1 max-w-[620px]">
          Dokument z knihovny (elektronický i nahraný soubor) přiřadíš přímo konkrétnímu trenérovi —
          stejně jako ho jinde přiřazuješ k produktu.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <select value={coachId} onChange={(e) => setCoachId(e.target.value)} className={inputClass}>
          <option value="">Vyber trenéra…</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={inputClass} disabled={!coachId}>
          <option value="">Vyber dokument…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}{t.kind === 'electronic' ? ' (elektronický)' : ''}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAttach}
          disabled={busy || !coachId}
          className="inline-flex h-[42px] items-center justify-center gap-1.5 rounded-[14px] bg-brand-purple px-4 text-sm font-black text-white shadow-brand transition hover:bg-brand-purple-deep disabled:opacity-60"
        >
          <Plus size={15} /> Přiřadit
        </button>
      </div>

      {message ? <p className={`mt-3 text-sm font-bold ${messageOk ? 'text-green-600' : 'text-red-500'}`}>{message}</p> : null}

      {coachId ? (
        <div className="mt-5">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-brand-ink-soft">
            <UserCheck size={13} /> Přiřazené dokumenty
          </p>
          {docs.length > 0 ? (
            <ul className="space-y-2">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center gap-3 rounded-[14px] border border-brand-purple/12 bg-white px-4 py-2.5">
                  {d.template.kind === 'electronic' ? <FileSignature size={15} className="text-brand-pink shrink-0" /> : <FileText size={15} className="text-brand-purple shrink-0" />}
                  <span className="flex-1 truncate text-sm font-black text-brand-ink">{d.template.name}</span>
                  <button type="button" onClick={() => handleRemove(d)} disabled={busy} className="flex h-8 w-8 items-center justify-center rounded-[12px] text-brand-ink-soft transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50">
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-[14px] border border-dashed border-brand-purple/20 bg-brand-paper px-4 py-4 text-center text-sm font-bold text-brand-ink-soft">
              Tenhle trenér zatím nemá přiřazený žádný dokument.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
