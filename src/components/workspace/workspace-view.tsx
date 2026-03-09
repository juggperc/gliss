"use client";

import { ChatInterface } from "@/components/chat/chat-interface";
import { CouncilActivityView } from "@/components/workspace/council-activity-view";
import { SavedLessonsView } from "@/components/workspace/saved-lessons-view";
import { useChatStore } from "@/store/use-chat-store";

export function WorkspaceView() {
  const activeView = useChatStore((state) => state.activeView);

  if (activeView === "saved-lessons") {
    return <SavedLessonsView />;
  }

  if (activeView === "council-activity") {
    return <CouncilActivityView />;
  }

  return <ChatInterface />;
}
