"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { prevMonth, nextMonth, formatMonthLabelShort } from "@/lib/date"

interface MonthNavProps {
  month: string
  basePath?: string
}

export function MonthNav({ month, basePath }: MonthNavProps) {
  const suffix = basePath ? `/${basePath}` : ""

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/${prevMonth(month)}${suffix}`} aria-label="Mês anterior" />}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="min-w-30 text-center text-sm font-medium">
        {formatMonthLabelShort(month)}
      </span>

      <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/${nextMonth(month)}${suffix}`} aria-label="Próximo mês" />}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
