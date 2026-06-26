/*
  Warnings:

  - You are about to alter the column `amount` on the `BalanceTransaction` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `balanceAfter` on the `BalanceTransaction` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `balanceBefore` on the `BalanceTransaction` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `amount` on the `Deposit` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `amount` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `priceReseller` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `priceUser` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `balance` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.

*/
-- CreateTable
CREATE TABLE "Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIProvider" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AIModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "providerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "inputPricePer1K" INTEGER NOT NULL,
    "outputPricePer1K" INTEGER NOT NULL,
    "contextWindow" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIModel_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AIProvider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIApiKey" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "modelId" INTEGER,
    "keyName" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "nineRouterKey" TEXT,
    "tier" TEXT NOT NULL,
    "rateLimit" INTEGER NOT NULL,
    "monthlyQuota" INTEGER,
    "creditsBalance" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "lastUsedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AIApiKey_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AIModel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIUsage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "apiKeyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "modelId" INTEGER NOT NULL,
    "requestId" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "inputCost" INTEGER NOT NULL,
    "outputCost" INTEGER NOT NULL,
    "totalCost" INTEGER NOT NULL,
    "inputPricePer1K" INTEGER NOT NULL,
    "outputPricePer1K" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIUsage_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "AIApiKey" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AIUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AIUsage_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AIModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AITransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "apiKeyId" INTEGER,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "relatedUsageId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AITransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AITransaction_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "AIApiKey" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "agentType" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "input" TEXT,
    "output" TEXT,
    "reportPath" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "durationMs" INTEGER,
    "llmTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "llmCost" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "triggeredBy" TEXT NOT NULL DEFAULT 'cron',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AgentSchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "agentType" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "cronExpression" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" DATETIME,
    "nextRunAt" DATETIME,
    "config" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AgentReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "agentTaskId" INTEGER NOT NULL,
    "reportType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metrics" TEXT,
    "periodStart" DATETIME,
    "periodEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentReport_agentTaskId_fkey" FOREIGN KEY ("agentTaskId") REFERENCES "AgentTask" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "platform" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" DATETIME,
    "publishedAt" DATETIME,
    "postId" TEXT,
    "engagementData" TEXT,
    "promoCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "body" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AgentConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "agentType" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL DEFAULT 'https://api.openai.com/v1',
    "apiKey" TEXT,
    "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "maxTokens" INTEGER NOT NULL DEFAULT 4096,
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RevenueMetric" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "activeResellers" INTEGER NOT NULL DEFAULT 0,
    "depositTotal" INTEGER NOT NULL DEFAULT 0,
    "agentRevenue" TEXT,
    "conversionRate" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BalanceTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BalanceTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BalanceTransaction" ("amount", "balanceAfter", "balanceBefore", "createdAt", "description", "id", "referenceId", "type", "userId") SELECT "amount", "balanceAfter", "balanceBefore", "createdAt", "description", "id", "referenceId", "type", "userId" FROM "BalanceTransaction";
DROP TABLE "BalanceTransaction";
ALTER TABLE "new_BalanceTransaction" RENAME TO "BalanceTransaction";
CREATE TABLE "new_Deposit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentMethodId" INTEGER,
    "paymentProof" TEXT,
    "midtransToken" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "confirmedByUserId" INTEGER,
    "confirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Deposit_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Deposit_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Deposit" ("amount", "confirmedAt", "confirmedByUserId", "createdAt", "id", "midtransToken", "paymentMethod", "paymentMethodId", "paymentProof", "status", "updatedAt", "userId") SELECT "amount", "confirmedAt", "confirmedByUserId", "createdAt", "id", "midtransToken", "paymentMethod", "paymentMethodId", "paymentProof", "status", "updatedAt", "userId" FROM "Deposit";
DROP TABLE "Deposit";
ALTER TABLE "new_Deposit" RENAME TO "Deposit";
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "targetUrl" TEXT,
    "quantity" INTEGER,
    "accountId" INTEGER,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "providerOrderId" TEXT,
    "providerStatus" TEXT,
    "notes" TEXT,
    "selectedDuration" TEXT,
    "selectedOs" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("accountId", "amount", "createdAt", "id", "notes", "productId", "providerOrderId", "providerStatus", "quantity", "selectedDuration", "selectedOs", "status", "targetUrl", "type", "updatedAt", "userId") SELECT "accountId", "amount", "createdAt", "id", "notes", "productId", "providerOrderId", "providerStatus", "quantity", "selectedDuration", "selectedOs", "status", "targetUrl", "type", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "priceUser" INTEGER NOT NULL,
    "priceReseller" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "providerServiceId" TEXT,
    "source" TEXT,
    "jakmallProductId" TEXT,
    "categoryJakmall" TEXT,
    "weight" REAL,
    "length" REAL,
    "width" REAL,
    "height" REAL,
    "variants" JSONB,
    "imageUrl" TEXT,
    "shippingInfo" JSONB,
    "minOrder" INTEGER NOT NULL DEFAULT 1,
    "maxOrder" INTEGER NOT NULL DEFAULT 10000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "providerStatus" TEXT NOT NULL DEFAULT 'Tersedia',
    "durationOptions" TEXT,
    "osOptions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("categoryId", "createdAt", "description", "durationOptions", "id", "isActive", "maxOrder", "minOrder", "name", "osOptions", "priceReseller", "priceUser", "providerServiceId", "slug", "type", "updatedAt") SELECT "categoryId", "createdAt", "description", "durationOptions", "id", "isActive", "maxOrder", "minOrder", "name", "osOptions", "priceReseller", "priceUser", "providerServiceId", "slug", "type", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE UNIQUE INDEX "Product_jakmallProductId_key" ON "Product"("jakmallProductId");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "googleId" TEXT,
    "authProvider" TEXT NOT NULL DEFAULT 'local',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("balance", "createdAt", "email", "id", "isVerified", "name", "password", "role", "updatedAt", "verificationToken") SELECT "balance", "createdAt", "email", "id", "isVerified", "name", "password", "role", "updatedAt", "verificationToken" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AIProvider_name_key" ON "AIProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AIProvider_slug_key" ON "AIProvider"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AIModel_modelId_key" ON "AIModel"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "AIApiKey_apiKey_key" ON "AIApiKey"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "AIUsage_requestId_key" ON "AIUsage"("requestId");

-- CreateIndex
CREATE INDEX "AgentTask_agentType_idx" ON "AgentTask"("agentType");

-- CreateIndex
CREATE INDEX "AgentTask_status_idx" ON "AgentTask"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AgentSchedule_agentType_key" ON "AgentSchedule"("agentType");

-- CreateIndex
CREATE INDEX "AgentReport_reportType_idx" ON "AgentReport"("reportType");

-- CreateIndex
CREATE INDEX "SocialPost_platform_status_idx" ON "SocialPost"("platform", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ContentItem_slug_key" ON "ContentItem"("slug");

-- CreateIndex
CREATE INDEX "ContentItem_contentType_status_idx" ON "ContentItem"("contentType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AgentConfig_agentType_key" ON "AgentConfig"("agentType");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueMetric_date_key" ON "RevenueMetric"("date");

-- CreateIndex
CREATE INDEX "RevenueMetric_date_idx" ON "RevenueMetric"("date");
