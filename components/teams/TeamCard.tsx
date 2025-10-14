"use client";

import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
import type { Team } from "@/types";

interface TeamCardProps {
  team: Team & {
    member_count?: number;
    project_count?: number;
  };
}

export function TeamCard({ team }: TeamCardProps) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {team.name}
            </h3>
            <p className="text-sm text-gray-500">
              {team.member_count || 0} member{team.member_count !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div>
          <span className="font-semibold text-gray-900">
            {team.project_count || 0}
          </span>{" "}
          project{team.project_count !== 1 ? "s" : ""}
        </div>
      </div>
    </Link>
  );
}
