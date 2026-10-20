(function () {
  var key = 'tdesign-preview-preferences';
  var defaults = { density: 'standard', defaultPage: 'requests', theme: 'system' };
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var changeId = 0;
  function normalize(value) {
    value = value && typeof value === 'object' ? value : {};
    return {
      density: value.density === 'compact' ? 'compact' : 'standard',
      defaultPage: value.defaultPage === 'workbenchHome' ? 'workbenchHome' : 'requests',
      theme: value.theme === 'light' || value.theme === 'dark' ? value.theme : 'system'
    };
  }
  function read() {
    try { return normalize(JSON.parse(localStorage.getItem(key) || '{}')); }
    catch { return { ...defaults }; }
  }
  function setMode(mode) {
    document.documentElement.setAttribute('theme-mode', mode);
    document.documentElement.style.colorScheme = mode;
  }
  function apply(theme, initial) {
    var dark = theme === 'dark' || theme === 'system' && media && media.matches;
    var mode = dark ? 'dark' : 'light';
    var currentId = ++changeId;
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (initial || document.documentElement.getAttribute('theme-mode') === mode || reducedMotion || !document.startViewTransition) {
      setMode(mode);
      return;
    }
    try {
      var transition = document.startViewTransition(function () {
        if (currentId === changeId) setMode(mode);
      });
      transition.ready && transition.ready.catch(function () {});
      transition.updateCallbackDone && transition.updateCallbackDone.catch(function () {
        if (currentId === changeId) setMode(mode);
      });
      transition.finished && transition.finished.catch(function () {});
    } catch {
      if (currentId === changeId) setMode(mode);
    }
  }
  function save(value) {
    if (!value || !['standard', 'compact'].includes(value.density) || !['requests', 'workbenchHome'].includes(value.defaultPage) || !['system', 'light', 'dark'].includes(value.theme)) throw new Error('界面偏好无效。');
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { throw new Error('此浏览器无法保存界面偏好，请检查本地存储设置。'); }
    apply(value.theme);
    return value;
  }
  globalThis.previewTheme = { read: read, save: save, apply: apply };
  apply(read().theme, true);
  if (media && media.addEventListener) media.addEventListener('change', function () {
    if (read().theme === 'system') apply('system');
  });
})();
