"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { Target, LogOut, ArrowLeft, CheckCircle, Circle } from "lucide-react";
import Link from "next/link";
import type { Project, Section } from "@/types";

const SECTION_INFO = {
  problem: {
    title: "Problem Statement",
    description: "Define the core problem you're solving",
    icon: "🎯",
  },
  target_users: {
    title: "Target Users",
    description: "Identify who will use your product",
    icon: "👥",
  },
  vision: {
    title: "Vision & Solution",
    description: "Articulate your product vision",
    icon: "💡",
  },
  features: {
    title: "Key Features",
    description: "List essential product features",
    icon: "⚡",
  },
  competitors: {
    title: "Competitors",
    description: "Analyze the competitive landscape",
    icon: "🏆",
  },
  differentiation: {
    title: "Differentiation",
    description: "Define your unique value proposition",
    icon: "✨",
  },
  tech_stack: {
    title: "Tech Stack",
    description: "Plan your technical approach",
    icon: "🔧",
  },
};

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { teamId, projectId } = params as { teamId: string; projectId: string };
  const { user, loading: authLoading, signOut } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [responseContent, setResponseContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [completedSections, setCompletedSections] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (user && projectId) {
      fetchProjectData();
    }
  }, [user, projectId]);

  useEffect(() => {
    if (selectedSection) {
      fetchAIPrompts();
      fetchResponses();
      fetchUserResponse();
    }
  }, [selectedSection]);

  useEffect(() => {
    if (user && sections.length > 0) {
      fetchCompletedSections();
    }
  }, [user, sections]);

  const fetchProjectData = async () => {
    try {
      const supabase = createClient();

      // Get project details
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) {
        console.error("Error fetching project:", projectError);
        router.push(`/teams/${teamId}`);
        return;
      }

      setProject(projectData);

      // Get sections for this project
      const { data: sectionsData, error: sectionsError } = await supabase
        .from("sections")
        .select("*")
        .eq("project_id", projectId)
        .order("order", { ascending: true });

      if (sectionsError) {
        console.error("Error fetching sections:", sectionsError);
      } else {
        setSections(sectionsData || []);
        // Select first section by default
        if (sectionsData && sectionsData.length > 0) {
          setSelectedSection(sectionsData[0]);
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIPrompts = async () => {
    if (!selectedSection || !user) return;

    setLoadingPrompts(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sectionType: selectedSection.type,
          projectContext: project?.description || "",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiPrompts(data.questions || []);
      }
    } catch (error) {
      console.error("Error fetching AI prompts:", error);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const fetchResponses = async () => {
    if (!selectedSection || !user) return;

    setLoadingResponses(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch(
        `/api/responses?sectionId=${selectedSection.id}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResponses(data.responses || []);
      }
    } catch (error) {
      console.error("Error fetching responses:", error);
    } finally {
      setLoadingResponses(false);
    }
  };

  const fetchUserResponse = async () => {
    if (!selectedSection || !user) return;

    try {
      const supabase = createClient();
      const { data: userResponse } = await supabase
        .from("responses")
        .select("content")
        .eq("section_id", selectedSection.id)
        .eq("user_id", user.id)
        .maybeSingle();

      setResponseContent(userResponse?.content || "");
    } catch (error) {
      console.error("Error fetching user response:", error);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedSection || !user || !responseContent.trim()) return;

    setSavingDraft(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch("/api/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sectionId: selectedSection.id,
          content: responseContent,
          isDraft: true,
        }),
      });

      if (response.ok) {
        // Show success feedback (you can add a toast notification here)
        console.log("Draft saved successfully");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedSection || !user || !responseContent.trim()) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch("/api/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sectionId: selectedSection.id,
          content: responseContent,
          isDraft: false,
        }),
      });

      if (response.ok) {
        // Refresh responses to show the new one
        await fetchResponses();
        // Update completed sections
        await fetchCompletedSections();
        // Show success feedback
        console.log("Response submitted successfully");
      }
    } catch (error) {
      console.error("Error submitting response:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchCompletedSections = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { data: userResponses } = await supabase
        .from("responses")
        .select("section_id")
        .eq("user_id", user.id)
        .eq("is_draft", false);

      if (userResponses) {
        const completedIds = new Set(
          userResponses.map((r) => r.section_id)
        );
        setCompletedSections(completedIds);
      }
    } catch (error) {
      console.error("Error fetching completed sections:", error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
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
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link
            href={`/teams/${teamId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Team
          </Link>

          {/* Project Header */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-gray-600">{project.description}</p>
            )}
          </div>

          {/* Main Layout: Sidebar + Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Section Navigation Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-24">
                <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                  Product Sections
                </h2>
                <nav className="space-y-2">
                  {sections.map((section) => {
                    const info = SECTION_INFO[section.type];
                    const isActive = selectedSection?.id === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setSelectedSection(section)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                          isActive
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-2xl">{info?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {info?.title || section.title}
                          </p>
                        </div>
                        {isActive ? (
                          <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        ) : completedSections.has(section.id) ? (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </nav>

                {/* Progress */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-gray-900">
                      {completedSections.size}/{sections.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          sections.length > 0
                            ? (completedSections.size / sections.length) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Content Area */}
            <div className="lg:col-span-3">
              {selectedSection ? (
                <div className="bg-white rounded-xl shadow-sm border p-8">
                  {/* Section Header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl">
                        {SECTION_INFO[selectedSection.type]?.icon}
                      </span>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {SECTION_INFO[selectedSection.type]?.title}
                        </h2>
                        <p className="text-gray-600">
                          {SECTION_INFO[selectedSection.type]?.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Prompts Section */}
                  <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      💭 AI Guided Questions
                    </h3>
                    {loadingPrompts ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                        <span className="ml-3 text-gray-600">
                          Generating questions...
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {aiPrompts.length > 0 ? (
                          aiPrompts.map((question, index) => (
                            <p key={index} className="text-gray-700">
                              • {question}
                            </p>
                          ))
                        ) : (
                          <p className="text-gray-600 italic">
                            No questions available
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Response Form */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      ✍️ Your Response
                    </h3>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      rows={8}
                      placeholder="Share your thoughts and ideas here..."
                      value={responseContent}
                      onChange={(e) => setResponseContent(e.target.value)}
                      disabled={submitting || savingDraft}
                    />
                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={handleSaveDraft}
                        disabled={
                          savingDraft ||
                          submitting ||
                          !responseContent.trim()
                        }
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingDraft ? "Saving..." : "Save Draft"}
                      </button>
                      <button
                        onClick={handleSubmitResponse}
                        disabled={
                          submitting ||
                          savingDraft ||
                          !responseContent.trim()
                        }
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Submitting..." : "Submit Response"}
                      </button>
                    </div>
                  </div>

                  {/* Team Responses */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      👥 Team Responses
                    </h3>
                    {loadingResponses ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                        <span className="ml-3 text-gray-600">
                          Loading responses...
                        </span>
                      </div>
                    ) : responses.length > 0 ? (
                      <div className="space-y-4">
                        {responses.map((response) => (
                          <div
                            key={response.id}
                            className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                {response.user?.name?.[0]?.toUpperCase() ||
                                  response.user?.email?.[0]?.toUpperCase() ||
                                  "?"}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {response.user?.name || response.user?.email}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(
                                    response.created_at
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(
                                    response.created_at
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {response.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No responses yet. Be the first to share your thoughts!
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                  <p className="text-gray-500">Select a section to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
