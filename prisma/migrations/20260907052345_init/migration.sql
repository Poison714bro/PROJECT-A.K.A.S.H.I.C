-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ANALYST',
    "clearanceLevel" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelEntity" (
    "id" TEXT NOT NULL,
    "primaryAlias" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL,
    "lastActive" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "rawData" JSONB,

    CONSTRAINT "IntelEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CryptoWallet" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "observedVolumeUSD" DOUBLE PRECISION NOT NULL,
    "entityId" TEXT NOT NULL,

    CONSTRAINT "CryptoWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PGPKey" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "shortKeyId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,

    CONSTRAINT "PGPKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedEntry" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "severity" TEXT NOT NULL,
    "rawData" JSONB,
    "entityId" TEXT,

    CONSTRAINT "FeedEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawIngestLog" (
    "id" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "errorLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawIngestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapIncident" (
    "id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "label" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "drugCategory" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "originRoute" TEXT,
    "entityId" TEXT,

    CONSTRAINT "MapIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraphEdge" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "strength" DOUBLE PRECISION,

    CONSTRAINT "GraphEdge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "IntelEntity_category_idx" ON "IntelEntity"("category");

-- CreateIndex
CREATE INDEX "IntelEntity_riskScore_idx" ON "IntelEntity"("riskScore");

-- CreateIndex
CREATE INDEX "IntelEntity_status_idx" ON "IntelEntity"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CryptoWallet_address_key" ON "CryptoWallet"("address");

-- CreateIndex
CREATE UNIQUE INDEX "PGPKey_fingerprint_key" ON "PGPKey"("fingerprint");

-- CreateIndex
CREATE INDEX "FeedEntry_timestamp_idx" ON "FeedEntry"("timestamp");

-- CreateIndex
CREATE INDEX "FeedEntry_sourceType_idx" ON "FeedEntry"("sourceType");

-- CreateIndex
CREATE INDEX "FeedEntry_severity_idx" ON "FeedEntry"("severity");

-- CreateIndex
CREATE INDEX "MapIncident_date_idx" ON "MapIncident"("date");

-- CreateIndex
CREATE INDEX "MapIncident_drugCategory_idx" ON "MapIncident"("drugCategory");

-- AddForeignKey
ALTER TABLE "CryptoWallet" ADD CONSTRAINT "CryptoWallet_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "IntelEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PGPKey" ADD CONSTRAINT "PGPKey_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "IntelEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedEntry" ADD CONSTRAINT "FeedEntry_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "IntelEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapIncident" ADD CONSTRAINT "MapIncident_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "IntelEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphEdge" ADD CONSTRAINT "GraphEdge_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "IntelEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphEdge" ADD CONSTRAINT "GraphEdge_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "IntelEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
