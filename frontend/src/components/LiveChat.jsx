import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

export default function LiveChat() {
    const [isOpen, setIsOpen] = useState(false);
    const whatsappNumber = "6285175450863"; // Ganti dengan nomor WhatsApp Anda

    const handleWhatsAppClick = () => {
        const message = encodeURIComponent("Halo Admin Markaz Arshy, saya butuh bantuan terkait layanan...");
        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    };

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
            {/* Chat Bubble / Window */}
            {isOpen && (
                <div className="glass-card animate-fade-in" style={{ 
                    position: 'absolute', 
                    bottom: '80px', 
                    right: '0', 
                    width: '320px', 
                    padding: '0', 
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px var(--bg-muted)',
                    border: '1px solid var(--border-color-active)'
                }}>
                    <div style={{ 
                        background: 'var(--accent-primary)', 
                        padding: '20px', 
                        color: 'var(--text-inverse)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <h4 style={{ fontWeight: '800', fontSize: '16px' }}>Live Support</h4>
                            <p style={{ fontSize: '11px', opacity: 0.8, fontWeight: '600' }}>Online & Siap Membantu</p>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#070913' }}>
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div style={{ padding: '20px', background: 'rgba(7,9,19,0.95)' }}>
                        <div style={{ 
                            background: 'var(--bg-page)', 
                            padding: '12px', 
                            borderRadius: '12px', 
                            fontSize: '13px', 
                            color: 'var(--text-secondary)',
                            marginBottom: '20px',
                            lineHeight: '1.5',
                            borderLeft: '3px solid var(--accent-primary)'
                        }}>
                            Halo! Ada yang bisa kami bantu hari ini? Kami biasanya membalas dalam hitungan menit via WhatsApp.
                        </div>
                        
                        <button 
                            onClick={handleWhatsAppClick}
                            className="btn btn-primary" 
                            style={{ 
                                width: '100%', 
                                background: '#25d366', 
                                border: 'none', 
                                color: 'var(--text-primary)', 
                                borderRadius: '12px',
                                padding: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                fontWeight: '700'
                            }}
                        >
                            <MessageCircle size={18} /> Chat via WhatsApp
                        </button>
                    </div>
                    
                    <div style={{ padding: '10px', textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-muted)' }}>
                        Powered by Markaz Arshy Support
                    </div>
                </div>
            )}

            {/* Floating Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="animate-floating"
                style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%', 
                    background: isOpen ? 'var(--bg-surface)' : 'var(--grad-primary)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-neon-hover)',
                    position: 'relative',
                    transition: 'all 0.3s'
                }}
            >
                {!isOpen && <div className="pulse-ring"></div>}
                {isOpen ? <X size={28} color="var(--accent-primary)" /> : <MessageCircle size={28} color="#070913" />}
            </button>
        </div>
    );
}
