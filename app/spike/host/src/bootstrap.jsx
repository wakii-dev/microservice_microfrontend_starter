// App bootstrap — mọi import shared (react/react-dom) đặt SAU async boundary ở index.jsx
window.addEventListener('error', (e) => {
  document.getElementById('app').innerHTML = '❌ BOOT ERROR: ' + e.message;
});

import('react-dom/client')
  .then(({ createRoot }) => {
    const root = createRoot(document.getElementById('app'));
    root.render(<div style={{ padding: 24 }}>host booting…</div>);

    import('spike_remote/Hello')
      .then(({ default: Hello }) => {
        root.render(<Hello />);
      })
      .catch((err) => {
        root.render(
          <div style={{ padding: 24, color: 'crimson', fontFamily: 'monospace' }}>
            ❌ REMOTE LOAD FAILED: {String(err && err.message ? err.message : err)}
          </div>
        );
      });
  })
  .catch((err) => {
    document.getElementById('app').innerHTML =
      '❌ REACT LOAD FAILED: ' + String(err && err.message ? err.message : err);
  });
