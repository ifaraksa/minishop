import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { ApiRequestError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { EXPO_OUT } from '../utils/motion';

export function AdminLoginPage() {
  const { isAuthenticated, loading, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await login(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Gagal melakukan login admin.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('admin@minishop.test');
    setPassword('admin12345');
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F3EE] px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EXPO_OUT }}
        className="w-full max-w-md"
      >
        <Link
          to="/"
          className="group mb-6 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#63625C] transition-colors hover:text-[#1A1A18]"
        >
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
            strokeWidth={1.25}
          />
          Kembali ke Katalog
        </Link>

        <div className="rounded-2xl border border-[#1A1A18]/10 bg-[#FAF9F6] p-7 sm:p-9">
          <div className="flex items-center gap-2.5">
            <span className="block h-3.5 w-3.5 rounded-[3px] bg-[#1A1A18]" />
            <span className="text-[17px] font-bold tracking-[-0.03em] text-[#1A1A18]">
              MiniShop
            </span>
            <span className="rounded-md border border-[#1A1A18]/12 bg-[#F5F3EE] px-2 py-0.5 font-mono text-[10px] text-[#63625C] uppercase">
              Backoffice
            </span>
          </div>

          <h1 className="font-editorial mt-5 text-2xl text-[#1A1A18]">Masuk ke Admin</h1>
          <p className="mt-1 text-[13px] text-[#63625C]">
            Kelola produk katalog, perbarui stok, dan proses status pesanan masuk.
          </p>

          {/* Demo Account Helper */}
          <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-[#4A6B53]/25 bg-[#E4ECE5]/70 px-4 py-3 text-xs">
            <div>
              <span className="flex items-center gap-1.5 font-medium text-[#35503C]">
                <KeyRound className="h-3.5 w-3.5" strokeWidth={1.5} />
                Akun Demo Admin
              </span>
              <p className="mt-0.5 font-mono text-[11px] text-[#35503C]/90">
                admin@minishop.test / admin12345
              </p>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={fillDemoCredentials}
              className="shrink-0 rounded-lg bg-[#1A1A18] px-3 py-1.5 text-[11.5px] font-medium text-[#F5F3EE] transition-colors hover:bg-[#2F2F2C]"
            >
              Isi Otomatis
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-lg border border-[#A1483F]/30 bg-[#F2E1DF] px-3.5 py-2.5 text-xs font-medium text-[#A1483F]">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="admin_email" className="block text-[12px] font-medium text-[#63625C]">
                Email
              </label>
              <input
                id="admin_email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@minishop.test"
                className="mt-1.5 w-full rounded-lg border border-[#1A1A18]/15 bg-[#F5F3EE]/60 px-3.5 py-2.5 text-[14px] text-[#1A1A18] transition-colors focus:border-[#1A1A18] focus:bg-[#FAF9F6] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="admin_password"
                className="block text-[12px] font-medium text-[#63625C]"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="admin_password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#1A1A18]/15 bg-[#F5F3EE]/60 py-2.5 pr-10 pl-3.5 text-[14px] text-[#1A1A18] transition-colors focus:border-[#1A1A18] focus:bg-[#FAF9F6] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-[#63625C] transition-colors hover:text-[#1A1A18]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.25} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.25} />
                  )}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1A1A18] px-5 py-3 text-[13px] font-medium text-[#F5F3EE] transition-colors hover:bg-[#2F2F2C] disabled:opacity-55"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.25} />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Masuk ke Dashboard</span>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
