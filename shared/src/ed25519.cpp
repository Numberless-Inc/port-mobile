#include "ed25519.hpp"

#include <vector>
#include <cassert>
#include <openssl/evp.h>
#include <encoders.hpp>

std::string ed25519::generate_keys_json()
{
  EVP_PKEY *pkey = nullptr;
  EVP_PKEY_CTX *pctx = EVP_PKEY_CTX_new_id(EVP_PKEY_ED25519, nullptr);
  EVP_PKEY_keygen_init(pctx);
  EVP_PKEY_keygen(pctx, &pkey);
  // Extract private key
  size_t private_key_len;
  std::vector<unsigned char> private_key(32);
  EVP_PKEY_get_raw_private_key(pkey, private_key.data(), &private_key_len);
  assert(32 == private_key_len);

  // Extract public key
  size_t public_key_len;
  std::vector<unsigned char> public_key(32);
  EVP_PKEY_get_raw_public_key(pkey, public_key.data(), &public_key_len);
  assert(32 == public_key_len);

  std::string private_key_b64 = encoders::base64_encode(private_key);
  std::string public_key_b64 = encoders::base64_encode(public_key);
  std::string keysJSON = "{\"privateKey\":\"" + private_key_b64 + "\",\"publicKey\":\"" + public_key_b64 + "\"}";

  EVP_PKEY_free(pkey);
  EVP_PKEY_CTX_free(pctx);
  return keysJSON;
}
std::string ed25519::sign_message(const std::string &message, const std::string &private_key_b64)
{
  std::vector<unsigned char> private_key = encoders::base64_decode(private_key_b64);
  EVP_PKEY *priv_key = EVP_PKEY_new_raw_private_key(EVP_PKEY_ED25519, nullptr, private_key.data(), 32);
  size_t sig_len;
  EVP_MD_CTX *mdctx = EVP_MD_CTX_new();
  if (1 != EVP_DigestSignInit(mdctx, NULL, NULL, NULL, priv_key))
  {
    EVP_PKEY_free(priv_key);
    return "error";
  }
  if (1 != EVP_DigestSign(mdctx, NULL, &sig_len, (const unsigned char *)message.c_str(), message.length()))
  {
    EVP_MD_CTX_free(mdctx);
    EVP_PKEY_free(priv_key);
    return "error";
  }
  std::vector<unsigned char> signature(sig_len);
  if (1 != EVP_DigestSign(mdctx, signature.data(), &sig_len, (const unsigned char *)message.c_str(), message.length()))
  {
    EVP_MD_CTX_free(mdctx);
    EVP_PKEY_free(priv_key);
    return "error";
  }
  EVP_MD_CTX_free(mdctx);
  return encoders::base64_encode(signature);
}