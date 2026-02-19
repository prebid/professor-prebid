// @ts-ignore
// eslint-disable-next-line no-native-reassign
googletag = googletag || {};
if (!Array.isArray(this.googletag.cmd)) {
    (this.googletag as any).cmd = [];
}
googletag.cmd.push(() => googletag.openConsole());
