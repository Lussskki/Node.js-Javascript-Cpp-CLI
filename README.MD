## Node.js-Javascript-Cpp-CLI
It's my ever created cli for me, i am writing a c++/opengl  code and It is necessary for me to write on a lightweight vscode IDE.

## Youtube Video
[![Watch the Video](https://img.youtube.com/vi/sVYdlhQS360/0.jpg)](https://www.youtube.com/watch?v=sVYdlhQS360)

*Watch the demo on YouTube → [Click Here](https://www.youtube.com/watch?v=sVYdlhQS360)*

## Features


- Initialize a new C++ project folder

- Create standard project directories: src, include, and .vscode

- Generate tasks.json for building and running your project in VSCode

- Generate c_cpp_properties.json for IntelliSense and compiler configuration

- Supports custom C++ standard, compiler, and libraries

## Installation
```npm install -g cpp-starter-cli```
## Usage
```cpp-starter-cli init```

You will be prompted for:

- Project name (default: cpp_project)

- C++ standard (default: c++17)

- Compiler command (default: g++)

- Libraries (comma-separated, default: opengl,glfw, glad, glm)

Example:
```bash
? Project name: my_game
? C++ standard: c++20
? Compiler command: g++
? Libraries (comma separated): glfw,glm,glad 
```
## After completion, your project structure will look like:
```
my_game/
├── src/
├── lib/
├── include/
└── .vscode/
    ├── tasks.json
    └── c_cpp_properties.json
```
 You can now build and run your project directly from VSCode.

## Notes

To work with this listed libraries, you have to download it manually and just copy-paste it in ```include``` and ```lib```.

Works best on Linux and other systems using g++ or compatible compilers.