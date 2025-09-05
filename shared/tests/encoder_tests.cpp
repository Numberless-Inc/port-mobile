#include <gtest/gtest.h>
#include <vector>
#include "vectorcmp.hpp"
#include "encoders.hpp"

// Ensure that basic tests actually work here. Yoinked from the documentation.
TEST(EncoderTests, EncodeBinaryToHex)
{
  std::vector<unsigned char> a = {0x0, 0x1, 0x4, 0xa, 0xf};
  auto converted = encoders::binary_to_hex(a.data(), a.size());
  EXPECT_STREQ("0001040a0f", converted.c_str());
}

TEST(EncoderTests, EncodeHexToBinary)
{
  std::string hex = "0001040a0f";
  auto converted = encoders::hex_to_binary(hex);
  std::vector<unsigned char> a = {0x0, 0x1, 0x4, 0xa, 0xf};
  ASSERT_VEC_EQ(converted, a);
}