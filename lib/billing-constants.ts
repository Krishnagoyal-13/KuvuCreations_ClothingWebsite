export const BILLING_PRODUCT_TYPES = [
  "Night suit",
  "Kurti set",
  "Unstitched suit",
  "Cordset",
  "Handloom",
  "Jewellery",
  "Cosmetic",
  "Tupperware",
] as const

export type BillingProductType = (typeof BILLING_PRODUCT_TYPES)[number]
