import { version } from "../../package.json"

export function AppFooter() {
  return (
    <footer className="border-t py-4">
      <div className="mx-auto max-w-3xl px-4 flex justify-end">
        <span className="text-xs text-muted-foreground">v{version}</span>
      </div>
    </footer>
  )
}
