import { redirect } from "next/navigation"
import { currentReferenceMonth } from "@/lib/date"

export default function RootPage() {
  redirect(`/${currentReferenceMonth()}`)
}
