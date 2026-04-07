import Script from 'next/script'

export function GoogleAnalytics({ gtagId }: { gtagId: string | null | undefined }) {
  if (!gtagId?.trim()) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
        strategy="afterInteractive"
      />
      <Script id={`gtag-init-${gtagId}`} strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gtagId}');
        `}
      </Script>
    </>
  )
}
