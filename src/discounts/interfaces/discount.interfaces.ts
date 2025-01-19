import { Prisma } from "@prisma/client"

export interface Discount {
  discount_name: string
  discount_total: Prisma.Decimal
  discount_id?: string
  createdAt: Date;
  updatedAt: Date
}
