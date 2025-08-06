#pragma once
/**
 * GoogleTest helpers to compare vectors
 */

#define ASSERT_VEC_EQ(x, y)                               \
  do                                                      \
  {                                                       \
    ASSERT_EQ(x.size(), y.size());                        \
    for (int i = 0; i < x.size(); i++)                    \
    {                                                     \
      EXPECT_EQ(x[i], y[i]) << "x and y differ at " << i; \
    }                                                     \
  } while (0)