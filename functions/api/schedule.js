export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const month = (url.searchParams.get("month") || "").trim();

  if (!month) return Response.json({ error: "Missing month" }, { status: 400 });

  const KEY = `westevents:schedule:${month}`;

  if (request.method === "GET") {
    const raw = await env.SCHEDULE_KV.get(KEY);
    if (!raw) return Response.json({ month, schedule: [] });
    return new Response(raw, { headers: { "Content-Type": "application/json" } });
  }

  if (request.method === "POST") {
    const token = request.headers.get("x-admin-token");
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const ok = await env.SCHEDULE_KV.get(`westevents:token:${token}`);
    if (!ok) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body || body.month !== month || !Array.isArray(body.schedule)) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    await env.SCHEDULE_KV.put(KEY, JSON.stringify({ month, schedule: body.schedule }));
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}