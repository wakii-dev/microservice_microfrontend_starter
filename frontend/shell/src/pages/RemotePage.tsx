// T3 stub — T5 (FI-73) thay bằng RemoteSlot thật (lazy remote + error boundary).
export function RemotePage({ title }: { title: string }) {
  return (
    <section>
      <h1>{title}</h1>
      <p>(remote slot — sắp tới)</p>
    </section>
  );
}
