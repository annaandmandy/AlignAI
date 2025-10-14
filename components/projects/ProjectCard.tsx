"use client";

import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  teamId: string;
}

export function ProjectCard({ project, teamId }: ProjectCardProps) {
  return (
    <Link
      href={`/teams/${teamId}/projects/${project.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-200 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors flex-shrink-0">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {project.name}
            </h4>
            {project.description && (
              <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
      </div>

      <div className="text-xs text-gray-500">
        Updated {formatRelativeTime(project.updated_at)}
      </div>
    </Link>
  );
}
