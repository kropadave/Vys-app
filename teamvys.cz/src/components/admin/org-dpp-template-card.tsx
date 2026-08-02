'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { type OrgDppTemplate, getOrgDppTemplate, saveOrgDppTemplate } from '@/lib/api-client';

const DEFAULT_ROLE = 'Trenér sportovních lekcí';
const DEFAULT_SCOPE =
  'Vedení lekcí, evidence docházky, bezpečnostní dohled a potvrzování progresu účastníků v administraci.';
const DEFAULT_CLAUSES = [
  'Trenér zajišťuje vedení lekcí, přípravu prostoru, evidenci docházky a bezpečné předání informací administrátorovi.',
  'Rozsah práce se řídí domluveným rozpisem lekcí a nepřekročí zákonný limit pro DPP v daném kalendářním roce.',
  'Odměna se počítá podle schválené hodinové sazby a potvrzené docházky v administraci.',
  'Trenér potvrzuje mlčenlivost o osobních údajích dětí, rodičů a interních provozních informacích.',
  'Digitální podpis trenéra a zástupce organizace je považovaný za potvrzení vyplněných údajů a uložení dokumentu do evidence.',
];

export function OrgDppTemplateCard() {
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(false);

  const [role, setRole] = useState('');
  const [scope, setScope] = useState('');
  const [clauses, setClauses] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const result = await getOrgDppTemplate();
      setRole(result.dppRole ?? '');
      setScope(result.dppScope ?? '');
      setClauses(result.dppClauses ?? []);
    } catch {
      setRole('');
      setScope('');
      setClauses([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const template: OrgDppTemplate = {
      dppRole: role.trim() || null,
      dppScope: scope.trim() || null,
      dppClauses: clauses.map((c) => c.trim()).filter(Boolean),
    };
    setSaving(true);
    setMessage(null);
    try {
      await saveOrgDppTemplate(template);
      setMessageOk(true);
      setMessage('Šablona DPP uložena.');
    } catch (err) {
      setMessageOk(false);
      setMessage(err instanceof Error ? err.message : 'Uložení se nezdařilo.');
    } finally {
      setSaving(false);
    }
  }

  function addClause() {
    setClauses((prev) => [...prev, '']);
  }

  function updateClause(index: number, value: string) {
    setClauses((prev) => prev.map((c, i) => (i === index ? value : c)));
  }

  function removeClause(index: number) {
    setClauses((prev) => prev.filter((_, i) => i !== index));
  }

  if (!loaded) return null;

  const isCustom = role.trim() || scope.trim() || clauses.length > 0;

  return (
    <section
      className="rounded-brand-lg border bg-white p-6 mb-6"
      style={{ borderColor: 'rgba(20,14,38,0.08)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="mb-4">
        <p className="text-brand-pink text-xs font-black uppercase tracking-[0.16em]">DPP smlouva</p>
        <h2 className="text-xl font-black text-brand-ink mt-1">Šablona Dohody o provedení práce</h2>
        <p className="text-[#5C5474] text-sm leading-6 mt-1 max-w-[600px]">
          Upravte texty, které se generují do DPP dokumentu každého trenéra.{' '}
          {!isCustom && <span className="font-black text-brand-ink">Zatím jsou použity výchozí texty platformy.</span>}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-black uppercase tracking-wide text-brand-ink mb-1">
              Pozice / role trenéra
            </label>
            <input
              type="text"
              maxLength={120}
              placeholder={DEFAULT_ROLE}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-[14px] border border-brand-purple/15 bg-brand-paper px-3 py-2 text-sm font-bold text-brand-ink outline-none focus:border-brand-purple"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wide text-brand-ink mb-1">
              Předmět smlouvy (krátký popis)
            </label>
            <input
              type="text"
              maxLength={300}
              placeholder={DEFAULT_SCOPE}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full rounded-[14px] border border-brand-purple/15 bg-brand-paper px-3 py-2 text-sm font-bold text-brand-ink outline-none focus:border-brand-purple"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-black uppercase tracking-wide text-brand-ink">
              Klauzule smlouvy ({clauses.length === 0 ? `výchozí (${DEFAULT_CLAUSES.length})` : clauses.length})
            </label>
            <button
              type="button"
              onClick={addClause}
              disabled={clauses.length >= 20}
              className="inline-flex items-center gap-1 rounded-[12px] bg-brand-purple px-3 py-1.5 text-xs font-black text-white shadow-brand transition hover:bg-brand-purple-deep disabled:opacity-50"
            >
              <Plus size={13} /> Přidat klauzuli
            </button>
          </div>

          {clauses.length === 0 ? (
            <div className="rounded-[16px] border border-brand-purple/10 bg-brand-paper p-3 space-y-2">
              {DEFAULT_CLAUSES.map((clause, i) => (
                <div key={i} className="rounded-[12px] bg-white px-3 py-2 text-xs font-bold leading-5 text-brand-ink-soft">
                  <span className="font-black text-brand-ink-soft">{i + 1}. </span>{clause}
                </div>
              ))}
              <p className="text-[11px] font-bold text-brand-ink-soft px-1 pt-1">↑ Výchozí klauzule platformy — přidej vlastní pro jejich nahrazení.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clauses.map((clause, i) => (
                <div key={i} className="flex gap-2">
                  <span className="flex h-8 w-6 shrink-0 items-center justify-center text-xs font-black text-brand-ink-soft">{i + 1}.</span>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={clause}
                    onChange={(e) => updateClause(i, e.target.value)}
                    placeholder={DEFAULT_CLAUSES[i] ?? 'Text klauzule...'}
                    className="flex-1 resize-none rounded-[14px] border border-brand-purple/15 bg-brand-paper px-3 py-2 text-sm font-bold text-brand-ink outline-none focus:border-brand-purple"
                  />
                  <button
                    type="button"
                    onClick={() => removeClause(i)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] text-brand-ink-soft transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-[14px] bg-brand-purple px-4 py-2.5 text-sm font-black text-white shadow-brand transition hover:bg-brand-purple-deep disabled:opacity-60"
          >
            {saving ? 'Ukládám...' : 'Uložit šablonu'}
          </button>
          {isCustom && (
            <button
              type="button"
              onClick={() => { setRole(''); setScope(''); setClauses([]); }}
              className="text-xs font-bold text-brand-ink-soft underline underline-offset-2 hover:text-brand-ink"
            >
              Obnovit výchozí
            </button>
          )}
        </div>

        {message && (
          <p className={`text-sm font-bold ${messageOk ? 'text-green-600' : 'text-red-500'}`}>{message}</p>
        )}
      </form>
    </section>
  );
}
