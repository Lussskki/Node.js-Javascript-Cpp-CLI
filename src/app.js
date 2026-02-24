#!/usr/bin/env node
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


console.log("RUNNING THIS FILE:", __filename);

import { Command } from "commander";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import { exec } from "child_process";

const program = new Command();

program
  .name("cpp-starter-cli")
  .description("Generate C++ project folder with VSCode configuration and build/run commands")
  .version("1.0.0");

// ------------------ INIT ------------------
program
  .command("init")
  .description("Initialize a new C++ project")
  .action(async () => {
    try {
      const answers = await inquirer.prompt([
        { name: "projectName", message: "Project name:", default: "cpp_project" },
        { name: "cppStandard", message: "C++ standard:", default: "c++17" },
        { name: "compiler", message: "Compiler command:", default: "g++" },
        { name: "libs", message: "Libraries (comma separated):", default: "opengl,glfw" }
      ]);

      const projectPath = answers.projectName === "." ? process.cwd() : path.join(process.cwd(), answers.projectName);
      const vscodeDir = path.join(projectPath, ".vscode");
      const srcDir = path.join(projectPath, "src");
      const includeDir = path.join(projectPath, "include");
      const libDir = path.join(projectPath, "lib");

      await fs.ensureDir(srcDir);
      await fs.ensureDir(includeDir);
      await fs.ensureDir(libDir);
      await fs.ensureDir(vscodeDir);

      const mainCppPath = path.join(srcDir, "main.cpp");
      if (!(await fs.pathExists(mainCppPath))) {
        await fs.writeFile(mainCppPath, `#include <iostream>\n\nint main() {\n  std::cout << "Hello C++!" << std::endl;\n  return 0;\n}`);
      }

      const libList = answers.libs.split(",").map(l => l.trim().toLowerCase());
      const isWindows = process.platform === "win32";

      if (libList.includes("glm")) await fs.ensureDir(path.join(includeDir, "glm"));
      if (libList.includes("stb")) await fs.ensureDir(path.join(includeDir, "stb"));
      if (libList.includes("tinyobj")) {
        await fs.ensureDir(path.join(includeDir, "tinyobjloader"));
        const tinyImpl = `#define TINYOBJLOADER_IMPLEMENTATION\n#include "tinyobjloader/tiny_obj_loader.h"\n`;
        await fs.writeFile(path.join(srcDir, "tinyobjloader_impl.cpp"), tinyImpl);
      }
      if (libList.includes("glad")) {
        await fs.ensureDir(path.join(includeDir, "glad"));
        await fs.ensureDir(path.join(includeDir, "KHR"));
        console.log("GLAD folders created. Place glad.h, KHR/khrplatform.h, and glad.c manually.");
      }

      // VSCode configs
      const tasks = {
        version: "2.0.0",
        tasks: [
          { label: "build", type: "shell", command: "echo Build via CLI", group: { kind: "build", isDefault: true }, problemMatcher: ["$gcc"] },
          { label: "run", type: "shell", command: isWindows ? "echo Run via CLI" : "echo Run via CLI", dependsOn: "build" }
        ]
      };
      await fs.writeJson(path.join(vscodeDir, "tasks.json"), tasks, { spaces: 2 });

      const cppProps = {
        configurations: [{
          name: isWindows ? "Windows" : "Linux",
          includePath: ["${workspaceFolder}/include", "${workspaceFolder}/include/**", "${workspaceFolder}/**"],
          defines: [],
          compilerPath: answers.compiler,
          cStandard: "c11",
          cppStandard: answers.cppStandard,
          intelliSenseMode: isWindows ? "gcc-x64" : "linux-gcc-x64"
        }],
        version: 4
      };
      await fs.writeJson(path.join(vscodeDir, "c_cpp_properties.json"), cppProps, { spaces: 2 });

      const configData = { compiler: answers.compiler, cppStandard: answers.cppStandard, libs: libList, outputName: isWindows ? `${answers.projectName}.exe` : answers.projectName };
      await fs.writeJson(path.join(projectPath, ".cpp-cli-config.json"), configData, { spaces: 2 });

      console.log(`\nProject created at: ${projectPath}`);
      console.log(`Executable: ${configData.outputName}`);
      console.log("Place header-only libs (GLM, stb, tinyobjloader, GLAD) manually in include/.");
      console.log("If you use GLAD, also place glad.c into src/.");
    } catch (err) {
      console.error("\nError:", err.message);
    }
  });

// ------------------ BUILD FUNCTION ------------------
async function buildProject() {
  const projectPath = process.cwd();
  const configPath = path.join(projectPath, ".cpp-cli-config.json");
  if (!(await fs.pathExists(configPath))) throw new Error("No project config found. Run `cpp-starter-cli init` first.");

  const config = await fs.readJson(configPath);
  const srcDir = path.join(projectPath, "src");
  const srcFiles = (await fs.readdir(srcDir)).filter(f => f.endsWith(".cpp")).map(f => path.join("src", f));
  if (await fs.pathExists(path.join(srcDir, "glad.c"))) srcFiles.push("src/glad.c");

  const isWindows = process.platform === "win32";
  let linkerFlags = [];
  let systemFlags = [];

  if (config.libs.includes("glfw")) { linkerFlags.push("-lglfw3"); if (isWindows) systemFlags.push("-lopengl32", "-lgdi32"); else systemFlags.push("-lGL", "-ldl", "-pthread"); }
  if (config.libs.includes("opengl")) { if (isWindows) systemFlags.push("-lopengl32"); else systemFlags.push("-lGL"); }
  if (config.libs.includes("glew")) linkerFlags.push(isWindows ? "-lglew32" : "-lGLEW");

  const buildCommand = [config.compiler, `-std=${config.cppStandard}`, ...srcFiles, "-Iinclude", "-Llib", ...linkerFlags, ...systemFlags, "-o", config.outputName].join(" ");
  console.log(`\nCompiling: ${buildCommand}\n`);

  return new Promise((resolve, reject) => {
    exec(buildCommand, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      console.log(stdout);
      console.log(`Build succeeded! Executable: ${config.outputName}`);
      resolve(config.outputName);
    });
  });
}

// ------------------ BUILD COMMAND ------------------
program
  .command("build")
  .description("Build the C++ project")
  .action(async () => {
    try { await buildProject(); } catch (err) { console.error("Build failed:", err); }
  });

// ------------------ RUN COMMAND ------------------
program
  .command("run")
  .description("Run the C++ project (without rebuilding)")
  .action(async () => {
    try {
      const projectPath = process.cwd();
      const configPath = path.join(projectPath, ".cpp-cli-config.json");

      if (!(await fs.pathExists(configPath))) {
        throw new Error("No project config found. Run `cpp-starter-cli init` first.");
      }

      const config = await fs.readJson(configPath);
      const isWindows = process.platform === "win32";
      const exePath = path.join(projectPath, config.outputName);

      if (!(await fs.pathExists(exePath))) {
        throw new Error("Executable not found. Run `cpp-starter-cli build` first.");
      }

      console.log(`Running ${config.outputName}...\n`);

      const runCommand = isWindows
        ? `cmd.exe /c start cmd /k "${config.outputName} & pause"`
        : `./${config.outputName}`;

      exec(runCommand, (err, stdout, stderr) => {
        if (err) return console.error(stderr || err.message);
        console.log(stdout);
      });

    } catch (err) {
      console.error("Run failed:", err.message);
    }
  });

program.parse(process.argv);