import React from 'react';

export default function CatalogSkeleton() {
    return (
        <div className="catalog-product-grid animate-fade-in">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card product-card" style={{ height: '220px' }}>
                    <div>
                        <div className="flex-between" style={{ marginBottom: '15px' }}>
                            <div className="skeleton" style={{ width: '60px', height: '18px', borderRadius: '99px' }}></div>
                            <div className="skeleton" style={{ width: '80px', height: '18px', borderRadius: '99px' }}></div>
                        </div>
                        <div className="skeleton" style={{ width: '70%', height: '24px', marginBottom: '12px' }}></div>
                        <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '8px' }}></div>
                        <div className="skeleton" style={{ width: '90%', height: '14px' }}></div>
                    </div>
                    
                    <div className="product-card-footer">
                        <div>
                            <div className="skeleton" style={{ width: '40px', height: '10px', marginBottom: '5px' }}></div>
                            <div className="skeleton" style={{ width: '100px', height: '24px' }}></div>
                        </div>
                        <div className="skeleton" style={{ width: '80px', height: '36px', borderRadius: 'var(--radius-sm)' }}></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
