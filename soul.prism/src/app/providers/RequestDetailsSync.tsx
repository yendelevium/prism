"use client";

import { unwrap } from "@/@types/actionResult";
import { requestToRequestItem } from "@/@types/collectionItem";
import { getRequestByIdAction } from "@/backend/request/request.actions";
import { useRequestStore } from "@/stores/useRequestStore";
import { useSelectionStore } from "@/stores/useSelectionStore";
import { useEffect } from "react";
import { toast } from "sonner";


export function RequestDetailsSync() {
    const request = useSelectionStore(s => s.request);
    const setRequest = useRequestStore(s => s.setRequest);

    useEffect(() => {
        if(!request) {
            return;
        }

        const loadRequest = async () => {
            const raw = unwrap(
                await getRequestByIdAction(request.id)
            );

            if (!raw) {
                toast.error("Could not load that request");
                return;
            }

            const requestItem = requestToRequestItem(raw!);

            setRequest(requestItem);
        }

        loadRequest();
    }, [request?.id, setRequest]);

    return null;
}