import { useState } from "react";
import {
  FlaskConical,
  User,
  Calendar,
  MapPin,
  DollarSign,
  BookOpen,
} from "lucide-react";

export default function RAMatching() {
  const [selectedField, setSelectedField] = useState("");

  const researchPositions = [
    {
      id: 1,
      title: "Machine Learning Research Assistant",
      professor: "Dr. Sarah Chen",
      department: "Computer Science",
      description:
        "Assist with research on deep learning algorithms for computer vision applications.",
      requirements: [
        "Python",
        "PyTorch",
        "Linear Algebra",
        "Research experience preferred",
      ],
      stipend: "$2,500/month",
      hours: "15-20 hours/week",
      location: "Engineering Building, Room 301",
      startDate: "Fall 2024",
      field: "computer-science",
    },
    {
      id: 2,
      title: "Quantum Computing Research Assistant",
      professor: "Dr. Michael Rodriguez",
      department: "Physics",
      description:
        "Research quantum algorithms and their applications in cryptography.",
      requirements: [
        "Quantum Mechanics",
        "Linear Algebra",
        "Programming skills",
        "Physics background",
      ],
      stipend: "$2,200/month",
      hours: "12-15 hours/week",
      location: "Physics Lab, Room 205",
      startDate: "Spring 2024",
      field: "physics",
    },
    {
      id: 3,
      title: "Bioinformatics Research Assistant",
      professor: "Dr. Emily Johnson",
      department: "Biology",
      description:
        "Analyze genomic data using computational methods and machine learning.",
      requirements: [
        "Biology background",
        "Python/R",
        "Statistics",
        "Data analysis skills",
      ],
      stipend: "$2,000/month",
      hours: "10-15 hours/week",
      location: "Biology Research Center",
      startDate: "Summer 2024",
      field: "biology",
    },
  ];

  const filteredPositions = selectedField
    ? researchPositions.filter((pos) => pos.field === selectedField)
    : researchPositions;

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Filter by Field
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { value: "", label: "All Fields" },
            { value: "computer-science", label: "Computer Science" },
            { value: "physics", label: "Physics" },
            { value: "biology", label: "Biology" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedField(option.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedField === option.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Research Positions */}
      <div className="space-y-4">
        {filteredPositions.map((position) => (
          <div key={position.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <FlaskConical className="h-5 w-5 text-red-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    {position.title}
                  </h3>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {position.professor}
                  </span>
                  <span className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {position.department}
                  </span>
                </div>

                <p className="text-gray-700 mb-4">{position.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Requirements
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {position.requirements.map((req, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Details
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        {position.stipend}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {position.hours}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {position.location}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Start Date: {position.startDate}
                </div>
              </div>

              <div className="ml-6 flex flex-col space-y-2">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Apply Now
                </button>
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPositions.length === 0 && (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <FlaskConical className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No positions found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters or check back later for new
            opportunities.
          </p>
        </div>
      )}
    </div>
  );
}
