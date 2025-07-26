"use client";

import {
  BookOpen,
  TrendingUp,
  Calendar,
  Target,
  Search,
  FlaskConical,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const stats = [
  {
    name: "Courses Enrolled",
    value: "12",
    change: "+2",
    changeType: "positive",
    icon: BookOpen,
  },
  {
    name: "GPA",
    value: "3.8",
    change: "+0.2",
    changeType: "positive",
    icon: TrendingUp,
  },
  {
    name: "Research Hours",
    value: "45",
    change: "+15",
    changeType: "positive",
    icon: FlaskConical,
  },
  {
    name: "Assignments Due",
    value: "3",
    change: "-2",
    changeType: "negative",
    icon: Calendar,
  },
];

const quickActions = [
  {
    name: "Search Courses",
    description: "Find new courses to enroll in",
    icon: Search,
    href: "/search",
    color: "from-accent-muted-teal to-accent-steel-blue",
  },
  {
    name: "Research Opportunities",
    description: "Discover research positions",
    icon: FlaskConical,
    href: "/research",
    color: "from-red-600 to-red-700",
  },
  {
    name: "View Schedule",
    description: "Check your academic calendar",
    icon: Calendar,
    href: "/dashboard",
    color: "from-accent-rich-gold to-red-600",
  },
  {
    name: "Set Goals",
    description: "Track your academic progress",
    icon: Target,
    href: "/dashboard",
    color: "from-accent-steel-blue to-accent-muted-teal",
  },
];

const recentActivity = [
  {
    type: "course",
    title: "Enrolled in Advanced Machine Learning",
    time: "2 hours ago",
    status: "completed",
  },
  {
    type: "assignment",
    title: "Submitted Research Proposal",
    time: "1 day ago",
    status: "completed",
  },
  {
    type: "research",
    title: "Applied for RA Position",
    time: "2 days ago",
    status: "pending",
  },
  {
    type: "course",
    title: "Completed Data Structures Quiz",
    time: "3 days ago",
    status: "completed",
  },
];

export default function DashboardOverview() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-neutral-slate/50 backdrop-blur-sm border border-red-500/20 rounded-xl p-6 hover:border-red-500/30 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-cool-grey text-sm font-medium">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg bg-gradient-to-r ${
                  stat.icon === BookOpen
                    ? "from-red-500/20 to-red-600/20"
                    : stat.icon === TrendingUp
                    ? "from-accent-muted-teal/20 to-accent-steel-blue/20"
                    : stat.icon === FlaskConical
                    ? "from-accent-rich-gold/20 to-red-600/20"
                    : "from-accent-steel-blue/20 to-accent-muted-teal/20"
                }`}
              >
                <stat.icon
                  className={`h-6 w-6 ${
                    stat.icon === BookOpen
                      ? "text-red-500"
                      : stat.icon === TrendingUp
                      ? "text-accent-muted-teal"
                      : stat.icon === FlaskConical
                      ? "text-accent-rich-gold"
                      : "text-accent-steel-blue"
                  }`}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span
                className={`text-sm font-medium ${
                  stat.changeType === "positive"
                    ? "text-accent-muted-teal"
                    : "text-red-500"
                }`}
              >
                {stat.change}
              </span>
              <span className="text-neutral-cool-grey text-sm ml-1">
                from last month
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <a
              key={action.name}
              href={action.href}
              className="group bg-neutral-slate/30 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-r ${action.color}`}
                  >
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white group-hover:text-red-100 transition-colors">
                      {action.name}
                    </h3>
                    <p className="text-sm text-neutral-cool-grey">
                      {action.description}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-cool-grey group-hover:text-red-400 transition-colors" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">
          Recent Activity
        </h2>
        <div className="bg-neutral-slate/50 backdrop-blur-sm border border-red-500/20 rounded-xl p-6">
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {activity.status === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-accent-muted-teal" />
                  ) : (
                    <Clock className="h-5 w-5 text-accent-rich-gold" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    {activity.title}
                  </p>
                  <p className="text-sm text-neutral-cool-grey">
                    {activity.time}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === "completed"
                        ? "bg-accent-muted-teal/20 text-accent-muted-teal"
                        : "bg-accent-rich-gold/20 text-accent-rich-gold"
                    }`}
                  >
                    {activity.status === "completed" ? "Completed" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
