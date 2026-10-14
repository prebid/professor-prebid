const win = window as any;
win.googletag = win.googletag || {};
win.googletag.cmd = win.googletag.cmd || [];
win.googletag.cmd.push(() => {
  if (typeof win.googletag.openConsole === 'function') {
    win.googletag.openConsole();
  } else {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('google_console')) {
      url.searchParams.set('google_console', '1');
      window.location.href = url.toString();
    }
  }
});
