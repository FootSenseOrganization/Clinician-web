import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center hero-gradient px-4">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold tracking-tight text-foreground">404</h1>
        <p className="mt-4 text-lg text-muted-foreground">Page not found.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg brand-gradient px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
