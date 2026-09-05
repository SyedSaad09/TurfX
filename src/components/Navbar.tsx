import { useState, useEffect } from 'react';
import { Menu, X, MapPin, Search, Heart, User, Calendar, Home, Compass } from 'lucide-react';
import { navigateTo, useRouter } from '@/lib/router';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { route } = useRouter();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const isActive = (path: string) => route.path === path;

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Explore', path: '/explore', icon: Compass },
    { label: 'My Bookings', path: '/dashboard', icon: Calendar },
    { label: 'Favorites', path: '/dashboard?tab=favorites', icon: Heart },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/10'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => navigateTo('/')}
              className="flex items-center gap-2 transition-transform hover:scale-105"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/30">
                <span className="text-lg font-black text-white">T</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-black tracking-tight text-white">TurfX</span>
                <span className="text-[9px] font-medium tracking-widest text-emerald-400 uppercase">
                  Find. Book. Play.
                </span>
              </div>
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigateTo(item.path)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right actions */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-slate-300 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>Nanded</span>
              </div>
              <button
                onClick={() => navigateTo('/explore')}
                className="rounded-lg bg-gradient-to-r from-emerald-400 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-105"
              >
                Find a Turf
              </button>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-white p-2"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 pt-16 bg-slate-950/98 backdrop-blur-xl">
          <div className="flex flex-col gap-2 p-6">
            <div className="flex items-center gap-2 text-sm text-slate-300 px-3 py-2 rounded-lg bg-white/5 border border-white/10 mb-4">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span>Nanded, Maharashtra</span>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigateTo(item.path);
                    setMobileOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={() => {
                navigateTo('/explore');
                setMobileOpen(false);
              }}
              className="mt-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-600 px-4 py-3 text-sm font-semibold text-white text-center"
            >
              Find a Turf
            </button>
          </div>
        </div>
      )}
    </>
  );
}
