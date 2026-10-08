import { Link } from 'react-router'

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <p className="text-lg font-semibold">Page not found</p>
      <Link to="/" className="text-sm font-medium text-royal-600 hover:underline">
        Back to dashboard
      </Link>
    </div>
  )
}
