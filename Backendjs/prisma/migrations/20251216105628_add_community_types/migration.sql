-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CommunityType" ADD VALUE 'GAMING';
ALTER TYPE "CommunityType" ADD VALUE 'ART';
ALTER TYPE "CommunityType" ADD VALUE 'MUSIC';
ALTER TYPE "CommunityType" ADD VALUE 'TECHNOLOGY';
ALTER TYPE "CommunityType" ADD VALUE 'SPORTS';
ALTER TYPE "CommunityType" ADD VALUE 'FINANCE';
ALTER TYPE "CommunityType" ADD VALUE 'LIFESTYLE';
ALTER TYPE "CommunityType" ADD VALUE 'TRAVEL';
ALTER TYPE "CommunityType" ADD VALUE 'EDUCATION';
ALTER TYPE "CommunityType" ADD VALUE 'OTHER';
