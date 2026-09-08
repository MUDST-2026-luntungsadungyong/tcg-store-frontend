import { Link, useNavigate } from 'react-router-dom';
import { Package, Trash2, Minus, Plus } from 'lucide-react';
import { useCartStore } from '@/features/cart/model/useCartStore';
import { useToastStore } from '@/shared/model/useToastStore';

export function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, getTotalItems, getSubtotal, getTotal } = useCartStore();
  const addToast = useToastStore(state => state.addToast);

  const totalItems = getTotalItems();
  const subtotal = getSubtotal();
  const shipping: number = 0;
  const total = getTotal();

  const handleCheckout = () => {
    if (items.length === 0) return;
    addToast({
      message: 'Proceeding to checkout...',
      type: 'info',
    });
    navigate('/checkout');
  };

  const handleRemove = (productId: string, productName: string) => {
    removeItem(productId);
    addToast({
      message: `Removed ${productName} from cart`,
      type: 'info',
    });
  };

  return (
    <div className="w-full bg-[#1B2336] min-h-[calc(100vh-64px)] text-white font-['IBM_Plex_Sans_Thai',sans-serif] px-4 md:px-8 py-10">
      <div className="max-w-[1440px] mx-auto">
        
        {/* Page Title */}
        <h1 className="text-4xl md:text-[72px] font-bold text-[#BCC6E2] uppercase tracking-tight leading-tight mb-8">
          YOUR CART
        </h1>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Items in Cart */}
          <div className="lg:col-span-8 bg-[#192338] border border-[rgba(143,179,226,0.20)] rounded-[16px] p-6 flex flex-col gap-4">
            
            {/* Header */}
            <div className="flex items-center gap-3 pb-2">
              <div className="w-5 h-5 flex items-center justify-center text-[#A5C9F9]">
                <Package size={20} />
              </div>
              <h2 className="text-[#A5C9F9] text-2xl font-bold">
                Items in Cart
              </h2>
            </div>

            {/* Empty State */}
            {items.length === 0 ? (
              <div className="w-full py-16 flex flex-col items-center justify-center text-center gap-3">
                <h3 className="text-[#EDF0F7] text-xl font-semibold font-['Inter',sans-serif]">
                  Your cart is empty
                </h3>
                <p className="text-[#A6ADC7] text-sm font-normal font-['Inter',sans-serif] mb-2">
                  Browse cards and add something you like.
                </p>
                <Link
                  to="/browse"
                  className="bg-[#D9DEF2] hover:bg-white text-[#1A1A26] px-6 py-2.5 rounded-lg text-sm font-semibold font-['Inter',sans-serif] transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              /* Populated Items List */
              <div className="flex flex-col gap-4">
                {items.map(({ product, quantity }) => (
                  <div 
                    key={product.id}
                    className="bg-[rgba(11,20,31,0.50)] border border-[rgba(165,201,249,0.10)] rounded-[16px] p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-colors"
                  >
                    {/* Card Thumbnail */}
                    <div className="w-24 h-24 bg-[#2D3541] border border-[rgba(143,179,226,0.20)] shadow-[0px_0px_20px_rgba(143,179,226,0.20)] rounded-lg p-2 flex items-center justify-center shrink-0">
                      <img 
                        src={product.image || '/assets/expensive_card_1.png'} 
                        alt={product.name}
                        className="w-full h-full object-contain filter drop-shadow-sm" 
                      />
                    </div>

                    {/* Card Information */}
                    <div className="flex-1 flex flex-col gap-1 w-full overflow-hidden">
                      <Link 
                        to={`/products/${product.id}`}
                        className="text-[#DBE3F3] text-base font-bold line-clamp-1 hover:text-brand-blue transition-colors"
                      >
                        {product.name}
                      </Link>

                      <div className="text-[#A5C9F9] text-xs font-semibold uppercase tracking-widest">
                        IN STOCK
                      </div>

                      <div className="text-[#C6C6CD] text-xs">
                        Qty: {quantity}
                      </div>

                      {/* Stepper + Price Row */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[rgba(165,201,249,0.05)] w-full">
                        
                        {/* Stepper */}
                        <div className="flex items-center bg-[#0B141F] border border-[rgba(69,71,77,0.40)] rounded overflow-hidden h-[32px] select-none">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            disabled={quantity <= 1}
                            className="px-2.5 h-full flex items-center justify-center text-[#C6C6CD] hover:text-white disabled:opacity-30 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          
                          <div className="w-10 h-full flex items-center justify-center bg-[rgba(45,53,65,0.30)] text-[#DBE3F3] text-sm font-bold border-x border-[rgba(69,71,77,0.30)]">
                            {quantity}
                          </div>

                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            disabled={quantity >= product.stock}
                            className="px-2.5 h-full flex items-center justify-center text-[#C6C6CD] hover:text-white disabled:opacity-30 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Line Item Total Price */}
                        <div className="text-[#DBE3F3] text-base font-bold">
                          ฿{(product.price * quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Remove Trash Button */}
                    <button
                      onClick={() => handleRemove(product.id, product.name)}
                      className="p-2 text-[#DB3333] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 self-end sm:self-center"
                      title="Remove from cart"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-4 bg-[#192338] border border-[rgba(143,179,226,0.20)] rounded-[16px] p-6 flex flex-col gap-4">
            
            {/* Header */}
            <div className="pb-2 border-b border-[rgba(165,201,249,0.20)]">
              <h2 className="text-[#A5C9F9] text-2xl font-bold">
                Order Summary
              </h2>
            </div>

            {/* Subtotal */}
            <div className="flex items-center justify-between text-base text-[#C6C6CD]">
              <span>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
              <span>฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {/* Shipping */}
            <div className="flex items-center justify-between text-base text-[#C6C6CD]">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : `฿${shipping.toLocaleString()}`}</span>
            </div>

            {/* Estimated Tax */}
            <div className="flex items-center justify-between text-base text-[#C6C6CD]">
              <span>Estimated Tax</span>
              <span>฿0.00</span>
            </div>

            {/* Total Row */}
            <div className="pt-4 border-t border-[rgba(165,201,249,0.20)] flex items-center justify-between">
              <span className="text-[#DBE3F3] text-base font-bold">Total</span>
              <span className="text-[#A5C9F9] text-xl font-bold shadow-[0px_0px_20px_rgba(143,179,226,0.20)]">
                ฿{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Action Button */}
            <div className="pt-2 flex flex-col items-center gap-2">
              <button
                onClick={handleCheckout}
                disabled={items.length === 0}
                className="w-full bg-[#DAE1F1] hover:bg-white text-black font-bold text-lg md:text-xl py-3 px-6 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                Proceed to Checkout
              </button>
              <span className="text-[#C6C6CD] text-sm font-medium">
                Buy
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
