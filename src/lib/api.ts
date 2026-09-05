import { supabase } from './supabase';
import type { TurfWithRelations, Slot, Review, Coupon, Booking, Sport, Facility } from '@/types';

export async function fetchSports(): Promise<Sport[]> {
  const { data, error } = await supabase.from('sports').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function fetchFacilities(): Promise<Facility[]> {
  const { data, error } = await supabase.from('facilities').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function fetchTurfs(filters?: {
  city?: string;
  isIndoor?: boolean;
  minRating?: number;
  maxPrice?: number;
  search?: string;
  sportSlug?: string;
}): Promise<TurfWithRelations[]> {
  let query = supabase
    .from('turfs')
    .select('*')
    .eq('is_active', true)
    .order('popularity', { ascending: false });

  if (filters?.city) query = query.eq('city', filters.city);
  if (filters?.isIndoor !== undefined) query = query.eq('is_indoor', filters.isIndoor);
  if (filters?.minRating) query = query.gte('rating', filters.minRating);
  if (filters?.maxPrice) query = query.lte('price_per_hour', filters.maxPrice);
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,area.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Fetch relations for all turfs
  const turfIds = data.map((t) => t.id);
  const [sportsData, facData, allSports, allFacilities] = await Promise.all([
    supabase.from('turf_sports').select('turf_id, sport_id').in('turf_id', turfIds),
    supabase.from('turf_facilities').select('turf_id, facility_id').in('turf_id', turfIds),
    supabase.from('sports').select('*'),
    supabase.from('facilities').select('*'),
  ]);

  const sportMap = new Map<string, Sport>(
    (allSports.data || []).map((s) => [s.id, s])
  );
  const facMap = new Map<string, Facility>(
    (allFacilities.data || []).map((f) => [f.id, f])
  );

  const sportsByTurf = new Map<string, Sport[]>();
  for (const ts of sportsData.data || []) {
    const sport = sportMap.get(ts.sport_id);
    if (sport) {
      const arr = sportsByTurf.get(ts.turf_id) || [];
      arr.push(sport);
      sportsByTurf.set(ts.turf_id, arr);
    }
  }

  const facByTurf = new Map<string, Facility[]>();
  for (const tf of facData.data || []) {
    const fac = facMap.get(tf.facility_id);
    if (fac) {
      const arr = facByTurf.get(tf.turf_id) || [];
      arr.push(fac);
      facByTurf.set(tf.turf_id, arr);
    }
  }

  let result: TurfWithRelations[] = data.map((turf) => ({
    ...turf,
    sports: sportsByTurf.get(turf.id) || [],
    facilities: facByTurf.get(turf.id) || [],
  }));

  if (filters?.sportSlug) {
    result = result.filter((t) => t.sports.some((s) => s.slug === filters.sportSlug));
  }

  return result;
}

export async function fetchTurfBySlug(slug: string): Promise<TurfWithRelations | null> {
  const { data, error } = await supabase
    .from('turfs')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [sportsData, facData] = await Promise.all([
    supabase.from('turf_sports').select('sport_id').eq('turf_id', data.id),
    supabase.from('turf_facilities').select('facility_id').eq('turf_id', data.id),
  ]);

  const sportIds = (sportsData.data || []).map((ts) => ts.sport_id);
  const facIds = (facData.data || []).map((tf) => tf.facility_id);

  const [sports, facilities] = await Promise.all([
    sportIds.length > 0
      ? supabase.from('sports').select('*').in('id', sportIds)
      : Promise.resolve({ data: [], error: null }),
    facIds.length > 0
      ? supabase.from('facilities').select('*').in('id', facIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  return {
    ...data,
    sports: sports.data || [],
    facilities: facilities.data || [],
  };
}

export async function fetchSlots(turfId: string, date: string): Promise<Slot[]> {
  const { data, error } = await supabase
    .from('slots')
    .select('*')
    .eq('turf_id', turfId)
    .eq('slot_date', date)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchReviews(turfId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('turf_id', turfId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('is_active', true)
    .order('discount_value', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createBooking(booking: Partial<Booking>): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert(booking)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSlotStatus(
  slotId: string,
  status: Slot['status']
): Promise<void> {
  const { error } = await supabase.from('slots').update({ status }).eq('id', slotId);
  if (error) throw error;
}

export async function fetchBookingByCode(code: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_code', code)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAllBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);
  if (error) throw error;
}
