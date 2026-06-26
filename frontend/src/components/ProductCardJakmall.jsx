
import React from 'react';
import { Link } from 'react-router-dom';

const ProductCardJakmall = ({ product }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group">
            <Link to={`/jakmall-products/${product.id}`} className="block">
                <div className="relative h-48 sm:h-56 overflow-hidden">
                    <img
                        src={product.imageUrl || 'https://via.placeholder.com/400x300.png?text=No+Image'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-70 transition-opacity duration-300"></div>
                    <div className="absolute bottom-3 left-3 px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full shadow-md">
                        Jakmall
                    </div>
                </div>
                <div className="p-5">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-500 transition-colors duration-300">
                        {product.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                        {product.description || 'No description available.'}
                    </p>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            Rp {product.price.toLocaleString('id-ID')}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Stock: {product.stock > 0 ? product.stock : 'Out of Stock'}
                        </span>
                    </div>
                    {product.categoryJakmall && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Category: <span className="font-medium">{product.categoryJakmall}</span>
                        </div>
                    )}
                    {/* Displaying variants if available */}
                    {product.variants && product.variants.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Variants: <span className="font-medium">{product.variants.map(v => v.name).join(', ')}</span>
                        </div>
                    )}
                    <button className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105">
                        View Details
                    </button>
                </div>
            </Link>
        </div>
    );
};

export default ProductCardJakmall;
