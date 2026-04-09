import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="zlon-root">
      <div className="zlon-device zlon-device--consumer">
        <div className="zlon-screen zlon-screen--stacked">
          <main className="zlon-scroll-view" style={{ paddingTop: 'max(72px, 12vh)' }}>
            <section className="zlon-section-card zlon-section-card--hero">
              <p className="zlon-eyebrow">Not Found</p>
              <h1 className="zlon-section-title">This route does not exist in the new app.</h1>
              <p className="zlon-helper-copy">
                The old website paths were removed during the SPA rebuild. Use the new consumer or business entry points below.
              </p>
            </section>
            <section className="zlon-action-list">
              <Link className="zlon-button zlon-button--primary" href="/">
                Open Consumer App
              </Link>
              <a className="zlon-button zlon-button--ghost" href="https://mybusiness.zlon.in/">
                Open Business App
              </a>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
