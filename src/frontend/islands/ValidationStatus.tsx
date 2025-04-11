// src/frontend/islands/ValidationStatus.tsx
import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import type { ValidationProgress } from "../../backend/types/validation.types.ts";

interface ValidationStatusProps {
  feedCount: number;
  onValidationComplete?: () => void;
}

export default function ValidationStatus({ feedCount, onValidationComplete }: ValidationStatusProps) {
  // Validation state management
  const validationState = useSignal<'idle' | 'starting' | 'polling' | 'processing' | 'completed' | 'error'>('idle');
  const validationId = useSignal<string | null>(null);
  const validationProgressDetails = useSignal<ValidationProgress | null>(null);
  const validationError = useSignal<string | null>(null);
  const lastUpdateTimestamp = useSignal<number>(Date.now());
  const pollingIntervalRef = useRef<number | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current !== null) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Handle validation process
  const handleValidate = async () => {
    try {
      validationState.value = 'starting';
      validationError.value = null;
      
      // Trigger validation
      const response = await fetch('/api/validate', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start validation: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Validation started response:', data);
      
      // The API returns validationId, not id
      validationId.value = data.validationId;
      validationState.value = 'polling';
      
      // Start polling for status updates
      startPollingValidationStatus();
    } catch (error) {
      console.error('Error starting validation:', error);
      validationState.value = 'error';
      validationError.value = error instanceof Error ? error.message : String(error);
    }
  };

  // Poll for validation status updates
  const startPollingValidationStatus = () => {
    if (pollingIntervalRef.current !== null) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Poll every 1 second
    pollingIntervalRef.current = setInterval(async () => {
      if (!validationId.value) {
        clearInterval(pollingIntervalRef.current!);
        return;
      }
      
      try {
        //console.log(`Polling validation status for ID: ${validationId.value}`);
        const response = await fetch(`/api/validation-status?validationId=${validationId.value}`);
        
        if (!response.ok) {
          throw new Error(`Failed to get validation status: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        //console.log('Validation status response:', data);
        
        // Make sure we're dealing with a ValidationSession object
        if (data && typeof data === 'object') {
          // Update state based on validation status
          if (data.status === 'completed') {
            validationState.value = 'completed';
            clearInterval(pollingIntervalRef.current!);
            pollingIntervalRef.current = null;
            
            // Notify parent component that validation is complete
            if (onValidationComplete) {
              onValidationComplete();
            }
          } else if (data.status === 'error') {
            validationState.value = 'error';
            validationError.value = data.error || 'Unknown error occurred during validation';
            clearInterval(pollingIntervalRef.current!);
            pollingIntervalRef.current = null;
          } else if (data.status === 'processing' || data.status === 'pending') {
            validationState.value = 'processing';
            validationProgressDetails.value = data.progress || null;
            lastUpdateTimestamp.value = Date.now(); // Trigger re-render for animations
            
            // Fetch updated feeds during validation to show real-time updates
            if (onValidationComplete) {
              onValidationComplete(); // This will trigger fetchFeeds() in the parent component
            }
          }
        } else {
          console.error('Invalid validation status response:', data);
          throw new Error('Invalid validation status response');
        }
      } catch (error) {
        console.error('Error polling validation status:', error);
        validationState.value = 'error';
        validationError.value = error instanceof Error ? error.message : String(error);
        clearInterval(pollingIntervalRef.current!);
        pollingIntervalRef.current = null;
      }
    }, 1000);
  };

  return (
    <div class="w-full max-w-4xl bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 ease-in-out">
      <div class="px-6 py-5 border-b border-slate-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-slate-900">Feed Validation</h3>
          <p class="text-sm text-slate-500">Check and update feed status</p>
        </div>
        {validationState.value === 'idle' && (
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            Ready
          </span>
        )}
        {validationState.value === 'processing' && (
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg class="-ml-0.5 mr-1.5 h-2 w-2 text-blue-400 animate-pulse" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Processing
          </span>
        )}
        {validationState.value === 'completed' && (
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg class="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Complete
          </span>
        )}
        {validationState.value === 'error' && (
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <svg class="-ml-0.5 mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Error
          </span>
        )}
      </div>
      
      <div class="p-6">
        {/* Idle state with validation button */}
        {validationState.value === 'idle' && (
          <div class="text-center">
            <div class="mb-4 flex justify-center">
              <svg class="h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p class="text-slate-600 mb-4">Validate your feeds to check their status and availability.</p>
            <button
              type="button"
              onClick={handleValidate}
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-200"
              disabled={feedCount === 0}
            >
              <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Validate All Feeds ({feedCount})
            </button>
          </div>
        )}
        
        {/* Starting validation */}
        {validationState.value === 'starting' && (
          <div class="text-center py-4">
            <svg class="animate-spin h-8 w-8 text-blue-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-blue-600 font-medium">Initiating validation process...</p>
          </div>
        )}
        
        {/* Polling for updates */}
        {validationState.value === 'polling' && (
          <div class="text-center py-4">
            <svg class="animate-spin h-8 w-8 text-blue-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-blue-600 font-medium">Connecting to validation service...</p>
          </div>
        )}
        
        {/* Processing with progress bar */}
        {validationState.value === 'processing' && validationProgressDetails.value && (
          <div class="transition-all duration-300 ease-in-out" key={lastUpdateTimestamp.value}>
            <div class="mb-2 flex justify-between items-center">
              <span class="text-sm font-medium text-slate-700">Validation Progress</span>
              <span class="text-sm font-medium text-slate-700">
                {Math.round((validationProgressDetails.value.processedFeeds / validationProgressDetails.value.totalFeeds) * 100)}%
              </span>
            </div>
            <div class="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                class="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-500 ease-out"
                style={{ 
                  width: `${(validationProgressDetails.value.processedFeeds / validationProgressDetails.value.totalFeeds) * 100}%` 
                }}
              ></div>
            </div>
            <div class="mt-3 flex justify-between text-xs text-slate-500">
              <span>{validationProgressDetails.value.processedFeeds} processed</span>
              <span>{validationProgressDetails.value.totalFeeds} total</span>
            </div>
            
            {validationProgressDetails.value.currentFeed && (
              <div class="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md">
                <div class="flex items-center">
                  <svg class="h-4 w-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span class="text-xs font-medium text-slate-700">Currently Processing:</span>
                </div>
                <p class="mt-1 text-sm text-slate-600 truncate">{validationProgressDetails.value.currentFeed}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Processing without details */}
        {validationState.value === 'processing' && !validationProgressDetails.value && (
          <div class="text-center py-4">
            <svg class="animate-spin h-8 w-8 text-blue-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-blue-600 font-medium">Processing feeds...</p>
          </div>
        )}
        
        {/* Completed state */}
        {validationState.value === 'completed' && (
          <div class="text-center">
            <div class="mb-4 flex justify-center">
              <div class="rounded-full bg-green-100 p-3">
                <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 class="text-lg font-medium text-slate-900 mb-1">Validation Complete</h3>
            <p class="text-slate-600 mb-4">All feeds have been successfully validated.</p>
            <button
              type="button"
              onClick={handleValidate}
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Validate Again
            </button>
          </div>
        )}
        
        {/* Error state */}
        {validationState.value === 'error' && (
          <div class="text-center">
            <div class="mb-4 flex justify-center">
              <div class="rounded-full bg-red-100 p-3">
                <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 class="text-lg font-medium text-slate-900 mb-1">Validation Error</h3>
            <p class="text-red-600 mb-4">{validationError.value}</p>
            <button
              type="button"
              onClick={handleValidate}
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
