import { useState, useEffect } from 'react';
import {
  Search, MapPin, Star, ArrowRight, Zap, Shield, Clock, TrendingUp,
  Trophy, Users, Sparkles, ChevronRight, BadgeCheck, Calendar,
  CircleDot, Circle, Award, Flame
} from 'lucide-react';
import { fetchTurfs, fetchCoupons, fetchSports } from '@/lib/api';
import type { TurfWithRelations, Coupon, Sport } from '@/types';
import { TurfCard, TurfCardSkeleton } from '@/components/TurfCard';
import { navigateTo } from '@/lib/router';
import { formatINR } from '@/lib/utils';

export function HomePage() {
  const [turfs, setTurfs] = useState<TurfWithRelations[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [t, c, s] = await Promise.all([
          fetchTurfs({ city: 'Nanded' }),
          fetchCoupons(),
          fetchSports(),
        ]);
        setTurfs(t);
        setCoupons(c);
        setSports(s);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const popularTurfs = [...turfs].sort((a, b) => b.popularity - a.popularity).slice(0, 4);
  const topRated = [...turfs].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const bestValue = [...turfs].sort((a, b) => a.price_per_hour - b.price_per_hour).slice(0, 3);

  const handleSearch = () => {
    const params = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
    navigateTo(`/explore${params}`);
  };

  const sportIcons: Record<string, typeof CircleDot> = {
    football: CircleDot,
    cricket: Trophy,
    basketball: Circle,
    badminton: CircleDot,
    tennis: CircleDot,
    volleyball: Circle,
  };

  return (
    <div className="bg-white">
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-slate-950">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/37635539/pexels-photo-37635539.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
            alt="Turf at night"
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950" />
          <div className="absolute inset-0 bg-grid opacity-50" />
        </div>

        {/* Floating glow orbs */}
        <div className="absolute top-1/4 left-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-10 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 mb-6 animate-fade-in">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-300 tracking-wide">
                Now live in Nanded . Expanding across India soon
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] animate-fade-in-up">
              Book your next
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                game in seconds
              </span>
            </h1>

            <p className="mt-5 text-lg text-slate-300 max-w-xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Discover premium sports turfs near you. Compare prices, check live
              availability, and book instantly. Find. Book. Play.
            </p>

            {/* Search bar */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search turf, sport or location..."
                  className="w-full rounded-xl border border-white/10 bg-white/10 backdrop-blur-lg py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-400 outline-none transition-all focus:border-emerald-400/50 focus:bg-white/15"
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 backdrop-blur-lg px-4 py-3.5">
                <MapPin className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-medium text-white">Nanded</span>
              </div>
              <button
                onClick={handleSearch}
                className="rounded-xl bg-gradient-to-r from-emerald-400 to-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-emerald-500/50 hover:scale-105 whitespace-nowrap"
              >
                Find a Turf
              </button>
            </div>

            {/* Quick stats */}
            <div className="mt-12 flex flex-wrap gap-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              {[
                { value: `${turfs.length}+`, label: 'Premium Turfs' },
                { value: '6', label: 'Sports' },
                { value: '500+', label: 'Happy Players' },
                { value: '4.6', label: 'Avg Rating' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ===== SPORTS CATEGORIES ===== */}
      <section className="py-16 -mt-20 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Browse by sport</h2>
              <p className="text-sm text-slate-500 mt-1">Find turfs for your favourite game</p>
            </div>
            <button
              onClick={() => navigateTo('/explore')}
              className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:gap-2 transition-all"
            >
              View all <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {sports.map((sport) => {
              const Icon = sportIcons[sport.slug] || CircleDot;
              return (
                <button
                  key={sport.id}
                  onClick={() => navigateTo(`/explore?sport=${sport.slug}`)}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 transition-all group-hover:from-emerald-400 group-hover:to-teal-600 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-600">
                    {sport.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== POPULAR TURFS ===== */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Trending</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">Popular turfs in Nanded</h2>
              <p className="text-sm text-slate-500 mt-1">Most booked venues this week</p>
            </div>
            <button
              onClick={() => navigateTo('/explore')}
              className="hidden sm:flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:gap-2 transition-all"
            >
              View all <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <TurfCardSkeleton key={i} />)
              : popularTurfs.map((turf) => <TurfCard key={turf.id} turf={turf} />)}
          </div>
        </div>
      </section>

      {/* ===== SMART RECOMMENDATIONS ===== */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Smart Picks</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-6">Curated for you</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Best rated */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                  <Award className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm font-bold text-slate-900">Best Rated</span>
              </div>
              {topRated.map((turf) => (
                <button
                  key={turf.id}
                  onClick={() => navigateTo(`/turf/${turf.slug}`)}
                  className="flex items-center gap-3 w-full py-2.5 border-b border-slate-100 last:border-0 text-left hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <img src={turf.image_urls[0]} alt={turf.name} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{turf.name}</p>
                    <p className="text-xs text-slate-500">{turf.area}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-slate-700">{turf.rating}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Best value */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm font-bold text-slate-900">Best Value</span>
              </div>
              {bestValue.map((turf) => (
                <button
                  key={turf.id}
                  onClick={() => navigateTo(`/turf/${turf.slug}`)}
                  className="flex items-center gap-3 w-full py-2.5 border-b border-slate-100 last:border-0 text-left hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <img src={turf.image_urls[0]} alt={turf.name} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{turf.name}</p>
                    <p className="text-xs text-slate-500">{turf.area}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">{formatINR(turf.price_per_hour)}</span>
                </button>
              ))}
            </div>

            {/* High demand */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                  <Zap className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-sm font-bold text-slate-900">High Demand</span>
              </div>
              {popularTurfs.slice(0, 3).map((turf) => (
                <button
                  key={turf.id}
                  onClick={() => navigateTo(`/turf/${turf.slug}`)}
                  className="flex items-center gap-3 w-full py-2.5 border-b border-slate-100 last:border-0 text-left hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <img src={turf.image_urls[0]} alt={turf.name} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{turf.name}</p>
                    <p className="text-xs text-slate-500">{turf.area}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-red-500 bg-red-50 px-2 py-0.5 rounded">
                    Hot
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-16 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Simple Process</span>
            <h2 className="text-3xl font-black text-white mt-2">How TurfX works</h2>
            <p className="text-slate-400 mt-2 max-w-lg mx-auto">
              Three simple steps to get you on the field
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                step: '01',
                title: 'Find your turf',
                desc: 'Search and filter by sport, location, price, and facilities to discover the perfect venue near you.',
              },
              {
                icon: Calendar,
                step: '02',
                title: 'Pick a slot',
                desc: 'Check real-time availability, select your date and time, and review your booking details instantly.',
              },
              {
                icon: Trophy,
                step: '03',
                title: 'Play your game',
                desc: 'Pay securely online, get instant confirmation with directions, and show up to play. It is that easy.',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="relative text-center">
                  {idx < 2 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-emerald-500/30 to-transparent" />
                  )}
                  <div className="relative inline-flex">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/30">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 text-xs font-black text-emerald-400 bg-slate-900 rounded-full px-1.5 py-0.5 border border-emerald-500/30">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-5">{item.title}</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== EXCLUSIVE OFFERS ===== */}
      {coupons.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-2">
              <BadgeCheck className="h-5 w-5 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Exclusive Offers</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-6">Save on your next booking</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="relative overflow-hidden rounded-2xl border-2 border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-6"
                >
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/10" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-black text-emerald-600">
                        {coupon.discount_type === 'percent'
                          ? `${coupon.discount_value}% OFF`
                          : `${formatINR(coupon.discount_value)} OFF`}
                      </span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Trophy className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-700">{coupon.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <code className="rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-emerald-600 border border-emerald-200">
                        {coupon.code}
                      </code>
                      <span className="text-xs text-slate-500">
                        Min order {formatINR(coupon.min_order)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== WHY TURFX ===== */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-slate-900">Why players choose TurfX</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Zap, title: 'Instant Booking', desc: 'Book in under 30 seconds with real-time slot availability.' },
              { icon: Shield, title: 'Secure Payments', desc: 'UPI, cards, and net banking with bank-grade security.' },
              { icon: MapPin, title: 'Local Discovery', desc: 'Find turfs near you with distance and directions.' },
              { icon: Clock, title: '24/7 Access', desc: 'Browse and book anytime, even at midnight.' },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-5 w-5 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Testimonials</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900">What players say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: 'Aditya Patil', role: 'Football Enthusiast', rating: 5, text: 'TurfX completely changed how we book our weekend matches. The live slot grid is a game changer - no more calling around to check availability.' },
              { name: 'Rohan More', role: 'Cricket Coach', rating: 5, text: 'As a coach, I book multiple slots every week. TurfX makes it effortless and the confirmation with directions is perfect for sharing with my team.' },
              { name: 'Neha Rathod', role: 'Badminton Player', rating: 4, text: 'Love the indoor sports dome discovery. Found a great badminton court near me that I did not know existed. The booking process is super smooth.' },
            ].map((t, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-4 w-4 ${idx < t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Ready to <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">play?</span>
          </h2>
          <p className="text-slate-400 mt-3 max-w-lg mx-auto">
            Join hundreds of players in Nanded who book their turfs with TurfX.
            Your next game is just a click away.
          </p>
          <button
            onClick={() => navigateTo('/explore')}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 hover:shadow-emerald-500/50"
          >
            Find a Turf
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
