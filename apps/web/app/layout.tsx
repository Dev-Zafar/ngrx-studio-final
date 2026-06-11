import type { Metadata } from 'next'
import { Sora, Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { CustomCursor } from '@/components/animations/CustomCursor'
import { PageLoader } from '@/components/animations/PageLoader'
import { SmoothScrollProvider } from '@/components/animations/SmoothScrollProvider'

const sora = Sora({ subsets: ['latin'], variable: '--font-sora', weight: ['300','400','500','600','700','800'], display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', weight: ['300','400','500','600','700'], display: 'swap' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['300','400','500','600'], display: 'swap' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', weight: ['400','500'], display: 'swap' })

export const metadata: Metadata = {
  title: 'NGRX Studio — Frame Every Second',
  description: 'NGRX Studio is a premium digital creative agency specializing in video editing, motion graphics, brand identity, and content strategy.',
  openGraph: {
    title: 'NGRX Studio — Frame Every Second',
    description: 'We craft viral content and build powerful digital brands.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} bg-void text-text-1 cursor-none`}>
        <PageLoader />
        <CustomCursor />
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
