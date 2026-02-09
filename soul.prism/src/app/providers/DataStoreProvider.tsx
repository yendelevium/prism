"use client";

import { useRef } from "react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { Workspace } from "@/@types/workspace";
import { useSelectionStore } from "@/stores/useSelectionStore";

export default function DataStoreProvider({ workspaces, children }: {workspaces: Workspace[], children: React.ReactNode}) {
    const initialized = useRef(false);

    if (!initialized.current) {
        useWorkspaceStore.setState({ workspaces: workspaces });
        useSelectionStore.setState({
            workspace: workspaces[0] ?? null,
            collection: null,
            request: null,
        });
        initialized.current = true;
    }

    return children;
}