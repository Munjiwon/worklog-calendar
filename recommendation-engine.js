(function (root) {
  function plan({ dates, existing, history, tag, target, dailyMax, start, end, allowed, classes, holiday, net, preferences = [] }) {
    const minute = t => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
    const time = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
    const hits = (a, b) => a.date === b.date && minute(a.start) < minute(b.end) && minute(b.start) < minute(a.end);
    const selected = [];
    let remaining = target;
    const candidates = [];
    for (const date of dates) {
      if (holiday(date)) continue;
      const day = new Date(`${date}T12:00:00`).getDay() || 7;
      for (let s = start; s < end; s += 15) {
        // A recommendation must begin with actual work, not a deducted meal.
        // Use the same tag-specific net calculation as the final duration.
        if (net({ date, start: time(s), end: time(s + 1), tag }) <= 0) continue;
        const score = history.reduce((sum, h) => sum + ((new Date(`${h.date}T12:00:00`).getDay() || 7) === day ? 4 : 0) + (Math.abs(minute(h.start) - s) < 60 ? 2 : 0), 0)
          + preferences.reduce((sum, p, i) => sum + (p.day === day && Math.abs(p.start - s) < 60 ? (preferences.length - i) / 10 : 0), 0);
        candidates.push({ date, s, score });
      }
    }
    candidates.sort((a, b) => b.score - a.score || a.date.localeCompare(b.date) || a.s - b.s);
    for (const permitOverlap of [false, true]) {
      if (permitOverlap && !allowed.length) break;
      while (remaining > 0) {
        let longest = null;
        // Candidates are already ordered by historical preference. Keep that
        // order only as a tie-breaker after contiguous real working time.
        for (const c of candidates) {
        const used = [...existing, ...selected].filter(x => x.date === c.date && x.tag === tag).reduce((n, x) => n + net(x), 0);
        const budget = Math.min(remaining, dailyMax - used);
        if (budget <= 0) continue;
        let best = null;
        for (let e = c.s + 1; e <= end; e++) {
          const item = { date: c.date, start: time(c.s), end: time(e), tag };
          if (classes(c.date).some(x => hits(item, { ...x, date: c.date })) || selected.some(x => hits(item, x))) break;
          const collisions = existing.filter(x => hits(item, x));
          if (collisions.some(x => !permitOverlap || !allowed.includes(x.tag) || x.tag === tag)) break;
          const minutes = net(item);
          if (minutes > budget) break;
          if (minutes > 0 && (!best || minutes > best.minutes)) best = { ...item, minutes, overlapTags: [...new Set(collisions.map(x => x.tag))] };
        }
        if (best && (!longest || best.minutes > longest.minutes)) longest = best;
        }
        if (!longest) break;
        selected.push(longest);
        remaining -= longest.minutes;
      }
    }
    return { items: selected.sort((a,b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start)), missing: remaining };
  }
  if (typeof module !== 'undefined') module.exports = { plan };
  else root.WorklogRecommendation = { plan };
})(typeof window === 'undefined' ? globalThis : window);
