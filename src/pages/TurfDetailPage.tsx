import { useState, useEffect } from 'react';
import {
  Star, MapPin, Clock, Calendar, Zap, Building2, Sun, Moon,
  CheckCircle2, X, Ruler, Layers, ArrowLeft, Heart, Share2,
  Shield, Info, ChevronRight, Users, Phone, Navigation, Trophy
} from 'lucide-react';
import {
  fetchTurfBySlug, fetchSlots, fetchReviews, fetchTurfs
} from '@/lib/api';
import type { TurfWithRelations, Slot, Review } from '@/types';
import { formatINR, formatTime, getNext7Days } from '@/lib/utils';
import { navigateTo, useRouter } from '@/lib/router';
import { useFavorites } from '@/lib/favorites';
import { TurfCard } from '@/components/TurfCard';

export function TurfDetailPage() {
  const { route } = useRouter();
  const slug = route.path.split('?')[0].replace('/turf/', '');

  const [turf, setTurf] = useState<TurfWithRelations | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarTurfs, setSimilarTurfs] = useState<TurfWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedDate, setSelectedDate] = useState(getNext7Days()[0].iso);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const { isFavorite, toggleFavorite } = useFavorites();
  const days = getNext7Days();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setActiveImage(0);
      setSelectedSlot(null);
      try {
        const t = await fetchTurfBySlug(slug);
        if (!t) {
          navigateTo('/explore');
          return;
        }
        setTurf(t);
        const [r, allTurfs] = await Promise.all([
          fetchReviews(t.id),
          fetchTurfs({ city: 'Nanded' }),
        ]);
        setReviews(r);
        setSimilarTurfs(
          allTurfs
            .filter((x) => x.id !== t.id && x.sports.some((s) => t.sports.some((ts) => ts.slug === s.slug)))
            .slice(0, 3)
        );
      } catch (err) {
        console.error('Failed to load turf:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!turf) return;
    (async () => {
      try {
        const s = await fetchSlots(turf.id, selectedDate);
        setSlots(s);
        setSelectedSlot(null);
      } catch (err) {
        console.error('Failed to load slots:', err);
      }
    })();
  }, [turf, selectedDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200 mb-6" />
          <div className="h-8 w-2/3 animate-pulse rounded bg-slate-200 mb-4" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!turf) return null;

  const fav = isFavorite(turf.id);
  const availableSlots = slots.filter((s) => s.status === 'available').length;

  const handleBookNow = () => {
    if (!selectedSlot) return;
    const params = new URLSearchParams({
      turf: turf.slug,
      slot: selectedSlot.id,
      date: selectedDate,
    });
    navigateTo(`/booking?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button onClick={() => navigateTo('/')} className="hover:text-emerald-600">Home</button>
            <ChevronRight className="h-3 w-3" />
            <button onClick={() => navigateTo('/explore')} className="hover:text-emerald-600">Explore</button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-700 font-medium">{turf.name}</span>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main image */}
          <div className="lg:col-span-2 relative h-72 sm:h-96 lg:h-[420px] rounded-2xl overflow-hidden group">
            <img
              src={turf.image_urls[activeImage]}
              alt={turf.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

            {/* Top badges */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {turf.is_verified && (
                <span className="rounded-full bg-emerald-500/95 backdrop-blur px-3 py-1 text-xs font-bold text-white">
                  Verified
                </span>
              )}
              {turf.is_indoor ? (
                <span className="rounded-full bg-blue-500/95 backdrop-blur px-3 py-1 text-xs font-bold text-white flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Indoor
                </span>
              ) : (
                <span className="rounded-full bg-orange-500/95 backdrop-blur px-3 py-1 text-xs font-bold text-white flex items-center gap-1">
                  <Sun className="h-3 w-3" /> Outdoor
                </span>
              )}
              {turf.has_floodlights && (
                <span className="rounded-full bg-amber-500/95 backdrop-blur px-3 py-1 text-xs font-bold text-white flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Floodlit
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => toggleFavorite(turf.id)}
                className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur transition-all ${
                  fav ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'
                }`}
              >
                <Heart className={`h-5 w-5 ${fav ? 'fill-current' : ''}`} />
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/40 transition-all">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Thumbnail column */}
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-4">
            {turf.image_urls.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`relative h-24 lg:h-[130px] rounded-xl overflow-hidden transition-all ${
                  activeImage === idx
                    ? 'ring-2 ring-emerald-500 ring-offset-2'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`${turf.name} ${idx + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">{turf.name}</h1>
                  <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      {turf.area}, {turf.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-700">{turf.rating}</span>
                      <span className="text-slate-400">({turf.review_count} reviews)</span>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">
                    {formatINR(turf.price_per_hour)}
                  </div>
                  <div className="text-xs text-slate-400">per hour</div>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mt-4">{turf.description}</p>

              {/* Sports tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {turf.sports.map((sport) => (
                  <span
                    key={sport.slug}
                    className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700"
                  >
                    {sport.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Specifications</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SpecCard icon={Ruler} label="Size" value={turf.size || 'Standard'} />
                <SpecCard icon={Layers} label="Surface" value={turf.surface || 'Turf'} />
                <SpecCard icon={turf.is_indoor ? Building2 : Sun} label="Type" value={turf.is_indoor ? 'Indoor' : 'Outdoor'} />
                <SpecCard icon={Zap} label="Floodlights" value={turf.has_floodlights ? 'Yes' : 'No'} />
              </div>
            </div>

            {/* Facilities */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Facilities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {turf.facilities.map((fac) => (
                  <div key={fac.slug} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-4 py-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-sm text-slate-700">{fac.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                Turf Rules
              </h2>
              <ul className="space-y-3">
                {turf.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600 mt-0.5">
                      {idx + 1}
                    </span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Opening hours */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-500" />
                Opening Hours
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold">{formatTime(turf.open_time)}</span>
                </div>
                <div className="h-px flex-1 bg-slate-200" />
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Moon className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold">{formatTime(turf.close_time)}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">Open all 7 days</p>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-900">Reviews ({reviews.length})</h2>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="text-lg font-black text-slate-900">{turf.rating}</span>
                  <span className="text-sm text-slate-400">/ 5</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-slate-400">No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white text-sm font-bold">
                            {review.author_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{review.author_name}</p>
                            <p className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Booking panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Slot selection */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-1">Select a date</h3>
                <p className="text-xs text-slate-400 mb-4">Next 7 days availability</p>

                {/* Date scroller */}
                <div className="flex gap-2 overflow-x-auto slot-scroll pb-2 -mx-1 px-1">
                  {days.map((day) => (
                    <button
                      key={day.iso}
                      onClick={() => setSelectedDate(day.iso)}
                      className={`flex flex-col items-center justify-center min-w-[68px] py-3 rounded-xl border transition-all ${
                        selectedDate === day.iso
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                          : 'border-slate-200 text-slate-600 hover:border-emerald-300'
                      }`}
                    >
                      <span className="text-xs font-medium">{day.label}</span>
                      <span className="text-sm font-bold mt-0.5">{day.subLabel}</span>
                    </button>
                  ))}
                </div>

                {/* Slot grid */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-700">Available Slots</h4>
                    <span className="text-xs text-slate-400">{availableSlots} available</span>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 mb-3 text-[10px]">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="h-3 w-3 rounded bg-emerald-100 border border-emerald-300"></span> Available
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="h-3 w-3 rounded bg-emerald-500"></span> Selected
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="h-3 w-3 rounded bg-slate-100 border border-slate-200"></span> Booked
                    </span>
                  </div>

                  {slots.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No slots configured for this date</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        const isBooked = slot.status === 'booked' || slot.status === 'blocked' || slot.status === 'unavailable';
                        return (
                          <button
                            key={slot.id}
                            disabled={isBooked}
                            onClick={() => setSelectedSlot(slot)}
                            className={`rounded-lg px-2 py-2.5 text-xs font-semibold transition-all ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-105'
                                : isBooked
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:scale-105'
                            }`}
                          >
                            {formatTime(slot.start_time).replace(':00', '')}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected slot summary */}
                {selectedSlot && (
                  <div className="mt-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-4 animate-scale-in">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-emerald-700">Selected Slot</span>
                      <button onClick={() => setSelectedSlot(null)} className="text-emerald-400 hover:text-emerald-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Clock className="h-4 w-4 text-emerald-600" />
                      {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Price</span>
                      <span className="text-lg font-black text-emerald-600">{formatINR(selectedSlot.price)}</span>
                    </div>
                  </div>
                )}

                {/* Book button */}
                <button
                  onClick={handleBookNow}
                  disabled={!selectedSlot}
                  className={`mt-5 w-full rounded-xl py-3.5 text-sm font-bold transition-all ${
                    selectedSlot
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:scale-[1.02]'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {selectedSlot ? 'Proceed to Book' : 'Select a slot to continue'}
                </button>
              </div>

              {/* Location card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  Location
                </h3>
                <p className="text-sm text-slate-600 mb-3">{turf.address}</p>
                <a
                  href={`https://www.google.com/maps?q=${turf.lat},${turf.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  <Navigation className="h-4 w-4 text-emerald-500" />
                  Get Directions
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Similar turfs */}
        {similarTurfs.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-black text-slate-900 mb-6">Similar turfs you might like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {similarTurfs.map((t) => (
                <TurfCard key={t.id} turf={t} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SpecCard({ icon: Icon, label, value }: { icon: typeof Ruler; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <Icon className="h-5 w-5 text-emerald-500 mb-2" />
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}
