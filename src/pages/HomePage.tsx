import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronsDown } from 'lucide-react';
import { productsApi } from '@/api/products';
import type { Product } from '@/types';

import { Skeleton } from '@/components/common/Skeleton';

// Horizontal card for "The Pokémon Cards Collection"
function HorizontalProductCard({ product }: { product: Product }) {
  return (
    <Link 
      to={`/products/${product.id}`}
      className="flex bg-white rounded-[16px] overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 group h-[120px]"
    >
      <div className="w-[100px] h-full bg-[#F8F9FA] p-3 flex items-center justify-center shrink-0">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 flex flex-col justify-center flex-1">
        <h3 className="text-[12px] font-semibold text-[#374151] line-clamp-2 leading-snug mb-1">
          {product.name}
        </h3>
        <div className="text-[10px] text-gray-500 mb-2">Graded PSA 10</div>
        <div className="text-[18px] font-bold text-[#111827] mb-1">
          ฿{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center">
          <span className="text-[10px] font-bold text-[#16A34A]">
            + $5.00 (+2.50%)
          </span>
        </div>
      </div>
    </Link>
  );
}

// Auto-sliding Infinite Seamless Loop Banner Carousel (3s interval)
function ExpensiveCardsCarousel() {
  const SLIDES = [
    { id: 1, img: '/assets/expensive_card_banner_132_306.png' },
    { id: 2, img: '/assets/expensive_card_banner_132_306.png' },
    { id: 3, img: '/assets/expensive_card_banner_132_306.png' },
  ];

  // Extended slides with clones at boundaries for infinite loop: [Clone 3, 1, 2, 3, Clone 1]
  const extendedSlides = [SLIDES[SLIDES.length - 1], ...SLIDES, SLIDES[0]];
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Auto-slide forward every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const handleTransitionEnd = () => {
    // When reached Clone 1 at the end, snap silently back to real Slide 1
    if (currentIndex >= extendedSlides.length - 1) {
      setIsTransitioning(false);
      setCurrentIndex(1);
    }
    // When reached Clone 3 at the start, snap silently to real Slide 3
    else if (currentIndex <= 0) {
      setIsTransitioning(false);
      setCurrentIndex(SLIDES.length);
    }
  };

  // Active dot index (0, 1, 2)
  const activeDotIndex = (currentIndex - 1 + SLIDES.length) % SLIDES.length;

  const handleDotClick = (dotIdx: number) => {
    setIsTransitioning(true);
    setCurrentIndex(dotIdx + 1);
  };

  return (
    <section className="w-full flex flex-col items-center overflow-hidden bg-[#151B2B]">
      <div className="w-full max-w-[1440px] mx-auto">
        <div className="relative w-full overflow-hidden">
          {/* Slides Container */}
          <div 
            className={`flex w-full ${isTransitioning ? 'transition-transform duration-700 ease-in-out' : 'transition-none'}`}
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            onTransitionEnd={handleTransitionEnd}
          >
            {extendedSlides.map((slide, idx) => (
              <div key={`${slide.id}-${idx}`} className="w-full flex-shrink-0 flex items-center justify-center select-none py-12 md:py-20 px-8">
                <div className="w-full max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
                  {/* Left: Card Image */}
                  <div className="flex-1 flex items-center justify-center relative h-[350px] md:h-[500px]">
                    <img 
                      src={slide.img} 
                      alt="Pokémon Card" 
                      className="max-h-full max-w-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20"
                    />
                  </div>

                  {/* Right: Text */}
                  <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left z-10">
                    <h2 className="text-[#FDE047] text-4xl md:text-5xl lg:text-[64px] font-black leading-[1.1] tracking-wide drop-shadow-lg">
                      The 10 Most<br />Expensive<br />Pokémon Cards<br />of 2025
                    </h2>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Pagination - Exact Figma match (hollow/solid circles without background) */}
          <div className="absolute bottom-6 md:bottom-12 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-10">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDotClick(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer w-[14px] h-[14px] ${
                  activeDotIndex === idx 
                    ? 'bg-[#CBD5E1] shadow-sm' 
                    : 'bg-transparent border-[1.5px] border-[#64748B] hover:border-[#94A3B8]'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const [trending, setTrending] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const data = await productsApi.getProducts();
        setTrending(data);
      } catch (error) {
        console.error('Failed to fetch trending products', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTrending();
  }, []);

  const scrollToContent = () => {
    document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col pb-20 w-full overflow-hidden">
      
      {/* 1. Hero Section — matched to Figma node 147:144 group (image30/MYTHIC/logo/MARKET/Start!/chevron) */}
      <section className="relative w-full bg-bg-base overflow-hidden h-[calc(100dvh-64px)] min-h-[560px]">
        <img
          src="/assets/hero_castle_bg.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
        />

        {/* MYTHIC (upper-left, faded) */}
        <span
          className="absolute font-bold uppercase text-[rgba(255,255,255,0.3)] whitespace-nowrap select-none"
          style={{ left: '10.9%', top: '25.7%', fontSize: 'clamp(28px,8.9vw,128px)', fontFamily: "'IBM Plex Sans Thai', sans-serif" }}
          aria-hidden="true"
        >
          MYTHIC
        </span>

        {/* MARKET (lower-right, more faded) */}
        <span
          className="absolute font-bold uppercase text-[rgba(255,255,255,0.1)] whitespace-nowrap select-none"
          style={{ left: '54.9%', top: '50%', fontSize: 'clamp(28px,8.9vw,128px)', fontFamily: "'IBM Plex Sans Thai', sans-serif" }}
          aria-hidden="true"
        >
          MARKET
        </span>

        {/* Logo lockup, centered — width scales with viewport, height follows via aspect-ratio so it never distorts/crops on resize */}
        <div
          className="absolute overflow-hidden pointer-events-none"
          style={{
            left: '50%',
            top: '35%',
            width: 'clamp(180px, 36vw, 883px)',
            aspectRatio: '883 / 632',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <img
            src="/assets/mythix_logo_white_v2.png"
            alt="Mythic Market"
            className="absolute top-0 left-0 w-full h-[140%] object-cover"
          />
        </div>

        {/* Start! + scroll cue */}
        <button
          onClick={scrollToContent}
          className="absolute flex flex-col items-center gap-2 text-[#dbe3f3] hover:text-brand-gold transition-colors duration-200 cursor-pointer bg-transparent border-none p-0"
          style={{ left: '47.4%', top: '78.8%', transform: 'translateX(-50%)' }}
        >
          <span className="text-[20px] md:text-[32px] font-bold" style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>
            Start!
          </span>
          <img src="/assets/chevron_double_down.svg" alt="" aria-hidden="true" className="w-6 h-6 md:w-8 md:h-8 animate-pulse" />
        </button>
      </section>

      <div id="explore-section" className="w-full scroll-mt-20">
        {/* 2. The 10 Most Expensive Pokémon Cards of 2025 (Auto-Slide Carousel 3s) */}
        <ExpensiveCardsCarousel />

        {/* 3. What's new! */}
        <section className="py-16 bg-[#0B111A]">
          <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 mb-8">
            <h2 className="text-[32px] font-bold text-white inline-block">
              What's new!
            </h2>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-6 snap-x custom-scrollbar px-4 md:px-8 max-w-[1440px] mx-auto">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="min-w-[650px] bg-white rounded-[24px] p-6 snap-center shrink-0 flex flex-col">
                <div className="flex w-full">
                  {/* Left: Image */}
                  <div className="w-[320px] h-[200px] shrink-0 overflow-hidden rounded-xl">
                    <img 
                      src="/assets/whats_new_91_28.png" 
                      alt="What's new" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Right: Text */}
                  <div className="flex-1 flex flex-col pl-6 pt-2">
                    <h3 className="text-[28px] font-bold text-black leading-[1.2] mb-3">
                      Pokémon TCG: 30th<br />Celebration
                    </h3>
                    <p className="text-[15px] font-bold text-black leading-snug mb-2">
                      These adorable cards show the many sides of<br />the Mouse Pokémon.
                    </p>
                    <p className="text-[12px] font-bold text-black">
                      Aug 12, 2026
                    </p>
                  </div>
                </div>

                {/* Bottom: Button */}
                <div className="w-full flex justify-center mt-6">
                  <button className="bg-[#FFA3A3] text-black font-bold py-2.5 px-16 rounded-full hover:bg-[#FF8A8A] transition-colors">
                    More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. The 10 Most Expensive Cards */}
        <section className="py-16 bg-[#0B111A]">
          <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
            <h2 className="text-[32px] font-bold text-white mb-4 lg:mb-8">The 10 Most Expensive Cards</h2>
            <div className="flex gap-16 overflow-x-auto pb-12 pt-[120px] md:pt-[140px] custom-scrollbar snap-x px-4 md:px-0">
              {[
                {
                  id: 1,
                  img: '/assets/expensive_card_1.png',
                  price: '2000.00',
                  marketPrice: '199.00',
                  title: 'Trophy Pikachu - #3',
                  desc: '1998 P.M. Japanese Promo\nBronze 3rd-2nd Tournament'
                },
                {
                  id: 2,
                  img: '/assets/expensive_card_2.png',
                  price: '20.00',
                  marketPrice: '5.00',
                  title: 'Pokemon Illustrator',
                  desc: '1998 P.M. Japanese Promo\nIllustration Contest'
                },
                {
                  id: 3,
                  img: '/assets/expensive_card_3.png',
                  price: '5.00',
                  marketPrice: '199.00',
                  title: 'P.M. SM BLACK STAR',
                  desc: 'TSUNEKAZU ISHIHARA\nISHIHARA GX-PROMO'
                },
                {
                  id: 4,
                  img: '/assets/expensive_card_1.png',
                  price: '2000.00',
                  marketPrice: '199.00',
                  title: 'Trophy Pikachu - #3',
                  desc: '1998 P.M. Japanese Promo\nBronze 3rd-2nd Tournament'
                },
                {
                  id: 5,
                  img: '/assets/expensive_card_2.png',
                  price: '20.00',
                  marketPrice: '5.00',
                  title: 'Pokemon Illustrator',
                  desc: '1998 P.M. Japanese Promo\nIllustration Contest'
                },
                {
                  id: 6,
                  img: '/assets/expensive_card_3.png',
                  price: '5.00',
                  marketPrice: '199.00',
                  title: 'P.M. SM BLACK STAR',
                  desc: 'TSUNEKAZU ISHIHARA\nISHIHARA GX-PROMO'
                },
                {
                  id: 7,
                  img: '/assets/expensive_card_1.png',
                  price: '2000.00',
                  marketPrice: '199.00',
                  title: 'Trophy Pikachu - #3',
                  desc: '1998 P.M. Japanese Promo\nBronze 3rd-2nd Tournament'
                },
                {
                  id: 8,
                  img: '/assets/expensive_card_2.png',
                  price: '20.00',
                  marketPrice: '5.00',
                  title: 'Pokemon Illustrator',
                  desc: '1998 P.M. Japanese Promo\nIllustration Contest'
                }
              ].map((item) => (
                <div key={item.id} className="bg-white min-w-[200px] h-[260px] md:min-w-[240px] md:h-[315px] rounded-[24px] p-4 flex flex-col relative shrink-0 group cursor-pointer mt-4">
                  {/* Image popping out of top right, tilted, anchored to bottom to avoid text */}
                  <div className="absolute bottom-[50px] md:bottom-[65px] -right-2 md:-right-4 w-[85%] md:w-[88%] rotate-[4deg] z-10 transition-transform duration-500 group-hover:rotate-0 group-hover:-translate-y-4 drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
                    <img 
                      src={item.img} 
                      alt={item.title} 
                      className="w-full h-auto object-contain" 
                    />
                  </div>
                  
                  {/* Text Container at the bottom */}
                  <div className="mt-auto flex flex-col gap-0.5 relative z-20 bg-white/80 backdrop-blur-sm rounded-xl p-2 -mx-2">
                    <div className="flex justify-between items-end gap-2">
                      <span className="text-[16px] md:text-[18px] font-black text-[#1E293B] leading-none">
                        ฿{item.price}
                      </span>
                      <span className="text-[10px] md:text-[11px] font-bold text-[#1E293B] leading-tight text-right line-clamp-2">
                        {item.title}
                      </span>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] md:text-[10px] text-gray-500 font-medium whitespace-nowrap">
                        Market Price: <span className="text-[#16A34A] font-bold">฿{item.marketPrice}</span>
                      </span>
                      <span className="text-[8px] md:text-[9px] text-gray-500 leading-snug whitespace-pre-wrap text-right">
                        {item.desc}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. The Pokémon Cards Collection */}
        <section className="py-12">
          <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[28px] font-bold text-white">The Pokémon Cards Collection</h2>
              <Link to="/collection" className="text-gray-300 hover:text-white flex items-center gap-1 text-[15px] font-semibold transition-colors">
                Watch More <ChevronRight size={20} />
              </Link>
            </div>
            
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-8 snap-x custom-scrollbar">
              {[
                {
                  id: 1,
                  img: '/assets/expensive_card_1.png',
                  price: '2000.00',
                  marketPrice: '199.00',
                  title: 'Trophy Pikachu - #3',
                  desc: '1998 P.M. Japanese Promo\n\nBronze 3rd-2nd Tournament',
                  inStock: true,
                },
                {
                  id: 2,
                  img: '/assets/expensive_card_2.png',
                  price: '20.00',
                  marketPrice: '5.00',
                  title: 'Pokemon Illustrator',
                  desc: '1998 P.M. Japanese\n\nIllustration Contest',
                  inStock: true,
                },
                {
                  id: 3,
                  img: '/assets/expensive_card_3.png',
                  price: '5.00',
                  marketPrice: '100.00',
                  title: 'P.M. SM BLACK STAR',
                  desc: 'TSUNEKAZU ISHIHARA\n\nISHEHARA GX-PROMO',
                  inStock: true,
                },
                {
                  id: 4,
                  img: '/assets/expensive_card_1.png',
                  price: '2000.00',
                  marketPrice: '199.00',
                  title: 'Trophy Pikachu - #3',
                  desc: '1998 P.M. Japanese Promo\n\nBronze 3rd-2nd Tournament',
                  inStock: true,
                },
                {
                  id: 5,
                  img: '/assets/expensive_card_2.png',
                  price: '20.00',
                  marketPrice: '5.00',
                  title: 'Pokemon Illustrator',
                  desc: '1998 P.M. Japanese\n\nIllustration Contest',
                  inStock: true,
                }
              ].map((item, idx) => (
                <div key={item.id + '-' + idx} className="bg-white rounded-[16px] p-4 flex gap-4 min-w-[320px] md:min-w-[400px] h-[180px] md:h-[200px] snap-start shrink-0 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-[#8B5CF6]">
                  {/* Left Image */}
                  <div className="relative w-[110px] md:w-[130px] h-full shrink-0 flex items-center justify-center rounded-lg">
                    {item.inStock && (
                      <span className="absolute top-2 right-1 bg-[#16A34A] text-white text-[9px] font-bold px-2 py-0.5 rounded z-10 tracking-wide">
                        IN STOCK
                      </span>
                    )}
                    <img 
                      src={item.img} 
                      alt={item.title} 
                      className="w-full h-full object-contain drop-shadow-md" 
                    />
                  </div>
                  
                  {/* Right Content */}
                  <div className="flex flex-col flex-1 py-1">
                    <h3 className="text-black font-bold text-[15px] md:text-[17px] leading-tight mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 text-[11px] md:text-[12px] leading-snug whitespace-pre-wrap mb-auto">
                      {item.desc}
                    </p>
                    
                    <div className="mt-2">
                      <div className="text-black font-black text-[22px] md:text-[28px] leading-none mb-1">
                        ฿{item.price}
                      </div>
                      <div className="text-gray-400 text-[11px] md:text-[12px] font-medium">
                        Market Price: <span className="text-[#16A34A] font-bold">฿{item.marketPrice}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
