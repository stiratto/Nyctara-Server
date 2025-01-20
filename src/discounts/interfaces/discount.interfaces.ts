import { Prisma } from "@prisma/client"

export interface Discount {
  discount_id?: string
  discount_name: string
  discount_total: Prisma.Decimal
  valid_until: Date
  createdAt?: Date
  updatedAt?: Date
}
