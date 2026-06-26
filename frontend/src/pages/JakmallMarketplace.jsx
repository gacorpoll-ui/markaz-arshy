
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCardJakmall from '../components/ProductCardJakmall'; // Assuming this path
import { Link } from 'react-router-dom'; // For routing

const JakmallMarketplace = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(12); // Number of products to display per page
    const [filters, setFilters] = useState({ category: '', search: '' });

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Fetch products from your backend API
                const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                const response = await axios.get(`${baseUrl}/api/catalog/products?source=jakmall&page=${currentPage}&limit=${productsPerPage}&category=${filters.category}&search=${filters.search}`);
                setProducts(response.data.products || []);
            } catch (err) {
                setError('Failed to fetch Jakmall products.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [currentPage, productsPerPage, filters]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1); // Reset to first page on filter change
    };

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) return <div className="text-center py-10 text-xl text-gray-700 dark:text-gray-300">Loading products...</div>;
    if (error) return <div className="text-center py-10 text-xl text-red-500">{error}</div>;
    if (products.length === 0) return <div className="text-center py-10 text-xl text-gray-700 dark:text-gray-300">No Jakmall products found.</div>;

    const totalPages = Math.ceil(products.length / productsPerPage); // This needs to come from backend for true pagination

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-extrabold text-center mb-10 text-gray-900 dark:text-white">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-500">
                    Jakmall Marketplace
                </span>
            </h1>

            {/* Filter and Search Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0 md:space-x-4">
                <input
                    type="text"
                    name="search"
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={handleFilterChange}
                    className="w-full md:w-1/3 p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white transition-all duration-300"
                />
                {/* Example Category Filter - You'd populate categories dynamically */}
                <select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="w-full md:w-1/4 p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white transition-all duration-300"
                >
                    <option value="">All Categories</option>
                    <option value="electronics">Electronics</option>
                    <option value="fashion">Fashion</option>
                    {/* ... other categories */}
                </select>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products.map((product) => (
                    <ProductCardJakmall key={product.id} product={product} />
                ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-12">
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i + 1}
                        onClick={() => paginate(i + 1)}
                        className={`mx-1 px-4 py-2 rounded-lg text-lg font-medium transition-colors duration-300 
                                    ${currentPage === i + 1
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default JakmallMarketplace;
