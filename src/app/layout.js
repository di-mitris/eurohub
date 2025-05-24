// Remove Next.js font imports and use regular Google Fonts
// import { Inter, Roboto_Slab } from 'next/font/google'
import './globals.css'

// Configure fonts with consistent options - REMOVED FOR NOW
// const inter = Inter({ 
//   subsets: ['latin'],
//   variable: '--font-inter',
//   display: 'swap',
//   preload: true,
// })

// const robotoSlab = Roboto_Slab({ 
//   subsets: ['latin'],
//   variable: '--font-roboto-slab',
//   display: 'swap',
//   preload: true,
// })

export const metadata = {
  title: 'European News & Elections Hub',
  description: 'Stay informed with the latest European news and upcoming election schedules across Europe',
  keywords: 'European news, elections, politics, EU, current events, democracy',
  authors: [{ name: 'European News Hub' }],
  creator: 'European News Hub',
  publisher: 'European News Hub',
  metadataBase: new URL('https://your-domain.com'), // Replace with your actual domain
  openGraph: {
    title: 'European News & Elections Hub',
    description: 'Your comprehensive source for European news and political information',
    url: 'https://your-domain.com', // Replace with your actual domain
    siteName: 'European News & Elections Hub',
    images: [
      {
        url: '/og-image.jpg', // Add this image to your public folder
        width: 1200,
        height: 630,
        alt: 'European News & Elections Hub',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'European News & Elections Hub',
    description: 'Your comprehensive source for European news and political information',
    images: ['/og-image.jpg'], // Add this image to your public folder
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'your-google-verification-code', // Add your Google Search Console verification
    // yandex: 'your-yandex-verification-code', // Add if needed
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="font-sans antialiased">
        {/* Skip to main content for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>
        
        {/* Navigation Bar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">EN</span>
                </div>
                <span className="font-bold text-xl text-gray-800">European Hub</span>
              </div>
              
              <div className="hidden md:flex items-center space-x-8">
                <a 
                  href="#news" 
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium"
                >
                  Latest News
                </a>
                <a 
                  href="#elections" 
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium"
                >
                  Elections
                </a>
                <a 
                  href="#about" 
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium"
                >
                  About
                </a>
              </div>
              
              {/* Mobile menu button - Static for now since it needs client interactivity */}
              <div className="md:hidden p-2 rounded-md text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main id="main-content" className="min-h-screen">
          {children}
        </main>

        {/* Removed cookie banner completely to avoid server component issues */}
        
        {/* Analytics script placeholder */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Add your analytics script here, e.g., Google Analytics */}
            {/* 
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'GA_MEASUREMENT_ID');
              `}
            </Script>
            */}
          </>
        )}
      </body>
    </html>
  )
}