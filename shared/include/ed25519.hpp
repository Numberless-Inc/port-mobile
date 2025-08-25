#pragma once
#include <string>

namespace ed25519
{
  std::string generate_keys_json();
  std::string sign_message(const std::string &message, const std::string &private_key_b64);
};