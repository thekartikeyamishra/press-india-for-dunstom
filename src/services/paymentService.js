// File: src/services/paymentService.js
// ============================================
// PAYMENT SERVICE — Razorpay (Tier-based, robust Windows flow)
// - Primary: server-created Razorpay Payment Link (prefilled amount)
// - Fallback: open your Razorpay.me page WITHOUT params (avoids error screen)
// - No UPI / QR / manual flow
// - Safe popup with same-tab fallback
// - Firestore status updates preserved
// ============================================

import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

class PaymentService {
  constructor() {
    // Required: your Razorpay Payment Page
    this.razorpayMeUrl =
      (import.meta?.env?.VITE_RAZORPAY_ME_URL) ||
      'https://razorpay.me/@dunstomcorporationprivatelimi';

    // Optional: backend endpoint that creates Razorpay Payment Links
    // Returns JSON: { url: "https://rzp.io/..." }
    // See README note below for the tiny server snippet.
    this.paymentLinkApi = import.meta?.env?.VITE_PAYMENT_LINK_API || '';

    // Optional logs
    this.testMode = (import.meta?.env?.VITE_TEST_MODE) === 'true';
  }

  // ---------- Tiers (INR) ----------
  getAmountForTier(tier) {
    const t = String(tier || '').trim().toLowerCase();
    switch (t) {
      case 'top priority':
      case 'top':
        return 100000;
      case 'medium priority':
      case 'medium':
        return 50000;
      case 'micro priority':
      case 'micro':
      default:
        return 100;
    }
  }

  normalizeAmount(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return 100;
    return Math.max(1, Math.round(n)); // INR integer
  }

  // ---------- Server-created Payment Link (preferred) ----------
  async createServerPaymentLink({ amount, grievanceId, title }) {
    if (!this.paymentLinkApi) return null;

    try {
      const res = await fetch(this.paymentLinkApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          // Send rupees; have your backend convert to paise
          amount: this.normalizeAmount(amount),
          currency: 'INR',
          reference_id: grievanceId,
          title: title || 'Payment',
          notes: grievanceId ? { grievanceId } : undefined
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.url && typeof data.url === 'string') return data.url;
      throw new Error('Invalid Payment Link API response');
    } catch (err) {
      if (this.testMode) console.warn('Payment Link API failed:', err);
      return null;
    }
  }

  // ---------- Main flow ----------
  /**
   * grievanceData may include:
   *  - tier: "Top Priority" | "Medium Priority" | "Micro Priority"
   *  - paymentAmount (optional override)
   *  - title (optional)
   */
  async initiatePayment(grievanceId, grievanceData) {
    try {
      if (!isBrowser) throw new Error('Payment must run in the browser.');
      const user = auth.currentUser;
      if (!user) throw new Error('Please login to continue.');

      const computed = this.getAmountForTier(grievanceData?.tier);
      const amount = this.normalizeAmount(grievanceData?.paymentAmount ?? computed);

      // Mark initiation
      await updateDoc(doc(db, 'grievances', grievanceId), {
        paymentStatus: 'pending',
        paymentAmount: amount,
        paymentInitiatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 1) Best: server-created Payment Link with prefilled amount
      let link =
        (await this.createServerPaymentLink({
          amount,
          grievanceId,
          title: grievanceData?.title
        })) ||
        // 2) Fallback: open plain Razorpay.me page (NO params to avoid error page)
        String(this.razorpayMeUrl).trim();

      await this.openRazorpay(link, grievanceId);

      return { success: true, amount, link };
    } catch (err) {
      console.error('❌ Payment initiation error:', err);
      toast.error(err.message || 'Failed to initiate payment');
      throw err;
    }
  }

  async openRazorpay(link, grievanceId) {
    try {
      const width = 760;
      const height = 900;
      const left = Math.max(0, (window.innerWidth - width) / 2);
      const top = Math.max(0, (window.innerHeight - height) / 2);

      // Windows-friendly: popup then same-tab fallback
      const win = window.open(
        link,
        'razorpay_payment',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=yes,noopener,noreferrer`
      );
      if (!win) window.location.href = link;

      await updateDoc(doc(db, 'grievances', grievanceId), {
        paymentStatus: 'processing',
        paymentMethod: this.paymentLinkApi ? 'razorpay_payment_link' : 'razorpay_payment_page',
        paymentLink: link,
        paymentStartedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success('Complete the payment in the Razorpay window 💳', { duration: 5000 });
    } catch (err) {
      console.error('❌ Razorpay open error:', err);
      toast.error('Could not open Razorpay checkout');
    }
  }

  // Allow retry from Profile page
  async retryPayment(grievanceId) {
    try {
      const snap = await getDoc(doc(db, 'grievances', grievanceId));
      if (!snap.exists()) throw new Error('Grievance not found');
      const data = snap.data();
      if (data.paymentStatus === 'completed') {
        toast('Payment already completed ✅');
        return;
      }
      const tier = data.tier || 'Micro Priority';
      const amount = data.paymentAmount || this.getAmountForTier(tier);
      return await this.initiatePayment(grievanceId, { tier, paymentAmount: amount });
    } catch (err) {
      console.error('❌ Retry payment error:', err);
      toast.error(err.message || 'Failed to retry payment');
      throw err;
    }
  }

  // UI helpers
  getPaymentStatusBadge(status) {
    const map = {
      pending: { label: 'Pending', color: '#f59e0b' },
      processing: { label: 'Processing', color: '#3b82f6' },
      completed: { label: 'Completed', color: '#10b981' },
      failed: { label: 'Failed', color: '#ef4444' },
      cancelled: { label: 'Cancelled', color: '#6b7280' },
    };
    return map[status] || map.pending;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(this.normalizeAmount(amount));
  }
}

const paymentService = new PaymentService();
export default paymentService;
