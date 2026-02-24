#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";

const program = new Command();

program
  .name("cpp-starter-cli")
  .description("Generate C++ project folder with VSCode configuration")
  .version("1.0.0");

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

      // Create empty main.cpp
      await fs.writeFile(path.join(srcDir, "main.cpp"), "");

      const libList = answers.libs
        .split(",")
        .map(l => l.trim().toLowerCase());

      let linkerFlags = [];
      let systemFlags = [];
      const isWindows = process.platform === "win32";

      if (libList.includes("glfw")) {
        linkerFlags.push("-lglfw3");
        if (isWindows) {
          systemFlags.push("-lopengl32", "-lgdi32");
        } else {
          systemFlags.push("-lGL", "-ldl", "-pthread");
        }
      }

      if (libList.includes("opengl")) {
        if (isWindows) systemFlags.push("-lopengl32");
        else systemFlags.push("-lGL");
      }

      if (libList.includes("glew")) {
        linkerFlags.push(isWindows ? "-lglew32" : "-lGLEW");
      }

      const outputName = isWindows
        ? `${answers.projectName}main.exe`
        : answers.projectName;

      const buildCommand = [
        answers.compiler,
        `-std=${answers.cppStandard}`,
        "src/*.cpp",
        "-Iinclude",
        "-Llib",
        ...linkerFlags,
        ...systemFlags,
        "-o",
        outputName
      ].join(" ");

      const tasks = {
        version: "2.0.0",
        tasks: [
          {
            label: "build",
            type: "shell",
            command: buildCommand,
            group: { kind: "build", isDefault: true },
            problemMatcher: ["$gcc"]
          },
          {
            label: "run",
            type: "shell",
            command: isWindows ? outputName : `./${outputName}`,
            dependsOn: "build"
          }
        ]
      };

      await fs.writeJson(path.join(vscodeDir, "tasks.json"), tasks, { spaces: 2 });

      const cppProps = {
        configurations: [
          {
            name: isWindows ? "Windows" : "Linux",
            includePath: [
              "${workspaceFolder}/include",
              "${workspaceFolder}/**"
            ],
            defines: [],
            compilerPath: answers.compiler,
            cStandard: "c11",
            cppStandard: answers.cppStandard,
            intelliSenseMode: isWindows ? "gcc-x64" : "linux-gcc-x64"
          }
        ],
        version: 4
      };

      await fs.writeJson(
        path.join(vscodeDir, "c_cpp_properties.json"),
        cppProps,
        { spaces: 2 }
      );

      console.log(`\nProject "${answers.projectName}" created at:\n${projectPath}\n`);
    } catch (err) {
      console.error("\nError:", err.message);
    }
  });

program.parse(process.argv);