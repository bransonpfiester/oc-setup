import { Command } from "commander";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, "..", "package.json"), "utf-8"),
    );
    return pkg.version ?? "1.0.0";
  } catch {
    return "1.0.0";
  }
}

const program = new Command();

program
  .name("oc-setup")
  .description("OpenClaw client setup CLI")
  .version(getVersion());

program
  .command("init", { isDefault: true })
  .description("Full guided setup flow (default)")
  .action(async () => {
    const { initCommand } = await import("./commands/init.js");
    await initCommand();
  });

program
  .command("doctor")
  .description("Diagnose common issues")
  .action(async () => {
    const { doctorCommand } = await import("./commands/doctor.js");
    await doctorCommand();
  });

program
  .command("update")
  .description("Update OpenClaw to latest version")
  .action(async () => {
    const { updateCommand } = await import("./commands/update.js");
    await updateCommand();
  });

program
  .command("reset")
  .description("Back up config and start fresh")
  .action(async () => {
    const { resetCommand } = await import("./commands/reset.js");
    await resetCommand();
  });

program
  .command("add [channel]")
  .description("Add a channel (discord, imessage, whatsapp)")
  .action(async (channel?: string) => {
    const { addChannelCommand } = await import("./commands/add-channel.js");
    await addChannelCommand(channel);
  });

program.parse();
