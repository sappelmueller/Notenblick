// The settings tabs and Studio use the same manual activation and focus rules.
window.tsBindViewTabs = function(list, options) {
  const tabs = options.tabs, panels = options.panels;
  let generation = 0;
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', options.label);
  list.querySelectorAll(':scope > li').forEach(item => item.setAttribute('role', 'presentation'));
  function activate(tab, focus = false, update = true) {
    const current = ++generation, focusBefore = document.activeElement;
    const commit = () => {
      if (current !== generation) return false;
      tabs.forEach(item => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
      });
      if (focus && (document.activeElement === focusBefore || document.activeElement === tab)) tab.focus();
      options.onActivate?.(tab, update);
      return true;
    };
    const ready = options.beforeActivate?.(tab, update);
    if (ready?.then) return ready.then(ok => ok === false ? false : commit()).catch(error => { if (current === generation) options.onError?.(error); return false; });
    return ready === false ? false : commit();
  }
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    tab.removeAttribute('aria-current');
    tab.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); activate(tab, true);
    });
    tab.addEventListener('keydown', event => {
      if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
      const index = tabs.indexOf(tab);
      const next = {ArrowRight: tabs[(index + 1) % tabs.length], ArrowLeft: tabs[(index - 1 + tabs.length) % tabs.length], Home: tabs[0], End: tabs[tabs.length - 1]}[event.key];
      if (next) { event.preventDefault(); tabs.forEach(item => { item.tabIndex = item === next ? 0 : -1; }); next.focus(); }
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(tab, true); }
    });
  });
  panels.forEach((panel, index) => {
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabs[index].id);
    panel.removeAttribute('tabindex');
  });
  return {activate};
};

