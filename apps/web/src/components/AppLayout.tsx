import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

/** App shell: header nav + auth bar + routed content. Mobile-first. */
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
            <AuthBar />
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

function AuthBar() {
  const { isConfigured, loading, user, signOut, promptSignIn } = useAuth();
  if (!isConfigured || loading) return null;
  if (user) {
    return (
      <div className="authbar">
        <span className="authbar__email" title={user.email ?? ''}>
          {user.email}
        </span>
        <button type="button" className="authbar__btn" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    );
  }
  return (
    <button type="button" className="authbar__btn authbar__btn--primary" onClick={promptSignIn}>
      Sign in
    </button>
  );
}

function navClass({ isActive }: { isActive: boolean }): string {
  return `app-nav__link ${isActive ? 'is-active' : ''}`;
}
