import { z } from "zod";

export const searchFormSchema = z
  .object({
    origin: z
      .string()
      .length(3)
      .regex(/^[A-Z]{3}$/, "Code IATA invalide"),
    destination: z
      .string()
      .length(3)
      .regex(/^[A-Z]{3}$/, "Code IATA invalide"),
    departDate: z.string().min(1, "Date de départ requise"),
    returnDate: z.string().nullable().optional(),
    adults: z.number().min(1).max(9, "Entre 1 et 9 adultes"),
    children: z.number().min(0).max(8, "Entre 0 et 8 enfants"),
    infants: z.number().min(0).max(8, "Entre 0 et 8 nourrissons"),
    cabin: z
      .enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"])
      .default("ECONOMY"),
    currency: z.string().default("EUR"),
  })
  .refine(
    (data) => {
      if (data.returnDate) {
        const depart = new Date(data.departDate);
        const return_ = new Date(data.returnDate);
        return depart <= return_;
      }
      return true;
    },
    {
      message: "La date de retour doit être après la date de départ",
      path: ["returnDate"],
    }
  )
  .refine(
    (data) => {
      return data.adults + data.children + data.infants <= 9;
    },
    {
      message: "Maximum 9 passagers au total",
      path: ["adults"],
    }
  );

export const localFareAssumptionSchema = z
  .object({
    routeKey: z.string().min(1, "Clé de route requise"),
    dateFrom: z.string().min(1, "Date de début requise"),
    dateTo: z.string().min(1, "Date de fin requise"),
    carrier: z.string().optional(),
    fareDzdMin: z.number().min(0, "Prix minimum doit être positif"),
    fareDzdMax: z.number().min(0, "Prix maximum doit être positif"),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      const from = new Date(data.dateFrom);
      const to = new Date(data.dateTo);
      return from <= to;
    },
    {
      message: "La date de fin doit être après la date de début",
      path: ["dateTo"],
    }
  )
  .refine(
    (data) => {
      return data.fareDzdMax >= data.fareDzdMin;
    },
    {
      message: "Le prix maximum doit être supérieur au prix minimum",
      path: ["fareDzdMax"],
    }
  );

export const configSchema = z.object({
  eurToDzdCustomRate: z.number().min(0.1, "Taux de change doit être positif"),
  showViaAlgiers: z.boolean(),
  minSavingsPercent: z.number().min(0).max(100, "Pourcentage entre 0 et 100"),
  riskBufferMinutes: z.number().min(0, "Buffer de risque doit être positif"),
  legalDisclaimer: z.string().min(10, "Avertissement légal trop court"),
});

export type SearchFormData = z.infer<typeof searchFormSchema>;
export type LocalFareAssumptionData = z.infer<typeof localFareAssumptionSchema>;
export type ConfigData = z.infer<typeof configSchema>;
