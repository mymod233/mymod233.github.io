;(function () {
  // 需要强制暗色的路径规则，自行补充
  var forceDark = /^\/(page|about|links|music)(\/|$)/i.test(location.pathname);
  if (!forceDark) return;

  // 1) 立刻设为 dark
  try { localStorage.setItem('theme', 'dark'); } catch (e) {}
  var html = document.documentElement;
  html.setAttribute('data-theme', 'dark');
  html.classList.add('force-dark-page');

  // 2) 隐藏可能存在的主题切换按钮（多写几种常见选择器以防主题版本差异）
  var hideSwitch = function () {
    var selectors = [
      '#toggle-mode', '.toggle-mode', '.toggle-theme', '.darkmode-switch',
      '.mode', '.site-nav .mode', '.navbar .mode'
    ];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.style.setProperty('display', 'none', 'important');
        el.setAttribute('aria-hidden', 'true');
      });
    });
  };
  hideSwitch();

  // 3) 监听 data-theme，防止被外部脚本改回 light
  var obs = new MutationObserver(function (muts) {
    if (html.getAttribute('data-theme') !== 'dark') {
      html.setAttribute('data-theme', 'dark');
    }
    hideSwitch();
  });
  obs.observe(html, { attributes: true, attributeFilter: ['data-theme'] });

  // 4) 某些主题用 prefers-color-scheme，直接硬顶一层样式变量
  var css = document.createElement('style');
  css.textContent =
    'html.force-dark-page{color-scheme: dark !important;}';
  document.head.appendChild(css);
})();