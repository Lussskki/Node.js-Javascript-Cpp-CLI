#include <iostream>
#include <vector>
#include <glad/glad.h>
#include <GLFW/glfw3.h>

#include "tiny_obj_loader.h"
#include "stb_image.h"

int main() {
    // ---------------- GLFW window ----------------
    if (!glfwInit()) {
        std::cerr << "Failed to initialize GLFW\n";
        return -1;
    }

    GLFWwindow* window = glfwCreateWindow(800, 600, "OpenGL Test", nullptr, nullptr);
    if (!window) {
        std::cerr << "Failed to create GLFW window\n";
        glfwTerminate();
        return -1;
    }

    glfwMakeContextCurrent(window);

    // ---------------- GLAD ----------------
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
        std::cerr << "Failed to initialize GLAD\n";
        return -1;
    }

    std::cout << "OpenGL version: " << glGetString(GL_VERSION) << "\n";

    // ---------------- tinyobjloader ----------------
    tinyobj::attrib_t attrib;
    std::vector<tinyobj::shape_t> shapes;
    std::vector<tinyobj::material_t> materials;
    std::string warn;

    bool ret = tinyobj::LoadObj(
        &attrib,
        &shapes,
        &materials,
        &warn,
        "src/dummy.obj",   // OBJ filename (const char*)
        nullptr,           // optional MTL base directory
        true               // triangulate
    );

    if (!ret) {
        std::cerr << "Failed to load OBJ\n";
    } else {
        std::cout << "tinyobjloader loaded OBJ successfully (or dummy file missing)\n";
    }

    if (!warn.empty()) std::cout << "WARN: " << warn << "\n";

    // ---------------- stb_image ----------------
    int width, height, channels;
    unsigned char* data = stbi_load("src/dummy.png", &width, &height, &channels, 0);
    if (data) {
        std::cout << "stb_image loaded PNG: " << width << "x" << height << "\n";
        stbi_image_free(data);
    } else {
        std::cout << "stb_image could not load dummy.png (this is fine for testing)\n";
    }

    // ---------------- Main loop ----------------
    while (!glfwWindowShouldClose(window)) {
        glClearColor(0.2f, 0.3f, 0.4f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    glfwDestroyWindow(window);
    glfwTerminate();

    return 0;
}