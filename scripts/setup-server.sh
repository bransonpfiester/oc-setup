#!/bin/bash
set -euo pipefail

# Bootstrap a fresh Hetzner VPS for running OpenClaw agent containers.
# Run this once after creating your server:
#   ssh root@YOUR_SERVER_IP < scripts/setup-server.sh

echo ""
echo "=== OpenClaw Cloud Server Setup ==="
echo ""

# Update system
echo "[1/5] Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# Install Docker
echo "[2/5] Installing Docker..."
if command -v docker &>/dev/null; then
  echo "  Docker already installed: $(docker --version)"
else
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "  Docker installed: $(docker --version)"
fi

# Pull OpenClaw image
echo "[3/5] Pulling OpenClaw Docker image..."
docker pull ghcr.io/openclaw/openclaw:latest

# Set up automatic image updates via cron
echo "[4/5] Configuring automatic image updates..."
CRON_JOB="0 4 * * * docker pull ghcr.io/openclaw/openclaw:latest && docker ps -q --filter ancestor=ghcr.io/openclaw/openclaw:latest | xargs -r docker restart 2>/dev/null"
(crontab -l 2>/dev/null | grep -v "openclaw"; echo "$CRON_JOB") | crontab -

# Configure firewall
echo "[5/5] Configuring firewall..."
if command -v ufw &>/dev/null; then
  ufw allow OpenSSH
  ufw --force enable
  echo "  Firewall enabled (SSH only)"
else
  echo "  ufw not found, skipping firewall setup"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Server is ready to host OpenClaw agents."
echo "Docker containers will be created automatically via the oc-setup website."
echo ""
echo "Useful commands:"
echo "  docker ps                    -- list running agents"
echo "  docker logs <container>      -- view agent logs"
echo "  docker stop <container>      -- stop an agent"
echo "  docker rm <container>        -- remove an agent"
echo "  docker stats                 -- resource usage"
echo ""
