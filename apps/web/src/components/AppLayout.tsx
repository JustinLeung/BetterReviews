import { NavLink, Outlet } from 'react-router-dom';

/** App shell: header nav + routed content. Mobile-first. */
export function AppLayout() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <NavLink to="/" className="brand">
            <span className="brand__mark">◆</span>
            <span className="brand__name">BetterReviews</span>
          </NavLink>
          <nav className="app-nav">
            <NavLink to="/" end className={navClass}>
              Discover
            </NavLink>
            <NavLink to="/saved" className={navClass}>
              Saved
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <p>Recommendations from friends and people with similar taste — not universal ratings.</p>
      </footer>
    </div>
  );
}

function navClass({ isActive }: { isActive: boolean }): string {
  return `app-nav__link ${isActive ? 'is-active' : ''}`;
}
