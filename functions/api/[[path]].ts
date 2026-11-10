interface PagesEnvironment {
  API_ORIGIN?: string;
}

interface PagesRequestContext {
  request: Request;
  env: PagesEnvironment;
}

const noStoreHeaders = {
  'cache-control': 'no-store',
  'content-type': 'text/plain; charset=utf-8',
};

export const onRequest = async ({ request, env }: PagesRequestContext): Promise<Response> => {
  const configuredOrigin = env.API_ORIGIN?.trim();

  if (!configuredOrigin) {
    return new Response('API origin is not configured', {
      status: 503,
      headers: noStoreHeaders,
    });
  }

  let origin: URL;
  try {
    origin = new URL(configuredOrigin);
  } catch {
    return new Response('API origin is invalid', {
      status: 503,
      headers: noStoreHeaders,
    });
  }

  if (origin.protocol !== 'https:') {
    return new Response('API origin must use HTTPS', {
      status: 503,
      headers: noStoreHeaders,
    });
  }

  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, origin);

  try {
    const upstreamResponse = await fetch(new Request(upstreamUrl, request));
    const headers = new Headers(upstreamResponse.headers);
    headers.set('cache-control', 'no-store');

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers,
    });
  } catch {
    return new Response('API is temporarily unavailable', {
      status: 502,
      headers: noStoreHeaders,
    });
  }
};
