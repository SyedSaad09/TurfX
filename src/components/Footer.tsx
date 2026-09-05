import { MapPin, Mail, Phone, Instagram, Facebook, Twitter, Youtube } from 'lucide-react';
import { navigateTo } from '@/lib/router';

export function Footer() {
  const linkGroups = [
    {
      title: 'Explore',
      links: [
        { label: 'All Turfs', path: '/explore' },
        { label: 'Football', path: '/explore?sport=football' },
        { label: 'Cricket', path: '/explore?sport=cricket' },
        { label: 'Basketball', path: '/explore?sport=basketball' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About TurfX', path: '/' },
        { label: 'List Your Turf', path: '/' },
        { label: 'Careers', path: '/' },
        { label: 'Contact', path: '/' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', path: '/' },
        { label: 'Cancellation Policy', path: '/' },
        { label: 'Terms of Service', path: '/' },
        { label: 'Privacy Policy', path: '/' },
      ],
    },
  ];

  return (
    <footer className="bg-slate-950 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600">
                <span className="text-lg font-black text-white">T</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-black tracking-tight text-white">TurfX</span>
                <span className="text-[9px] font-medium tracking-widest text-emerald-400 uppercase">
                  Find. Book. Play.
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-5">
              TurfX is Nanded's premier sports turf booking platform. Discover, compare,
              and book the best turfs in your city in seconds.
            </p>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>Nanded, Maharashtra, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-400" />
                <span>hello@turfx.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-400" />
                <span>+91 98XXX XXXXX</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-5">
              {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#/"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link groups */}
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-white mb-4">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigateTo(link.path)}
                      className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            (c) 2026 TurfX. All rights reserved. Demo data shown for showcase purposes.
          </p>
          <p className="text-xs text-slate-500">
            Made with passion in Nanded, MH
          </p>
        </div>
      </div>
    </footer>
  );
}
