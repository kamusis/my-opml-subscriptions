// src/frontend/components/OPMLUploader.tsx
import { JSX } from "preact";
import { useState, useRef } from "preact/hooks";

interface OPMLUploaderProps {
  onFileChange: (event: JSX.TargetedEvent<HTMLInputElement, Event>) => void;
  onFileDrop: (files: FileList | null) => void;
  onUpload: () => void;
  uploadStatus: string;
  errorMessage: string | null;
  selectedFileName: string | null;
}

export default function OPMLUploader(
  { onFileChange, onFileDrop, onUpload, uploadStatus, errorMessage, selectedFileName }:
    OPMLUploaderProps,
) {
  // State for drag and drop UI
  const [isDragging, setIsDragging] = useState(false);

  // Use a counter to track drag enter/leave events to handle child elements
  const dragCounter = useRef(0);

  const handleDragEnter = (e: JSX.TargetedDragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: JSX.TargetedDragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: JSX.TargetedDragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: JSX.TargetedDragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      onFileDrop(e.dataTransfer.files);
    }
  };
  return (
    <div class="bg-white/90 backdrop-blur-sm border border-fresh-teal/30 rounded-lg shadow-sm w-full overflow-hidden">
      <div class="px-6 py-5 border-b border-fresh-teal/20">
        <h2 class="text-lg font-medium text-slate-900">Upload Subscription File</h2>
        <p class="mt-1 text-sm text-slate-500">Import your subscriptions from an OPML, XML, or other compatible file</p>
      </div>

      <div class="p-6">
        <div class="mb-5">
          <label
            class="block mb-2 text-sm font-medium text-slate-700"
            htmlFor="file_input"
          >
            Select Subscription File
          </label>

          <div class="flex items-center justify-center w-full">
            <label
              htmlFor="file_input"
              class={`relative flex flex-col items-center justify-center w-full h-32 border-2 ${isDragging ? 'border-fresh-yellow bg-fresh-mint/20' : 'border-fresh-teal/30 bg-white/50'} border-dashed rounded-lg cursor-pointer hover:bg-fresh-mint/10 transition-colors duration-200`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnter={handleDragEnter}
            >
              <div class="flex flex-col items-center justify-center pt-5 pb-6">
                <div class={`absolute inset-0 flex items-center justify-center bg-fresh-mint bg-opacity-80 rounded-lg transition-opacity duration-200 ${isDragging ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <div class="text-slate-800 font-medium text-lg bg-white px-4 py-2 rounded-lg shadow-sm border border-fresh-yellow">
                    Drop file here
                  </div>
                </div>
                <svg class="w-8 h-8 mb-3 text-fresh-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p class="mb-1 text-sm text-slate-500">
                  <span class="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p class="text-xs text-slate-500">OPML, XML, RSS, ATOM, or TXT files</p>
              </div>
              <input
                id="file_input"
                type="file"
                accept=".opml,.xml,.rss,.atom,.txt"
                class="hidden"
                onChange={onFileChange}
              />
            </label>
          </div>

          {selectedFileName && (
            <div class="mt-3 flex items-center text-sm text-slate-600 bg-white/70 p-2 rounded border border-fresh-teal/30">
              <svg class="w-4 h-4 mr-2 text-fresh-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="truncate">{selectedFileName}</span>
            </div>
          )}
        </div>

        <div class="flex justify-center">
          <button
            onClick={onUpload}
            type="button"
            disabled={uploadStatus === "uploading" || !selectedFileName}
            class="inline-flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-slate-800 bg-fresh-yellow hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fresh-yellow disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
          {uploadStatus === "uploading" ? (
            <>
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : "Upload Feeds"}
          </button>
        </div>

        {uploadStatus === "success" && (
          <div class="mt-3 p-3 bg-fresh-mint/30 border border-fresh-teal/30 text-slate-700 rounded-md flex items-start">
            <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>File uploaded successfully! Your feeds are now ready for validation.</span>
          </div>
        )}

        {uploadStatus === "error" && errorMessage && (
          <div class="mt-3 p-3 bg-red-50/70 border border-red-200 text-red-700 rounded-md flex items-start">
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
