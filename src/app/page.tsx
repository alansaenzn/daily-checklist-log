import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  // Redirect authenticated users to /today
  const user = await getAuthUser();
  if (user) {
    redirect("/today");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Build Momentum,<br />One Day at a Time
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Quick, achievable daily tasks designed to build momentum and maintain consistency.
            No perfectionism. Just progress.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/active"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Active
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg border-2 border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          {/* Feature 1 */}
          <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-4">📈</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Dashboard</h3>
            <p className="text-gray-600">
              See your momentum snapshot and explore templates. Reflection and design in one place.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-4">✎</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Tasks</h3>
            <p className="text-gray-600">
              Create and manage your task templates. Activate or deactivate as needed.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-4">✓</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Active</h3>
            <p className="text-gray-600">
              Check off your active tasks for today. The only place to execute.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Archive</h3>
            <p className="text-gray-600">
              View your completion history with heatmaps and proof of progress.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Build Momentum?
          </h2>
          <p className="text-gray-700 mb-8 max-w-xl mx-auto">
            Dashboard with integrated templates for design, Tasks for management, Active for execution, and Archive for reflection. Build momentum one day at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              View Dashboard
            </Link>
            <Link
              href="/active"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-gray-200 text-gray-900 font-semibold hover:bg-gray-300 transition-colors"
            >
              Go to Active
            </Link>
          </div>
        </div>

        {/* Navigation Overview */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6 font-semibold">Main Navigation (Bottom Bar)</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors border border-gray-200"
            >
              📈 Dashboard
            </Link>
            <Link
              href="/tasks"
              className="px-4 py-2 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors border border-gray-200"
            >
              ✎ Tasks
            </Link>
            <Link
              href="/active"
              className="px-4 py-2 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors border border-gray-200"
            >
              ✓ Active
            </Link>
            <Link
              href="/archive"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              📊 Archive
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
