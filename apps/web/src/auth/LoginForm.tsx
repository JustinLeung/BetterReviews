import { useState } from 'react';
import { useAuth } from './AuthProvider';

const INBUCKET_URL = import.meta.env.VITE_INBUCKET_URL;

/** Passwordless magic-link sign-in. */
export function LoginForm() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithEmail(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the magic link.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="login-sent">
        <p>
          We sent a magic link to <strong>{email}</strong>. Open it to finish signing in.
        </p>
        {INBUCKET_URL && (
          <p className="muted">
            Local dev: emails aren't really sent — find it in your{' '}
            <a href={INBUCKET_URL} target="_blank" rel="noreferrer">
              local mailbox
            </a>
            .
          </p>
        )}
        <button type="button" className="btn btn--ghost" onClick={() => setSent(false)}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <p className="muted">No password needed — we'll email you a one-time sign-in link.</p>
      <label className="field">
        <span className="field__label">Email</span>
        <input
          type="email"
          className="field__input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
        {busy ? 'Sending…' : 'Send magic link'}
      </button>
    </form>
  );
}
