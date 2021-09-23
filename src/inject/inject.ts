const inject = () => {
  const script = document.createElement('script');
  script.src = chrome.extension.getURL('/injected.bundle.js');
  if (document.head || document.documentElement) {
    (document.head || document.documentElement).appendChild(script);
    script.onload = () => { script.remove(); };
  } else {
    inject();
  }
}
inject();
