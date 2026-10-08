(() => {
  const el = id => document.getElementById(id);
  const dialog = el('accountSettings');
  el('openSettings').onclick = () => {
    el('accountSettingsForm').reset();
    el('settingsEmail').value = currentSession?.email || '';
    el('settingsWeekStart').value = String(weekStartsOn);
    el('settingsStatus').textContent = '';
    dialog.showModal();
  };
  const clearPasswords = () => ['settingsCurrentPassword', 'settingsPassword', 'settingsPasswordConfirm'].forEach(id => el(id).value = '');
  el('closeSettings').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { clearPasswords(); el('openSettings').focus(); });
  el('calendarSettingsForm').onsubmit = async event => {
    event.preventDefault();
    const button = event.submitter;
    button.disabled = true;
    try {
      const value = Number(el('settingsWeekStart').value);
      window.clearTimeout(calendarDataSaveTimer);
      const response = await fetch('/api/calendar-data', {
        method: 'PUT', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({...getCurrentCalendarData(), weekStartsOn:value})
      });
      if (!response.ok) throw new Error('달력 설정 저장에 실패했습니다.');
      weekStartsOn = value;
      localStorage.setItem(storageKeys.weekStartsOn, JSON.stringify(value));
      currentWeekStart = startOfWeek(currentWeekStart);
      render();
      el('settingsStatus').textContent = '달력 설정을 저장했습니다.';
    } catch (error) { el('settingsStatus').textContent = error.message; }
    finally { button.disabled = false; }
  };
  el('accountSettingsForm').onsubmit = async event => {
    event.preventDefault();
    if (el('settingsPassword').value !== el('settingsPasswordConfirm').value) {
      el('settingsStatus').textContent = '새 비밀번호가 일치하지 않습니다.'; return;
    }
    const button = event.submitter;
    button.disabled = true;
    try {
      const response = await fetch('/api/account', {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:el('settingsEmail').value, currentPassword:el('settingsCurrentPassword').value, password:el('settingsPassword').value})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '계정 정보 저장에 실패했습니다.');
      currentSession = {...currentSession, ...data.user};
      clearPasswords();
      el('settingsStatus').textContent = '계정 정보를 저장했습니다.';
    } catch (error) { el('settingsStatus').textContent = error.message; }
    finally { button.disabled = false; }
  };
})();
