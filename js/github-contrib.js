// <github-contrib user="...">: a GitHub-style contribution heatmap built
// from a public, unauthenticated API — no token or backend required.
class GithubContrib extends HTMLElement {
  connectedCallback() {
    const user = this.getAttribute('user') || 'Burakayabasi';
    this.style.display = 'block';
    this.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'border:1px solid var(--color-neutral-800); border-radius:var(--radius-lg); padding:var(--space-4); background:color-mix(in oklab, var(--color-neutral-800) 30%, transparent); overflow-x:auto;';

    const head = document.createElement('div');
    head.style.cssText = 'display:flex; justify-content:space-between; align-items:baseline; gap:var(--space-4); margin-bottom:var(--space-3); flex-wrap:wrap;';
    const title = document.createElement('div');
    title.style.cssText = 'color:var(--color-neutral-300); font-size:0.85rem;';
    title.textContent = 'GitHub-Aktivität';
    const link = document.createElement('a');
    link.href = 'https://github.com/' + user;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = '@' + user;
    link.style.cssText = 'font-size:0.85rem; color:var(--color-accent-300); text-decoration:none;';
    head.append(title, link);

    const body = document.createElement('div');
    body.style.cssText = 'display:flex; gap:6px; min-width:max-content;';

    const days = document.createElement('div');
    days.style.cssText = 'display:grid; grid-template-rows:repeat(7,11px); gap:3px; padding-top:17px; color:var(--color-neutral-400); font-size:0.7rem; line-height:11px;';
    ['', 'Mo', '', '', '', 'Fr', ''].forEach(t => {
      const d = document.createElement('div');
      d.textContent = t;
      days.appendChild(d);
    });

    const cols = document.createElement('div');
    cols.style.cssText = 'display:flex; flex-direction:column; gap:6px;';
    const months = document.createElement('div');
    months.style.cssText = 'position:relative; height:11px; color:var(--color-neutral-400); font-size:0.7rem; line-height:11px;';
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid; grid-auto-flow:column; grid-template-rows:repeat(7,11px); gap:3px; min-width:max-content;';
    cols.append(months, grid);
    body.append(days, cols);

    const foot = document.createElement('div');
    foot.style.cssText = 'display:flex; justify-content:space-between; align-items:center; gap:var(--space-4); margin-top:var(--space-3); color:var(--color-neutral-400); font-size:0.75rem;';
    const status = document.createElement('div');
    const legend = document.createElement('div');
    legend.style.cssText = 'display:flex; align-items:center; gap:4px;';
    foot.append(status, legend);

    const shades = [
      'color-mix(in oklab, var(--color-neutral-700) 60%, transparent)',
      'rgba(57,255,143,0.22)', 'rgba(57,255,143,0.42)', 'rgba(57,255,143,0.68)', 'rgba(57,255,143,0.95)'
    ];
    const swatch = (lvl) => {
      const s = document.createElement('span');
      s.style.cssText = 'width:11px; height:11px; border-radius:2px; display:block; background:' + shades[lvl] + ';';
      return s;
    };
    const less = document.createElement('span'); less.textContent = 'Weniger';
    const more = document.createElement('span'); more.textContent = 'Mehr';
    legend.append(less, swatch(0), swatch(1), swatch(2), swatch(3), swatch(4), more);

    wrap.append(head, body, foot);
    this.appendChild(wrap);

    const cellFor = (level, label) => {
      const c = document.createElement('div');
      c.style.cssText = 'width:11px; height:11px; border-radius:2px; background:' + shades[level] + ';';
      if (label) c.title = label;
      return c;
    };

    const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const drawMonths = (weekMonth) => {
      months.innerHTML = '';
      let prev = -1, lastX = -99;
      weekMonth.forEach((m, i) => {
        if (m === prev) return;
        prev = m;
        const x = i * 14;
        if (x - lastX < 28) return;
        lastX = x;
        const l = document.createElement('div');
        l.textContent = MONTHS[m];
        l.style.cssText = 'position:absolute; left:' + x + 'px; top:0; white-space:nowrap;';
        months.appendChild(l);
      });
    };

    const drawEmpty = () => {
      grid.innerHTML = '';
      for (let i = 0; i < 371; i++) grid.appendChild(cellFor(0));
      const now = new Date();
      const weekMonth = [];
      for (let w = 0; w < 53; w++) {
        const d = new Date(now);
        d.setDate(d.getDate() - (52 - w) * 7);
        weekMonth.push(d.getMonth());
      }
      drawMonths(weekMonth);
    };

    drawEmpty();
    status.textContent = 'Lade …';

    fetch('https://github-contributions-api.jogruber.de/v4/' + user + '?y=last')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then(data => {
        const days = data.contributions || [];
        if (!days.length) throw new Error('leer');
        months.innerHTML = '';
        grid.innerHTML = '';
        const firstDow = new Date(days[0].date).getDay();
        for (let i = 0; i < firstDow; i++) {
          const pad = document.createElement('div');
          pad.style.cssText = 'width:11px; height:11px;';
          grid.appendChild(pad);
        }
        let total = 0;
        const weekMonth = [];
        for (let i = 0; i < days.length; i++) {
          const d = days[i];
          total += d.count;
          const date = new Date(d.date);
          if ((firstDow + i) % 7 === 0) weekMonth.push(date.getMonth());
          const dt = date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
          grid.appendChild(cellFor(Math.min(4, d.level || 0), d.count + ' Beiträge · ' + dt));
        }
        drawMonths(weekMonth);
        status.textContent = total.toLocaleString('de-DE') + ' Beiträge im letzten Jahr';
      })
      .catch(() => { status.textContent = 'Aktivität nicht abrufbar — Profil auf GitHub ansehen'; });
  }
}
if (!customElements.get('github-contrib')) customElements.define('github-contrib', GithubContrib);
