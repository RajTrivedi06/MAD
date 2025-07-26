import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Save } from "lucide-react";

export default function ProfileSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.user_metadata?.first_name || "",
    lastName: user?.user_metadata?.last_name || "",
    email: user?.email || "",
    major: "",
    year: "",
    interests: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Implement profile update
    setTimeout(() => setLoading(false), 1000);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-black/50 backdrop-blur-sm shadow-lg rounded-lg border border-red-500/20">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-3 mb-6">
            <User className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="text-lg font-medium text-white">
                Personal Information
              </h3>
              <p className="text-sm text-gray-300">
                Update your profile information and preferences.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-200">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-white/10 border border-red-500/20 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-white/10 border border-red-500/20 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200">
                Email
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                  className="pl-10 block w-full bg-gray-800/50 border border-red-500/20 rounded-md shadow-sm text-gray-400"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Email cannot be changed
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-200">
                  Major
                </label>
                <select
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-white/10 border border-red-500/20 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-white"
                >
                  <option value="">Select your major</option>
                  <option value="computer-science">Computer Science</option>
                  <option value="engineering">Engineering</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="physics">Physics</option>
                  <option value="biology">Biology</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200">
                  Academic Year
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-white/10 border border-red-500/20 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-white"
                >
                  <option value="">Select your year</option>
                  <option value="freshman">Freshman</option>
                  <option value="sophomore">Sophomore</option>
                  <option value="junior">Junior</option>
                  <option value="senior">Senior</option>
                  <option value="graduate">Graduate</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200">
                Academic Interests
              </label>
              <textarea
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                rows={4}
                placeholder="Describe your academic interests, research areas, or career goals..."
                className="mt-1 block w-full bg-white/10 border border-red-500/20 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-white placeholder-gray-400"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
