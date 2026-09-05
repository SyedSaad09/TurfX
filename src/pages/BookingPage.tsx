import { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Clock, MapPin, Calendar,
  CreditCard, Wallet, Building2, Smartphone, Tag, X,
  ShieldCheck, Loader2, PartyPopper, QrCode, Navigation,
  CalendarPlus, Copy, Home
} from 'lucide-react';
import { fetchTurfBySlug, fetchSlots, fetchCoupons, createBooking, updateSlotStatus } from '@/lib/api';
import type { TurfWithRelations, Slot, Coupon } from '@/types';
import { formatINR, formatTime, formatDateLong, generateBookingCode } from '@/lib/utils';
import { navigateTo, useRouter } from '@/lib/router';
import { useToast } from '@/components/Toast';

type Step = 1 | 2 | 3 | 4; // 4 = confirmation
type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet';

export function BookingPage() {
  const { route } = useRouter();
  const { showToast } = useToast();

  const params = new URLSearchParams(route.path.split('?')[1]);
  const turfSlug = params.get('turf') || '';
  const slotId = params.get('slot') || '';
  const date = params.get('date') || '';

  const [turf, setTurf] = useState<TurfWithRelations | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>(1);
  const [processing, setProcessing] = useState(false);
  const [bookingCode, setBookingCode] = useState('');

  // Form data
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponInput, setCouponInput] = useState('');

  const PLATFORM_FEE = 25;

  useEffect(() => {
    (async () => {
      try {
        const t = await fetchTurfBySlug(turfSlug);
        if (!t) {
          navigateTo('/explore');
          return;
        }
        setTurf(t);
        const slots = await fetchSlots(t.id, date);
        const s = slots.find((sl) => sl.id === slotId) || null;
        setSlot(s);
        const c = await fetchCoupons();
        setCoupons(c);
      } catch (err) {
        console.error('Failed to load booking data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [turfSlug, slotId, date]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!turf || !slot) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 flex flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 mb-4">
          <X className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Booking information not found</h2>
        <p className="text-sm text-slate-500 mt-1">The slot you selected may no longer be available.</p>
        <button onClick={() => navigateTo('/explore')} className="mt-4 text-sm font-semibold text-emerald-600">
          Back to explore
        </button>
      </div>
    );
  }

  const baseAmount = slot.price;
  const discount = appliedCoupon
    ? appliedCoupon.discount_type === 'percent'
      ? Math.min((baseAmount * appliedCoupon.discount_value) / 100, appliedCoupon.max_discount || 9999)
      : appliedCoupon.discount_value
    : 0;
  const finalAmount = Math.max(baseAmount + PLATFORM_FEE - discount, 0);

  const applyCoupon = () => {
    const found = coupons.find((c) => c.code.toUpperCase() === couponInput.toUpperCase().trim());
    if (!found) {
      showToast('Invalid coupon code', 'error');
      return;
    }
    if (baseAmount < found.min_order) {
      showToast(`Minimum order ${formatINR(found.min_order)} required`, 'error');
      return;
    }
    setAppliedCoupon(found);
    showToast(`Coupon ${found.code} applied!`, 'success');
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  const handleConfirmBooking = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      showToast('Please enter your name and phone number', 'error');
      return;
    }
    if (customerPhone.trim().length < 10) {
      showToast('Please enter a valid phone number', 'error');
      return;
    }

    setProcessing(true);
    try {
      const code = generateBookingCode();
      await createBooking({
        booking_code: code,
        turf_id: turf.id,
        slot_id: slot.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || null,
        slot_date: date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        duration_hours: 1,
        base_amount: baseAmount,
        platform_fee: PLATFORM_FEE,
        discount: discount,
        final_amount: finalAmount,
        status: 'confirmed',
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code || null,
      });
      await updateSlotStatus(slot.id, 'booked');
      setBookingCode(code);
      setStep(4);
      showToast('Booking confirmed!', 'success');
    } catch (err) {
      console.error('Booking failed:', err);
      showToast('Booking failed. Please try again.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // ===== CONFIRMATION STEP =====
  if (step === 4) {
    return <ConfirmationScreen bookingCode={bookingCode} turf={turf} slot={slot} date={date} finalAmount={finalAmount} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => (step > 1 ? setStep((step - 1) as Step) : navigateTo(`/turf/${turf.slug}`))}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {step > 1 ? 'Back to previous step' : 'Back to turf'}
        </button>

        {/* Progress bar */}
        <div className="flex items-center justify-between mb-8 max-w-md mx-auto">
          {[
            { num: 1, label: 'Slot' },
            { num: 2, label: 'Review' },
            { num: 3, label: 'Payment' },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    step >= s.num
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <span className={`text-xs mt-1.5 font-medium ${step >= s.num ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
              {idx < 2 && (
                <div className={`h-0.5 flex-1 mx-2 transition-all ${step > s.num ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ===== STEP 1: REVIEW SLOT ===== */}
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <img src={turf.image_urls[0]} alt={turf.name} className="h-48 sm:h-auto sm:w-56 object-cover" />
                <div className="p-6 flex-1">
                  <h2 className="text-xl font-black text-slate-900">{turf.name}</h2>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {turf.area}, {turf.city}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mt-5">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                        <Calendar className="h-3.5 w-3.5" /> Date
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{formatDateLong(date)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                        <Clock className="h-3.5 w-3.5" /> Time
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-sm text-slate-500">Slot Price (1 hour)</span>
                    <span className="text-lg font-black text-slate-900">{formatINR(slot.price)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Your Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">Full Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">Phone Number *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">Email (optional)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="For booking confirmation"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!customerName.trim() || !customerPhone.trim()}
              className={`w-full rounded-xl py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                customerName.trim() && customerPhone.trim()
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:scale-[1.01]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Continue to Review
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ===== STEP 2: REVIEW ===== */}
        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Booking Summary</h3>
              <div className="space-y-3">
                <Row label="Turf" value={turf.name} />
                <Row label="Location" value={`${turf.area}, ${turf.city}`} />
                <Row label="Date" value={formatDateLong(date)} />
                <Row label="Time" value={`${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`} />
                <Row label="Duration" value="1 hour" />
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Tag className="h-4 w-4 text-emerald-500" />
                Apply Coupon
              </h3>

              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-emerald-700">{appliedCoupon.code}</p>
                    <p className="text-xs text-emerald-600">{appliedCoupon.description}</p>
                  </div>
                  <button onClick={removeCoupon} className="text-emerald-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Enter coupon code"
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm uppercase outline-none focus:border-emerald-400"
                    />
                    <button
                      onClick={applyCoupon}
                      className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {coupons.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCouponInput(c.code);
                          setAppliedCoupon(c);
                          showToast(`Coupon ${c.code} applied!`, 'success');
                        }}
                        className="flex items-center justify-between w-full rounded-lg border border-dashed border-slate-200 px-3 py-2 text-left hover:border-emerald-300 transition-colors"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-900">{c.code}</span>
                          <span className="text-xs text-slate-500 ml-2">{c.description}</span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-600">
                          {c.discount_type === 'percent' ? `${c.discount_value}% off` : `${formatINR(c.discount_value)} off`}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Price breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Price Breakdown</h3>
              <div className="space-y-3">
                <Row label="Slot Price" value={formatINR(baseAmount)} />
                <Row label="Platform Fee" value={formatINR(PLATFORM_FEE)} />
                {discount > 0 && (
                  <Row label="Discount" value={`- ${formatINR(discount)}`} valueClass="text-emerald-600" />
                )}
                <div className="h-px bg-slate-100 my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">Total Payable</span>
                  <span className="text-2xl font-black text-emerald-600">{formatINR(finalAmount)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-teal-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
            >
              Proceed to Payment
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ===== STEP 3: PAYMENT ===== */}
        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'upi' as const, label: 'UPI', desc: 'GPay, PhonePe, Paytm', icon: Smartphone },
                  { id: 'card' as const, label: 'Card', desc: 'Credit / Debit', icon: CreditCard },
                  { id: 'netbanking' as const, label: 'Net Banking', desc: 'All banks', icon: Building2 },
                  { id: 'wallet' as const, label: 'Wallet', desc: 'Paytm, Amazon', icon: Wallet },
                ].map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                        paymentMethod === method.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        paymentMethod === method.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{method.label}</p>
                        <p className="text-[10px] text-slate-400">{method.desc}</p>
                      </div>
                      {paymentMethod === method.id && (
                        <Check className="h-4 w-4 text-emerald-600 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment summary */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-semibold">Secure Payment</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Slot Price</span>
                  <span>{formatINR(baseAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Platform Fee</span>
                  <span>{formatINR(PLATFORM_FEE)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>- {formatINR(discount)}</span>
                  </div>
                )}
                <div className="h-px bg-white/10 my-2" />
                <div className="flex justify-between text-base font-bold">
                  <span>Total Payable</span>
                  <span className="text-emerald-400">{formatINR(finalAmount)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={processing}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-teal-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Pay {formatINR(finalAmount)} & Confirm
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              This is a demo payment. No real transaction will occur.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold text-slate-900 ${valueClass}`}>{value}</span>
    </div>
  );
}

// ===== CONFIRMATION SCREEN =====
function ConfirmationScreen({
  bookingCode,
  turf,
  slot,
  date,
  finalAmount,
}: {
  bookingCode: string;
  turf: TurfWithRelations;
  slot: Slot;
  date: string;
  finalAmount: number;
}) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(bookingCode);
    setCopied(true);
    showToast('Booking ID copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const calendarUrl = () => {
    const startDate = new Date(`${date}T${slot.start_time}`);
    const endDate = new Date(`${date}T${slot.end_time}`);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`TurfX: ${turf.name}`)}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${encodeURIComponent(`Booking ID: ${bookingCode}`)}&location=${encodeURIComponent(turf.address)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Success animation */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mb-4 relative">
            <div className="absolute inset-0 rounded-full bg-emerald-200/50 animate-ping" />
            <PartyPopper className="h-10 w-10 text-emerald-600 relative" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Booking Confirmed!</h1>
          <p className="text-sm text-slate-500 mt-2">
            Get ready to play. Your turf is booked and waiting.
          </p>
        </div>

        {/* Booking card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80 uppercase tracking-wider">TurfX Booking ID</p>
                <button onClick={copyCode} className="flex items-center gap-2 mt-1 group">
                  <span className="text-xl font-black tracking-wider">{bookingCode}</span>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4 opacity-70 group-hover:opacity-100" />}
                </button>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <QrCode className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Turf info */}
          <div className="p-6">
            <div className="flex gap-4 mb-5">
              <img src={turf.image_urls[0]} alt={turf.name} className="h-20 w-20 rounded-xl object-cover" />
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{turf.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" /> {turf.area}, {turf.city}
                </p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Calendar className="h-3.5 w-3.5" /> Date
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatDateLong(date)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Clock className="h-3.5 w-3.5" /> Time
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                </p>
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-center justify-between py-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">Amount Paid</span>
              <span className="text-xl font-black text-emerald-600">{formatINR(finalAmount)}</span>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <a
                href={`https://www.google.com/maps?q=${turf.lat},${turf.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
              >
                <Navigation className="h-4 w-4 text-emerald-500" />
                Get Directions
              </a>
              <a
                href={calendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
              >
                <CalendarPlus className="h-4 w-4 text-emerald-500" />
                Add to Calendar
              </a>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={() => navigateTo('/dashboard')}
            className="rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
          >
            View My Bookings
          </button>
          <button
            onClick={() => navigateTo('/')}
            className="rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
