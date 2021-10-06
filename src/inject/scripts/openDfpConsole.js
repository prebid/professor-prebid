const script = document.createElement('script');
script.innerHTML = `
	var googletag = googletag || {};
	googletag.cmd = googletag.cmd || [];

	googletag.cmd.push(() => {
		googletag.openConsole();
	});
`;
(document.head || document.documentElement).appendChild(script);
script.onload = () => { script.remove(); };
