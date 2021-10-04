const inject: any = () => {
  const script = document.createElement('script');
  script.src = chrome.extension.getURL('/injected.bundle.js');
  script.id = 'professor prebid injected bundle';
  if (document.head || document.documentElement) {
    (document.head || document.documentElement).appendChild(script);
    script.onload = () => { script.remove(); };
  } else {
    setTimeout(() => inject(), 10)
  }
}
inject();
