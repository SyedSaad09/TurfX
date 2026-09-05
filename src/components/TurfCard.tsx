import { Star, MapPin, Heart, ArrowRight, Clock, Zap } from 'lucide-react';
import type { TurfWithRelations } from '@/types';
import { formatINR } from '@/lib/utils';
import { navigateTo } from '@/lib/router';
import { useFavorites } from '@/lib/favorites';

interface TurfCardProps {
  turf: TurfWithRelations;
  distance?: number;
  variant?: 'default' | 'compact';
}

export function TurfCard({ turf, distance, variant = 'default' }: TurfCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(turf.id);
  const primarySport = turf.sports[0];
  const heroImage = turf.image_urls[0];

  if (variant === 'compact') {
    return (
      <button
        onClick={() => navigateTo(`/turf/${turf.slug}`)}
        className="group flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition-all hover:shadow-lg hover:border-slate-300 w-full"
      >
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
          <img
            src={heroImage}
            alt={turf.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-110"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-900 truncate">{turf.name}</h4>
            <div className="flex items-center gap-0.5 shrink-0">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-slate-700">{turf.rating}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">{turf.area}</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs font-bold text-emerald-600">
              {formatINR(turf.price_per_hour)}/hr
            </span>
            {primarySport && (
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                {primarySport.name}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={heroImage}
          alt={turf.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {turf.is_verified && (
            <span className="rounded-full bg-emerald-500/95 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
              Verified
            </span>
          )}
          {turf.is_indoor && (
            <span className="rounded-full bg-blue-500/95 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
              Indoor
            </span>
          )}
          {turf.has_floodlights && (
            <span className="rounded-full bg-amber-500/95 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg flex items-center gap-1">
              <Zap className="h-2.5 w-2.5" /> Floodlit
            </span>
          )}
        </div>

        {/* Favorite */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(turf.id);
          }}
          className={`absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition-all ${
            fav
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
              : 'bg-white/20 text-white hover:bg-white/40'
          }`}
        >
          <Heart className={`h-4 w-4 ${fav ? 'fill-current' : ''}`} />
        </button>

        {/* Rating overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/40 backdrop-blur px-2.5 py-1.5">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-bold text-white">{turf.rating}</span>
          <span className="text-[10px] text-white/70">({turf.review_count})</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-slate-900 leading-snug group-hover:text-emerald-600 transition-colors">
            {turf.name}
          </h3>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
          <MapPin className="h-3.5 w-3.5" />
          <span>{turf.area}, {turf.city}</span>
          {distance !== undefined && (
            <>
              <span className="text-slate-300">.</span>
              <span className="font-medium text-slate-600">{distance.toFixed(1)} km</span>
            </>
          )}
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
          {turf.short_description}
        </p>

        {/* Sports tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {turf.sports.slice(0, 3).map((sport) => (
            <span
              key={sport.slug}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
            >
              {sport.name}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <span className="text-lg font-black text-slate-900">
              {formatINR(turf.price_per_hour)}
            </span>
            <span className="text-xs text-slate-400">/hour</span>
          </div>
          <button
            onClick={() => navigateTo(`/turf/${turf.slug}`)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-emerald-600 group-hover:gap-2.5"
          >
            View Turf
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TurfCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-52 animate-pulse bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
        <div className="flex gap-1.5">
          <div className="h-5 w-16 animate-pulse rounded bg-slate-200" />
          <div className="h-5 w-16 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}
