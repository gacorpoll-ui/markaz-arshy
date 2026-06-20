import React from 'react';

export default function AdminSkeleton() {
    return (
        <div className="animate-fade-in admin-overview-container">
            <div className="skeleton skeleton-title" style={{ width: '300px', height: '36px', marginBottom: '30px' }}></div>
            
            {/* Primary Stats Grid Skeleton */}
            <div className="admin-primary-stats-grid">
                <div className="skeleton skeleton-card"></div>
                <div className="skeleton skeleton-card"></div>
                <div className="skeleton skeleton-card"></div>
                <div className="skeleton skeleton-card"></div>
            </div>

            {/* Secondary Sections Skeleton */}
            <div className="admin-secondary-sections-grid">
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
                    <div className="skeleton skeleton-card" style={{ height: '250px' }}></div>
                    <div className="skeleton skeleton-card" style={{ height: '250px' }}></div>
                </div>
            </div>

            {/* Tertiary Stats Grid Skeleton */}
            <div className="admin-tertiary-stats-grid">
                <div className="skeleton skeleton-card" style={{ height: '200px' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="skeleton skeleton-card" style={{ height: '90px' }}></div>
                    <div className="skeleton skeleton-card" style={{ height: '90px' }}></div>
                </div>
            </div>
        </div>
    );
}
