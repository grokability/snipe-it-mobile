export async function discoverOAuthClient(domain) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response;
    try {
        response = await fetch(`${domain}/api/v1/client`, {
            signal: controller.signal,
        });
    } catch {
        throw new Error('network');
    } finally {
        clearTimeout(timeoutId);
    }

    if (response.status === 404) return null;
    if (!response.ok) return null;

    try {
        const data = await response.json();
        if (!data?.client_id) return null;
        return { clientId: String(data.client_id) };
    } catch {
        return null;
    }
}
