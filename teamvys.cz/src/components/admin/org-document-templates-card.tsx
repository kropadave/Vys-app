'use client';

import { Download, FileSignature, FileText, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
    type CustomDocField,
    type CustomDocFieldType,
    type DocumentTemplate,
    type ElectronicDocBody,
    createDocumentTemplate,
    deleteDocumentTemplate,
    listDocumentTemplates,
    updateDocumentTemplate,
} from '@/lib/api-client';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

function templatePublicUrl(path: string | null): string | null {
  if (!path) return null;
  try {
    return createBrowserSupabaseClient().storage.from('document-templates').getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

type BuilderField = {
  key: string;
  id: string;
  label: string;
  type: CustomDocFieldType;
  required: boolean;
  optionsText: string;
};

const FIELD_TYPE_OPTIONS: Array<{ value: CustomDocFieldType; label: string }> = [
  { value: 'text', label: 'Krátký text' },
  { value: 'textarea', label: 'Delší text' },
  { value: 'check', label: 'Zaškrtávátko (souhlas)' },
  { value: 'choice', label: 'Výběr z možností' },
  { value: 'date', label: 'Datum' },
];

function newFieldKey(): string {
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function bodyToBuilderFields(body: ElectronicDocBody | null): BuilderField[] {
  if (!body?.fields) return [];
  return body.fields.map((f) => ({
    key: newFieldKey(),
    id: f.id,
    label: f.label,
    type: f.type,
    required: Boolean(f.required),
    optionsText: (f.options ?? []).join(', '),
  }));
}

export function OrgDocumentTemplatesCard() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFile = useRef<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [mode, setMode] = useState<'file' | 'electronic'>('file');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [intro, setIntro] = useState('');
  const [clauses, setClauses] = useState<string[]>([]);
  const [fields, setFields] = useState<BuilderField[]>([]);

  const load = useCallback(async () => {
    try {
      const result = await listDocumentTemplates();
      setTemplates(result.templates);
    } catch {
      setTemplates([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function flash(ok: boolean, text: string) {
    setMessageOk(ok);
    setMessage(text);
  }

  function resetForm() {
    setName('');
    setIntro('');
    setClauses([]);
    setFields([]);
    setEditingId(null);
    pendingFile.current = null;
    setFileName(null);
  }

  function startElectronic() {
    resetForm();
    setMode('electronic');
  }

  function startFile() {
    resetForm();
    setMode('file');
  }

  function startEdit(template: DocumentTemplate) {
    setMode('electronic');
    setEditingId(template.id);
    setName(template.name);
    setIntro(template.body?.intro ?? '');
    setClauses(template.body?.clauses ?? []);
    setFields(bodyToBuilderFields(template.body));
    setMessage(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  function buildBody(): ElectronicDocBody {
    return {
      intro: intro.trim() || null,
      clauses: clauses.map((c) => c.trim()).filter(Boolean),
      fields: fields
        .filter((f) => f.label.trim())
        .map((f): CustomDocField => ({
          id: f.id,
          label: f.label.trim(),
          type: f.type,
          required: f.required,
          ...(f.type === 'choice'
            ? { options: f.optionsText.split(',').map((o) => o.trim()).filter(Boolean) }
            : {}),
        })),
    };
  }

  async function handleFileCreate(e: React.FormEvent) {
    e.preventDefault();
    const file = pendingFile.current;
    if (!name.trim()) {
      flash(false, 'Vyplň název šablony.');
      return;
    }
    if (!file) {
      flash(false, 'Vyber soubor šablony.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `library/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from('document-templates').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { template } = await createDocumentTemplate({ name: name.trim(), kind: 'file', filePath: path, fileFilename: file.name });
      setTemplates((prev) => [template, ...prev]);
      resetForm();
      flash(true, 'Šablona uložena do knihovny.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Uložení se nezdařilo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleElectronicSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      flash(false, 'Vyplň název dokumentu.');
      return;
    }
    const body = buildBody();
    if (!body.intro && body.clauses.length === 0 && body.fields.length === 0) {
      flash(false, 'Přidej úvodní text, klauzuli nebo aspoň jedno pole.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      if (editingId) {
        const { template } = await updateDocumentTemplate(editingId, { name: name.trim(), body });
        setTemplates((prev) => prev.map((t) => (t.id === editingId ? template : t)));
        flash(true, 'Elektronický dokument upraven.');
      } else {
        const { template } = await createDocumentTemplate({ name: name.trim(), kind: 'electronic', body });
        setTemplates((prev) => [template, ...prev]);
        flash(true, 'Elektronický dokument uložen do knihovny.');
      }
      resetForm();
      setMode('electronic');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Uložení se nezdařilo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(template: DocumentTemplate) {
    if (!window.confirm(`Smazat šablonu „${template.name}" z knihovny?`)) return;
    setBusy(true);
    try {
      await deleteDocumentTemplate(template.id);
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
      if (editingId === template.id) resetForm();
      flash(true, 'Šablona smazána.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Smazání se nezdařilo.');
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return null;

  const inputClass =
    'w-full rounded-[14px] border border-brand-purple/15 bg-brand-paper px-3 py-2 text-sm font-bold text-brand-ink outline-none focus:border-brand-purple';
  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-[12px] px-3.5 py-2 text-sm font-black transition ${active ? 'bg-brand-purple text-white shadow-brand' : 'bg-brand-purple/8 text-brand-purple hover:bg-brand-purple/15'}`;

  return (
    <section className="rounded-brand-lg border bg-white p-6" style={{ borderColor: 'rgba(20,14,38,0.08)', boxShadow: 'var(--shadow-card)' }}>
      <div className="mb-4">
        <p className="text-brand-pink text-xs font-black uppercase tracking-[0.16em]">Knihovna dokumentů</p>
        <h2 className="text-xl font-black text-brand-ink mt-1">Šablony dokumentů</h2>
        <p className="text-[#5C5474] text-sm leading-6 mt-1 max-w-[640px]">
          Vytvoř si vlastní <strong>elektronický dokument</strong> (přihláška, souhlas, GDPR…) — pojmenuješ ho, poskládáš z textu a vyplňovacích polí a rodič ho vyplní a podepíše přímo v appce. Nebo <strong>nahraj soubor</strong>, který si rodič stáhne, vyplní a nahraje zpět. Hotové dokumenty pak přiřadíš k produktům.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,image/*,application/pdf"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          pendingFile.current = file;
          setFileName(file?.name ?? null);
          e.target.value = '';
        }}
      />

      {templates.length > 0 ? (
        <ul className="mb-5 space-y-2">
          {templates.map((template) => {
            const isElectronic = template.kind === 'electronic';
            const url = isElectronic ? null : templatePublicUrl(template.filePath);
            const fieldCount = template.body?.fields?.length ?? 0;
            return (
              <li key={template.id} className="flex flex-wrap items-center gap-3 rounded-[16px] border border-brand-purple/12 bg-white px-4 py-3">
                {isElectronic ? <FileSignature size={16} className="text-brand-pink shrink-0" /> : <FileText size={16} className="text-brand-purple shrink-0" />}
                <div className="min-w-[160px] flex-1">
                  <p className="text-sm font-black text-brand-ink">{template.name}</p>
                  <p className="text-xs font-bold text-brand-ink-soft">
                    {isElectronic ? `Elektronický · ${fieldCount} ${fieldCount === 1 ? 'pole' : 'polí'} k vyplnění` : template.fileFilename}
                  </p>
                </div>
                {isElectronic ? (
                  <button type="button" onClick={() => startEdit(template)} className="inline-flex items-center gap-1 rounded-[10px] bg-brand-pink/10 px-2.5 py-1 text-[11px] font-black text-brand-pink hover:bg-brand-pink/20">
                    <Pencil size={12} /> Upravit
                  </button>
                ) : url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-[10px] bg-brand-purple/10 px-2.5 py-1 text-[11px] font-black text-brand-purple hover:bg-brand-purple/15">
                    <Download size={12} /> Stáhnout
                  </a>
                ) : null}
                <button type="button" onClick={() => handleDelete(template)} disabled={busy} className="flex h-8 w-8 items-center justify-center rounded-[12px] text-brand-ink-soft transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50">
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mb-5 rounded-[16px] border border-dashed border-brand-purple/20 bg-brand-paper px-4 py-6 text-center text-sm font-bold text-brand-ink-soft">
          Zatím žádné šablony. Přidej první níže.
        </p>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={startElectronic} className={tabClass(mode === 'electronic')}>
          <FileSignature size={15} /> Elektronický dokument
        </button>
        <button type="button" onClick={startFile} className={tabClass(mode === 'file')}>
          <Upload size={15} /> Nahrát soubor
        </button>
      </div>

      {mode === 'file' ? (
        <form onSubmit={handleFileCreate} className="grid gap-3 rounded-[18px] border border-brand-purple/12 bg-brand-paper p-4 sm:grid-cols-[1fr_auto]">
          <div className="grid gap-2">
            <input type="text" maxLength={120} placeholder="Název šablony (např. Přihláška 2026)" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-[14px] border border-brand-purple/20 bg-white px-3 py-2 text-sm font-black text-brand-purple transition hover:bg-brand-purple-light"
            >
              <Upload size={15} /> {fileName ?? 'Vybrat soubor'}
            </button>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={busy} className="inline-flex h-[42px] items-center gap-1.5 rounded-[14px] bg-brand-purple px-4 text-sm font-black text-white shadow-brand transition hover:bg-brand-purple-deep disabled:opacity-60">
              <Plus size={15} /> Přidat do knihovny
            </button>
          </div>
          {message ? <p className={`sm:col-span-2 text-sm font-bold ${messageOk ? 'text-green-600' : 'text-red-500'}`}>{message}</p> : null}
        </form>
      ) : (
        <form onSubmit={handleElectronicSave} className="grid gap-4 rounded-[18px] border border-brand-pink/20 bg-brand-paper p-4">
          {editingId ? (
            <div className="flex items-center justify-between rounded-[12px] bg-brand-pink/10 px-3 py-2">
              <span className="text-xs font-black text-brand-pink">Upravuješ „{name}"</span>
              <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 text-xs font-black text-brand-ink-soft hover:text-brand-ink">
                <X size={13} /> Nový dokument
              </button>
            </div>
          ) : null}

          <div className="grid gap-1.5">
            <label className="text-xs font-black uppercase tracking-wide text-brand-ink-soft">Název dokumentu</label>
            <input type="text" maxLength={120} placeholder="Např. Online přihláška 2026" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-black uppercase tracking-wide text-brand-ink-soft">Úvodní text (nepovinné)</label>
            <textarea rows={2} maxLength={2000} placeholder="Krátký úvod, který rodič uvidí navrchu dokumentu." value={intro} onChange={(e) => setIntro(e.target.value)} className={`${inputClass} resize-y`} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wide text-brand-ink-soft">Odstavce / klauzule</label>
              <button type="button" onClick={() => setClauses((p) => [...p, ''])} className="inline-flex items-center gap-1 text-xs font-black text-brand-purple hover:text-brand-purple-deep">
                <Plus size={13} /> Přidat odstavec
              </button>
            </div>
            {clauses.map((clause, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="mt-2 w-5 shrink-0 text-right text-xs font-black text-brand-ink-soft">{index + 1}.</span>
                <textarea rows={2} maxLength={1000} value={clause} onChange={(e) => setClauses((p) => p.map((c, i) => (i === index ? e.target.value : c)))} className={`${inputClass} resize-y`} placeholder="Text odstavce…" />
                <button type="button" onClick={() => setClauses((p) => p.filter((_, i) => i !== index))} className="mt-1 flex h-8 w-8 items-center justify-center rounded-[10px] text-brand-ink-soft hover:bg-red-50 hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {clauses.length === 0 ? <p className="text-xs font-bold text-brand-ink-soft">Zatím žádné odstavce.</p> : null}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wide text-brand-ink-soft">Vyplňovací pole pro rodiče</label>
              <button
                type="button"
                onClick={() => setFields((p) => [...p, { key: newFieldKey(), id: newFieldKey(), label: '', type: 'text', required: false, optionsText: '' }])}
                className="inline-flex items-center gap-1 text-xs font-black text-brand-purple hover:text-brand-purple-deep"
              >
                <Plus size={13} /> Přidat pole
              </button>
            </div>
            {fields.map((field) => (
              <div key={field.key} className="grid gap-2 rounded-[14px] border border-brand-purple/12 bg-white p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input type="text" maxLength={200} placeholder="Popis pole (např. Jméno dítěte)" value={field.label} onChange={(e) => setFields((p) => p.map((f) => (f.key === field.key ? { ...f, label: e.target.value } : f)))} className={`${inputClass} min-w-[180px] flex-1`} />
                  <select value={field.type} onChange={(e) => setFields((p) => p.map((f) => (f.key === field.key ? { ...f, type: e.target.value as CustomDocFieldType } : f)))} className={`${inputClass} w-auto`}>
                    {FIELD_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <label className="inline-flex items-center gap-1.5 text-xs font-black text-brand-ink-soft">
                    <input type="checkbox" checked={field.required} onChange={(e) => setFields((p) => p.map((f) => (f.key === field.key ? { ...f, required: e.target.checked } : f)))} className="h-4 w-4 accent-brand-purple" />
                    povinné
                  </label>
                  <button type="button" onClick={() => setFields((p) => p.filter((f) => f.key !== field.key))} className="flex h-8 w-8 items-center justify-center rounded-[10px] text-brand-ink-soft hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                </div>
                {field.type === 'choice' ? (
                  <input type="text" placeholder="Možnosti oddělené čárkou (např. Ano, Ne, Nevím)" value={field.optionsText} onChange={(e) => setFields((p) => p.map((f) => (f.key === field.key ? { ...f, optionsText: e.target.value } : f)))} className={inputClass} />
                ) : null}
              </div>
            ))}
            {fields.length === 0 ? <p className="text-xs font-bold text-brand-ink-soft">Zatím žádná pole. Bez polí rodič dokument jen odsouhlasí a podepíše.</p> : null}
          </div>

          {message ? <p className={`text-sm font-bold ${messageOk ? 'text-green-600' : 'text-red-500'}`}>{message}</p> : null}

          <div className="flex justify-end">
            <button type="submit" disabled={busy} className="inline-flex h-[42px] items-center gap-1.5 rounded-[14px] bg-brand-purple px-4 text-sm font-black text-white shadow-brand transition hover:bg-brand-purple-deep disabled:opacity-60">
              <Plus size={15} /> {editingId ? 'Uložit změny' : 'Uložit do knihovny'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
