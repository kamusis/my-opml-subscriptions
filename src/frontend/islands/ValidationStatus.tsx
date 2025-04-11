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
    <div class="w-full max-w-4xl text-center p-4 border rounded bg-white shadow-sm min-h-[5rem]">
      <h3 class="text-lg font-medium mb-2">Validation Status</h3>
      
      {/* Idle state with validation button */}
      {validationState.value === 'idle' && (
        <div>
          <p class="text-gray-500 mb-4">Ready to validate.</p>
          <button
            type="button"
            onClick={handleValidate}
            class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={feedCount === 0}
          >
            Validate All Feeds ({feedCount})
          </button>
        </div>
      )}
      
      {/* Starting validation */}
      {validationState.value === 'starting' && <p class="text-blue-600">Initiating validation...</p>}
      
      {/* Polling for updates */}
      {validationState.value === 'polling' && <p class="text-blue-600">Connecting to status updates...</p>}
      
      {/* Processing with progress bar */}
      {validationState.value === 'processing' && validationProgressDetails.value && (
        <div class="transition-all duration-300 ease-in-out" key={lastUpdateTimestamp.value}>
          <p class="text-blue-600">Processing...</p>
          <div class="relative w-full h-6 bg-slate-300 rounded-lg overflow-hidden">
            <div 
              class="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-500 ease-out"
              style={{ 
                width: `${(validationProgressDetails.value.processedFeeds / validationProgressDetails.value.totalFeeds) * 100}%` 
              }}
            ></div>
            <div class="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
              {validationProgressDetails.value.processedFeeds} / {validationProgressDetails.value.totalFeeds}
            </div>
          </div>
          <p class="text-sm text-gray-600 mt-1 transition-opacity duration-300">
            {validationProgressDetails.value.processedFeeds} / {validationProgressDetails.value.totalFeeds} feeds processed.
          </p>
          {validationProgressDetails.value.currentFeed && (
            <p class="text-sm text-gray-500 truncate transition-all duration-300 mt-1">
              Current: <span class="font-medium">{validationProgressDetails.value.currentFeed}</span>
            </p>
          )}
        </div>
      )}
      
      {/* Processing without details */}
      {validationState.value === 'processing' && !validationProgressDetails.value && (
        <p class="text-blue-600">Processing feeds...</p>
      )}
      
      {/* Completed state */}
      {validationState.value === 'completed' && (
        <div class="text-green-600">
          <p>Validation completed successfully!</p>
          <button
            type="button"
            onClick={handleValidate}
            class="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Validate Again
          </button>
        </div>
      )}
      
      {/* Error state */}
      {validationState.value === 'error' && (
        <div class="text-red-600">
          <p>Error during validation: {validationError.value}</p>
          <button
            type="button"
            onClick={handleValidate}
            class="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
