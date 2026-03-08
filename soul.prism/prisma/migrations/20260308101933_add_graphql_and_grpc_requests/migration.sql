-- CreateTable
CREATE TABLE "GraphQLRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "variables" TEXT,
    "operationName" TEXT,
    "headers" JSONB,
    "collectionId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GraphQLRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GRPCRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serverAddress" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "protoFile" TEXT NOT NULL,
    "metadata" JSONB,
    "useTls" BOOLEAN NOT NULL DEFAULT false,
    "body" TEXT,
    "collectionId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GRPCRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GraphQLRequest" ADD CONSTRAINT "GraphQLRequest_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphQLRequest" ADD CONSTRAINT "GraphQLRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GRPCRequest" ADD CONSTRAINT "GRPCRequest_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GRPCRequest" ADD CONSTRAINT "GRPCRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
