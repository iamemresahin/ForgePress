'use client'

import { useRef, useState, useTransition } from 'react'
import { CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { bulkCreateSourcesAction } from './actions'

type ParsedRow = {
  label: string
  url: string
  category: string
  type: 'rss' | 'sitemap' | 'manual_url' | 'custom_feed'
  keep: boolean
}

type SiteOption = { id: string; name: string; defaultLocale: string }

function detectType(url: string): 'rss' | 'sitemap' | 'manual_url' {
  const lower = url.toLowerCase()
  if (lower.includes('feed') || lower.includes('rss') || lower.endsWith('.xml')) return 'rss'
  if (lower.includes('sitemap')) return 'sitemap'
  return 'manual_url'
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  // Detect delimiter
  const delim = lines[0].includes(';') ? ';' : ','

  // Parse header
  const header = lines[0].split(delim).map((h) => h.trim().toLowerCase().replace(/[#"']/g, ''))

  // Find column indexes
  const labelIdx = header.findIndex((h) => ['site', 'name', 'label', 'ad', 'kaynak', 'isim'].some((k) => h.includes(k)))
  const urlIdx   = header.findIndex((h) => ['link', 'url', 'adres', 'feed'].some((k) => h.includes(k)))
  const catIdx   = header.findIndex((h) => ['kategori', 'category', 'type', 'tur', 'tür'].some((k) => h.includes(k)))

  if (labelIdx === -1 || urlIdx === -1) return []

  const rows: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delim).map((c) => c.trim().replace(/^["']|["']$/g, ''))
    const label    = cols[labelIdx] ?? ''
    const url      = cols[urlIdx] ?? ''
    const category = catIdx >= 0 ? (cols[catIdx] ?? '') : ''
    if (!label || !url) continue
    rows.push({ label, url, category, type: detectType(url), keep: true })
  }
  return rows
}

export function SourceImportPanel({
  siteOptions,
  locale,
}: {
  siteOptions: SiteOption[]
  locale: 'tr' | 'en'
}) {
  const tr = locale === 'tr'
  const fileRef = useRef<HTMLInputElement>(null)

  const [rows, setRows] = useState<ParsedRow[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState(siteOptions[0]?.id ?? '')
  const [selectedLocale, setSelectedLocale] = useState(siteOptions[0]?.defaultLocale ?? 'en')
  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedSite = siteOptions.find((s) => s.id === selectedSiteId)

  function handleSiteChange(id: string) {
    setSelectedSiteId(id)
    const site = siteOptions.find((s) => s.id === id)
    if (site) setSelectedLocale(site.defaultLocale)
  }

  function handleFile(file: File) {
    setFileName(file.name)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setRows(parseCSV(text))
    }
    reader.readAsText(file, 'UTF-8')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function toggleRow(i: number) {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, keep: !r.keep } : r))
  }

  function handleImport() {
    const toImport = rows.filter((r) => r.keep).map((r) => ({
      label: r.label,
      url: r.url,
      type: r.type,
      locale: selectedLocale,
      pollMinutes: 60,
    }))
    startTransition(async () => {
      const res = await bulkCreateSourcesAction(selectedSiteId, toImport)
      if (!res.error) {
        setResult({ imported: res.imported, skipped: res.skipped })
        setRows([])
        setFileName('')
      }
    })
  }

  const keptCount = rows.filter((r) => r.keep).length

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="size-4 text-muted-foreground" />
          <span className="eyebrow">{tr ? 'Toplu içe aktar' : 'Bulk import'}</span>
        </div>
        <CardTitle className="text-lg">{tr ? 'CSV / Excel\'den kaynak yükle' : 'Import sources from CSV / Excel'}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {tr
            ? 'Sütunlar: Site, Link, Kategori (başlık satırı gerekli). Excel dosyasını önce CSV olarak kaydedin.'
            : 'Columns: Site, Link, Category (header row required). Save Excel files as CSV first.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Site + locale selectors */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="field">
            <label className="label">{tr ? 'Hedef site' : 'Target site'}</label>
            <select
              value={selectedSiteId}
              onChange={(e) => handleSiteChange(e.target.value)}
              className="mt-1"
            >
              {siteOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">{tr ? 'Dil' : 'Locale'}</label>
            <input
              type="text"
              value={selectedLocale}
              onChange={(e) => setSelectedLocale(e.target.value)}
              className="mt-1 input"
              placeholder="tr, en, de…"
            />
          </div>
        </div>

        {/* Drop zone */}
        {rows.length === 0 && !result && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[18px] border-2 border-dashed border-border/60 px-6 py-10 text-center transition hover:border-primary/40 hover:bg-accent/30"
          >
            <Upload className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">{tr ? 'Dosyayı buraya sürükle veya tıkla' : 'Drag file here or click to browse'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tr ? 'CSV veya Excel\'den dışa aktarılmış CSV' : 'CSV or CSV exported from Excel / Google Sheets'}</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </div>
        )}

        {/* Success state */}
        {result && (
          <div className="flex items-center gap-3 rounded-[16px] border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
            <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
            <div>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                {tr ? `${result.imported} kaynak eklendi` : `${result.imported} sources imported`}
                {result.skipped > 0 && `, ${result.skipped} ${tr ? 'atlandı' : 'skipped'}`}
              </p>
              <p className="text-xs text-muted-foreground">{tr ? 'Kaynaklar sayfasında görüntüleyebilirsiniz.' : 'View them in the sources list.'}</p>
            </div>
            <button type="button" onClick={() => setResult(null)} className="ml-auto text-muted-foreground hover:opacity-70">
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Preview table */}
        {rows.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {tr ? `${rows.length} satır okundu · ${keptCount} seçili` : `${rows.length} rows parsed · ${keptCount} selected`}
                  {selectedSite ? ` · ${selectedSite.name}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setRows((r) => r.map((x) => ({ ...x, keep: true })))}
                >
                  {tr ? 'Tümünü seç' : 'Select all'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => { setRows([]); setFileName('') }}
                >
                  {tr ? 'İptal' : 'Cancel'}
                </Button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-[14px] border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <tr>
                    <th className="w-10 px-3 py-2.5 text-left font-medium text-muted-foreground"></th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">{tr ? 'Kaynak' : 'Source'}</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">URL</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">{tr ? 'Kategori' : 'Category'}</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">{tr ? 'Tip' : 'Type'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      onClick={() => toggleRow(i)}
                      className={`cursor-pointer transition ${row.keep ? '' : 'opacity-40'}`}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={row.keep}
                          onChange={() => toggleRow(i)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-medium">{row.label}</td>
                      <td className="max-w-[200px] truncate px-3 py-2.5 font-mono text-xs text-muted-foreground">{row.url}</td>
                      <td className="px-3 py-2.5">
                        {row.category && (
                          <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                            {row.category}
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          value={row.type}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, type: e.target.value as ParsedRow['type'] } : r))}
                          className="rounded-lg border border-border/60 bg-transparent px-2 py-1 text-xs"
                        >
                          <option value="manual_url">manual_url</option>
                          <option value="rss">rss</option>
                          <option value="sitemap">sitemap</option>
                          <option value="custom_feed">custom_feed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              type="button"
              onClick={handleImport}
              disabled={isPending || keptCount === 0}
              className="w-full rounded-xl"
            >
              {isPending
                ? tr ? 'Ekleniyor...' : 'Importing...'
                : tr ? `${keptCount} kaynağı ekle → ${selectedSite?.name ?? ''}` : `Import ${keptCount} sources → ${selectedSite?.name ?? ''}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
