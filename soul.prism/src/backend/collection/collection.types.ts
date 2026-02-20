export interface Collection {
  id: string;
  name: string;
  workspaceId: string;
  createdById: string;
  createdAt: Date;
}

export interface CreateCollectionInput {
  name: string;
  workspaceId: string;
}

export interface UpdateCollectionInput {
  name: string;
}

export interface CollectionResponse {
  data: Collection | Collection[];
}
