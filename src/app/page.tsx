import { BrandMark } from '@/components/brand-mark'

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 py-16">
      <div className="absolute inset-0 z-0">
        <iframe
          src="https://my.spline.design/animatedbackgroundgradientforweb-jvJDeBWjMvShkjPKxPRUswLq"
          className="h-full w-full border-0"
          title="ForgePress background"
        />
      </div>
      <div className="absolute inset-0 z-10 bg-black/10" />

      <div className="relative z-20 flex max-w-xl flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-3 text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <BrandMark className="size-10 text-sky-300" />
          <span className="font-display text-4xl font-semibold tracking-tight">ForgePress</span>
        </div>
        <p className="text-base leading-7 text-white/88 drop-shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
          ForgePress is an AI-assisted content platform for running multi-site publishing operations from one control panel.
        </p>
      </div>
    </main>
  )
}
