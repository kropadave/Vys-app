'use client';

import { useCallback, useEffect, useState } from 'react';

import { getOrgCoachRate, saveOrgCoachRate } from '@/lib/api-client';

// Org-wide default coach hourly rate (attendance payouts).
// Every org — including VYS — can set its own default rate here. Individual
// coaches can still be overridden separately; this is the org-wide fallback.
export function OrgCoachRateCard() {
  const [rate, setRate] = useState<string>('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(false);

  const loadRate = useCallback(async () => {
    try {
      const result = await getOrgCoachRate();
      setRate(String(result.defaultCoachHourlyRate));
    } catch {
      setRate('500');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadRate();
  }, [loadRate]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(rate);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100000) {
      setMessageOk(false);
      setMessage('Zadej platnou hodinovou sazbu (0–100000 Kč/h).');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const result = await saveOrgCoachRate(Math.round(parsed));
      setRate(String(result.defaultCoachHourlyRate));
      setMessageOk(true);
      setMessage('Hodinová sazba uložena.');
    } catch (error) {
      setMessageOk(false);
      setMessage(error instanceof Error ? error.message : 'Uložení se nezdařilo.');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return null;

  return (
    <section
      className="rounded-brand-lg border bg-white p-6 mb-6"
      style={{ borderColor: 'rgba(20,14,38,0.08)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-brand-pink text-xs font-black uppercase tracking-[0.16em]">Mzdy trenérů</p>
          <h2 className="text-xl font-black text-brand-ink mt-1">Výchozí hodinová sazba</h2>
          <p className="text-[#5C5474] text-sm leading-6 mt-1 max-w-[560px]">
            Sazba, kterou trenéři vaší organizace dostávají za zapsanou docházku
            na tréninku. Jednotlivým trenérům lze nastavit i jinou sazbu zvlášť.
          </p>
        </div>
        <form onSubmit={handleSave} className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-black text-brand-ink mb-1 uppercase tracking-wide">
              Sazba (Kč/h)
            </label>
            <input
              type="number"
              min={0}
              max={100000}
              step={10}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-36 rounded-xl border border-brand-ink/15 px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-ink/30"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-ink px-5 py-2.5 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Ukládám…' : 'Uložit'}
          </button>
        </form>
      </div>

      {message && (
        <p
          className="text-sm font-semibold mt-4"
          style={{ color: messageOk ? '#15803D' : '#DC2626' }}
        >
          {message}
        </p>
      )}
    </section>
  );
}
