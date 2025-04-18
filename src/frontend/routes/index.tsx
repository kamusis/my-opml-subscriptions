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
      <div class="min-h-screen bg-gradient-to-br from-fresh-gradient-start via-fresh-gradient-middle to-fresh-gradient-end flex flex-col font-[Inter,sans-serif]">
        {/* Header */}
        <header class="bg-white/80 backdrop-blur-sm border-b border-fresh-teal/20">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
              <div class="flex items-center">
                <div class="flex-shrink-0 flex items-center">
                  <svg class="h-8 w-8 text-fresh-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7M6 17a1 1 0 011 1" />
                  </svg>
                  <span class="ml-2 text-xl font-semibold text-slate-800">OPML Manager</span>
                </div>
                <div class="hidden md:ml-6 md:flex md:space-x-6">
                  <a href="/" class="border-b-2 border-fresh-yellow text-slate-900 inline-flex items-center px-1 pt-1 text-sm font-medium">
                    Dashboard
                  </a>
                  <a href="#" class="border-b-2 border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                    Documentation
                  </a>
                </div>
              </div>
              
              {/* GitHub link */}
              <div class="flex items-center">
                <a href="https://github.com/kamusis/my-opml-subscriptions" target="_blank" rel="noopener noreferrer" class="text-slate-500 hover:text-slate-700 transition-colors duration-200">
                  <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
                  </svg>
                </a>
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
        <footer class="bg-white/80 backdrop-blur-sm border-t border-fresh-teal/20 mt-auto">
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
