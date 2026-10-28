// Entry anchor for the MF container (remoteEntry.js). In production this module is
// never executed in a page — the host imports the exposed `./{{remoteName}}Page`
// directly through Module Federation. It exists as the async boundary the container
// requires: an entry that statically imports shared modules crashes in-host
// ("Invalid loadShareSync" — the share scope is not initialized yet → blank page).
//
// It only executes when you open the standalone debug page: boot `./standalone`
// dynamically (async boundary) and surface load failures on the page instead of
// failing silently with an empty root.
import('./standalone').catch((err: unknown) => {
  document.body.textContent = `Standalone load fail: ${err instanceof Error ? err.message : String(err)}`;
});
