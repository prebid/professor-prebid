// This script injects "injected.js" into the active page which
// which will enable the code to get access to the JS context (namely "pbjs")

function injectScript(file_path, tag) {
	var node = document.getElementsByTagName(tag)[0];
	var script = document.createElement('script');
	script.setAttribute('type', 'text/javascript');
	script.setAttribute('src', file_path);
	node.appendChild(script);
}

function checkForDOM() {
	if (document.head) {
		injectScript(chrome.extension.getURL('js/3p/dataframe.js'), 'head');
		injectScript(chrome.extension.getURL('js/3p/moment.min.js'), 'head');
		injectScript(chrome.extension.getURL('js/injected.js'), 'head');
	} else {
		requestIdleCallback(checkForDOM);
	}
}

checkForDOM();