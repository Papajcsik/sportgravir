/** JSON fetch for the admin API. Throws an Error carrying the server's (Hungarian) message. */
export async function api<T>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    cache: "no-store",
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (res.status === 401) window.dispatchEvent(new Event("sportgravir:admin-expired"));
  if (!res.ok) throw new Error(data.error ?? "Valami nem sikerült. Próbálja újra.");
  return data;
}
