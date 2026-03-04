const RAILWAY_API = "https://backboard.railway.com/graphql/v2";

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const token = process.env.RAILWAY_API_TOKEN;
  const projectId = process.env.RAILWAY_PROJECT_ID;
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID;

  if (!token || !projectId || !environmentId) {
    return json({ error: "Cloud deployment is not configured on the server." }, 503);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const { telegramToken, apiKey, provider, preset, name } = body;

  if (!telegramToken || !apiKey) {
    return json({ error: "telegramToken and apiKey are required." }, 400);
  }

  const serviceName = `openclaw-${(name || "agent").toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;

  try {
    const service = await railwayQuery(token, CREATE_SERVICE, {
      input: {
        projectId,
        name: serviceName,
        source: { image: "ghcr.io/openclaw/openclaw:latest" },
      },
    });

    const serviceId = service.data?.serviceCreate?.id;
    if (!serviceId) {
      console.error("serviceCreate response:", JSON.stringify(service));
      return json({ error: "Failed to create Railway service." }, 502);
    }

    const variables = {
      TELEGRAM_BOT_TOKEN: telegramToken,
      MODEL_PROVIDER: provider || "anthropic",
      MODEL_API_KEY: apiKey,
      MODEL_ID: getModelId(provider),
      AGENT_PRESET: preset || "business",
      AGENT_NAME: name || "OpenClaw Agent",
    };

    await railwayQuery(token, UPSERT_VARIABLES, {
      input: {
        projectId,
        environmentId,
        serviceId,
        variables,
      },
    });

    await railwayQuery(token, DEPLOY_SERVICE, {
      serviceId,
      environmentId,
    });

    return json({
      success: true,
      serviceName,
      serviceId,
      message: `Agent "${serviceName}" is deploying. It should be live in ~60 seconds.`,
    });
  } catch (err) {
    console.error("Railway deploy error:", err);
    return json({ error: "Deployment failed. Please try again." }, 502);
  }
}

const CREATE_SERVICE = `
  mutation serviceCreate($input: ServiceCreateInput!) {
    serviceCreate(input: $input) {
      id
      name
    }
  }
`;

const UPSERT_VARIABLES = `
  mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
    variableCollectionUpsert(input: $input)
  }
`;

const DEPLOY_SERVICE = `
  mutation serviceInstanceDeploy($serviceId: String!, $environmentId: String!) {
    serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
  }
`;

async function railwayQuery(token, query, variables) {
  const res = await fetch(RAILWAY_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Railway API ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (data.errors) {
    throw new Error(`Railway GraphQL: ${JSON.stringify(data.errors)}`);
  }
  return data;
}

function getModelId(provider) {
  switch (provider) {
    case "openai": return "gpt-4o";
    case "openrouter": return "anthropic/claude-sonnet-4-5-20250514";
    default: return "claude-sonnet-4-5-20250514";
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
