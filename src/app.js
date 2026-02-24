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
      // Prompt user for project settings
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

      // Create folders
      await fs.ensureDir(srcDir);
      await fs.ensureDir(includeDir);
      await fs.ensureDir(libDir);
      await fs.ensureDir(vscodeDir);

      // Create empty main.cpp
      await fs.writeFile(path.join(srcDir, "main.cpp"), "");

      // Process library list
      const libList = answers.libs
        .split(",")
        .map(l => l.trim().toLowerCase());

      let linkerFlags = [];
      let systemFlags = [];
      const isWindows = process.platform === "win32";

      // Link GLFW / OpenGL
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

      // Header-only libraries setup
      if (libList.includes("glm")) {
        await fs.ensureDir(path.join(includeDir, "glm"));
      }

      if (libList.includes("stb")) {
        await fs.ensureDir(path.join(includeDir, "stb"));
      }

      if (libList.includes("tinyobj")) {
        await fs.ensureDir(path.join(includeDir, "tinyobjloader"));

        // Generate tinyobjloader implementation file
        const tinyImpl = `#define TINYOBJLOADER_IMPLEMENTATION
                          #include "tinyobjloader/tiny_obj_loader.h"
        `;
        await fs.writeFile(
          path.join(srcDir, "tinyobjloader_impl.cpp"),
          tinyImpl
        );
      }

      // Output executable name
      const outputName = isWindows
        ? `${answers.projectName}main.exe`
        : answers.projectName;

      // Build command
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

      // VSCode tasks.json
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

      // VSCode c_cpp_properties.json
      const cppProps = {
        configurations: [
          {
            name: isWindows ? "Windows" : "Linux",
            includePath: [
              "${workspaceFolder}/include",
              "${workspaceFolder}/include/**",
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
      console.log("Header folders for GLM, stb_image, and tinyobjloader have been created (place headers manually inside include/).");
    } catch (err) {
      console.error("\nError:", err.message);
    }
  });

program.parse(process.argv);