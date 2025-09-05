cmake_minimum_required(VERSION 3.13)

# Define the library name here.
project(appmodules)

# Set the platform-specific shared libraries directory
set(STATIC_LIB_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../../../../../shared/lib/${ANDROID_ABI})


# This file includes all the necessary to let you build your React Native application
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

# Define where the additional source code lives. We need to crawl back the jni, main, src, app, android folders
file(GLOB NATIVE_SOURCE_FILES CONFIGURE_DEPENDS ../../../../../shared/src/*.cpp)
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ${NATIVE_SOURCE_FILES})

# Define where CMake can find the additional header files. We need to crawl back the jni, main, src, app, android folders
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ../../../../../shared/include)

# Define where external library headers are found. They are private since we don't want to directly expose them.
target_include_directories(${CMAKE_PROJECT_NAME} PRIVATE ../../../../../shared/include/external)

# Add statically compiled libraries
add_library(crypto STATIC IMPORTED)
set_target_properties(crypto PROPERTIES IMPORTED_LOCATION ${STATIC_LIB_DIR}/libcrypto.a)

add_library(ssl STATIC IMPORTED)
set_target_properties(ssl PROPERTIES IMPORTED_LOCATION ${STATIC_LIB_DIR}/libssl.a)

target_link_libraries(
  ${CMAKE_PROJECT_NAME}
  crypto
  ssl
)