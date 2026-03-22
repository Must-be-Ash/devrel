#!/usr/bin/env node

import { Command } from "commander";
import { registerDidCommand } from "./d-id.js";
import { registerRenderCommand, registerPreviewCommand } from "./render.js";
import { registerDoctorCommand } from "./doctor.js";

const program = new Command();

program
  .name("devrel-toolkit")
  .description(
    "Toolkit for automated product demo video creation with AI avatars and Remotion compositing"
  )
  .version("0.1.0")
  .option("-v, --verbose", "Enable verbose debug output");

registerDidCommand(program);
registerRenderCommand(program);
registerPreviewCommand(program);
registerDoctorCommand(program);

program.parse();
