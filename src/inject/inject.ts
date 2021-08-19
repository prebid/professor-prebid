// This script injects "injected.js" into the active page which
// which will enable the code to get access to the JS context (namely "pbjs")

const injectScript = (file_path: string, tag: string) => {
  var node = document.getElementsByTagName(tag)[0];
  var script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', file_path);
  node.appendChild(script);
}

const checkForDOM = () => {
  if (document.head) {
    injectScript(chrome.extension.getURL('./injected.bundle.js'), 'body');
  } else {
    requestIdleCallback(checkForDOM);
  }
}

checkForDOM();
