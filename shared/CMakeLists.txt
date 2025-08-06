cmake_minimum_required(VERSION 3.14)
project(my_project)

# GoogleTest requires at least C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

#####################################
# Setting up the testing framework  #
#####################################

include(FetchContent)
# Latest version as of 20250625. Maybe find a better way to do this
FetchContent_Declare(
  googletest
  URL https://github.com/google/googletest/archive/03597a01ee50ed33e9dfd640b249b4be3799d395.zip
)
# For Windows: Prevent overriding the parent project's compiler/linker settings
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

#####################################
# Test build test file              #
#####################################

enable_testing()

file(GLOB TEST_SOURCES CONFIGURE_DEPENDS "tests/*.cpp")  # Needs at least CMake 3.12, I think

file(GLOB IMPLEMENTATION_SOURCES CONFIGURE_DEPENDS "src/*.cpp")
list(REMOVE_ITEM IMPLEMENTATION_SOURCES "${CMAKE_CURRENT_SOURCE_DIR}/src/NativeCryptoModule.cpp")

add_executable( tests ${TEST_SOURCES} )

target_sources( tests PRIVATE ${IMPLEMENTATION_SOURCES})
target_include_directories( tests PRIVATE include include/external)

find_package(OpenSSL REQUIRED)

target_link_libraries(
  tests
  GTest::gtest_main
  OpenSSL::SSL
  OpenSSL::Crypto
)

include(GoogleTest)
gtest_discover_tests(tests)
