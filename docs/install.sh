#!/bin/bash
set -e

CONFIG="$1"

echo ""
echo "  OpenClaw Setup Installer"
echo "  ========================"
echo ""

if [ -z "$CONFIG" ]; then
  echo "No config provided. Running interactive setup..."
  echo ""
  npx oc-setup 2>/dev/null || {
    echo ""
    echo "ERROR: npx failed. Make sure Node.js 18+ is installed."
    echo ""
    echo "  macOS:  brew install node"
    echo "  Linux:  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo ""
    exit 1
  }
  exit 0
fi

check_node() {
  if command -v node &>/dev/null; then
    NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_MAJOR" -ge 18 ] 2>/dev/null; then
      return 0
    fi
  fi
  return 1
}

install_node() {
  echo "  Node.js 18+ not found. Installing..."
  echo ""

  OS="$(uname -s)"
  case "$OS" in
    Darwin)
      if command -v brew &>/dev/null; then
        echo "  Installing Node.js via Homebrew..."
        brew install node
      else
        echo "  Installing Homebrew first..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv 2>/dev/null)"
        brew install node
      fi
      ;;
    Linux)
      echo "  Installing Node.js via NodeSource..."
      curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
      sudo apt-get install -y nodejs
      ;;
    *)
      echo "  ERROR: Unsupported OS ($OS). Install Node.js 18+ manually: https://nodejs.org"
      exit 1
      ;;
  esac

  if ! check_node; then
    echo ""
    echo "  ERROR: Node.js installation failed. Install manually: https://nodejs.org"
    exit 1
  fi

  echo ""
  echo "  Node.js $(node -v) installed."
}

if ! check_node; then
  install_node
else
  echo "  Node.js $(node -v) found."
fi

echo ""
echo "  Running oc-setup..."
echo ""

npx oc-setup --config "$CONFIG"
