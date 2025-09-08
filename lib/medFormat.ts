export function formatUsage(raw: string | undefined | null): string {
  if (!raw) return '—';
  const s = raw.trim();
  // simple heuristics: 1日2回, 1日1回, 朝夕, 朝・夕, 食前/食後
  try {
    const dayMatch = s.match(/(\d+)\s*日\s*(\d+)\s*回/);
    if (dayMatch) {
      return `${dayMatch[1]}日あたり${dayMatch[2]}回（${s}）`;
    }
    if (/朝|夕|昼|夜|朝夕|朝・夕/.test(s)) {
      return `${s} に服用`;
    }
    if (/食前/.test(s)) return `${s} (食前)`;
    if (/食後/.test(s)) return `${s} (食後)`;
    // fallback: return original
    return s;
  } catch (e) {
    return s;
  }
}

export function formatDosage(raw: string | undefined | null): string {
  if (!raw) return '—';
  const s = raw.trim();
  try {
    // normalize micrograms, mg, ml, tablets
    const mgMatch = s.match(/([0-9\.]+)\s*mg/i);
    if (mgMatch) return `${mgMatch[1]} mg`;
    const gMatch = s.match(/([0-9\.]+)\s*g/i);
    if (gMatch) return `${gMatch[1]} g`;
    const tabMatch = s.match(/([0-9\.]+)\s*(錠|タブレット|錠剤)/);
    if (tabMatch) return `${tabMatch[1]} 錠`;
    // ml
    const mlMatch = s.match(/([0-9\.]+)\s*(ml|mL)/i);
    if (mlMatch) return `${mlMatch[1]} mL`;
    return s;
  } catch (e) {
    return s;
  }
}
