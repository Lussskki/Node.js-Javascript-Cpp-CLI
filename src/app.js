#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";

const program = new Command();

program
  .name("cpp-starter-cli")
  .description("Generate C++ project folder with VSCode tasks and c_cpp_properties")
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
        { name: "libs", message: "Libraries (comma separated):", default: "opengl,glfw,glew" }
      ]);

      
      const projectPath = answers.projectName === "." 
        ? process.cwd() 
        : path.join(process.cwd(), answers.projectName);

      const vscodeDir = path.join(projectPath, ".vscode");
      const srcDir = path.join(projectPath, "src");
      const includeDir = path.join(projectPath, "include");
      const libDir = path.join(projectPath, "lib");

      // Create project folders
      await fs.ensureDir(srcDir);
      await fs.ensureDir(includeDir);
      await fs.ensureDir(libDir);
      await fs.ensureDir(vscodeDir);

      // Write tasks.json
      const tasks = {
        version: "2.0.0",
        tasks: [
          {
            label: "build",
            type: "shell",
            command: `${answers.compiler} -std=${answers.cppStandard} src/*.cpp -o ${answers.projectName}`,
            group: { kind: "build", isDefault: true },
            problemMatcher: ["$gcc"]
          },
          {
            label: "run",
            type: "shell",
            command: `./${answers.projectName}`,
            group: "test",
            dependsOn: "build"
          }
        ]
      };
      await fs.writeJson(path.join(vscodeDir, "tasks.json"), tasks, { spaces: 2 });

      // Write c_cpp_properties.json
      const cppProps = {
        configurations: [
          {
            name: "Linux",
            includePath: ["${workspaceFolder}/**"],
            defines: [],
            compilerPath: answers.compiler,
            cStandard: "c11",
            cppStandard: answers.cppStandard,
            intelliSenseMode: "gcc-x64"
          }
        ],
        version: 4
      };
      await fs.writeJson(path.join(vscodeDir, "c_cpp_properties.json"), cppProps, { spaces: 2 });

      console.log(`\n C++ project "${answers.projectName}" created successfully at:\n${projectPath}\n`);
    } catch (err) {
      console.error("\n Error creating project:", err.message);
    }
  });

program.parse(process.argv);