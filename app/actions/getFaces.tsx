'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getFaces() {
  const faces = await prisma.face.findMany({
    where: {
      flag: 1,
    },
  });
  return faces;
}
