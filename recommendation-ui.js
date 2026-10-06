(() => {
  const el = id => document.getElementById(id);
  const duration = minutes => {
    const total = Math.max(0, Math.round(minutes));
    const hours = Math.floor(total / 60), rest = total % 60;
    return `${hours}시간${rest ? ` ${rest}분` : ''}`;
  };
  const modal = el('recommendModal');
  let result = null, snapshot = '', options = null, generation = 0;
  let view = 'calendar', month = '';
  const syncView = () => {
    el('recResults').classList.toggle('hidden', view !== 'list');
    el('recCalendar').classList.toggle('hidden', view !== 'calendar' || !result);
    el('recListView').setAttribute('aria-pressed', String(view === 'list'));
    el('recCalendarView').setAttribute('aria-pressed', String(view === 'calendar'));
  };
  const drawCalendar = () => {
    if (!result) return;
    const first = parseISODate(`${month}-01`), offset = (first.getDay()+6)%7;
    const count = new Date(first.getFullYear(), first.getMonth()+1,0).getDate();
    let html = `<div class="rec-month-nav"><button type="button" class="secondary" data-month="-1" ${month <= options.dates[0].slice(0,7) ? 'disabled' : ''}>이전 달</button><strong>${month.replace('-', '년 ')}월</strong><button type="button" class="secondary" data-month="1" ${month >= options.dates.at(-1).slice(0,7) ? 'disabled' : ''}>다음 달</button></div><p>일정을 누르면 선택·해제됩니다. 주황색은 겹침 예외입니다.</p><div class="rec-month-grid">${['월','화','수','목','금','토','일'].map(d=>`<strong>${d}</strong>`).join('')}`;
    for (let i=0;i<offset;i++) html += '<div class="rec-month-empty"></div>';
    for (let day=1;day<=count;day++) {
      const date = `${month}-${String(day).padStart(2,'0')}`;
      const holiday = getHolidayInfo(date);
      html += `<div class="rec-month-day"><strong>${day}</strong>${holiday ? `<small>${escapeHtml(holiday.name || (holiday.type === 'weekend' ? '주말' : '휴일'))}</small>` : ''}`;
      result.items.forEach((s,i) => {
        if (s.date !== date) return;
        const checked = el('recResults').querySelector(`[data-rec="${i}"]`).checked;
        html += `<button type="button" data-calendar-rec="${i}" aria-pressed="${checked}" class="rec-calendar-shift${s.overlapTags.length ? ' exception' : ''}${checked ? '' : ' deselected'}">${escapeHtml(s.tag)}<br>${s.start}–${s.end}<br>${duration(s.minutes)}${s.overlapTags.length ? `<br>겹침: ${s.overlapTags.map(escapeHtml).join(', ')}` : ''}</button>`;
      });
      html += '</div>';
    }
    el('recCalendar').innerHTML = html + '</div>';
  };
  el('recListView').onclick = () => { view='list'; syncView(); };
  el('recCalendarView').onclick = () => { view='calendar'; drawCalendar(); syncView(); };
  el('recCalendar').onclick = e => {
    const nav = e.target.closest('[data-month]'), item=e.target.closest('[data-calendar-rec]');
    if (nav) { const d=parseISODate(`${month}-01`); d.setMonth(d.getMonth()+Number(nav.dataset.month)); month=toISODate(d).slice(0,7); drawCalendar(); }
    if (item) { const checkbox=el('recResults').querySelector(`[data-rec="${item.dataset.calendarRec}"]`); checkbox.checked=!checkbox.checked; updateSelection(); }
  };
  const autoDaily = () => {
    const start=el('recStart').value,end=el('recEnd').value;
    el('recDaily').value = start && end && start < end ? Number((getNetMinutes({start,end,tag:el('recTag').value})/60).toFixed(6)) : '';
  };
  const autoTarget = () => {
    const minutes = getTagTargetMinutes(el('recTag').value);
    el('recHours').value = minutes > 0 ? minutes / 60 : '';
  };
  ['recStart','recEnd','recTag'].forEach(id => el(id).addEventListener('input', autoDaily));
  el('recTag').addEventListener('change', autoTarget);
  el('recHistory').addEventListener('change', () => { el('recWeeks').disabled = !el('recHistory').checked; });
  const state = () => JSON.stringify([getCurrentCalendarData(), semesters, [...publicHolidays]]);
  const updateSelection = () => {
    if (!result) return;
    const items = [...el('recResults').querySelectorAll('input:checked')].map(x => result.items[Number(x.dataset.rec)]);
    let overlap = 0;
    for (const s of items) for (let m = timeToMinutes(s.start); m < timeToMinutes(s.end); m++) {
      if (getMealWindowsForShift(s).some(w => m >= w.start && m < w.end)) continue;
      if (shifts.some(x => x.date === s.date && m >= timeToMinutes(x.start) && m < timeToMinutes(x.end) && !getMealWindowsForShift(x).some(w => m >= w.start && m < w.end))) overlap++;
    }
    const minutes = items.reduce((n,s) => n+s.minutes,0);
    el('recApply').textContent = `선택 ${items.length}개 적용 · 태그 ${duration(minutes)} / 기존과 중복 ${duration(overlap)} / 실제 추가 ${duration(minutes-overlap)}`;
    el('recApply').disabled = !items.length;
    drawCalendar();
  };
  el('recResults').addEventListener('change', updateSelection);
  const invalidate = () => { generation++; result = null; el('recResults').replaceChildren(); el('recCalendar').replaceChildren(); el('recViewControls').classList.add('hidden'); el('recApply').disabled = true; el('recStatus').textContent = ''; syncView(); };
  el('recommendSchedule').onclick = () => {
    invalidate();
    const tags = getKnownTags();
    el('recTag').innerHTML = tags.map(t => `<option>${escapeHtml(t)}</option>`).join('');
    el('recAllowedTags').innerHTML = tags.map(t => `<label class="rec-check"><input type="checkbox" value="${escapeHtml(t)}">${escapeHtml(t)}</label>`).join('');
    el('recFrom').value = toISODate(currentMonthStart);
    el('recTo').value = toISODate(new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 0));
    autoDaily(); autoTarget(); el('recWeeks').disabled = !el('recHistory').checked;
    modal.classList.remove('hidden'); el('recTag').focus();
  };
  el('recommendClose').onclick = () => { generation++; modal.classList.add('hidden'); el('recommendSchedule').focus(); };
  modal.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); el('recommendClose').click(); } });
  el('recommendForm').addEventListener('input', invalidate);
  el('recOverlap').onchange = () => el('recAllowed').classList.toggle('hidden', !el('recOverlap').checked);
  el('recommendForm').onsubmit = async e => {
    e.preventDefault(); invalidate(); const token = generation;
    if (!el('recommendForm').reportValidity()) return;
    if (!el('recDaily').value) autoDaily();
    const from = el('recFrom').value, to = el('recTo').value;
    const start = timeToMinutes(el('recStart').value), end = timeToMinutes(el('recEnd').value);
    const tag = el('recTag').value;
    const allowed = el('recOverlap').checked ? [...el('recAllowedTags').querySelectorAll('input:checked')].map(x => x.value).filter(t => t !== tag) : [];
    if (from > to || (parseISODate(to) - parseISODate(from)) / 86400000 > 92 || start >= end) { el('recStatus').textContent = '기간은 최대 93일이며, 종료일·종료시간은 시작 이후여야 합니다.'; return; }
    if (el('recOverlap').checked && !allowed.length) { el('recStatus').textContent = '대상 태그 외에 겹침을 허용할 태그를 선택하세요.'; return; }
    el('recGenerate').disabled = true;
    el('recStatus').textContent = '휴일과 과거 패턴을 확인하고 있습니다…';
    try {
      for (let y = Number(from.slice(0,4)); y <= Number(to.slice(0,4)); y++) {
        await loadPublicHolidayYear(y);
        if (!loadedPublicHolidayYears.has(y) && !el('recHoliday').checked) throw new Error('holiday data unavailable');
      }
      const dates = []; for (let d = parseISODate(from); toISODate(d) <= to; d.setDate(d.getDate() + 1)) dates.push(toISODate(d));
      const cutoff = parseISODate(from); cutoff.setDate(cutoff.getDate() - Number(el('recWeeks').value) * 7);
      const history = el('recHistory').checked ? shifts.filter(s => getShiftTag(s) === tag && s.date >= toISODate(cutoff) && s.date < from) : [];
      const grouped = new Map();
      history.forEach(s => { const day = parseISODate(s.date).getDay() || 7, start = timeToMinutes(s.start), key = `${day}/${start}`; const p = grouped.get(key) || { day, start, count: 0 }; p.count++; grouped.set(key, p); });
      let model = { patterns: [], model: false };
      if (history.length) {
        try { const r = await fetch('/api/recommendation-patterns', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({patterns:[...grouped.values()].sort((a,b) => b.count-a.count).slice(0,56)}), signal:AbortSignal.timeout(23000) }); if (r.ok) model = await r.json(); } catch {}
      }
      if (token !== generation) return;
      const existing = shifts.map(s => ({...s, tag:getShiftTag(s)}));
      const existingMinutes = existing.filter(s => s.tag === tag && dates.includes(s.date)).reduce((n,s) => n+getNetMinutes(s),0);
      const target = Math.max(0, Number(el('recHours').value)*60 - (el('recMode').value === 'total' ? existingMinutes : 0));
      options = { dates, existing, history, tag, target, dailyMax:Math.round(Number(el('recDaily').value)*60), start,end,allowed, classes:getClassesForDate, holiday:d => !el('recHoliday').checked && !!getHolidayInfo(d), net:getNetMinutes, preferences:model.patterns };
      result = WorklogRecommendation.plan(options); snapshot = state();
      el('recStatus').textContent = `기존 ${duration(existingMinutes)} · 추가 필요 ${duration(target)} · 추천 ${duration(target-result.missing)} · 부족 ${duration(result.missing)}. ${history.length ? `과거 ${history.length}개 일정 참고 · ${model.model ? 'AI 패턴 우선순위 반영' : '기본 패턴 분석 사용 (AI 연결 불가)'}` : '참고 기록 없이 빈 시간 기준으로 추천했습니다.'}`;
      el('recResults').innerHTML = result.items.map((s,i) => `<label class="rec-check timetable-item"><input type="checkbox" data-rec="${i}" checked><span>${s.date} ${s.start}–${s.end} · 실근무 ${duration(s.minutes)}${s.overlapTags.length ? `<br>겹침 예외: ${s.overlapTags.map(escapeHtml).join(', ')}` : '<br>겹침 없음'}</span></label>`).join('');
      month=from.slice(0,7); el('recViewControls').classList.remove('hidden');
      updateSelection(); syncView();
    } catch { el('recStatus').textContent = '추천 생성에 실패했습니다. 다시 시도해주세요.'; }
    finally { el('recGenerate').disabled = false; }
  };
  el('recApply').onclick = () => {
    if (!result) return;
    if (snapshot !== state()) { invalidate(); el('recStatus').textContent = '일정 또는 설정이 변경됐습니다. 다시 추천해주세요.'; return; }
    const items = [...el('recResults').querySelectorAll('input:checked')].map(x => result.items[Number(x.dataset.rec)]);
    if (!items.length) { el('recStatus').textContent = '적용할 일정을 선택하세요.'; return; }
    // Recompute all constraints against the current state before writing.
    const check = WorklogRecommendation.plan(options);
    if (JSON.stringify(check) !== JSON.stringify(result)) { invalidate(); el('recStatus').textContent = '배치 조건이 변경됐습니다. 다시 추천해주세요.'; return; }
    shifts.push(...items.map(({date,start,end,tag}) => ({id:makeId(),date,start,end,tag,title:tag})));
    saveShifts(); render(); invalidate(); el('recStatus').textContent = `${items.length}개 추천 일정을 적용했습니다.`;
  };
})();
