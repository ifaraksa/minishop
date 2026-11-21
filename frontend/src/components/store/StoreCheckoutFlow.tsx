import { useCallback, useState } from 'react';
import { useCart } from '../../context/CartContext';
import type { Order } from '../../types';
import { CartDrawer } from './CartDrawer';
import { CheckoutModal } from './CheckoutModal';
import { OrderSuccessModal } from './OrderSuccessModal';

interface StoreCheckoutFlowProps {
  onOrderCompleted?: (order: Order) => void;
}

export function StoreCheckoutFlow({ onOrderCompleted }: StoreCheckoutFlowProps) {
  const { closeCart } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const handleOpenCheckout = useCallback(() => {
    closeCart();
    setCheckoutOpen(true);
  }, [closeCart]);

  const handleOrderSuccess = useCallback(
    (order: Order) => {
      setCheckoutOpen(false);
      setCompletedOrder(order);
      onOrderCompleted?.(order);
    },
    [onOrderCompleted],
  );

  return (
    <>
      <CartDrawer onCheckout={handleOpenCheckout} />
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={handleOrderSuccess}
      />
      <OrderSuccessModal order={completedOrder} onClose={() => setCompletedOrder(null)} />
    </>
  );
}
