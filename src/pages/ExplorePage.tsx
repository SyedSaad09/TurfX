import { useState, useEffect, useMemo } from 'react';
import {
  Search, SlidersHorizontal, X, Star, MapPin, RotateCcw,
  Zap, Home, Building2, Sun, Moon, CheckCircle2, ArrowUpDown
} from 'lucide-react';
import { fetchTurfs } from '@/lib/api';
import type { TurfWithRelations } from '@/types';
import { TurfCard, TurfCardSkeleton } from '@/components/TurfCard';
import { useRouter } from '@/lib/router';

type SortOption = 'popularity' | 'rating' | 'price-low' | 'price-high';

export function ExplorePage() {
  const { route } = useRouter();
  const [turfs, setTurfs] = useState<TurfWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [isIndoor, setIsIndoor] = useState<boolean | null>(null);
  const [hasFloodlights, setHasFloodlights] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState<SortOption>('popularity');

  // Parse query params from route
  useEffect(() => {
    const queryStr = route.path.split('?')[1] || '';
    const params = new URLSearchParams(queryStr);
    const q = params.get('q');
    const sport = params.get('sport');
    if (q) setSearch(q);
    if (sport) setSelectedSport(sport);
  }, [route.path]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchTurfs({ city: 'Nanded' });
        setTurfs(data);
      } catch (err) {
        console.error('Failed to load turfs:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredTurfs = useMemo(() => {
    let result = [...turfs];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.area.toLowerCase().includes(q) ||
          t.short_description.toLowerCase().includes(q) ||
          t.sports.some((s) => s.name.toLowerCase().includes(q))
      );
    }

    if (selectedSport) {
      result = result.filter((t) => t.sports.some((s) => s.slug === selectedSport));
    }

    if (isIndoor !== null) {
      result = result.filter((t) => t.is_indoor === isIndoor);
    }

    if (hasFloodlights) {
      result = result.filter((t) => t.has_floodlights);
    }

    if (minRating > 0) {
      result = result.filter((t) => t.rating >= minRating);
    }

    if (maxPrice < 5000) {
      result = result.filter((t) => t.price_per_hour <= maxPrice);
    }

    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-low':
        result.sort((a, b) => a.price_per_hour - b.price_per_hour);
        break;
      case 'price-high':
        result.sort((a, b) => b.price_per_hour - a.price_per_hour);
        break;
      default:
        result.sort((a, b) => b.popularity - a.popularity);
    }

    return result;
  }, [turfs, search, selectedSport, isIndoor, hasFloodlights, minRating, maxPrice, sortBy]);

  const activeFilterCount =
    (selectedSport ? 1 : 0) +
    (isIndoor !== null ? 1 : 0) +
    (hasFloodlights ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (maxPrice < 5000 ? 1 : 0);

  const resetFilters = () => {
    setSelectedSport('');
    setIsIndoor(null);
    setHasFloodlights(false);
    setMinRating(0);
    setMaxPrice(5000);
    setSortBy('popularity');
  };

  const sportsList = [
    { slug: 'football', name: 'Football' },
    { slug: 'cricket', name: 'Cricket' },
    { slug: 'basketball', name: 'Basketball' },
    { slug: 'badminton', name: 'Badminton' },
    { slug: 'tennis', name: 'Tennis' },
    { slug: 'volleyball', name: 'Volleyball' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      {/* Search header */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search turf, sport or location..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-400 focus:bg-white"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                showFilters || activeFilterCount > 0
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filter sidebar - desktop */}
          {showFilters && (
            <aside className="hidden lg:block w-72 shrink-0">
              <FilterPanel
                sportsList={sportsList}
                selectedSport={selectedSport}
                setSelectedSport={setSelectedSport}
                isIndoor={isIndoor}
                setIsIndoor={setIsIndoor}
                hasFloodlights={hasFloodlights}
                setHasFloodlights={setHasFloodlights}
                minRating={minRating}
                setMinRating={setMinRating}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                resetFilters={resetFilters}
                activeFilterCount={activeFilterCount}
              />
            </aside>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-xl font-black text-slate-900">
                  {loading ? 'Loading...' : `${filteredTurfs.length} turfs available`}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">in Nanded, Maharashtra</p>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400"
                >
                  <option value="popularity">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {selectedSport && (
                  <FilterChip label={sportsList.find((s) => s.slug === selectedSport)?.name || selectedSport} onRemove={() => setSelectedSport('')} />
                )}
                {isIndoor !== null && (
                  <FilterChip label={isIndoor ? 'Indoor' : 'Outdoor'} onRemove={() => setIsIndoor(null)} />
                )}
                {hasFloodlights && <FilterChip label="Floodlights" onRemove={() => setHasFloodlights(false)} />}
                {minRating > 0 && <FilterChip label={`${minRating}+ Rating`} onRemove={() => setMinRating(0)} />}
                {maxPrice < 5000 && <FilterChip label={`Under Rs. ${maxPrice}`} onRemove={() => setMaxPrice(5000)} />}
                <button onClick={resetFilters} className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 px-2">
                  <RotateCcw className="h-3 w-3" /> Clear all
                </button>
              </div>
            )}

            {/* Turf grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <TurfCardSkeleton key={i} />)}
              </div>
            ) : filteredTurfs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No turfs found</h3>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or search query</p>
                <button onClick={resetFilters} className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredTurfs.map((turf) => (
                  <TurfCard key={turf.id} turf={turf} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilters(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="p-1">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <FilterPanel
              sportsList={sportsList}
              selectedSport={selectedSport}
              setSelectedSport={setSelectedSport}
              isIndoor={isIndoor}
              setIsIndoor={setIsIndoor}
              hasFloodlights={hasFloodlights}
              setHasFloodlights={setHasFloodlights}
              minRating={minRating}
              setMinRating={setMinRating}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              resetFilters={resetFilters}
              activeFilterCount={activeFilterCount}
            />
            <button
              onClick={() => setShowFilters(false)}
              className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white"
            >
              Show {filteredTurfs.length} results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700">
      {label}
      <button onClick={onRemove} className="hover:text-emerald-900">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

interface FilterPanelProps {
  sportsList: { slug: string; name: string }[];
  selectedSport: string;
  setSelectedSport: (v: string) => void;
  isIndoor: boolean | null;
  setIsIndoor: (v: boolean | null) => void;
  hasFloodlights: boolean;
  setHasFloodlights: (v: boolean) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  maxPrice: number;
  setMaxPrice: (v: number) => void;
  resetFilters: () => void;
  activeFilterCount: number;
}

function FilterPanel(props: FilterPanelProps) {
  return (
    <div className="space-y-6">
      {/* Sport */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-3">Sport</h4>
        <div className="space-y-1.5">
          {props.sportsList.map((sport) => (
            <button
              key={sport.slug}
              onClick={() => props.setSelectedSport(props.selectedSport === sport.slug ? '' : sport.slug)}
              className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm transition-all ${
                props.selectedSport === sport.slug
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
                props.selectedSport === sport.slug ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
              }`}>
                {props.selectedSport === sport.slug && <CheckCircle2 className="h-3 w-3 text-white" />}
              </div>
              {sport.name}
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-3">Venue Type</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => props.setIsIndoor(props.isIndoor === true ? null : true)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              props.isIndoor === true ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100'
            }`}
          >
            <Building2 className="h-4 w-4" /> Indoor
          </button>
          <button
            onClick={() => props.setIsIndoor(props.isIndoor === false ? null : false)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              props.isIndoor === false ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100'
            }`}
          >
            <Sun className="h-4 w-4" /> Outdoor
          </button>
        </div>
      </div>

      {/* Floodlights */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-3">Features</h4>
        <button
          onClick={() => props.setHasFloodlights(!props.hasFloodlights)}
          className={`flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
            props.hasFloodlights ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
            props.hasFloodlights ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
          }`}>
            {props.hasFloodlights && <CheckCircle2 className="h-3 w-3 text-white" />}
          </div>
          <Zap className="h-4 w-4" /> Floodlights
        </button>
      </div>

      {/* Rating */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-3">Minimum Rating</h4>
        <div className="space-y-1.5">
          {[0, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => props.setMinRating(r)}
              className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm transition-all ${
                props.minRating === r ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {r === 0 ? 'All ratings' : (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {r}+ stars
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-3">Max Price / Hour</h4>
        <input
          type="range"
          min="500"
          max="5000"
          step="100"
          value={props.maxPrice}
          onChange={(e) => props.setMaxPrice(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>Rs. 500</span>
          <span className="font-bold text-emerald-600">Up to Rs. {props.maxPrice}</span>
        </div>
      </div>

      {props.activeFilterCount > 0 && (
        <button
          onClick={props.resetFilters}
          className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600"
        >
          <RotateCcw className="h-4 w-4" /> Reset all filters
        </button>
      )}
    </div>
  );
}
