import {
  PrismaClient,
  Role,
  ExpenseCategory,
  ExpenseStatus,
} from "@prisma/client"
import bcrypt from "bcryptjs"
import { DateTime } from "luxon"

const prisma = new PrismaClient()

function createExpenseDate(dateString: string, timezone: string = "UTC") {
  const localDate = DateTime.fromISO(dateString + "T12:00:00", {
    zone: timezone,
  })
  return localDate.toUTC().toJSDate()
}
async function main() {
  console.log("🌱 Starting database seeding...")

  // Hash password for all users
  const hashedPassword = await bcrypt.hash("password123", 12)

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@expensetracker.com" },
    update: {},
    create: {
      email: "admin@expensetracker.com",
      name: "Admin Manager",
      password: hashedPassword,
      role: Role.ADMIN,
      timezone: "America/New_York",
    },
  })

  console.log("✅ Admin user created:", admin.email)

  // Create Employee Users
  const employees = await Promise.all([
    prisma.user.upsert({
      where: { email: "john.doe@expensetracker.com" },
      update: {},
      create: {
        email: "john.doe@expensetracker.com",
        name: "John Doe",
        password: hashedPassword,
        role: Role.EMPLOYEE,
        timezone: "America/Los_Angeles",
      },
    }),
    prisma.user.upsert({
      where: { email: "jane.smith@expensetracker.com" },
      update: {},
      create: {
        email: "jane.smith@expensetracker.com",
        name: "Jane Smith",
        password: hashedPassword,
        role: Role.EMPLOYEE,
        timezone: "Europe/London",
      },
    }),
    prisma.user.upsert({
      where: { email: "mike.johnson@expensetracker.com" },
      update: {},
      create: {
        email: "mike.johnson@expensetracker.com",
        name: "Mike Johnson",
        password: hashedPassword,
        role: Role.EMPLOYEE,
        timezone: 'Asia/Kolkata',
      },
    }),
  ])

  console.log(
    "✅ Employee users created:",
    employees.map((e) => e.email)
  )

  // Sample expense data
  const expenseData = [
    // John's expenses (California - America/Los_Angeles)
    {
      amount: 25.50,
      category: ExpenseCategory.FOOD,
      description: 'Team lunch at downtown restaurant',
      date: createExpenseDate('2024-07-15'),
      timezone: 'America/Los_Angeles',
      status: ExpenseStatus.APPROVED,
      userId: employees[0].id,
      processedAt: new Date('2024-07-16T10:30:00Z'),
      processedBy: admin.id,
    },
    {
      amount: 45.00,
      category: ExpenseCategory.TRANSPORT,
      description: 'Uber to client meeting',
      date: createExpenseDate('2024-07-16'),
      timezone: 'America/Los_Angeles',
      status: ExpenseStatus.PENDING,
      userId: employees[0].id,
    },
    {
      amount: 120.00,
      category: ExpenseCategory.SOFTWARE,
      description: 'Monthly subscription for design tools',
      date: createExpenseDate('2024-07-10'),
      timezone: 'America/Los_Angeles',
      status: ExpenseStatus.APPROVED,
      userId: employees[0].id,
      processedAt: new Date('2024-07-11T09:15:00Z'),
      processedBy: admin.id,
    },
    {
      amount: 85.75,
      category: ExpenseCategory.OFFICE_SUPPLIES,
      description: 'Printer cartridges and paper',
      date: createExpenseDate('2024-07-05'),
      timezone: 'America/Los_Angeles',
      status: ExpenseStatus.REJECTED,
      rejectionReason: 'Please use company supplier for office supplies',
      userId: employees[0].id,
      processedAt: new Date('2024-07-06T14:20:00Z'),
      processedBy: admin.id,
    },

    // Jane's expenses (London - Europe/London)
    {
      amount: 75.00,
      category: ExpenseCategory.TRAINING,
      description: 'Online course certification',
      date: createExpenseDate('2024-07-18'),
      timezone: 'Europe/London',
      status: ExpenseStatus.APPROVED,
      userId: employees[1].id,
      processedAt: new Date('2024-07-19T08:45:00Z'),
      processedBy: admin.id,
    },
    {
      amount: 32.50,
      category: ExpenseCategory.FOOD,
      description: 'Client dinner',
      date: createExpenseDate('2024-07-19'),
      timezone: 'Europe/London',
      status: ExpenseStatus.PENDING,
      userId: employees[1].id,
    },
    {
      amount: 150.00,
      category: ExpenseCategory.MARKETING,
      description: 'Conference registration fee',
      date: createExpenseDate('2024-07-12'),
      timezone: 'Europe/London',
      status: ExpenseStatus.APPROVED,
      userId: employees[1].id,
      processedAt: new Date('2024-07-13T11:30:00Z'),
      processedBy: admin.id,
    },
    {
      amount: 28.00,
      category: ExpenseCategory.TRANSPORT,
      description: 'Parking fees for client visit',
      date: createExpenseDate('2024-07-14'),
      timezone: 'Europe/London',
      status: ExpenseStatus.APPROVED,
      userId: employees[1].id,
      processedAt: new Date('2024-07-15T13:10:00Z'),
      processedBy: admin.id,
    },

    // Mike's expenses (India - Asia/Kolkata)
    {
      amount: 200.00,
      category: ExpenseCategory.ACCOMMODATION,
      description: 'Hotel for business trip',
      date: createExpenseDate('2024-07-20'),
      timezone: 'Asia/Kolkata',
      status: ExpenseStatus.PENDING,
      userId: employees[2].id,
    },
    {
      amount: 65.00,
      category: ExpenseCategory.ENTERTAINMENT,
      description: 'Team building dinner',
      date: createExpenseDate('2024-07-17'),
      timezone: 'Asia/Kolkata',
      status: ExpenseStatus.APPROVED,
      userId: employees[2].id,
      processedAt: new Date('2024-07-18T05:30:00Z'),
      processedBy: admin.id,
    },
    {
      amount: 90.00,
      category: ExpenseCategory.TRAVEL,
      description: 'Flight booking fee',
      date: createExpenseDate('2024-07-08'),
      timezone: 'Asia/Kolkata',
      status: ExpenseStatus.APPROVED,
      userId: employees[2].id,
      processedAt: new Date('2024-07-09T06:45:00Z'),
      processedBy: admin.id,
    },
    {
      amount: 15.50,
      category: ExpenseCategory.UTILITIES,
      description: 'Internet charges for home office',
      date: createExpenseDate('2024-07-11'),
      timezone: 'Asia/Kolkata',
      status: ExpenseStatus.PENDING,
      userId: employees[2].id,
    },

    // Admin's expenses (New York - America/New_York)
    {
      amount: 300.00,
      category: ExpenseCategory.SOFTWARE,
      description: 'Enterprise software license',
      date: createExpenseDate('2024-07-13'),
      timezone: 'America/New_York',
      status: ExpenseStatus.APPROVED,
      userId: admin.id,
      processedAt: new Date('2024-07-14T15:00:00Z'),
      processedBy: admin.id,
    },
    {
      amount: 50.00,
      category: ExpenseCategory.OTHER,
      description: 'Miscellaneous office expenses',
      date: createExpenseDate('2024-07-09'),
      timezone: 'America/New_York',
      status: ExpenseStatus.APPROVED,
      userId: admin.id,
      processedAt: new Date('2024-07-10T12:00:00Z'),
      processedBy: admin.id,
    },
  ]

  // Create expenses
  const createdExpenses = await prisma.expense.createMany({
    data: expenseData,
  })

  console.log(`✅ Created ${createdExpenses.count} sample expenses`)

  // Add some older expenses for analytics
  const olderExpenseData = [
    {
      amount: 180.00,
      category: ExpenseCategory.TRAINING,
      description: 'Workshop attendance',
      date: createExpenseDate('2024-06-15'),
      timezone: 'America/Los_Angeles',
      status: ExpenseStatus.APPROVED,
      userId: employees[0].id,
      processedAt: new Date('2024-06-16T16:20:00Z'),
      processedBy: admin.id,
    },
    {
      amount: 95.00,
      category: ExpenseCategory.FOOD,
      description: 'Client lunch meeting',
      date: createExpenseDate('2024-06-20'),
      timezone: 'Europe/London',
      status: ExpenseStatus.APPROVED,
      userId: employees[1].id,
      processedAt: new Date('2024-06-21T10:15:00Z'),
      processedBy: admin.id,
    },
    {
      amount: 250.00,
      category: ExpenseCategory.ACCOMMODATION,
      description: 'Conference hotel stay',
      date: createExpenseDate('2024-05-25'),
      timezone: 'Asia/Kolkata',
      status: ExpenseStatus.APPROVED,
      userId: employees[2].id,
      processedAt: new Date('2024-05-26T07:30:00Z'),
      processedBy: admin.id,
    },
    {
      amount: 40.00,
      category: ExpenseCategory.TRANSPORT,
      description: 'Monthly metro pass',
      date: createExpenseDate('2024-06-01'),
      timezone: 'America/Los_Angeles',
      status: ExpenseStatus.APPROVED,
      userId: employees[0].id,
      processedAt: new Date('2024-06-02T14:45:00Z'),
      processedBy: admin.id,
    },
    {
      amount: 110.00,
      category: ExpenseCategory.SOFTWARE,
      description: 'Development tools subscription',
      date: createExpenseDate('2024-05-15'),
      timezone: 'Europe/London',
      status: ExpenseStatus.APPROVED,
      userId: employees[1].id,
      processedAt: new Date('2024-05-16T09:00:00Z'),
      processedBy: admin.id,
    },
  ];

  const olderExpenses = await prisma.expense.createMany({
    data: olderExpenseData,
  });

  console.log(
    `✅ Created ${olderExpenses.count} historical expenses for analytics`
  )

  // Summary
  const totalUsers = await prisma.user.count()
  const totalExpenses = await prisma.expense.count()
  const totalAmount = await prisma.expense.aggregate({
    _sum: { amount: true },
  })
   const timezoneStats = await prisma.user.groupBy({
    by: ['timezone'],
    _count: { timezone: true },
  });

  console.log("\n📊 Seeding Summary:")
  console.log(`👥 Total Users: ${totalUsers}`)
  console.log(`💰 Total Expenses: ${totalExpenses}`)
  console.log(
    `💵 Total Amount: $${totalAmount._sum.amount?.toFixed(2) || "0.00"}`
  )
  console.log('\n🌍 User Timezone Distribution:');
  timezoneStats.forEach(stat => {
    console.log(`   ${stat.timezone}: ${stat._count.timezone} users`);
  });
  console.log("\n🔐 Test Credentials:")
  console.log("Admin: admin@expensetracker.com / password123")
  console.log("Employee 1: john.doe@expensetracker.com / password123")
  console.log("Employee 2: jane.smith@expensetracker.com / password123")
  console.log("Employee 3: mike.johnson@expensetracker.com / password123")
  console.log("\n🎉 Database seeding completed successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
