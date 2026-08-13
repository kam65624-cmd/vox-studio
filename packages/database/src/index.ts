import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export type { Project, Episode, Production } from "@prisma/client";
