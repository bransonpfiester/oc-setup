export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return json(null, 204);
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const serverIp = process.env.HETZNER_SERVER_IP;
  const sshKey = process.env.HETZNER_SSH_PRIVATE_KEY;

  if (!serverIp || !sshKey) {
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

  const safeName = (name || "agent")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 30);
  const containerName = `openclaw-${safeName}-${Date.now().toString(36)}`;
  const modelId = getModelId(provider);

  const dockerCmd = [
    "docker run -d",
    `--name ${containerName}`,
    "--restart unless-stopped",
    `--memory=256m`,
    `--cpus=0.25`,
    `-e TELEGRAM_BOT_TOKEN='${escapeShell(telegramToken)}'`,
    `-e MODEL_PROVIDER='${escapeShell(provider || "anthropic")}'`,
    `-e MODEL_API_KEY='${escapeShell(apiKey)}'`,
    `-e MODEL_ID='${escapeShell(modelId)}'`,
    `-e AGENT_PRESET='${escapeShell(preset || "business")}'`,
    `-e AGENT_NAME='${escapeShell(name || "OpenClaw Agent")}'`,
    "ghcr.io/openclaw/openclaw:latest",
  ].join(" ");

  try {
    const result = await sshExec(serverIp, sshKey, dockerCmd);

    if (result.exitCode !== 0) {
      console.error("Docker run failed:", result.stderr);
      return json({ error: "Failed to start agent container." }, 502);
    }

    const containerId = result.stdout.trim().slice(0, 12);

    return json({
      success: true,
      containerName,
      containerId,
      message: `Agent "${containerName}" is running on the cloud server.`,
    });
  } catch (err) {
    console.error("SSH deploy error:", err);
    return json({ error: "Could not connect to cloud server." }, 502);
  }
}

async function sshExec(host, privateKey, command) {
  const { Client } = await import("ssh2");

  return new Promise((resolve, reject) => {
    const conn = new Client();
    let stdout = "";
    let stderr = "";

    conn
      .on("ready", () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }
          stream.on("data", (data) => { stdout += data.toString(); });
          stream.stderr.on("data", (data) => { stderr += data.toString(); });
          stream.on("close", (code) => {
            conn.end();
            resolve({ stdout, stderr, exitCode: code });
          });
        });
      })
      .on("error", reject)
      .connect({
        host,
        port: 22,
        username: "root",
        privateKey,
      });
  });
}

function getModelId(provider) {
  switch (provider) {
    case "openai": return "gpt-4o";
    case "openrouter": return "anthropic/claude-sonnet-4-5-20250514";
    default: return "claude-sonnet-4-5-20250514";
  }
}

function escapeShell(str) {
  return String(str).replace(/'/g, "'\\''");
}

function json(data, status = 200) {
  return new Response(data ? JSON.stringify(data) : null, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
