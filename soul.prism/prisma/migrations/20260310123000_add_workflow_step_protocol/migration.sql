CREATE TYPE "WorkflowRequestProtocol" AS ENUM ('REST', 'GRAPHQL', 'GRPC');

ALTER TABLE "WorkflowStep"
ADD COLUMN "protocol" "WorkflowRequestProtocol" NOT NULL DEFAULT 'REST';
