import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  AccountType,
  LineType,
} from '../generated/prisma/client';
import { prisma } from '../src/utils/prisma';

async function main() {
  console.log('🌱 Starting database seed...');

  const user = await prisma.user.create({
    data: {
      email: `finance_admin_${Math.floor(Math.random() * 10000)}@example.com`,
    },
  });
  console.log(`✅ Created User: ${user.email}`);

  const cashAccount = await prisma.account.create({
    data: {
      name: 'Operating Cash',
      type: AccountType.ASSETS,
      userId: user.id,
    },
  });

  const capitalAccount = await prisma.account.create({
    data: {
      name: "Owner's Equity",
      type: AccountType.EQUITY,
      userId: user.id,
    },
  });
  console.log(
    `✅ Created Accounts: ${cashAccount.name}, ${capitalAccount.name}`,
  );

  const amountCents = 1000000;

  const journalEntry = await prisma.journalEntry.create({
    data: {
      date: new Date(),
      description: 'Initial Capital Investment',
      lines: {
        create: [
          {
            amount: amountCents,
            type: LineType.DEBIT,
            accountId: cashAccount.id,
          },
          {
            amount: amountCents,
            type: LineType.CREDIT,
            accountId: capitalAccount.id,
          },
        ],
      },
    },
    include: {
      lines: true,
    },
  });

  console.log(
    `✅ Created Journal Entry '${journalEntry.description}' with ${journalEntry.lines.length} transaction lines.`,
  );
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
