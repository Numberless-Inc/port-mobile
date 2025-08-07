#pragma once

#include <string>
#include <vector>

namespace x25519
{
  typedef std::vector<unsigned char> key;
  const unsigned int PUBLIC_KEY_LENGTH = 32;
  class KeyPair
  {
  public:
    KeyPair() : private_key{key()}, public_key{key()} {};
    ~KeyPair()
    {
      // Zero out key data
      std::fill(private_key.begin(), private_key.end(), 0);
      std::fill(public_key.begin(), public_key.end(), 0);
    };
    key private_key;
    key public_key;
    std::string to_json();
  };
  std::shared_ptr<KeyPair> generate_keypair();
  key derive_secret(key &private_key_bin, key &peer_public_key_bin);
}
