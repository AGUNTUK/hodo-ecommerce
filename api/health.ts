export type HealthPayload = {
  ok: true;
  service: string;
  timestamp: string;
  env: "production" | "preview" | "development";
};

export function getHealth(): HealthPayload {
  const env =
    (process.env.VERCEL_ENV as HealthPayload["env"]) ||
    (process.env.NODE_ENV === "production" ? "production" : "development");
  return {
    ok: true,
    service: "hodo-api",
    timestamp: new Date().toISOString(),
    env,
  };
}

type Res =
  | {
      statusCode?: number;
      setHeader?: (name: string, value: string) => void;
      end?: (body?: string) => void;
    }
  | {
      status: (code: number) => { json: (data: unknown) => void };
    };

export default function handler(_req: unknown, res: Res) {
  const payload = getHealth();
  const body = JSON.stringify(payload);
  try {
    if ("statusCode" in (res as any)) {
      (res as any).statusCode = 200;
      (res as any).setHeader?.("Content-Type", "application/json");
      (res as any).end?.(body);
      return;
    }
  } catch {}
  if (typeof (res as any).status === "function") {
    (res as any).status(200).json(payload);
  }
}
