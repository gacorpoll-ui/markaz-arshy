import React from 'react';

// Menggunakan beberapa ikon dari Lucide React seperti di App.jsx
import { ShoppingCart, Eye } from 'lucide-react';

// Styling CSS sederhana di dalam komponen untuk kemudahan
const styles = {
    container: {
        width: '90%',
        maxWidth: '1200px',
        margin: '2rem auto',
        padding: '1rem',
    },
    pageTitle: {
        textAlign: 'center',
        marginBottom: '2rem',
        fontSize: '2.5rem',
        fontWeight: 'bold',
        color: '#111827',
    },
    productGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1.5rem',
    },
    productCard: {
        backgroundColor: '#ffffff',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
    },
    productImageContainer: {
        width: '100%',
        height: '200px',
        backgroundColor: '#F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9CA3AF',
    },
    productImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    productInfo: {
        padding: '1rem',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    productTitle: {
        fontSize: '1.1rem',
        fontWeight: '600',
        color: '#111827',
        margin: '0 0 0.5rem 0',
    },
    productDescription: {
        fontSize: '0.9rem',
        color: '#6B7280',
        flexGrow: 1,
        marginBottom: '1rem',
        lineHeight: '1.5',
    },
    productPrice: {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: '#3B82F6',
        marginBottom: '1rem',
    },
    buyButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        padding: '0.75rem',
        backgroundColor: '#3B82F6',
        color: 'white',
        textAlign: 'center',
        textDecoration: 'none',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'background-color 0.2s',
    }
};

const MarketplacePage = ({ user, token }) => {
    // Data produk placeholder. Nantinya ini akan diambil dari backend.
    const placeholderProducts = [
        {
            id: 1,
            name: 'Nama Produk Jakmall 1',
            description: 'Deskripsi singkat dan menarik untuk produk pertama dari Jakmall.',
            price: '99.000',
            imageUrl: '', // URL gambar akan ditambahkan nanti
            productUrl: '#' // URL ke halaman produk di Jakmall
        },
        {
            id: 2,
            name: 'Nama Produk Jakmall 2',
            description: 'Deskripsi singkat dan menarik untuk produk kedua dari Jakmall.',
            price: '149.000',
            imageUrl: '',
            productUrl: '#'
        },
        {
            id: 3,
            name: 'Nama Produk Jakmall 3',
            description: 'Deskripsi singkat dan menarik untuk produk ketiga dari Jakmall.',
            price: '210.000',
            imageUrl: '',
            productUrl: '#'
        },
        {
            id: 4,
            name: 'Nama Produk Jakmall 4',
            description: 'Deskripsi singkat dan menarik untuk produk keempat dari Jakmall.',
            price: '75.000',
            imageUrl: '',
            productUrl: '#'
        },
    ];

    return (
        <div style={styles.container}>
            <h1 style={styles.pageTitle}>Marketplace</h1>
            <div style={styles.productGrid}>
                {placeholderProducts.map(product => (
                    <div key={product.id} style={styles.productCard} onMouseOver={e => e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.1)'} onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'}>
                        <div style={styles.productImageContainer}>
                            {product.imageUrl ?
                                <img src={product.imageUrl} alt={product.name} style={styles.productImage} /> :
                                <span>Gambar Segera Hadir</span>
                            }
                        </div>
                        <div style={styles.productInfo}>
                            <h3 style={styles.productTitle}>{product.name}</h3>
                            <p style={styles.productDescription}>{product.description}</p>
                            <p style={styles.productPrice}>Rp {product.price}</p>
                            <a href={product.productUrl} target="_blank" rel="noopener noreferrer" style={styles.buyButton} onMouseOver={e => e.currentTarget.style.backgroundColor = '#2563EB'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#3B82F6'}>
                                <Eye size={16} />
                                Lihat Produk
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarketplacePage;
