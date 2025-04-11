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
    <div class="p-4 border rounded shadow-sm bg-white w-full max-w-lg">
      <h2 class="text-xl font-semibold mb-4">Upload OPML File</h2>
      <div class="mb-4">
        <label
          class="block mb-2 text-sm font-medium text-gray-700"
          htmlFor="file_input"
        >
          Choose file (.opml)
        </label>
        <input
          class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
          id="file_input"
          type="file"
          accept=".opml"
          onChange={onFileChange}
        />
        {selectedFileName && (
          <p class="mt-1 text-sm text-gray-600">
            Selected: {selectedFileName}
          </p>
        )}
      </div>
      <button
        onClick={onUpload}
        type="button"
        disabled={uploadStatus === "uploading"}
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 w-full"
      >
        {uploadStatus === "uploading" ? "Uploading..." : "Upload"}
      </button>
      {uploadStatus === "success" && (
        <p class="mt-2 text-green-600">Upload successful!</p>
      )}
      {uploadStatus === "error" && errorMessage && (
        <p class="mt-2 text-red-600">Error: {errorMessage}</p>
      )}
    </div>
  );
}
