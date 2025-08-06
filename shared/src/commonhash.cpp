#include "commonhash.hpp"

#include "encoders.hpp"
#include <openssl/evp.h>
#include <openssl/sha.h>
#include "encoders.hpp"

std::string hash::hashSHA256(std::string input)
{
  EVP_MD_CTX *mdctx = EVP_MD_CTX_new();
  unsigned char hash[SHA256_DIGEST_LENGTH];
  unsigned int hash_len;

  // Initialize the context with SHA-256
  EVP_DigestInit_ex(mdctx, EVP_sha256(), nullptr);

  // Add the input string
  EVP_DigestUpdate(mdctx, input.c_str(), input.length());

  // Finalize the hash
  EVP_DigestFinal_ex(mdctx, hash, &hash_len);

  // Clean up
  EVP_MD_CTX_free(mdctx);

  // Convert the hash to a hexadecimal string
  return encoders::binary_to_hex(hash, hash_len);
}