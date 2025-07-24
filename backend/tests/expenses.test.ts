import request from "supertest"
import { describe,it,beforeEach,expect } from "@jest/globals"
import app from "../src/server"
import { prisma } from "../src/lib/prisma"
import { Role, ExpenseCategory, ExpenseStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

describe("Expense Routes", () => {
  let employeeToken: string
  let adminToken: string
  let employeeId: string
  let adminId: string

  beforeEach(async () => {
    // Create test users
    const employee = await prisma.user.create({
      data: {
        email: "employee@test.com",
        name: "Test Employee",
        password: await bcrypt.hash("Password123", 12),
        role: Role.EMPLOYEE,
      },
    })

    const admin = await prisma.user.create({
      data: {
        email: "admin@test.com",
        name: "Test Admin",
        password: await bcrypt.hash("Password123", 12),
        role: Role.ADMIN,
      },
    })

    employeeId = employee.id
    adminId = admin.id

    // Get tokens
    const employeeLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "employee@test.com", password: "Password123" })

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@test.com", password: "Password123" })

    employeeToken = employeeLogin.body.data.token
    adminToken = adminLogin.body.data.token
  })

  describe("POST /api/expenses", () => {
    it("should create expense with valid data", async () => {
      const expenseData = {
        amount: 50.0,
        category: ExpenseCategory.FOOD,
        description: "Team lunch",
        date: "2024-07-20",
      }

      const response = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(expenseData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.amount).toBe(expenseData.amount)
      expect(response.body.data.category).toBe(expenseData.category)
      expect(response.body.data.userId).toBe(employeeId)
    })

    it("should not create expense with invalid amount", async () => {
      const expenseData = {
        amount: -50.0, // Negative amount
        category: ExpenseCategory.FOOD,
        description: "Team lunch",
        date: "2024-07-20",
      }

      const response = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(expenseData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it("should not create expense without authentication", async () => {
      const expenseData = {
        amount: 50.0,
        category: ExpenseCategory.FOOD,
        description: "Team lunch",
        date: "2024-07-20",
      }

      const response = await request(app)
        .post("/api/expenses")
        .send(expenseData)
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it("should not create expense with future date", async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)

      const expenseData = {
        amount: 50.0,
        category: ExpenseCategory.FOOD,
        description: "Team lunch",
        date: futureDate.toISOString().split("T")[0],
      }

      const response = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(expenseData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe("GET /api/expenses", () => {
    beforeEach(async () => {
      // Create test expenses
      await prisma.expense.createMany({
        data: [
          {
            amount: 50.0,
            category: ExpenseCategory.FOOD,
            description: "Lunch 1",
            date: new Date("2024-07-20"),
            userId: employeeId,
            status: ExpenseStatus.PENDING,
          },
          {
            amount: 75.0,
            category: ExpenseCategory.TRANSPORT,
            description: "Taxi",
            date: new Date("2024-07-19"),
            userId: employeeId,
            status: ExpenseStatus.APPROVED,
          },
          {
            amount: 100.0,
            category: ExpenseCategory.FOOD,
            description: "Admin lunch",
            date: new Date("2024-07-18"),
            userId: adminId,
            status: ExpenseStatus.PENDING,
          },
        ],
      })
    })

    it("should get employee expenses (employee only sees own)", async () => {
      const response = await request(app)
        .get("/api/expenses")
        .set("Authorization", `Bearer ${employeeToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.data).toHaveLength(2)
      expect(
        response.body.data.data.every((exp: any) => exp.userId === employeeId)
      ).toBe(true)
    })

    it("should get all expenses for admin", async () => {
      const response = await request(app)
        .get("/api/expenses")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.data).toHaveLength(3)
    })

    it("should filter expenses by status", async () => {
      const response = await request(app)
        .get("/api/expenses?status=PENDING")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.data).toHaveLength(2)
      expect(
        response.body.data.data.every(
          (exp: any) => exp.status === ExpenseStatus.PENDING
        )
      ).toBe(true)
    })

    it("should filter expenses by category", async () => {
      const response = await request(app)
        .get("/api/expenses?category=FOOD")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.data).toHaveLength(2)
      expect(
        response.body.data.data.every(
          (exp: any) => exp.category === ExpenseCategory.FOOD
        )
      ).toBe(true)
    })

    it("should paginate expenses", async () => {
      const response = await request(app)
        .get("/api/expenses?page=1&limit=2")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.data).toHaveLength(2)
      expect(response.body.data.pagination.page).toBe(1)
      expect(response.body.data.pagination.limit).toBe(2)
      expect(response.body.data.pagination.total).toBe(3)
    })
  })

  describe("GET /api/expenses/:id", () => {
    let expenseId: string

    beforeEach(async () => {
      const expense = await prisma.expense.create({
        data: {
          amount: 50.0,
          category: ExpenseCategory.FOOD,
          description: "Test expense",
          date: new Date("2024-07-20"),
          userId: employeeId,
        },
      })
      expenseId = expense.id
    })

    it("should get expense by ID for owner", async () => {
      const response = await request(app)
        .get(`/api/expenses/${expenseId}`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(expenseId)
    })

    it("should get expense by ID for admin", async () => {
      const response = await request(app)
        .get(`/api/expenses/${expenseId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(expenseId)
    })

    it("should not get expense for non-owner employee", async () => {
      // Create another employee
      const otherEmployee = await prisma.user.create({
        data: {
          email: "other@test.com",
          name: "Other Employee",
          password: await bcrypt.hash("Password123", 12),
          role: Role.EMPLOYEE,
        },
      })

      const otherLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: "other@test.com", password: "Password123" })

      const response = await request(app)
        .get(`/api/expenses/${expenseId}`)
        .set("Authorization", `Bearer ${otherLogin.body.data.token}`)
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })

  describe("PUT /api/expenses/:id", () => {
    let expenseId: string

    beforeEach(async () => {
      const expense = await prisma.expense.create({
        data: {
          amount: 50.0,
          category: ExpenseCategory.FOOD,
          description: "Test expense",
          date: new Date("2024-07-20"),
          userId: employeeId,
          status: ExpenseStatus.PENDING,
        },
      })
      expenseId = expense.id
    })

    it("should update pending expense", async () => {
      const updateData = {
        amount: 75.0,
        description: "Updated expense",
      }

      const response = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.amount).toBe(updateData.amount)
      expect(response.body.data.description).toBe(updateData.description)
    })

    it("should not update approved expense", async () => {
      // Update expense to approved
      await prisma.expense.update({
        where: { id: expenseId },
        data: { status: ExpenseStatus.APPROVED },
      })

      const updateData = {
        amount: 75.0,
      }

      const response = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(updateData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe("Only pending expenses can be updated")
    })
  })

  describe("DELETE /api/expenses/:id", () => {
    let expenseId: string

    beforeEach(async () => {
      const expense = await prisma.expense.create({
        data: {
          amount: 50.0,
          category: ExpenseCategory.FOOD,
          description: "Test expense",
          date: new Date("2024-07-20"),
          userId: employeeId,
          status: ExpenseStatus.PENDING,
        },
      })
      expenseId = expense.id
    })

    it("should delete pending expense", async () => {
      const response = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verify expense is deleted
      const deletedExpense = await prisma.expense.findUnique({
        where: { id: expenseId },
      })
      expect(deletedExpense).toBeNull()
    })

    it("should not delete approved expense", async () => {
      // Update expense to approved
      await prisma.expense.update({
        where: { id: expenseId },
        data: { status: ExpenseStatus.APPROVED },
      })

      const response = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe("PUT /api/expenses/:id/approve-reject", () => {
    let expenseId: string

    beforeEach(async () => {
      const expense = await prisma.expense.create({
        data: {
          amount: 50.0,
          category: ExpenseCategory.FOOD,
          description: "Test expense",
          date: new Date("2024-07-20"),
          userId: employeeId,
          status: ExpenseStatus.PENDING,
        },
      })
      expenseId = expense.id
    })

    it("should approve expense (admin only)", async () => {
      const approvalData = {
        status: ExpenseStatus.APPROVED,
      }

      const response = await request(app)
        .put(`/api/expenses/${expenseId}/approve-reject`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(approvalData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe(ExpenseStatus.APPROVED)
    })

    it("should reject expense with reason (admin only)", async () => {
      const rejectionData = {
        status: ExpenseStatus.REJECTED,
        rejectionReason: "Invalid receipt provided",
      }

      const response = await request(app)
        .put(`/api/expenses/${expenseId}/approve-reject`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(rejectionData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe(ExpenseStatus.REJECTED)
      expect(response.body.data.rejectionReason).toBe(
        rejectionData.rejectionReason
      )
    })

    it("should not allow employee to approve/reject", async () => {
      const approvalData = {
        status: ExpenseStatus.APPROVED,
      }

      const response = await request(app)
        .put(`/api/expenses/${expenseId}/approve-reject`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(approvalData)
        .expect(403)

      expect(response.body.success).toBe(false)
    })

    it("should require rejection reason when rejecting", async () => {
      const rejectionData = {
        status: ExpenseStatus.REJECTED,
        // Missing rejectionReason
      }

      const response = await request(app)
        .put(`/api/expenses/${expenseId}/approve-reject`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(rejectionData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe("GET /api/analytics/expenses", () => {
    beforeEach(async () => {
      // Create test expenses for analytics
      await prisma.expense.createMany({
        data: [
          {
            amount: 50.0,
            category: ExpenseCategory.FOOD,
            description: "Lunch",
            date: new Date("2024-07-20"),
            userId: employeeId,
            status: ExpenseStatus.APPROVED,
          },
          {
            amount: 75.0,
            category: ExpenseCategory.FOOD,
            description: "Dinner",
            date: new Date("2024-07-19"),
            userId: employeeId,
            status: ExpenseStatus.APPROVED,
          },
          {
            amount: 100.0,
            category: ExpenseCategory.TRANSPORT,
            description: "Taxi",
            date: new Date("2024-07-18"),
            userId: employeeId,
            status: ExpenseStatus.PENDING,
          },
        ],
      })
    })

    it("should get analytics for employee (own expenses only)", async () => {
      const response = await request(app)
        .get("/api/analytics/expenses")
        .set("Authorization", `Bearer ${employeeToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.totalExpenses).toBe(3)
      expect(response.body.data.totalAmount).toBe(225.0)
      expect(response.body.data.expensesByCategory).toHaveLength(2) // FOOD and TRANSPORT
      expect(response.body.data.expensesByStatus).toHaveLength(2) // APPROVED and PENDING
    })

    it("should get analytics for admin (all expenses)", async () => {
      const response = await request(app)
        .get("/api/analytics/expenses")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.totalExpenses).toBeGreaterThanOrEqual(3)
      expect(response.body.data.expensesByCategory).toBeDefined()
      expect(response.body.data.expensesByStatus).toBeDefined()
    })
  })
})
