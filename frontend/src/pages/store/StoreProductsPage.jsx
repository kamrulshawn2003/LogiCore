import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { storeService } from '../../services/storeService';
import ProductCard from '../../components/common/ProductCard';
import Pagination from '../../components/common/Pagination';
import { FiSearch } from 'react-icons/fi';

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'sales', label: 'Best Selling' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const StoreProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category_id') || '';
  const sortBy = searchParams.get('sort') || 'featured';
  const page = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId, sortBy, page]);

  const fetchCategories = async () => {
    try {
      const home = await storeService.getHome();
      setCategories(home.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, search, category_id: categoryId, sortBy };
      const response = await storeService.listProducts(params);
      setProducts(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    // Reset to page 1 only when the change is a filter/sort, not when paging explicitly.
    if (!Object.prototype.hasOwnProperty.call(patch, 'page')) {
      next.delete('page');
    }
    setSearchParams(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {search ? (
            <>
              Results for <span className="text-brand-600">"{search}"</span>
            </>
          ) : categoryId && categories.length ? (
            categories.find((c) => String(c.id) === String(categoryId))?.name || 'Products'
          ) : (
            'All Products'
          )}
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-brand-500 focus:border-brand-500"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => updateParams({ category_id: '' })}
          className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
            !categoryId ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-600'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => updateParams({ category_id: cat.id })}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              String(cat.id) === String(categoryId)
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-600'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <FiSearch className="h-12 w-12 mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">No products found. Try a different search.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination pagination={pagination} onPageChange={(p) => updateParams({ page: p })} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StoreProductsPage;
