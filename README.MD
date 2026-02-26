# Node.js-Javascript-Cpp-CLI

This is my first CLI tool. I created it to quickly set up C++ / OpenGL projects and work in a lightweight VSCode environment.

## YouTube Video

[![Watch the Video](https://img.youtube.com/vi/sVYdlhQS360/0.jpg)](https://www.youtube.com/watch?v=sVYdlhQS360)

Watch the demo on YouTube → [Click Here](https://www.youtube.com/watch?v=sVYdlhQS360)


## Features

* Initialize a new C++ project folder
* Create standard project directories: `src`, `include`, `lib`, and `.vscode`
* Generate `tasks.json` for building and running in VSCode
* Generate `c_cpp_properties.json` for IntelliSense and compiler configuration
* Supports custom C++ standard, compiler, and libraries



## Requirements

* Node.js (v14+ recommended)
* npm
* g++ or another compatible C++ compiler
* VSCode (optional but recommended for using the generated tasks)



## Installation

Clone or download the project, then go into the project folder and run:

```bash
npm install -g .
```

This installs the CLI globally so you can use it from anywhere.

### Alternative (for development)

If you are developing the CLI, you can use:

```bash
npm link
```

This creates a global symlink so your changes update automatically.



## Usage

### Initialize a project

```bash
cpp-starter-cli init
```

You will be prompted for:

* Project name (default: `cpp_project`)
* C++ standard (default: `c++17`)
* Compiler command (default: `g++`)
* Libraries (comma-separated, default: `opengl, glfw, glad, glm, tinyobjloader, stbimage`)

Supported libraries:

* opengl
* glfw
* glm
* glad
* tinyobjloader
* stbimage

Example:

```bash
? Project name: my_game
? C++ standard: c++17
? Compiler command: g++
? Libraries (comma separated): glfw,glm,glad,tinyobjloader,stbimage
```


## Project Structure

After completion, your project structure will look like:

```
your-project/
├── src/
├── lib/
├── include/
└── .vscode/
    ├── tasks.json
    └── c_cpp_properties.json
```


## Commands

### Build the project

```bash
cpp-starter-cli build
```

### Run the project

```bash
cpp-starter-cli run
```

### Full workflow example

```bash
cpp-starter-cli init
cd your-project
cpp-starter-cli build
cpp-starter-cli run
```


## Notes

To use the listed libraries, you need to download them manually and copy them into the `include` and `lib` folders.

Works best on Linux and other systems using `g++` or compatible compilers.


## License

This project is licensed under the MIT License.
