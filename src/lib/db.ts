import postgres from "postgres";
const globalDb = globalThis as unknown as {
  gallerySql?: ReturnType<typeof postgres>;
};
export const sql =
  globalDb.gallerySql ??
  postgres(process.env.DATABASE_URL ?? "postgresql://localhost/gallery", {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });
if (process.env.NODE_ENV !== "production") globalDb.gallerySql = sql;
