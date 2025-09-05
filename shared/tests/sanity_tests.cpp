#include <gtest/gtest.h>
#include <vector>
#include "vectorcmp.hpp"

// Ensure that basic tests actually work here. Yoinked from the documentation.
TEST(SanityTest, BasicAssertionsWork)
{
  EXPECT_STRNE("hello", "world");
  EXPECT_EQ(7 * 6, 42);
}

// Ensure that we can assert equality of vectors fairly well
TEST(SanityTest, VectorCompare)
{
  std::vector<u_int8_t> a = {1, 2, 3};
  std::vector<u_int8_t> b = {1, 2, 3};
  ASSERT_VEC_EQ(a, b);
}