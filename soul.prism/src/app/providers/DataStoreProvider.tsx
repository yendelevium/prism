"use client";

import { useRef } from "react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { Workspace } from "@/@types/workspace";

export default function DataStoreProvider({ workspaces, children }: {workspaces: Workspace[], children: React.ReactNode}) {
    const initialized = useRef(false);

    if (!initialized.current) {
        useWorkspaceStore.setState({ workspaces: workspaces });
        initialized.current = true;
    }

    return children;
}