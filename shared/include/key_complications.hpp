#pragma once

#include <vector>

namespace key_complications
{
  typedef std::vector<unsigned char> key;
  inline key exclusive_or(key k1, key k2)
  {
    key resultant_key;
    if (k1.size() != k2.size())
      throw std::runtime_error("YAP shared secret and derived key are not the same length");

    for (int i = 0; i < k1.size(); i++)
    {
      resultant_key.push_back(k1[i] ^ k2[i]);
    }
    return resultant_key;
  };
}