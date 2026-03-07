/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    primary: '#0A0A0F',
                    secondary: '#12121A',
                    card: 'rgba(255, 255, 255, 0.04)',
                },
                accent: {
                    primary: '#6C63FF',
                    secondary: '#00D9FF',
                    success: '#00FF9F',
                    warning: '#FFB800',
                    error: '#FF4757',
                },
                txt: {
                    primary: '#F0F0FF',
                    secondary: 'rgba(240, 240, 255, 0.6)',
                    muted: 'rgba(240, 240, 255, 0.3)',
                }
            },
            fontFamily: {
                heading: ['Space Grotesk', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                'xl': '20px',
                '2xl': '28px',
            },
            boxShadow: {
                'glow-primary': '0 0 20px rgba(108, 99, 255, 0.4)',
                'glow-secondary': '0 0 20px rgba(0, 217, 255, 0.4)',
                'glow-success': '0 0 20px rgba(0, 255, 159, 0.4)',
            },
            animation: {
                'float': 'float 20s infinite ease-in-out',
                'shimmer': 'shimmer 2s infinite',
                'pulse-slow': 'pulse 3s infinite',
                'spin-slow': 'spin 3s linear infinite',
                'spin-reverse': 'spin-reverse 2s linear infinite',
                'progress': 'progress 30s linear forwards',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                    '33%': { transform: 'translate(30px, -30px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                },
                shimmer: {
                    '0%': { left: '-100%' },
                    '100%': { left: '100%' },
                },
                'spin-reverse': {
                    from: { transform: 'rotate(360deg)' },
                    to: { transform: 'rotate(0deg)' },
                },
                progress: {
                    from: { width: '0%' },
                    to: { width: '100%' },
                },
            },
        },
    },
    plugins: [],
}
