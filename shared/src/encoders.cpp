#include "encoders.hpp"
#include <sstream>
#include <iomanip>

static const std::string base64_chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789-_";

std::string encoders::binary_to_hex(const unsigned char *data, std::size_t length)
{
  std::stringstream hex_stream;
  hex_stream << std::hex << std::setfill('0');
  for (size_t i = 0; i < length; i++)
  {
    hex_stream << std::setw(2) << static_cast<int>(data[i]);
  }
  return hex_stream.str();
}

std::vector<unsigned char> encoders::hex_to_binary(const std::string &hex)
{
  std::vector<unsigned char> binary;
  for (size_t i = 0; i < hex.length(); i += 2)
  {
    uint8_t byte = std::stoi(hex.substr(i, 2), nullptr, 16);
    binary.push_back(static_cast<char>(byte));
  }
  return binary;
}

std::string encoders::base64_encode(const std::vector<unsigned char> &in)
{
  std::string out;
  out.reserve(in.size() * 2); // Should give it a good head start
  int val = 0, valb = -6;
  for (unsigned char c : in)
  {
    val = (val << 8) + c;
    valb += 8;
    while (valb >= 0)
    {
      out.push_back(base64_chars[(val >> valb) & 0x3F]);
      valb -= 6;
    }
  }
  if (valb > -6)
    out.push_back(base64_chars[((val << 8) >> (valb + 8)) & 0x3F]);
  while (out.size() % 4)
    out.push_back('=');
  return out;
}
std::vector<unsigned char> encoders::base64_decode(const std::string &in)
{
  std::vector<int> T(256, -1);
  for (int i = 0; i < 64; i++)
    T[base64_chars[i]] = i;
  std::vector<unsigned char> out;
  out.reserve(in.length()); // Give it a sufficient base to work off of
  std::vector<int> val(4, 0);
  int valb = -8;
  for (unsigned char c : in)
  {
    if (T[c] == -1)
      break;
    valb += 6;
    val[valb / 8] = val[valb / 8] << 6 | T[c];
    if (valb >= 0)
    {
      out.push_back(char((val[valb / 8] >> (valb % 8)) & 0xFF));
      valb -= 8;
    }
  }
  return out;
}
