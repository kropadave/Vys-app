'use client';

import { Download, FileText, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    type DocumentSlot,
    type DocumentSlotActivityType,
    type DocumentSlotFulfillment,
    type DocumentTemplate,
    createDocumentSlot,
    deleteDocumentSlot,
    listAdminDocumentSlots,
    listDocumentTemplates,
    updateDocumentSlot,
} from '@/lib/api-client';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

type Draft = {
  label: string;
  description: string;
  fulfillment: DocumentSlotFulfillment;
  templateId: string;
  required: boolean;
};

const EMPTY_DRAFT: Draft = { label: '', description: '', fulfillment: 'upload', templateId: '', required: true };

function templatePublicUrl(path: string | null): string | null {
  if (!path) return null;
  try {
    return createBrowserSupabaseClient().storage.from('document-templates').getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

export function ProductDocumentSlotsCard({ productId, activityType }: { productId: string; activityType: DocumentSlotActivityType }) {
  const [slots, setSlots] = useState<DocumentSlot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingSlotId, setUploadingSlotId] = useState<string | null>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadSlotId = useRef<string | null>(null);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);

  const load = useCallback(async () => {
    try {
      const result = await listAdminDocumentSlots({ productId });
      setSlots(result.slots.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch {
      setSlots([]);
    } finally {
      setLoaded(true);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    listDocumentTemplates().then((r) => setTemplates(r.templates)).catch(() => setTemplates([]));
  }, []);

  function flash(ok: boolean, text: string) {
    setMessageOk(ok);
    setMessage(text);
  }

  function resetForm() {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
  }

  function startEdit(slot: DocumentSlot) {
    setEditingId(slot.id);
    setDraft({
      label: slot.label,
      description: slot.description ?? '',
      fulfillment: slot.fulfillment,
      templateId: slot.templateId ?? '',
      required: slot.required,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.label.trim()) {
      flash(false, 'Vyplň název pole.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const selectedTemplate = draft.fulfillment === 'electronic' ? (templates.find((t) => t.id === draft.templateId) ?? null) : null;
      if (editingId) {
        const { slot } = await updateDocumentSlot(editingId, {
          label: draft.label.trim(),
          description: draft.description.trim() || null,
          fulfillment: draft.fulfillment,
          templateKind: null,
          templateId: selectedTemplate?.id ?? null,
          ...(draft.fulfillment === 'electronic'
            ? { templatePath: selectedTemplate?.filePath ?? null, templateFilename: selectedTemplate?.fileFilename ?? null }
            : {}),
          required: draft.required,
        });
        setSlots((prev) => prev.map((s) => (s.id === slot.id ? slot : s)));
        flash(true, 'Pole upraveno.');
      } else {
        const { slot } = await createDocumentSlot({
          activityType,
          productId,
          label: draft.label.trim(),
          description: draft.description.trim() || null,
          fulfillment: draft.fulfillment,
          templateKind: null,
          templateId: selectedTemplate?.id ?? null,
          ...(draft.fulfillment === 'electronic'
            ? { templatePath: selectedTemplate?.filePath ?? null, templateFilename: selectedTemplate?.fileFilename ?? null }
            : {}),
          required: draft.required,
          sortOrder: slots.length,
        });
        setSlots((prev) => [...prev, slot]);
        flash(true, 'Pole přidáno.');
      }
      resetForm();
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Uložení se nezdařilo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(slot: DocumentSlot) {
    if (!window.confirm(`Smazat pole „${slot.label}"?`)) return;
    setBusy(true);
    try {
      await deleteDocumentSlot(slot.id);
      setSlots((prev) => prev.filter((s) => s.id !== slot.id));
      if (editingId === slot.id) resetForm();
      flash(true, 'Pole smazáno.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Smazání se nezdařilo.');
    } finally {
      setBusy(false);
    }
  }

  async function uploadTemplate(slotId: string, file: File) {
    setUploadingSlotId(slotId);
    setMessage(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const path = `${productId}/${slotId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('document-templates').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { slot } = await updateDocumentSlot(slotId, { templatePath: path, templateFilename: file.name });
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? slot : s)));
      flash(true, 'Šablona nahrána.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Nahrání šablony se nezdařilo.');
    } finally {
      setUploadingSlotId(null);
    }
  }
  const inputClass =
    'w-full rounded-[12px] border border-brand-purple/15 bg-white px-3 py-2 text-sm font-bold text-brand-ink outline-none focus:border-brand-purple';

  const orderedSlots = useMemo(() => slots, [slots]);
  const electronicTemplates = useMemo(() => templates.filter((t) => t.kind === 'electronic'), [templates]);

  if (!loaded) return null;

  return (
    <div className="mt-2 rounded-[16px] border border-brand-purple/12 bg-brand-paper p-4 space-y-3">
      <input
        ref={templateInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,image/*,application/pdf"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const slotId = pendingUploadSlotId.current;
          if (file && slotId) void uploadTemplate(slotId, file);
          pendingUploadSlotId.current = null;
          e.target.value = '';
        }}
      />

      <div>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-purple">Dokumenty k produktu</p>
        <p className="text-[11px] font-bold text-brand-ink-soft mt-0.5">
          Přidej pole, která rodič doloží. U každého zvol: elektronická šablona (vyplní online), nebo vlastní (nahraješ formulář, rodič si ho stáhne, podepíše a nahraje zpět).
        </p>
      </div>

      {orderedSlots.length > 0 ? (
        <ul className="space-y-2">
          {orderedSlots.map((slot) => {
            const url = templatePublicUrl(slot.templatePath);
            return (
              <li key={slot.id} className="rounded-[12px] border border-brand-purple/10 bg-white px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <FileText size={15} className="text-brand-purple shrink-0" />
                  <div className="min-w-[140px] flex-1">
                    <p className="text-sm font-black text-brand-ink">
                      {slot.label}
                      {slot.required ? <span className="ml-2 text-[10px] font-black uppercase text-brand-pink">povinné</span> : null}
                    </p>
                    <p className="text-[11px] font-bold text-brand-ink-soft">
                      {slot.fulfillment === 'electronic' ? 'Elektronická šablona' : 'Vlastní – ke stažení a nahrání'}
                    </p>
                  </div>
                  <button type="button" onClick={() => startEdit(slot)} className="flex h-7 w-7 items-center justify-center rounded-[10px] text-brand-ink-soft transition hover:bg-brand-purple/5 hover:text-brand-purple">
                    <Pencil size={13} />
                  </button>
                  <button type="button" onClick={() => handleDelete(slot)} disabled={busy} className="flex h-7 w-7 items-center justify-center rounded-[10px] text-brand-ink-soft transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50">
                    <Trash2 size={13} />
                  </button>
                </div>
                {slot.fulfillment === 'upload' ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 pl-6">
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-[10px] bg-brand-purple/10 px-2.5 py-1 text-[11px] font-black text-brand-purple hover:bg-brand-purple/15">
                        <Download size={12} /> {slot.templateFilename ?? 'Formulář'}
                      </a>
                    ) : (
                      <span className="text-[11px] font-bold text-brand-ink-soft">Zatím bez formuláře ke stažení</span>
                    )}
                    <button
                      type="button"
                      onClick={() => { pendingUploadSlotId.current = slot.id; templateInputRef.current?.click(); }}
                      disabled={uploadingSlotId === slot.id}
                      className="inline-flex items-center gap-1 rounded-[10px] border border-brand-purple/20 bg-white px-2.5 py-1 text-[11px] font-black text-brand-purple hover:bg-brand-purple-light disabled:opacity-50"
                    >
                      <Upload size={12} /> {uploadingSlotId === slot.id ? 'Nahrávám…' : url ? 'Nahradit formulář' : 'Nahrát formulář'}
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-[12px] border border-dashed border-brand-purple/20 bg-white px-3 py-4 text-center text-xs font-bold text-brand-ink-soft">
          Zatím žádná pole. Přidej první níže.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-2 rounded-[12px] border border-brand-purple/10 bg-white p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-wide text-brand-purple">{editingId ? 'Upravit pole' : 'Nové pole'}</p>
          {editingId ? (
            <button type="button" onClick={resetForm} className="flex items-center gap-1 text-[11px] font-bold text-brand-ink-soft hover:text-brand-ink">
              <X size={12} /> Zrušit
            </button>
          ) : null}
        </div>

        <input type="text" maxLength={120} placeholder="Název pole (např. Přihláška)" value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} className={inputClass} />
        <input type="text" maxLength={300} placeholder="Popis / instrukce pro rodiče (nepovinné)" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} className={inputClass} />

        <div className="grid grid-cols-2 gap-2">
          {([['upload', 'Vlastní (ke stažení + nahrání)'], ['electronic', 'Elektronická šablona']] as [DocumentSlotFulfillment, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setDraft((d) => ({ ...d, fulfillment: value }))}
              className={`rounded-[12px] border px-3 py-2 text-xs font-black transition ${
                draft.fulfillment === value ? 'border-brand-purple bg-brand-purple text-white' : 'border-brand-purple/15 bg-white text-brand-ink-soft hover:border-brand-purple/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {draft.fulfillment === 'electronic' ? (
          <div className="space-y-2">
            {electronicTemplates.length > 0 ? (
              <select value={draft.templateId} onChange={(e) => setDraft((d) => ({ ...d, templateId: e.target.value }))} className={inputClass}>
                <option value="">Vyber elektronický dokument…</option>
                {electronicTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-[11px] font-bold text-brand-ink-soft">Zatím nemáš žádný elektronický dokument. Vytvoř si ho v sekci <strong>Dokumenty → Knihovna dokumentů</strong> (Elektronický dokument) a pak ho tu vyber.</p>
            )}
            <p className="text-[11px] font-bold text-brand-ink-soft">Rodič ho vyplní a podepíše přímo v appce. Nové dokumenty vytvoříš v sekci Dokumenty.</p>
          </div>
        ) : (
          <p className="text-[11px] font-bold text-brand-ink-soft">Po přidání pole nahraješ formulář ke stažení tlačítkem u pole výše.</p>
        )}

        <label className="flex items-center gap-2 text-xs font-bold text-brand-ink">
          <input type="checkbox" checked={draft.required} onChange={(e) => setDraft((d) => ({ ...d, required: e.target.checked }))} className="h-4 w-4 accent-brand-purple" />
          Povinné pole
        </label>

        <div className="flex items-center gap-2">
          <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-[12px] bg-brand-purple px-3 py-2 text-xs font-black text-white shadow-brand transition hover:bg-brand-purple-deep disabled:opacity-60">
            <Plus size={13} /> {editingId ? 'Uložit' : 'Přidat pole'}
          </button>
          {message ? <p className={`text-[11px] font-bold ${messageOk ? 'text-green-600' : 'text-red-500'}`}>{message}</p> : null}
        </div>
      </form>
    </div>
  );
}
