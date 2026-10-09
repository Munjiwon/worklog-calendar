(() => {
  const releases = window.WorklogReleases;
  if (!Array.isArray(releases) || !releases.length) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'release-trigger';
  button.textContent = 'v' + releases[0].version + ' · 버전 기록';
  button.setAttribute('aria-haspopup', 'dialog');
  const footer = document.createElement('footer');
  footer.className = 'release-footer';
  footer.append(button);
  document.body.append(footer);
  const dialog = document.createElement('dialog');
  dialog.className = 'release-dialog';
  dialog.setAttribute('aria-labelledby', 'releaseTitle');
  const header = document.createElement('header');
  header.className = 'release-header';
  const heading = document.createElement('h2');
  heading.id = 'releaseTitle';
  heading.textContent = '버전 기록';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'icon-button';
  close.textContent = '×';
  close.setAttribute('aria-label', '버전 기록 닫기');
  header.append(heading, close);
  dialog.append(header);
  const note = document.createElement('p');
  note.className = 'release-history-note';
  note.textContent = '과거 기록은 업로드 요청 기준입니다. 버전 대신 커밋 ID를 표시하며 날짜는 커밋 기준입니다. 업로드 완료는 서버 배포 완료를 의미하지 않습니다. 동일 변경의 재업로드 요청은 합쳤습니다.';
  dialog.append(note);
  releases.forEach((release, index) => {
    const article = document.createElement('article');
    article.className = 'release-entry';
    const row = document.createElement('div');
    row.className = 'release-row';
    const version = document.createElement('h3');
    version.textContent = release.historical ? '이전 배포 · ' + release.version : release.version;
    if (index === 0) {
      const badge = document.createElement('span');
      badge.className = 'release-badge';
      badge.textContent = '현재 버전';
      version.append(badge);
    }
    const date = document.createElement('time');
    date.dateTime = release.date;
    date.textContent = release.date.replaceAll('-', '.');
    row.append(version, date);
    const title = document.createElement('p');
    title.className = 'release-subtitle';
    title.textContent = release.title;
    const list = document.createElement('ul');
    release.changes.forEach(text => {
      const item = document.createElement('li');
      item.textContent = text;
      list.append(item);
    });
    article.append(row, title, list);
    if (release.status) {
      const status = document.createElement('p');
      status.className = 'release-history-note';
      status.textContent = release.status;
      article.append(status);
    }
    dialog.append(article);
  });
  document.body.append(dialog);
  button.onclick = () => dialog.showModal();
  close.onclick = () => dialog.close();
  dialog.addEventListener('close', () => button.focus());
})();
