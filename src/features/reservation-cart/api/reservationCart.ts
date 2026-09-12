import type { ReservationOrder } from '@/entities/reservation/model/types';
import { useReservationCartStore } from '@/features/reservation-cart/model/useReservationCartStore';
import {
  createReservationOrders,
  previewReservationOrders,
  type ReservationCheckoutPreview,
} from '@/features/reservations/api/reservationOrders';

export interface ReservationCartCheckoutResult {
  orders: ReservationOrder[];
  preview: ReservationCheckoutPreview;
}

/**
 * Creates one RESERVED order per seller and clears the cart only after the
 * adapter has completed successfully. A failed reservation leaves the cart
 * intact so the buyer can correct it or retry.
 */
export async function checkoutReservationCart(
  buyerId: string,
): Promise<ReservationCartCheckoutResult> {
  const items = useReservationCartStore.getState().items;
  const preview = previewReservationOrders(items);
  const orders = await createReservationOrders({ buyerId, items });
  useReservationCartStore.getState().clearCart();
  return { orders, preview };
}

export const reservationCartApi = {
  preview: (): ReservationCheckoutPreview =>
    previewReservationOrders(useReservationCartStore.getState().items),
  checkout: checkoutReservationCart,
};
