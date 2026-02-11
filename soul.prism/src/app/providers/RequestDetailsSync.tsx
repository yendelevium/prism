"use client";

import { unwrap } from "@/@types/actionResult";
import { requestToRequestItem } from "@/@types/collectionItem";
import { getCollectionByIdAction } from "@/backend/collection/collection.actions";
import { getRequestByIdAction } from "@/backend/request/request.actions";
import { useCollectionStore } from "@/stores/useCollectionStore";
import { useRequestStore } from "@/stores/useRequestStore";
import { useSelectionStore } from "@/stores/useSelectionStore";
import { useEffect } from "react";
import { toast } from "sonner";


export function RequestDetailsSync() {
    const request = useSelectionStore(s => s.request);
    const collections = useCollectionStore(s => s.collections);
    const setCollection = useSelectionStore(s => s.setCollection);
    const setLoading = useRequestStore(s => s.setLoading);
    const setRequest = useRequestStore(s => s.setRequest);

    useEffect(() => {
        if(!request) {
            return;
        }

        const loadRequest = async () => {
            try {
                setLoading(true);
                const raw = unwrap(
                    await getRequestByIdAction(request.id)
                );
                const requestItem = requestToRequestItem(raw!);
                setRequest(requestItem);
                setCollection(collections.find(c => c.id === raw!.collectionId) ?? null)
                setLoading(false);
            }
            catch (err: any) {
                toast.error(`Could not load that request: ${err.message}`);
                return;
            }

        }

        loadRequest();
    }, [request?.id, setRequest]);

    return null;
}