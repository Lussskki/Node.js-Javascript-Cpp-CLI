#!/usr/bin/env node
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs-extra";
import { exec } from "child_process";
import { Command } from "commander";
import inquirer from "inquirer";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
        {
          name: "libs",
          message: "Libraries (comma separated):",
          default: "opengl,glfw,glm,glad"   // ✅ GLEW removed
        }
      ]);

      const projectPath =
        answers.projectName === "."
          ? process.cwd()
          : path.join(process.cwd(), answers.projectName);

      const vscodeDir = path.join(projectPath, ".vscode");
      const srcDir = path.join(projectPath, "src");
      const includeDir = path.join(projectPath, "include");
      const libDir = path.join(projectPath, "lib");

      await fs.ensureDir(srcDir);
      await fs.ensureDir(includeDir);
      await fs.ensureDir(libDir);
      await fs.ensureDir(vscodeDir);

      let libList = answers.libs
        .split(",")
        .map(l => l.trim().toLowerCase());

      // ✅ Prevent GLAD + GLEW together
      if (libList.includes("glad") && libList.includes("glew")) {
        console.log("⚠ You selected both GLAD and GLEW.");
        console.log("GLAD will be used. Removing GLEW automatically.\n");
        libList = libList.filter(l => l !== "glew");
      }

      const tasks = {
        version: "2.0.0",
        tasks: [
          {
            label: "build",
            type: "shell",
            command: "echo Build via CLI",
            group: { kind: "build", isDefault: true },
            problemMatcher: ["$gcc"]
          },
          {
            label: "run",
            type: "shell",
            command: "echo Run via CLI",
            dependsOn: "build"
          }
        ]
      };

      await fs.writeJson(path.join(vscodeDir, "tasks.json"), tasks, { spaces: 2 });

      const cppProps = {
        configurations: [
          {
            name: process.platform === "win32" ? "Windows" : "Linux",
            includePath: [
              "${workspaceFolder}/include",
              "${workspaceFolder}/include/**",
              "${workspaceFolder}/**"
            ],
            defines: [],
            compilerPath: answers.compiler,
            cStandard: "c11",
            cppStandard: answers.cppStandard,
            intelliSenseMode:
              process.platform === "win32" ? "gcc-x64" : "linux-gcc-x64"
          }
        ],
        version: 4
      };

      await fs.writeJson(
        path.join(vscodeDir, "c_cpp_properties.json"),
        cppProps,
        { spaces: 2 }
      );

      const configData = {
        compiler: answers.compiler,
        cppStandard: answers.cppStandard,
        libs: libList,
        outputName:
          process.platform === "win32"
            ? `${answers.projectName}.exe`
            : answers.projectName
      };

      await fs.writeJson(
        path.join(projectPath, ".cpp-cli-config.json"),
        configData,
        { spaces: 2 }
      );

      console.log("✅ Init Complete!");
    } catch (err) {
      console.error("\nError:", err.message);
    }
  });


// ------------------ BUILD FUNCTION ------------------
async function buildProject() {
  const projectPath = process.cwd();
  const configPath = path.join(projectPath, ".cpp-cli-config.json");

  if (!(await fs.pathExists(configPath)))
    throw new Error("No project config found. Run init first.");

  const config = await fs.readJson(configPath);
  const srcDir = path.join(projectPath, "src");

  const srcFiles = (await fs.readdir(srcDir))
    .filter(f => f.endsWith(".cpp"))
    .map(f => path.join("src", f));

  const isWindows = process.platform === "win32";

  let linkerFlags = [];
  let systemFlags = [];

  // ------------------ GLFW ------------------
  if (config.libs.includes("glfw")) {
    linkerFlags.push("-lglfw3");

    if (isWindows) {
      systemFlags.push("-lgdi32");
    } else {
      systemFlags.push("-ldl", "-pthread");
    }
  }

  // ------------------ OpenGL ------------------
  if (config.libs.includes("opengl") || config.libs.includes("glfw")) {
    if (isWindows) systemFlags.push("-lopengl32");
    else systemFlags.push("-lGL");
  }

  // ------------------ GLEW (only if GLAD not used) ------------------
  if (config.libs.includes("glew") && !config.libs.includes("glad")) {
    linkerFlags.push(isWindows ? "-lglew32" : "-lGLEW");
  }

  // ------------------ GLAD ------------------
  if (config.libs.includes("glad")) {
    const gladSrc = path.join(projectPath, "src", "glad.c");
    if (await fs.pathExists(gladSrc)) {
      srcFiles.push("src/glad.c");
    } else {
      console.warn("⚠ Warning: GLAD source missing: src/glad.c");
    }
  }

  const buildCommand = [
    config.compiler,
    `-std=${config.cppStandard}`,
    ...srcFiles,
    "-Iinclude",
    "-Llib",
    ...linkerFlags,
    ...systemFlags,
    "-o",
    config.outputName
  ].join(" ");

  console.log(`\nCompiling: ${buildCommand}\n`);

  return new Promise((resolve, reject) => {
    exec(buildCommand, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      console.log("✅ Build succeeded!");
      resolve(config.outputName);
    });
  });
}


// ------------------ BUILD ------------------
program.command("build").action(async () => {
  try {
    await buildProject();
  } catch (err) {
    console.error("Build failed:", err);
  }
});


// ------------------ RUN ------------------
program.command("run").action(async () => {
  try {
    const config = await fs.readJson(".cpp-cli-config.json");
    const isWindows = process.platform === "win32";

    const runCommand = isWindows
      ? config.outputName
      : `./${config.outputName}`;

    exec(runCommand);
  } catch (err) {
    console.error(err.message);
  }
});

program.parse(process.argv);