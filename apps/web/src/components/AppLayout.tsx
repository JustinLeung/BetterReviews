import { NavLink, Outlet } from 'react-router-dom';

/** App shell: top navigation bar + routed content. Desktop-web layout. */
export function AppLayout() {
  return (
    <div className="app">
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink to="/" className="brand">
            <span className="brand__mark">◆</span>
            <span className="brand__name">BetterReviews</span>
          </NavLink>

          <nav className="site-nav">
            <NavLink to="/" end className={navClass}>
              Discover
            </NavLink>
            <NavLink to="/map" className={navClass}>
              Map
            </NavLink>
            <NavLink to="/list" className={navClass}>
              List
            </NavLink>
            <NavLink to="/saved" className={navClass}>
              Saved
            </NavLink>
          </nav>

          <span className="site-header__spacer" />

          <span className="site-header__city">
            <PinIcon /> Munich
          </span>
          <button type="button" className="site-header__cta">
            <PlusIcon />
            <span>Recommend a place</span>
          </button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

function navClass({ isActive }: { isActive: boolean }): string {
  return `site-nav__link ${isActive ? 'is-active' : ''}`;
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
