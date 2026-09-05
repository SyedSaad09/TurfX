import { useState, useEffect } from 'react';
import {
  Calendar, Heart, User, Settings, Clock, MapPin, Navigation,
  X, CheckCircle2, CalendarPlus, Ticket, Bell, CreditCard,
  TrendingUp, Trophy, Award, Target
} from 'lucide-react';
import { fetchAllBookings, cancelBooking, fetchTurfs, fetchTurfBySlug } from '@/lib/api';
import type { Booking, TurfWithRelations } from '@/types';
import { formatINR, formatTime, formatDateLong } from '@/lib/utils';
import { navigateTo, useRouter } from '@/lib/router';
import { useFavorites } from '@/lib/favorites';
import { useToast } from '@/components/Toast';
import { TurfCard } from '@/components/TurfCard';

type Tab = 'upcoming' | 'past' | 'cancelled' | 'favorites' | 'profile';

export function DashboardPage() {
  const { route } = useRouter();
  const { showToast } = useToast();
  const { favorites, isFavorite } = useFavorites();

  const queryTab = route.path.split('?')[1] || '';
  const tabParam = new URLSearchParams(queryTab).get('tab');
  const [activeTab, setActiveTab] = useState<Tab>(tabParam === 'favorites' ? 'favorites' : 'upcoming');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [turfCache, setTurfCache] = useState<Record<string, TurfWithRelations>>({});
  const [loading, setLoading] = useState(true);
  const [favTurfs, setFavTurfs] = useState<TurfWithRelations[]>([]);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [b, allTurfs] = await Promise.all([
          fetchAllBookings(),
          fetchTurfs({ city: 'Nanded' }),
        ]);
        setBookings(b);
        const cache: Record<string, TurfWithRelations> = {};
        for (const booking of b) {
          if (!cache[booking.turf_id]) {
            const turf = allTurfs.find((t) => t.id === booking.turf_id);
            if (turf) cache[booking.turf_id] = turf;
          }
        }
        setTurfCache(cache);

        // Load favorite turfs
        const favTurfData = allTurfs.filter((t) => favorites.includes(t.id));
        setFavTurfs(favTurfData);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [favorites]);

  const today = new Date().toISOString().split('T')[0];

  const upcoming = bookings.filter(
    (b) => b.status === 'confirmed' && b.slot_date >= today
  );
  const past = bookings.filter(
    (b) => b.status === 'confirmed' && b.slot_date < today
  );
  const cancelled = bookings.filter((b) => b.status === 'cancelled');

  const handleCancel = async (bookingId: string) => {
    setCancelingId(bookingId);
    try {
      await cancelBooking(bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b))
      );
      showToast('Booking cancelled successfully', 'success');
    } catch (err) {
      console.error('Cancel failed:', err);
      showToast('Failed to cancel booking', 'error');
    } finally {
      setCancelingId(null);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Calendar; count: number }[] = [
    { id: 'upcoming', label: 'Upcoming', icon: Calendar, count: upcoming.length },
    { id: 'past', label: 'Past', icon: Clock, count: past.length },
    { id: 'cancelled', label: 'Cancelled', icon: X, count: cancelled.length },
    { id: 'favorites', label: 'Favorites', icon: Heart, count: favTurfs.length },
    { id: 'profile', label: 'Profile', icon: User, count: 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900">My Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your bookings, favorites, and profile</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Calendar} label="Total Bookings" value={bookings.length} color="emerald" />
          <StatCard icon={Trophy} label="Games Played" value={past.length} color="blue" />
          <StatCard icon={Heart} label="Favorites" value={favTurfs.length} color="red" />
          <StatCard icon={Target} label="Total Spent" value={formatINR(bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.final_amount, 0))} color="amber" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto slot-scroll border-b border-slate-200 mb-6 -mx-1 px-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                    activeTab === tab.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
          </div>
        ) : activeTab === 'profile' ? (
          <ProfileTab />
        ) : activeTab === 'favorites' ? (
          <FavoritesTab favTurfs={favTurfs} />
        ) : (
          <BookingsTab
            bookings={activeTab === 'upcoming' ? upcoming : activeTab === 'past' ? past : cancelled}
            turfCache={turfCache}
            onCancel={handleCancel}
            cancelingId={cancelingId}
            canCancel={activeTab === 'upcoming'}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Calendar; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-400 to-teal-600 shadow-emerald-500/20',
    blue: 'from-blue-400 to-indigo-600 shadow-blue-500/20',
    red: 'from-red-400 to-rose-600 shadow-red-500/20',
    amber: 'from-amber-400 to-orange-600 shadow-amber-500/20',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colors[color]} shadow-lg mb-3`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function BookingsTab({
  bookings,
  turfCache,
  onCancel,
  cancelingId,
  canCancel,
}: {
  bookings: Booking[];
  turfCache: Record<string, TurfWithRelations>;
  onCancel: (id: string) => void;
  cancelingId: string | null;
  canCancel: boolean;
}) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
          <Calendar className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No bookings here</h3>
        <p className="text-sm text-slate-500 mt-1">Start exploring turfs and make your first booking</p>
        <button
          onClick={() => navigateTo('/explore')}
          className="mt-4 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
        >
          Explore Turfs
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const turf = turfCache[booking.turf_id];
        return (
          <BookingCard
            key={booking.id}
            booking={booking}
            turf={turf}
            onCancel={onCancel}
            cancelingId={cancelingId}
            canCancel={canCancel}
          />
        );
      })}
    </div>
  );
}

function BookingCard({
  booking,
  turf,
  onCancel,
  cancelingId,
  canCancel,
}: {
  booking: Booking;
  turf?: TurfWithRelations;
  onCancel: (id: string) => void;
  cancelingId: string | null;
  canCancel: boolean;
}) {
  const isCancelled = booking.status === 'cancelled';
  const statusColors: Record<string, string> = {
    confirmed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-slate-100 text-slate-600',
    pending: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all ${isCancelled ? 'opacity-60' : ''}`}>
      <div className="flex flex-col sm:flex-row">
        {turf && (
          <img src={turf.image_urls[0]} alt={turf.name} className="h-40 sm:h-auto sm:w-40 object-cover" />
        )}
        <div className="p-5 flex-1">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-bold text-slate-900">{turf?.name || 'Turf'}</h3>
              {turf && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" /> {turf.area}, {turf.city}
                </p>
              )}
            </div>
            <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${statusColors[booking.status]}`}>
              {booking.status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <p className="text-[10px] uppercase text-slate-400 font-medium mb-0.5">Date</p>
              <p className="text-xs font-semibold text-slate-700">{formatDateLong(booking.slot_date)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400 font-medium mb-0.5">Time</p>
              <p className="text-xs font-semibold text-slate-700">
                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400 font-medium mb-0.5">Booking ID</p>
              <p className="text-xs font-bold text-emerald-600 tracking-wide">{booking.booking_code}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              <span className="text-xs text-slate-400">Amount Paid</span>
              <span className="text-sm font-black text-slate-900 ml-2">{formatINR(booking.final_amount)}</span>
            </div>
            <div className="flex items-center gap-2">
              {turf && (
                <a
                  href={`https://www.google.com/maps?q=${turf.lat},${turf.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Navigation className="h-3.5 w-3.5" /> Directions
                </a>
              )}
              {canCancel && !isCancelled && (
                <button
                  onClick={() => onCancel(booking.id)}
                  disabled={cancelingId === booking.id}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {cancelingId === booking.id ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FavoritesTab({ favTurfs }: { favTurfs: TurfWithRelations[] }) {
  if (favTurfs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
          <Heart className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No favorites yet</h3>
        <p className="text-sm text-slate-500 mt-1">Tap the heart icon on any turf to save it here</p>
        <button
          onClick={() => navigateTo('/explore')}
          className="mt-4 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
        >
          Explore Turfs
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {favTurfs.map((turf) => (
        <TurfCard key={turf.id} turf={turf} />
      ))}
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white text-2xl font-black">
            G
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Guest User</h3>
            <p className="text-sm text-slate-500">Demo account</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Full Name</label>
            <input
              type="text"
              defaultValue="Guest User"
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Email</label>
            <input
              type="email"
              placeholder="Not provided"
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Phone</label>
            <input
              type="tel"
              placeholder="Not provided"
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-700">
          Account features (sign-in, profile editing, loyalty points) will be available in a future phase.
        </div>
      </div>

      {/* Gamification preview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          Achievements
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Trophy, label: 'First Booking', unlocked: true, color: 'amber' },
            { icon: Target, label: '5 Games', unlocked: false, color: 'emerald' },
            { icon: TrendingUp, label: 'Streak: 3', unlocked: false, color: 'blue' },
          ].map((badge) => {
            const Icon = badge.icon;
            return (
              <div className={`flex flex-col items-center text-center p-4 rounded-xl ${badge.unlocked ? 'bg-slate-50' : 'bg-slate-50/50 opacity-40'}`}>
                <Icon className={`h-8 w-8 mb-2 ${badge.unlocked ? 'text-amber-500' : 'text-slate-400'}`} />
                <span className="text-xs font-semibold text-slate-700">{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications preview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-emerald-500" />
          Notifications
        </h3>
        <div className="space-y-3">
          <NotificationItem
            icon={Calendar}
            text="You have no upcoming bookings. Book a turf now!"
            time="Just now"
          />
          <NotificationItem
            icon={Ticket}
            text="Use code TURFX20 for 20% off your first booking"
            time="2 days ago"
          />
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ icon: Icon, text, time }: { icon: typeof Bell; text: string; time: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 shrink-0">
        <Icon className="h-4 w-4 text-emerald-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-slate-700">{text}</p>
        <p className="text-xs text-slate-400 mt-0.5">{time}</p>
      </div>
    </div>
  );
}
