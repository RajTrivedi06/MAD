import { useState } from "react";

interface ResearchDocument {
  id: string;
  title: string;
  type: string;
  size: string;
  uploadedAt: string;
  status: "processing" | "completed" | "error";
}

interface AnalysisResult {
  id: string;
  documentId: string;
  summary: string;
  keyPoints: string[];
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
}

const mockDocuments: ResearchDocument[] = [
  {
    id: "1",
    title: "Research Paper on AI Ethics",
    type: "PDF",
    size: "2.4 MB",
    uploadedAt: "2024-01-15",
    status: "completed",
  },
  {
    id: "2",
    title: "Machine Learning Survey",
    type: "DOCX",
    size: "1.8 MB",
    uploadedAt: "2024-01-14",
    status: "completed",
  },
  {
    id: "3",
    title: "Data Analysis Report",
    type: "PDF",
    size: "3.1 MB",
    uploadedAt: "2024-01-13",
    status: "processing",
  },
];

const mockAnalysisResults: AnalysisResult[] = [
  {
    id: "1",
    documentId: "1",
    summary:
      "This research paper discusses the ethical implications of artificial intelligence in modern society, covering topics such as bias, privacy, and accountability.",
    keyPoints: [
      "AI bias and fairness in decision-making",
      "Privacy concerns with AI data collection",
      "Accountability frameworks for AI systems",
      "Regulatory approaches to AI ethics",
    ],
    sentiment: "neutral",
    confidence: 0.87,
  },
  {
    id: "2",
    documentId: "2",
    summary:
      "A comprehensive survey of machine learning techniques and their applications in various domains including healthcare, finance, and education.",
    keyPoints: [
      "Supervised vs unsupervised learning approaches",
      "Deep learning applications in healthcare",
      "Financial risk assessment using ML",
      "Educational technology and personalized learning",
    ],
    sentiment: "positive",
    confidence: 0.92,
  },
];

export function RAFeature() {
  const [documents, setDocuments] = useState<ResearchDocument[]>(mockDocuments);
  const [analysisResults, setAnalysisResults] =
    useState<AnalysisResult[]>(mockAnalysisResults);
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);

      // Simulate file upload
      setTimeout(() => {
        const newDocument: ResearchDocument = {
          id: Date.now().toString(),
          title: files[0].name,
          type: files[0].name.split(".").pop()?.toUpperCase() || "UNKNOWN",
          size: `${(files[0].size / 1024 / 1024).toFixed(1)} MB`,
          uploadedAt: new Date().toISOString().split("T")[0],
          status: "processing",
        };

        setDocuments((prev) => [newDocument, ...prev]);
        setIsUploading(false);

        // Simulate processing completion
        setTimeout(() => {
          setDocuments((prev) =>
            prev.map((doc) =>
              doc.id === newDocument.id
                ? { ...doc, status: "completed" as const }
                : doc
            )
          );
        }, 3000);
      }, 2000);
    }
  };

  const analyzeDocument = (documentId: string) => {
    // Simulate AI analysis
    const newResult: AnalysisResult = {
      id: Date.now().toString(),
      documentId,
      summary:
        "AI-generated summary of the document content with key insights and findings.",
      keyPoints: [
        "Key finding 1 from the document",
        "Important insight 2",
        "Critical observation 3",
        "Notable conclusion 4",
      ],
      sentiment: "positive",
      confidence: 0.89,
    };

    setAnalysisResults((prev) => [newResult, ...prev]);
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Research Assistant Feature
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Upload documents and get AI-powered analysis, summaries, and
            insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Management */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Document Management
              </h2>

              {/* Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Document
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={isUploading}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {isUploading ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin h-5 w-5 text-indigo-600 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Uploading...
                      </div>
                    ) : (
                      <div>
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, DOCX, TXT up to 10MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Search Documents */}
              <div className="mb-6">
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Search Documents
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Document List */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Recent Documents
                </h3>
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedDocument === doc.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedDocument(doc.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {doc.type} • {doc.size} • {doc.uploadedAt}
                        </p>
                      </div>
                      <div className="ml-2">
                        {doc.status === "processing" && (
                          <div className="flex items-center">
                            <svg
                              className="animate-spin h-4 w-4 text-yellow-500"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          </div>
                        )}
                        {doc.status === "completed" && (
                          <svg
                            className="h-4 w-4 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        {doc.status === "error" && (
                          <svg
                            className="h-4 w-4 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Analysis Results
                </h2>
                {selectedDocument && (
                  <button
                    onClick={() => analyzeDocument(selectedDocument)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Analyze Document
                  </button>
                )}
              </div>

              {selectedDocument ? (
                <div className="space-y-6">
                  {analysisResults
                    .filter((result) => result.documentId === selectedDocument)
                    .map((result) => (
                      <div
                        key={result.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            Analysis Summary
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                result.sentiment === "positive"
                                  ? "bg-green-100 text-green-800"
                                  : result.sentiment === "negative"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {result.sentiment}
                            </span>
                            <span className="text-sm text-gray-500">
                              Confidence: {(result.confidence * 100).toFixed(0)}
                              %
                            </span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Summary
                          </h4>
                          <p className="text-gray-600">{result.summary}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Key Points
                          </h4>
                          <ul className="space-y-1">
                            {result.keyPoints.map((point, index) => (
                              <li key={index} className="flex items-start">
                                <svg
                                  className="h-4 w-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="text-gray-600">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}

                  {analysisResults.filter(
                    (result) => result.documentId === selectedDocument
                  ).length === 0 && (
                    <div className="text-center py-12">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No analysis yet
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Click &quot;Analyze Document&quot; to get started.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Select a document
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose a document from the list to view its analysis.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
