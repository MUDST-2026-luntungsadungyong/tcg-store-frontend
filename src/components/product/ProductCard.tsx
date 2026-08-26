import { Link } from 'react-router-dom';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Mock data for ticker since it's not in the Product type
  const mockTicker = {
    value: "+ $20.00",
    percentage: "(+15.00%)",
    isPositive: true
  };

  return (
    <Link 
      to={`/products/${product.id}`}
      className="flex flex-col bg-white rounded-[20px] overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 group"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full bg-[#F8F9FA] p-6 flex items-center justify-center overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Content Container */}
      <div className="p-5 flex flex-col flex-1 bg-white">
        <div className="text-[22px] font-bold text-[#111827] mb-1 font-sans">
          ฿{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        
        <h3 className="text-[13px] font-semibold text-[#374151] line-clamp-2 leading-snug mb-3 min-h-[39px]">
          {product.name}
        </h3>

        <div className="mt-auto">
          <span className="inline-flex items-center text-[11px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-1 rounded-full">
            {mockTicker.value} {mockTicker.percentage}
          </span>
        </div>
      </div>
    </Link>
  );
}
