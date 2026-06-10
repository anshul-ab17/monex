import { prisma } from "@repo/db";

const user = await prisma.user.findUnique({
  where: {
    id: 1,
  },
});