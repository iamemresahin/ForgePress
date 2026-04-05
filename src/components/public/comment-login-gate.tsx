'use client'

import Link from 'next/link'
import { MessageSquareMore } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function CommentLoginGate({
  title,
  description,
  body,
  buttonLabel,
  loginHref,
  loginLabel,
}: {
  title: string
  description: string
  body: string
  buttonLabel: string
  loginHref: string
  loginLabel: string
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/20 hover:text-white">
          {buttonLabel}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-md border-white/10 bg-[#111112] text-white sm:max-w-md">
        <SheetHeader className="border-b border-white/10 px-6 py-6 text-left">
          <div className="mb-2 inline-flex size-12 items-center justify-center rounded-2xl bg-white/6">
            <MessageSquareMore className="size-6 text-white" />
          </div>
          <SheetTitle className="text-2xl font-semibold text-white">{title}</SheetTitle>
          <SheetDescription className="text-base leading-7 text-white/62">{description}</SheetDescription>
        </SheetHeader>

        <div className="px-6 py-6">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm leading-7 text-white/66">{body}</p>
            <Link
              href={loginHref}
              className="mt-5 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/92"
            >
              {loginLabel}
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
