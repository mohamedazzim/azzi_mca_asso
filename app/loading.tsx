import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" role="status" aria-live="polite">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" aria-hidden="true" />
        <p className="text-gray-600">Loading...</p>
        <span className="sr-only">Loading content, please wait.</span>
      </div>
    </div>
  )
}
