import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { storeService } from '../../services/storeService';
import ProductCard from '../../components/common/ProductCard';
import {
  FiTruck,
  FiShield,
  FiRefreshCw,
  FiHeadphones,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiZap,
} from 'react-icons/fi';

const HERO_SLIDES = [
  {
    id: 1,
    title: 'Grand Opening Sale',
    subtitle: 'Up to 50% off across the whole mall',
    cta: 'Shop Deals',
    gradient: 'from-brand-800 via-brand-600 to-brand-400',
  },
  {
    id: 2,
    title: 'Free Fast Delivery',
    subtitle: 'On every order — tracked from warehouse to door',
    cta: 'Start Shopping',
    gradient: 'from-brand-700 via-brand-500 to-brand-400',
  },
  {
    id: 3,
    title: 'New Tech Arrivals',
    subtitle: 'Latest electronics, in stock and ready to ship',
    cta: 'Browse Electronics',
    gradient: 'from-brand-900 via-brand-700 to-brand-500',
  },
];

const StoreHomePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);
  const [countdown, setCountdown] = useState('--:--:--');
  const navigate = useNavigate();

  useEffect(() => {
    fetchHome();
  }, []);

  // Auto-rotate hero carousel
  useEffect(() => {
    if (!data) return undefined;
    const timer = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 4500);
    return () => clearInterval(timer);
  }, [data]);

  // Countdown to midnight (flash-sale style)
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = Math.max(0, midnight - now);
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setCountdown(`${h}:${m}:${s}`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchHome = async () => {
    setLoading(true);
    try {
      const result = await storeService.getHome();
      setData(result);
    } catch (error) {
      console.error('Failed to load home:', error);
    } finally {
      setLoading(false);
    }
  };

  const SectionTitle = ({ title, accent }) => (
    <div className="flex items-end justify-between mb-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        {accent && <span className="w-1 h-6 bg-brand-600 rounded-full inline-block" />}
        {title}
      </h2>
      <Link to="/store/products" className="text-sm text-gray-400 hover:text-brand-600">
        View all &rsaquo;
      </Link>
    </div>
  );

  const ProductGrid = ({ products }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!data) return null;

  const flashProducts = (data.featured_products || []).slice(0, 6);
  const hero = HERO_SLIDES[slide];

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Hero: category sidebar + carousel */}
      <section className="mt-4 grid grid-cols-12 gap-4">
        <aside className="col-span-3 hidden lg:block bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="bg-brand-600 text-white text-sm font-bold px-4 py-3">All Categories</div>
          <ul className="py-1">
            {(data.categories || []).map((cat) => (
              <li key={cat.id}>
                <Link
                  to={`/store/products?category_id=${cat.id}`}
                  className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                >
                  <span>{cat.name}</span>
                  <span className="text-xs text-gray-400">{cat.product_count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <div className="col-span-12 lg:col-span-9 relative rounded-lg overflow-hidden">
          <div
            key={hero.id}
            className={`h-72 md:h-80 bg-gradient-to-r ${hero.gradient} text-white relative transition-all`}
          >
            <div className="px-8 py-14 md:py-16 max-w-lg">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold mb-4">
                <FiZap className="h-3.5 w-3.5" /> LogiCore Mall Exclusive
              </div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight drop-shadow-sm">{hero.title}</h1>
              <p className="mt-3 text-brand-50">{hero.subtitle}</p>
              <button
                onClick={() => navigate('/store/products')}
                className="mt-6 bg-white text-brand-600 font-semibold px-6 py-3 rounded-md hover:bg-gray-50 transition-colors shadow"
              >
                {hero.cta}
              </button>
            </div>
          </div>

          {/* Carousel controls */}
          <button
            onClick={() => setSlide((s) => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-2 backdrop-blur"
            aria-label="Previous slide"
          >
            <FiChevronLeft className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={() => setSlide((s) => (s + 1) % HERO_SLIDES.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-2 backdrop-blur"
            aria-label="Next slide"
          >
            <FiChevronRight className="h-5 w-5 text-white" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {HERO_SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setSlide(i)}
                className={`h-2 rounded-full transition-all ${i === slide ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Flash sale strip */}
      {flashProducts.length > 0 && (
        <section className="mt-6 bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="bg-brand-600 text-white px-5 py-3 flex items-center gap-4">
            <span className="font-black text-lg flex items-center gap-2">
              <FiZap className="h-5 w-5" /> FLASH SALE
            </span>
            <span className="text-xs text-brand-100">Ends in</span>
            <span className="flex items-center gap-1 text-sm font-bold tabular-nums">
              <FiClock className="h-4 w-4" />
              {countdown}
            </span>
            <Link to="/store/products?sortBy=sales" className="ml-auto text-xs text-brand-100 hover:text-white">
              More &rsaquo;
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4">
            {flashProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Service promises */}
      <section className="mt-6 bg-white rounded-xl border border-gray-100 px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {[
          { icon: FiTruck, label: 'Fast Delivery', sub: 'Tracked shipments' },
          { icon: FiShield, label: 'Secure Checkout', sub: 'Simulated payment' },
          { icon: FiRefreshCw, label: 'Easy Returns', sub: 'Order management' },
          { icon: FiHeadphones, label: '24/7 Support', sub: 'Notifications' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-center gap-3">
            <item.icon className="h-8 w-8 text-brand-600" />
            <div className="text-left">
              <div className="font-semibold text-gray-900 text-sm">{item.label}</div>
              <div className="text-xs text-gray-400">{item.sub}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Category tiles */}
      {data.categories && data.categories.length > 0 && (
        <section className="mt-10">
          <SectionTitle title="Browse by Category" accent />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/store/products?category_id=${cat.id}`}
                className="group px-4 py-5 bg-white border border-gray-100 rounded-lg text-center hover:border-brand-600 hover:shadow-md transition-all"
              >
                <div className="font-semibold text-gray-900 group-hover:text-brand-600">{cat.name}</div>
                <div className="mt-1 text-xs text-gray-400">
                  {cat.product_count} {cat.product_count === 1 ? 'product' : 'products'}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {data.featured_products && data.featured_products.length > 0 && (
        <section className="mt-10">
          <SectionTitle title="Featured Products" accent />
          <ProductGrid products={data.featured_products} />
        </section>
      )}

      {/* New arrivals */}
      {data.new_arrivals && data.new_arrivals.length > 0 && (
        <section className="mt-10">
          <SectionTitle title="New Arrivals" accent />
          <ProductGrid products={data.new_arrivals} />
        </section>
      )}

      {/* Best sellers */}
      {data.best_sellers && data.best_sellers.length > 0 && (
        <section className="mt-10">
          <SectionTitle title="Best Sellers" accent />
          <ProductGrid products={data.best_sellers} />
        </section>
      )}
    </div>
  );
};

export default StoreHomePage;
