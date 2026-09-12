import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';
import {
  getTopCollectors,
  type CollectorRanking,
} from '@/features/collection/api/leaderboard';
import { getMostExpensiveOnSaleCards } from '@/features/discovery/lib/expensiveCards';
import type { CardListing } from '@/entities/card/model/types';



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
  const [featuredProducts, setFeaturedProducts] = useState<CardListing[]>([]);
  const [expensiveCards, setExpensiveCards] = useState<CardListing[]>([]);
  const [topCollectors, setTopCollectors] = useState<CollectorRanking[]>([]);
  const [homeError, setHomeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void listingDiscoveryApi
      .getListings({ size: 100 })
      .then((res) => {
        if (!cancelled && res.items.length > 0) {
          setFeaturedProducts(res.items.slice(0, 5));
          setExpensiveCards(getMostExpensiveOnSaleCards(res.items, 10));
        }
      })
      .catch((error) => {
        console.error('Failed to load home page listings:', error);
        if (!cancelled) {
          setHomeError('Unable to load marketplace highlights. Please try again later.');
          setFeaturedProducts([]);
          setExpensiveCards([]);
        }
      });

    void getTopCollectors(5)
      .then((data) => {
        if (!cancelled && data.length > 0) setTopCollectors(data);
      })
      .catch((error) => {
        console.error('Failed to load leaderboard:', error);
        if (!cancelled) {
          setHomeError('Unable to load leaderboard data.');
          setTopCollectors([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToContent = () => {
    document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col pb-20 w-full overflow-hidden">
      
      {/* Hero layout follows the Figma visual language; copy reflects the reservation product. */}
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

        {/* TRADE (lower-right, more faded) */}
        <span
          className="absolute font-bold uppercase text-[rgba(255,255,255,0.1)] whitespace-nowrap select-none"
          style={{ left: '54.9%', top: '50%', fontSize: 'clamp(28px,8.9vw,128px)', fontFamily: "'IBM Plex Sans Thai', sans-serif" }}
          aria-hidden="true"
        >
          TRADE
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
            alt="Mythix trading platform"
            className="absolute top-0 left-0 w-full h-[140%] object-cover"
          />
        </div>

        {/* Start! + scroll cue */}
        <button
          onClick={scrollToContent}
          className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#dbe3f3] hover:text-brand-gold transition-colors duration-200 cursor-pointer bg-transparent border-none p-0 group z-20"
        >
          <span className="text-[20px] md:text-[32px] font-bold tracking-wide" style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>
            Start!
          </span>
          <img 
            src="/assets/chevron_double_down.svg" 
            alt="Scroll down" 
            className="w-6 h-6 md:w-8 md:h-8 animate-bounce transition-transform duration-200 group-hover:scale-110" 
          />
        </button>
      </section>

      <div id="explore-section" className="w-full scroll-mt-20">
        {homeError && (
          <div role="alert" className="mx-auto max-w-[1440px] px-4 pt-6 text-sm text-red-200 md:px-8">
            {homeError}
          </div>
        )}
        {/* 2. The 10 Most Expensive Pokémon Cards of 2025 (Auto-Slide Carousel 3s) */}
        <ExpensiveCardsCarousel />

        {/* 3. The Best Collections (Top 5 Collectors Leaderboard) */}
        <section className="py-16 bg-[#0B111A]">
          <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-amber-500/30">
                  <Sparkles size={13} /> Leaderboard
                </span>
              </div>
              <h2 className="text-[32px] font-bold text-white leading-tight">
                The Best Collections
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Top 5 collectors ranked by rare Pokémon cards (GX = 20 pts, Promos & Secret Rares)
              </p>
            </div>
            <Link
              to="/cards"
              className="text-gray-300 hover:text-white flex items-center gap-1 text-sm font-semibold transition-colors self-start md:self-auto"
            >
              Explore All Cards <ChevronRight size={18} />
            </Link>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-6 snap-x custom-scrollbar px-4 md:px-8 max-w-[1440px] mx-auto">
            {topCollectors.map((collector) => (
              <div
                key={collector.userId}
                className="min-w-[340px] sm:min-w-[420px] md:min-w-[480px] bg-white rounded-[24px] p-6 snap-center shrink-0 flex flex-col justify-between shadow-xl border-2 border-transparent hover:border-amber-400/50 transition-all duration-300"
              >
                {/* Top Info Bar: Rank & Collector */}
                <div>
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-4">
                    <div className="flex items-center gap-3">
                      {/* Rank Badge */}
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg shadow-md ${
                          collector.rank === 1
                            ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-slate-950 ring-2 ring-amber-300/60'
                            : collector.rank === 2
                            ? 'bg-gradient-to-br from-slate-100 via-gray-200 to-slate-400 text-slate-800 ring-1 ring-slate-300'
                            : collector.rank === 3
                            ? 'bg-gradient-to-br from-amber-600 via-orange-600 to-amber-800 text-white ring-1 ring-amber-700/50'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {collector.rank === 1 ? '👑 #1' : `#${collector.rank}`}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[18px] md:text-[20px] font-bold text-gray-900 leading-none">
                            {collector.name}
                          </h3>
                          {collector.rank === 1 && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Champion
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {collector.ultraRareCount} Ultra-Rare Cards
                        </span>
                      </div>
                    </div>

                    {/* Total Rare Score Pill */}
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        Rarity Score
                      </span>
                      <span className="text-xl md:text-2xl font-black text-amber-600 flex items-center gap-1">
                        ★ {collector.totalScore}
                        <span className="text-xs font-semibold text-gray-400">pts</span>
                      </span>
                    </div>
                  </div>

                  {/* Featured Rare Cards Showcase */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                      Featured Collection Highlights
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {collector.featuredCards.slice(0, 3).map((card) => (
                        <div
                          key={card.id}
                          className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col items-center text-center group hover:bg-white hover:shadow-md transition-all"
                        >
                          <div className="w-16 h-20 md:w-20 md:h-24 mb-2 flex items-center justify-center relative">
                            <img
                              src={card.image}
                              alt={card.name}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/assets/expensive_card_1.png';
                              }}
                              className="max-w-full max-h-full object-contain drop-shadow group-hover:scale-105 transition-transform"
                            />
                            {card.quantity > 1 && (
                              <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                                x{card.quantity}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-gray-900 line-clamp-1 w-full">
                            {card.name}
                          </span>
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.5 mt-1 whitespace-nowrap">
                            +{card.points} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="w-full flex justify-center mt-6 pt-4 border-t border-gray-100">
                  <Link
                    to="/cards"
                    className="w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-full text-sm transition-colors shadow-sm"
                  >
                    View Collection Cards
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. The 10 Most Expensive Cards on sell */}
        <section className="py-16 bg-[#0B111A]">
          <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 lg:mb-8">
              <div>
                <h2 className="text-[32px] font-bold text-white leading-tight">
                  The 10 Most Expensive Cards on sell
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Top 10 highest-value cards in stock and ready for purchase
                </p>
              </div>
              <Link
                to="/cards"
                className="text-gray-300 hover:text-white flex items-center gap-1 text-sm font-semibold transition-colors self-start md:self-auto"
              >
                Watch More <ChevronRight size={18} />
              </Link>
            </div>

            <div className="flex gap-16 overflow-x-auto pb-12 pt-[120px] md:pt-[140px] custom-scrollbar snap-x px-4 md:px-0">
              {expensiveCards.map((item) => (
                <Link
                  key={item.id}
                  to={`/cards/${item.id}`}
                  className="bg-white min-w-[200px] h-[260px] md:min-w-[240px] md:h-[315px] rounded-[24px] p-4 flex flex-col relative shrink-0 group cursor-pointer mt-4 hover:shadow-2xl transition-all"
                >
                  {/* Ready to sell In-Stock Badge */}
                  <span className="absolute top-3 left-4 bg-[#16A34A] text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full z-20 shadow-sm uppercase tracking-wider">
                    In Stock ({item.stock})
                  </span>

                  {/* Image popping out of top right, tilted, anchored to bottom to avoid text */}
                  <div className="absolute bottom-[50px] md:bottom-[65px] -right-2 md:-right-4 w-[85%] md:w-[88%] rotate-[4deg] z-10 transition-transform duration-500 group-hover:rotate-0 group-hover:-translate-y-4 drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex items-center justify-center">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/assets/expensive_card_1.png';
                      }}
                      className="w-full h-auto max-h-[190px] md:max-h-[230px] object-contain" 
                    />
                  </div>
                  
                  {/* Text Container at the bottom */}
                  <div className="mt-auto flex flex-col gap-0.5 relative z-20 bg-white/80 backdrop-blur-sm rounded-xl p-2 -mx-2">
                    <div className="flex justify-between items-end gap-2">
                      <span className="text-[16px] md:text-[18px] font-black text-[#1E293B] leading-none">
                        ฿{item.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] md:text-[11px] font-bold text-[#1E293B] leading-tight text-right line-clamp-2">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] md:text-[10px] text-gray-500 font-medium whitespace-nowrap">
                        Market Price: <span className="text-[#16A34A] font-bold">฿{(item.marketPrice ?? item.price).toFixed(2)}</span>
                      </span>
                      <span className="text-[8px] md:text-[9px] text-gray-500 leading-snug whitespace-pre-wrap text-right line-clamp-2">
                        {item.set || item.rarity || item.game}
                        {item.condition ? `\n${item.condition}` : ''}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 5. The Pokémon Cards Collection */}
        <section className="py-12">
          <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[28px] font-bold text-white">The Pokémon Cards Collection</h2>
              <Link to="/cards" className="text-gray-300 hover:text-white flex items-center gap-1 text-[15px] font-semibold transition-colors">
                Watch More <ChevronRight size={20} />
              </Link>
            </div>
            
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-8 snap-x custom-scrollbar">
              {featuredProducts.map((item) => (
                <Link
                  key={item.id}
                  to={`/cards/${item.id}`}
                  className="bg-white rounded-[16px] p-4 flex gap-4 min-w-[320px] md:min-w-[400px] h-[180px] md:h-[200px] snap-start shrink-0 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-[#8B5CF6]"
                >
                  {/* Left Image */}
                  <div className="relative w-[110px] md:w-[130px] h-full shrink-0 flex items-center justify-center rounded-lg">
                    {item.stock > 0 && (
                      <span className="absolute top-2 right-1 bg-[#16A34A] text-white text-[9px] font-bold px-2 py-0.5 rounded z-10 tracking-wide">
                        IN STOCK
                      </span>
                    )}
                    <img 
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain drop-shadow-md" 
                    />
                  </div>
                  
                  {/* Right Content */}
                  <div className="flex flex-col flex-1 py-1">
                    <h3 className="text-black font-bold text-[15px] md:text-[17px] leading-tight mb-2">
                      {item.name}
                    </h3>
                    <p className="text-gray-400 text-[11px] md:text-[12px] leading-snug whitespace-pre-wrap mb-auto">
                      {item.set || item.game}
                      {'\n\n'}
                      {item.condition || item.rarity || ''}
                    </p>
                    
                    <div className="mt-2">
                      <div className="text-black font-black text-[22px] md:text-[28px] leading-none mb-1">
                        ฿{item.price.toFixed(2)}
                      </div>
                      <div className="text-gray-400 text-[11px] md:text-[12px] font-medium">
                        Market Price:{' '}
                        <span className="text-[#16A34A] font-bold">
                          ฿{(item.marketPrice ?? item.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
