export async function onRequest({ request, env }) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const password = request.headers.get("x-admin-password");
  if (!password || password !== env.ADMIN_PASSWORD) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  await env.SCHEDULE_KV.put(`westevents:token:${token}`, "1", { expirationTtl: 60 * 30 });

  return Response.json({ token });
}