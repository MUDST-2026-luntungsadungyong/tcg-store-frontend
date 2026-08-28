import { Link } from 'react-router-dom';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageSrc = product.image || '/assets/expensive_card_1.png';
  const marketPrice = product.marketPrice ?? (product.price * 0.9);
  const inStock = product.stock > 0;

  // Format description like the homepage (set + condition or subtitle)
  const subtitle = product.subtitle || product.set || '1998 P.M. Japanese Promo';
  const detail = product.condition || 'Bronze 3rd-2nd Tournament';

  return (
    <Link 
      to={`/products/${product.id}`}
      className={`w-full bg-white rounded-[16px] p-4 flex gap-4 h-[180px] md:h-[200px] cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-[#8B5CF6] group ${
        !inStock ? 'opacity-60' : ''
      }`}
    >
      {/* Left Image */}
      <div className="relative w-[110px] md:w-[130px] h-full shrink-0 flex items-center justify-center rounded-lg">
        {inStock ? (
          <span className="absolute top-2 right-1 bg-[#16A34A] text-white text-[9px] font-bold px-2 py-0.5 rounded z-10 tracking-wide">
            IN STOCK
          </span>
        ) : (
          <span className="absolute top-2 right-1 bg-[#DC2626] text-white text-[9px] font-bold px-2 py-0.5 rounded z-10 tracking-wide">
            OUT OF STOCK
          </span>
        )}
        <img 
          src={imageSrc} 
          alt={product.name} 
          className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300" 
        />
      </div>
      
      {/* Right Content */}
      <div className="flex flex-col flex-1 py-1 overflow-hidden">
        <h3 className="text-black font-bold text-[15px] md:text-[17px] leading-tight mb-1 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-gray-500 text-[11px] md:text-[12px] leading-tight line-clamp-1 mb-1">
          {subtitle}
        </p>
        <p className="text-gray-400 text-[11px] md:text-[12px] leading-tight line-clamp-1 mb-auto">
          {detail}
        </p>
        
        <div className="mt-2">
          <div className="text-black font-black text-[22px] md:text-[28px] leading-none mb-1 line-clamp-1">
            ฿{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-gray-400 text-[11px] md:text-[12px] font-medium whitespace-nowrap">
            Market Price: <span className="text-[#16A34A] font-bold">
              ฿{marketPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
