#pragma once
#include <string>
#include <vector>

namespace encoders
{
  /// @brief convert a bytearray to a hexadecimal string
  /// @param data byte buffer to encode
  /// @param length the number of bytes to encode
  /// @return a hexadecimal encoding of data
  std::string binary_to_hex(const unsigned char *data, std::size_t length);
  std::vector<unsigned char> hex_to_binary(const std::string &hex_string);
  std::vector<unsigned char> base64_decode(const std::string &in);
  std::string base64_encode(const std::vector<unsigned char> &in);
};