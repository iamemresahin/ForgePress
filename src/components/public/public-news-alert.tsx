'use client'

import Link from 'next/link'
import { ArrowUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type PublicNewsAlertProps = {
  articleId: string
  articleHref: string
  siteId: string
  label: string
}

export function PublicNewsAlert({ articleId, articleHref, siteId, label }: PublicNewsAlertProps) {
  const storageKey = useMemo(() => `forgepress:last-seen-article:${siteId}`, [siteId])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const lastSeen = window.localStorage.getItem(storageKey)
    setVisible(lastSeen !== articleId)
  }, [articleId, storageKey])

  if (!visible) return null

  return (
    <Link
      href={articleHref}
      onClick={() => {
        window.localStorage.setItem(storageKey, articleId)
        setVisible(false)
      }}
      className="inline-flex items-center gap-3 rounded-full bg-[#3b82f6] px-7 py-3 text-[1.05rem] font-semibold text-white shadow-[0_18px_50px_-18px_rgba(59,130,246,0.85)] transition hover:bg-[#4c8dff]"
    >
      <ArrowUp className="size-5" />
      <span>{label}</span>
    </Link>
  )
}
