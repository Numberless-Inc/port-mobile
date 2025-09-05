#pragma once

#include <string>

namespace hash
{

  /// @brief hash a string using sha256
  /// @param input 
  /// @return hashed input
  std::string hashSHA256(std::string input);
}
