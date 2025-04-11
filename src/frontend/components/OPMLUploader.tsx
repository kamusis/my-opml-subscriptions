// src/frontend/components/OPMLUploader.tsx
import { JSX } from "preact";

interface OPMLUploaderProps {
  onFileChange: (event: JSX.TargetedEvent<HTMLInputElement, Event>) => void;
  onUpload: () => void;
  uploadStatus: string;
  errorMessage: string | null;
  selectedFileName: string | null;
}

export default function OPMLUploader(
  { onFileChange, onUpload, uploadStatus, errorMessage, selectedFileName }:
    OPMLUploaderProps,
) {
  return (
    <div class="bg-white border border-slate-200 rounded-lg shadow-sm w-full max-w-2xl overflow-hidden">
      <div class="px-6 py-5 border-b border-slate-200">
        <h2 class="text-lg font-medium text-slate-900">Upload OPML File</h2>
        <p class="mt-1 text-sm text-slate-500">Import your subscriptions from an OPML file</p>
      </div>
      
      <div class="p-6">
        <div class="mb-5">
          <label
            class="block mb-2 text-sm font-medium text-slate-700"
            htmlFor="file_input"
          >
            Select OPML File
          </label>
          
          <div class="flex items-center justify-center w-full">
            <label 
              htmlFor="file_input" 
              class="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors duration-200"
            >
              <div class="flex flex-col items-center justify-center pt-5 pb-6">
                <svg class="w-8 h-8 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p class="mb-1 text-sm text-slate-500"><span class="font-semibold">Click to upload</span> or drag and drop</p>
                <p class="text-xs text-slate-500">OPML files only</p>
              </div>
              <input 
                id="file_input" 
                type="file" 
                accept=".opml" 
                class="hidden" 
                onChange={onFileChange} 
              />
            </label>
          </div>
          
          {selectedFileName && (
            <div class="mt-3 flex items-center text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
              <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="truncate">{selectedFileName}</span>
            </div>
          )}
        </div>
        
        <button
          onClick={onUpload}
          type="button"
          disabled={uploadStatus === "uploading" || !selectedFileName}
          class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {uploadStatus === "uploading" ? (
            <>
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : "Upload OPML"}
        </button>
        
        {uploadStatus === "success" && (
          <div class="mt-3 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-start">
            <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>File uploaded successfully! Your feeds are now ready for validation.</span>
          </div>
        )}
        
        {uploadStatus === "error" && errorMessage && (
          <div class="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
            <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
