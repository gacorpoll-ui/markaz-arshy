import React from 'react';

// Menggunakan beberapa ikon dari Lucide React seperti di App.jsx
import { ShoppingCart, Eye } from 'lucide-react';

// Styling CSS sederhana di dalam komponen untuk kemudahan
const styles = {
    container: {
        width: '94%',
        maxWidth: '1400px',
        margin: '1.5rem auto',
        padding: '0 1rem',
    },
    pageTitle: {
        textAlign: 'center',
        marginBottom: '1rem',
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#1a1a2e',
    },
    productGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '12px',
    },
    productCard: {
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
    },
    productImageContainer: {
        width: '100%',
        height: '130px',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9CA3AF',
        fontSize: '11px',
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    productInfo: {
        padding: '8px 10px 10px',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    productTitle: {
        fontSize: '0.78rem',
        fontWeight: '600',
        color: '#111827',
        margin: '0 0 4px',
        lineHeight: '1.25',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
    },
    productDescription: {
        fontSize: '0.7rem',
        color: '#9ca3af',
        flexGrow: 1,
        marginBottom: '6px',
        lineHeight: '1.35',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
    },
    productPrice: {
        fontSize: '0.85rem',
        fontWeight: '800',
        color: '#7c3aed',
        marginBottom: '8px',
    },
    buyButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        width: '100%',
        padding: '6px',
        backgroundColor: '#7c3aed',
        color: 'white',
        textAlign: 'center',
        textDecoration: 'none',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '0.7rem',
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
                    <div key={product.id} style={styles.productCard} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}>
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
