export default function Home() {
  // This page should never be seen as middleware handles the redirect
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span>Redirecting...</span>
      </div>
    </div>
  )
}
