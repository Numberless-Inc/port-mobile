#include "commonrand.hpp"
#include <vector>
#include "encoders.hpp"
#include <openssl/rand.h>
std::string commonrand::hex(std::size_t length)
{
  auto random_data = std::vector<unsigned char>(length);
  try
  {
    // Generate random bytes and store them in random_data
    if (RAND_bytes(random_data.data(), length) != 1)
    {
      // Handle the error
      throw std::runtime_error("RAND_bytes failed to generate secure random bytes.");
    }
    std::string random_data_hex = encoders::binary_to_hex(random_data.data(), length);
    return random_data_hex;
  }
  catch (const std::exception &e)
  {
    return "error";
  }
}