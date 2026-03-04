export async function onRequest(context) {
  const { request, env } = context;

  // One key for now (you can expand later by month)
  const KEY = "westevents:schedule";

  if (request.method === "GET") {
    const raw = await env.SCHEDULE_KV.get(KEY);
    if (!raw) {
      return Response.json({ schedule: [] }, { status: 200 });
    }
    return new Response(raw, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.schedule)) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Save exactly what the frontend expects
    const payload = JSON.stringify({ schedule: body.schedule, month: body.month ?? "" });

    await env.SCHEDULE_KV.put(KEY, payload);

    return Response.json({ ok: true }, { status: 200 });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}