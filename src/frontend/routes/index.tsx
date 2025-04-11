// src/frontend/routes/index.tsx
import { Head } from "$fresh/runtime.ts";
import OPMLUploaderIsland from "../islands/OPMLUploaderIsland.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>OPML Subscription Manager</title>
        <link rel="stylesheet" href="/styles.css" /> {/* Ensure Tailwind is loaded */}
      </Head>
      <div class="min-h-screen bg-gray-100">
        {/* Header */}
        <header class="bg-white shadow-sm">
          <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
              <div class="flex">
                <div class="flex-shrink-0 flex items-center">
                  {/* Replace with actual logo if available */}
                   <svg class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                  <span class="ml-2 text-xl font-bold text-gray-800">OPML Manager</span>
                </div>
              </div>
              {/* Add nav links here if needed */}
            </div>
          </nav>
        </header>

        {/* Main Content Area */}
        <main class="py-8">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
             <h1 class="text-3xl font-bold text-gray-900 mb-6">Manage Your OPML Subscriptions</h1>
             {/* Integrate the interactive island */}
             <OPMLUploaderIsland />
          </div>
        </main>

        {/* Footer */}
        <footer class="bg-white mt-auto">
           <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} OPML Subscription Manager. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}
