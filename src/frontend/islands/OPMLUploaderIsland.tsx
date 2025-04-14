// src/frontend/islands/OPMLUploaderIsland.tsx
import { useSignal } from "@preact/signals";
import { JSX } from "preact";
import OPMLUploader from "../components/OPMLUploader.tsx";

type UploadStatus = "idle" | "uploading" | "success" | "error";

/**
 * OPMLUploaderIsland is responsible for handling OPML file uploads.
 * It has been simplified to focus only on the upload functionality.
 */
export default function OPMLUploaderIsland() {
  const selectedFile = useSignal<File | null>(null);
  const selectedFileName = useSignal<string | null>(null);
  const uploadStatus = useSignal<UploadStatus>("idle");
  const uploadErrorMessage = useSignal<string | null>(null);

  /**
   * Check if a file is potentially compatible with OPML format
   * Accepts .opml, .xml, and other potentially compatible formats
   */
  const isCompatibleFileType = (fileName: string): boolean => {
    const lowerCaseName = fileName.toLowerCase();
    // Accept .opml files (primary format)
    if (lowerCaseName.endsWith(".opml")) return true;

    // Accept .xml files (potentially compatible)
    if (lowerCaseName.endsWith(".xml")) return true;

    // Accept .rss and .atom files (feed formats that might be convertible)
    if (lowerCaseName.endsWith(".rss") || lowerCaseName.endsWith(".atom")) return true;

    // Accept .txt files (might contain feed URLs)
    if (lowerCaseName.endsWith(".txt")) return true;

    return false;
  };

  // Process a file whether it comes from input or drag & drop
  const processFile = (file: File) => {
    if (!isCompatibleFileType(file.name)) {
      uploadStatus.value = "error";
      uploadErrorMessage.value = "File must be an OPML, XML, or other compatible format.";
      selectedFile.value = null;
      selectedFileName.value = null;
      return false;
    } else {
      selectedFile.value = file;
      selectedFileName.value = file.name;
      uploadStatus.value = "idle";
      uploadErrorMessage.value = null;
      return true;
    }
  };

  // Handle file selection from input
  const handleFileChange = (event: JSX.TargetedEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) {
      if (!processFile(file)) {
        event.currentTarget.value = "";
      }
    } else {
      selectedFile.value = null;
      selectedFileName.value = null;
    }
  };

  // Handle file drop
  const handleFileDrop = (files: FileList | null) => {
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile.value) {
      uploadErrorMessage.value = "Please select a file first.";
      return;
    }

    uploadStatus.value = "uploading";
    uploadErrorMessage.value = null;

    const formData = new FormData();
    formData.append("file", selectedFile.value);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed. Invalid response." }));
        throw new Error(errorData.error || `Upload failed with status: ${response.status}`);
      }

      uploadStatus.value = "success";
      // Trigger a page reload to refresh all components
      setTimeout(() => {
        globalThis.location.reload();
      }, 1000);

    } catch (error) {
      console.error("Upload error:", error);
      uploadStatus.value = "error";
      uploadErrorMessage.value = error instanceof Error ? error.message : "An unknown error occurred during upload.";
    }
  };

  return (
    <div class="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
      <OPMLUploader
        onFileChange={handleFileChange}
        onFileDrop={handleFileDrop}
        onUpload={handleUpload}
        uploadStatus={uploadStatus.value}
        errorMessage={uploadErrorMessage.value}
        selectedFileName={selectedFileName.value}
      />
    </div>
  );
}
