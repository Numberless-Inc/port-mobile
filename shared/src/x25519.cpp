#include "x25519.hpp"

#include <vector>
#include <memory>
#include <openssl/evp.h>
#include <encoders.hpp>
#include "x25519.hpp"

std::shared_ptr<x25519::KeyPair> x25519::generate_keypair()
{
  EVP_PKEY *pkey = nullptr;
  EVP_PKEY_CTX *pctx = EVP_PKEY_CTX_new_id(EVP_PKEY_X25519, nullptr);
  int errcode;
  if (1 != (errcode = EVP_PKEY_keygen_init(pctx)))
    throw std::runtime_error("Failed x25519 keygen init " + std::to_string(errcode));
  if (1 != (errcode = EVP_PKEY_keygen(pctx, &pkey)))
    throw std::runtime_error("Failed x25519 keygen " + std::to_string(errcode));

  // The keys were generated, not put them into a KeyPair
  auto keypair = std::make_shared<KeyPair>();
  size_t private_key_len = 0;
  // Fill in the private key
  EVP_PKEY_get_raw_private_key(pkey, nullptr, &private_key_len);
  keypair->private_key.resize(private_key_len);
  if (1 != (errcode = EVP_PKEY_get_raw_private_key(pkey, keypair->private_key.data(), &private_key_len)))
    throw std::runtime_error("Could not extract x25519 private key " + std::to_string(errcode));

  // Fill in the public key
  size_t public_key_len = 0;
  EVP_PKEY_get_raw_public_key(pkey, nullptr, &public_key_len);
  keypair->public_key.resize(public_key_len);
  if (1 != (errcode = EVP_PKEY_get_raw_public_key(pkey, keypair->public_key.data(), &public_key_len)))
    throw std::runtime_error("Could not extract x25519 public key " + std::to_string(errcode));

  EVP_PKEY_free(pkey);
  EVP_PKEY_CTX_free(pctx);

  return keypair;
}

x25519::key x25519::derive_secret(x25519::key &private_key_bin, x25519::key &peer_public_key_bin)
{
  // Create and set up the context for the key derivation
  EVP_PKEY_CTX *ctx;
  size_t shared_secret_len = 0;
  EVP_PKEY *local_private_key = NULL, *peer_public_key = NULL;

  // Convert the binary keys to EVP_PKEY structures
  local_private_key = EVP_PKEY_new_raw_private_key(EVP_PKEY_X25519, NULL, reinterpret_cast<const unsigned char *>(private_key_bin.data()), private_key_bin.size());
  peer_public_key = EVP_PKEY_new_raw_public_key(EVP_PKEY_X25519, NULL, reinterpret_cast<const unsigned char *>(peer_public_key_bin.data()), peer_public_key_bin.size());

  if (!local_private_key || !peer_public_key)
  {
    throw std::runtime_error("Error creating keys for shared secret derivation.");
  }

  // Initialize the context
  ctx = EVP_PKEY_CTX_new(local_private_key, NULL);
  if (!ctx)
  {
    throw std::runtime_error("Error creating context for shared secret derivation.");
  }

  // Initialize the key derivation
  if (EVP_PKEY_derive_init(ctx) <= 0)
  {
    throw std::runtime_error("Error initializing shared secret derivation.");
  }

  // Provide the peer public key
  if (EVP_PKEY_derive_set_peer(ctx, peer_public_key) <= 0)
  {
    throw std::runtime_error("Error setting peer key for shared secret derivation.");
  }

  // Determine buffer length for shared secret
  if (EVP_PKEY_derive(ctx, NULL, &shared_secret_len) <= 0)
  {
    throw std::runtime_error("Error determining length of shared secret.");
  }

  // Allocate memory for the shared secret
  auto shared_secret = std::vector<unsigned char>(shared_secret_len);

  // Derive the shared secret
  if (EVP_PKEY_derive(ctx, shared_secret.data(), &shared_secret_len) <= 0)
  {
    throw std::runtime_error("Error deriving shared secret.");
  }

  // Clean up
  EVP_PKEY_free(local_private_key);
  EVP_PKEY_free(peer_public_key);
  EVP_PKEY_CTX_free(ctx);

  return shared_secret;
}

std::string x25519::KeyPair::to_json()
{
  std::string privkey_hex = encoders::binary_to_hex(private_key.data(), private_key.size());
  std::string pubkey_hex = encoders::binary_to_hex(public_key.data(), public_key.size());
  return "{\"privateKey\":\"" + privkey_hex + "\",\"publicKey\":\"" + pubkey_hex + "\"}";
}
