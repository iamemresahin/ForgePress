'use client'

import { useEffect, useState } from 'react'
import { Bookmark, BookmarkCheck, Check, Copy, Heart, Link2, MessageCircle, Send, Share2 } from 'lucide-react'

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.85L1.254 2.25H8.08l4.254 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function getStorageKey(prefix: string, articleId: string) {
  return `fp_${prefix}_${articleId}`
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

export function YouTubeEmbed({ url }: { url: string }) {
  const videoId = extractYouTubeId(url)
  if (!videoId) return null

  return (
    <div className="overflow-hidden rounded-[24px] aspect-video">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full border-0"
        loading="lazy"
      />
    </div>
  )
}

type SharePlatform = {
  key: string
  label: string
  icon: React.ReactNode
  href: (url: string, title: string) => string
}

const PLATFORMS: SharePlatform[] = [
  {
    key: 'twitter',
    label: 'X / Twitter',
    icon: <XIcon />,
    href: (url, title) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: <FacebookIcon />,
    href: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: <MessageCircle className="size-4" />,
    href: (url, title) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    key: 'telegram',
    label: 'Telegram',
    icon: <Send className="size-4" />,
    href: (url, title) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: <Link2 className="size-4" />,
    href: (url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
]

export function PublicArticleActions({
  articleId,
  title,
  locale,
}: {
  articleId: string
  title: string
  locale: string
}) {
  const tr = locale.toLowerCase().startsWith('tr')

  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pageUrl, setPageUrl] = useState('')

  useEffect(() => {
    setLiked(localStorage.getItem(getStorageKey('like', articleId)) === '1')
    setBookmarked(localStorage.getItem(getStorageKey('bookmark', articleId)) === '1')
    setPageUrl(window.location.href)
  }, [articleId])

  function toggleLike() {
    const next = !liked
    setLiked(next)
    localStorage.setItem(getStorageKey('like', articleId), next ? '1' : '0')
  }

  function toggleBookmark() {
    const next = !bookmarked
    setBookmarked(next)
    localStorage.setItem(getStorageKey('bookmark', articleId), next ? '1' : '0')
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: pageUrl })
        return
      } catch {
        // user cancelled or unsupported — fall through to dropdown
      }
    }
    setShowShare((v) => !v)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(pageUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const btnBase =
    'public-border public-text-dim inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition hover:opacity-80 select-none cursor-pointer'

  return (
    <div className="relative flex flex-wrap items-center gap-3">
      {/* Like */}
      <button
        type="button"
        onClick={toggleLike}
        className={`${btnBase} ${liked ? 'text-rose-500 border-rose-400/30' : ''}`}
        aria-label={tr ? 'Beğen' : 'Like'}
      >
        <Heart className={`size-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
        {tr ? 'Beğen' : 'Like'}
      </button>

      {/* Bookmark */}
      <button
        type="button"
        onClick={toggleBookmark}
        className={`${btnBase} ${bookmarked ? 'text-amber-500 border-amber-400/30' : ''}`}
        aria-label={tr ? 'Kaydet' : 'Save'}
      >
        {bookmarked ? (
          <BookmarkCheck className="size-4 fill-amber-500 text-amber-500" />
        ) : (
          <Bookmark className="size-4" />
        )}
        {tr ? 'Kaydet' : 'Save'}
      </button>

      {/* Share */}
      <div className="relative">
        <button
          type="button"
          onClick={handleShare}
          className={btnBase}
          aria-label={tr ? 'Paylaş' : 'Share'}
        >
          <Share2 className="size-4" />
          {tr ? 'Paylaş' : 'Share'}
        </button>

        {showShare && (
          <div
            className="public-panel absolute bottom-full left-0 z-20 mb-2 min-w-[200px] rounded-[20px] border p-2 shadow-xl"
            onMouseLeave={() => setShowShare(false)}
          >
            {PLATFORMS.map((platform) => (
              <a
                key={platform.key}
                href={platform.href(pageUrl, title)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowShare(false)}
                className="public-text-dim flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-medium transition hover:opacity-70"
              >
                {platform.icon}
                {platform.label}
              </a>
            ))}
            <button
              type="button"
              onClick={copyLink}
              className="public-text-dim flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-medium transition hover:opacity-70"
            >
              {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
              {copied ? (tr ? 'Kopyalandı!' : 'Copied!') : tr ? 'Linki kopyala' : 'Copy link'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
