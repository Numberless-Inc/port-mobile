#pragma once

#include <string>

namespace commonrand
{
  /// @brief Generate a random hex string
  /// @param length 
  /// @return random hex string encoding length bytes
  std::string hex(std::size_t length);
};