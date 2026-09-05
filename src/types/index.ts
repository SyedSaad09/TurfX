export interface Sport {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface Facility {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface Turf {
  id: string;
  name: string;
  slug: string;
  city: string;
  area: string;
  address: string;
  lat: number | null;
  lng: number | null;
  short_description: string;
  description: string;
  rating: number;
  review_count: number;
  price_per_hour: number;
  turf_type: string;
  is_indoor: boolean;
  is_outdoor: boolean;
  has_floodlights: boolean;
  open_time: string;
  close_time: string;
  size: string;
  surface: string;
  rules: string[];
  image_urls: string[];
  is_verified: boolean;
  is_active: boolean;
  popularity: number;
}

export interface Slot {
  id: string;
  turf_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'blocked' | 'unavailable';
  price: number;
}

export interface Review {
  id: string;
  turf_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_code: string;
  turf_id: string;
  slot_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  slot_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  base_amount: number;
  platform_fee: number;
  discount: number;
  final_amount: number;
  status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
  payment_method: string;
  coupon_code: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percent' | 'flat';
  discount_value: number;
  max_discount: number;
  min_order: number;
  is_active: boolean;
  valid_until: string | null;
}

export interface TurfWithRelations extends Turf {
  sports: Sport[];
  facilities: Facility[];
}

export type SlotStatus = Slot['status'];
