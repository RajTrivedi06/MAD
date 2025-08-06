import React from "react";

// Debug helper functions for React rendering issues

export const debugLog = (
  componentName: string,
  message: string,
  data?: any
) => {
  console.log(`[${componentName}] ${message}`, data || "");
};

export const debugError = (
  componentName: string,
  message: string,
  error?: any
) => {
  console.error(`[${componentName}] ERROR: ${message}`, error || "");
};

export const debugState = (
  componentName: string,
  stateName: string,
  value: any
) => {
  console.log(`[${componentName}] State "${stateName}" updated:`, value);
};

export const debugEffect = (
  componentName: string,
  effectName: string,
  dependencies: any[]
) => {
  console.log(
    `[${componentName}] Effect "${effectName}" triggered with dependencies:`,
    dependencies
  );
};

export const debugRender = (componentName: string, props?: any) => {
  console.log(
    `[${componentName}] Component rendering`,
    props ? `with props: ${JSON.stringify(props)}` : ""
  );
};

export const debugAPI = (
  componentName: string,
  endpoint: string,
  response: any
) => {
  console.log(`[${componentName}] API call to ${endpoint}:`, response);
};

export const debugAuth = (componentName: string, authState: any) => {
  console.log(`[${componentName}] Auth state changed:`, {
    user: authState.user?.id,
    loading: authState.loading,
    session: !!authState.session,
  });
};

// Hook to track component lifecycle
export const useDebugLifecycle = (componentName: string) => {
  React.useEffect(() => {
    debugLog(componentName, "Component mounted");
    return () => debugLog(componentName, "Component unmounted");
  }, [componentName]);
};

// Hook to track state changes
export const useDebugState = (
  componentName: string,
  stateName: string,
  value: any
) => {
  React.useEffect(() => {
    debugState(componentName, stateName, value);
  }, [componentName, stateName, value]);
};

// Hook to track effect dependencies
export const useDebugEffect = (
  componentName: string,
  effectName: string,
  dependencies: any[]
) => {
  React.useEffect(() => {
    debugEffect(componentName, effectName, dependencies);
  }, dependencies);
};

// Utility to check if component is mounted
export const useIsMounted = () => {
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
};

// Utility to safely set state only if component is mounted
export const useSafeState = <T>(initialValue: T) => {
  const [state, setState] = React.useState<T>(initialValue);
  const isMounted = useIsMounted();

  const safeSetState = React.useCallback(
    (value: T | ((prev: T) => T)) => {
      if (isMounted.current) {
        setState(value);
      }
    },
    [isMounted]
  );

  return [state, safeSetState] as const;
};

// Utility to debounce function calls
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  return React.useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
};

// Utility to check if we're in development mode
export const isDevelopment = process.env.NODE_ENV === "development";

// Conditional debug logging
export const devLog = (componentName: string, message: string, data?: any) => {
  if (isDevelopment) {
    debugLog(componentName, message, data);
  }
};

export const devError = (
  componentName: string,
  message: string,
  error?: any
) => {
  if (isDevelopment) {
    debugError(componentName, message, error);
  }
};
