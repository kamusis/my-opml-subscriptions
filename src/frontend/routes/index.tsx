// src/frontend/routes/index.tsx
import { Head } from "$fresh/runtime.ts";
import OPMLUploaderIsland from "../islands/OPMLUploaderIsland.tsx";
import FeedManagementIsland from "../islands/FeedManagementIsland.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>OPML Subscription Manager</title>
        <link rel="stylesheet" href="/styles.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" />
      </Head>
      <div class="min-h-screen bg-slate-50 flex flex-col font-[Inter,sans-serif]">
        {/* Header */}
        <header class="bg-white border-b border-slate-200">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
              <div class="flex items-center">
                <div class="flex-shrink-0 flex items-center">
                  <svg class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7M6 17a1 1 0 011 1" />
                  </svg>
                  <span class="ml-2 text-xl font-semibold text-slate-800">OPML Manager</span>
                </div>
                <div class="hidden md:ml-6 md:flex md:space-x-6">
                  <a href="/" class="border-b-2 border-blue-500 text-slate-900 inline-flex items-center px-1 pt-1 text-sm font-medium">
                    Dashboard
                  </a>
                  <a href="#" class="border-b-2 border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                    Documentation
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main class="flex-grow py-10">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-8">
              <h1 class="text-2xl font-semibold text-slate-900">OPML Subscription Manager</h1>
              <p class="mt-1 text-sm text-slate-500">Upload, manage, and validate your feed subscriptions</p>
            </div>
            <div class="space-y-8">
              <OPMLUploaderIsland />
              <FeedManagementIsland />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer class="bg-white border-t border-slate-200 mt-auto">
          <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center">
              <p class="text-sm text-slate-500">© {new Date().getFullYear()} OPML Subscription Manager</p>
              <div class="flex space-x-6">
                <a href="#" class="text-sm text-slate-500 hover:text-slate-900">Privacy</a>
                <a href="#" class="text-sm text-slate-500 hover:text-slate-900">Terms</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
