"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { Target, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { CreateTeamModal } from "@/components/teams/CreateTeamModal";
import { TeamCard } from "@/components/teams/TeamCard";
import type { Team } from "@/types";

interface TeamWithCounts extends Team {
  member_count: number;
  project_count: number;
}

export default function TeamsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [teams, setTeams] = useState<TeamWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTeams();
    }
  }, [user]);

  const fetchTeams = async () => {
    if (!user?.id) return;

    try {
      const supabase = createClient();
      console.log(user.id)
      
      // Get teams where user is a member
      const { data: teamMembers, error: membersError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id);

      if (membersError) {
        console.error("Error fetching team members:", membersError);
        setLoading(false);
        return;
      }

      if (!teamMembers || teamMembers.length === 0) {
        setTeams([]);
        setLoading(false);
        return;
      }

      const teamIds = teamMembers.map((tm: any) => tm.team_id);

      // Get team details
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .in("id", teamIds)
        .order("created_at", { ascending: false });

      if (teamsError) {
        console.error("Error fetching teams:", teamsError);
        setLoading(false);
        return;
      }

      // Get counts for each team
      const teamsWithCounts = await Promise.all(
        (teamsData || []).map(async (team: any) => {
          // Get member count
          const { count: memberCount } = await supabase
            .from("team_members")
            .select("*", { count: "exact", head: true })
            .eq("team_id", team.id);

          // Get project count
          const { count: projectCount } = await supabase
            .from("projects")
            .select("*", { count: "exact", head: true })
            .eq("team_id", team.id);

          return {
            ...team,
            member_count: memberCount || 0,
            project_count: projectCount || 0,
          } as TeamWithCounts;
        })
      );

      setTeams(teamsWithCounts);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/teams" className="flex items-center gap-2">
            <Target className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">AlignAI</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.user_metadata?.name || user?.email?.split("@")[0]}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Welcome Message (show only if no teams) */}
          {teams.length === 0 && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Welcome to AlignAI! 🎉
              </h1>
              <p className="text-blue-100">
                You&apos;ve successfully signed in. Let&apos;s start by creating
                your first team.
              </p>
            </div>
          )}

          {/* Teams Section */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Teams</h2>
                <p className="text-gray-600 text-sm mt-1">
                  {teams.length === 0
                    ? "Create or join a team to start collaborating"
                    : `Managing ${teams.length} team${teams.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="flex">
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex items-center gap-2 mr-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                      Create Team
                    </button>
                    <button
                      onClick={() => setIsJoinModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                      Join Team
                    </button>
              </div>
              
            </div>

            {/* Teams List or Empty State */}
            {teams.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Target className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No teams yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first team to start defining your product vision
                  with your teammates.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <Plus className="h-5 w-5" />
                  Create Your First Team
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {teams.map((team) => (
                  <TeamCard key={team.id} team={team} />
                ))}
              </div>
            )}
          </div>

          {/* Quick Start Guide (show only if no teams) */}
          {teams.length === 0 && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                🚀 Quick Start Guide
              </h3>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
                    1
                  </span>
                  <span>
                    <strong>Create a team</strong> - Invite your co-founders or
                    teammates
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
                    2
                  </span>
                  <span>
                    <strong>Start a project</strong> - Define your product idea
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
                    3
                  </span>
                  <span>
                    <strong>Answer AI prompts</strong> - Get guided through key
                    questions
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
                    4
                  </span>
                  <span>
                    <strong>Align with AI</strong> - Detect conflicts and build
                    consensus
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
                    5
                  </span>
                  <span>
                    <strong>Export your PRD</strong> - Share with stakeholders
                  </span>
                </li>
              </ol>
            </div>
          )}
        </div>
      </main>

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          fetchTeams(); // Refresh teams list
        }}
      />
    </div>
  );
}
