import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, BookOpen } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class PrerequisiteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      "Prerequisite Error Boundary caught an error:",
      error,
      errorInfo
    );

    this.setState({
      error,
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="h-[600px] bg-gray-50 rounded-lg border flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500" />
            <div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">
                Something went wrong
              </h3>
              <p className="text-gray-600 mb-4">
                We encountered an error while loading the prerequisite graph.
                This might be due to a temporary issue or complex prerequisite
                data.
              </p>
              {this.state.error && (
                <details className="text-left mb-4">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Fallback component for courses with no prerequisites
export const NoPrerequisitesFallback: React.FC<{ courseCode?: string }> = ({
  courseCode,
}) => (
  <div className="h-[600px] bg-gray-50 rounded-lg border flex items-center justify-center">
    <div className="text-center">
      <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h3 className="font-semibold text-gray-900 text-lg mb-2">
        No Prerequisites Found
      </h3>
      <p className="text-gray-600 mb-2">
        {courseCode
          ? `${courseCode} has no prerequisite requirements.`
          : "This course has no prerequisite requirements."}
      </p>
      <p className="text-sm text-gray-500">
        You can enroll in this course directly.
      </p>
    </div>
  </div>
);

// Fallback component for loading errors
export const LoadingErrorFallback: React.FC<{
  error?: string;
  onRetry?: () => void;
  courseCode?: string;
}> = ({ error, onRetry, courseCode }) => (
  <div className="h-[600px] bg-gray-50 rounded-lg border flex items-center justify-center">
    <div className="flex flex-col items-center gap-4 text-center max-w-md">
      <AlertCircle className="w-12 h-12 text-red-500" />
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">
          Unable to Load Prerequisites
        </h3>
        <p className="text-gray-600 mb-4">
          {error ||
            "We couldn't load the prerequisite information for this course."}
        </p>
        {courseCode && (
          <p className="text-sm text-gray-500">Course: {courseCode}</p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  </div>
);

// Fallback component for complex prerequisite errors
export const ComplexPrerequisiteFallback: React.FC<{
  courseCode?: string;
  onShowSimple?: () => void;
}> = ({ courseCode, onShowSimple }) => (
  <div className="h-[600px] bg-gray-50 rounded-lg border flex items-center justify-center">
    <div className="flex flex-col items-center gap-4 text-center max-w-md">
      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-yellow-600" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">
          Complex Prerequisites Detected
        </h3>
        <p className="text-gray-600 mb-4">
          {courseCode
            ? `${courseCode} has complex prerequisite requirements`
            : "This course has complex prerequisite requirements"}
          that couldn't be displayed in the interactive graph.
        </p>
        <p className="text-sm text-gray-500">
          The prerequisite information may include advanced logic or circular
          dependencies.
        </p>
      </div>
      {onShowSimple && (
        <button
          onClick={onShowSimple}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          Show Simple View
        </button>
      )}
    </div>
  </div>
);
