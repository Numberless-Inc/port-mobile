#include "aesgcm.hpp"

#include <openssl/evp.h>
#include "commonrand.hpp"
#include "encoders.hpp"

void aesgcm::encrypt(key secret, data plaintext, unsigned char *iv_buf, unsigned char *tag_buf, unsigned char *ciphertext_buf)
{
  EVP_CIPHER_CTX *ctx;
  /* Create and initialise the context */
  if (!(ctx = EVP_CIPHER_CTX_new()))
    throw std::runtime_error("Could not create cipher context");

  /* Initialise the encryption operation. */
  if (1 != EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, NULL, NULL))
  {
    EVP_CIPHER_CTX_free(ctx);
    throw std::runtime_error("Could not initialize encryption");
  }

  // We use the default IV length, 12 bytes
  // TODO: This is silly, create a separate method for bytes
  auto iv = encoders::hex_to_binary(commonrand::hex(12));
  memcpy(iv_buf, iv.data(), 12);

  /* Initialise key and IV */
  if (1 != EVP_EncryptInit_ex(ctx, NULL, NULL, secret.data(), iv_buf))
  {
    EVP_CIPHER_CTX_free(ctx);
    throw std::runtime_error("Could not initialize encryption");
  }

  int len;
  int ciphertext_len;
  if (1 != EVP_EncryptUpdate(ctx,
                             ciphertext_buf,
                             &len, plaintext.data(),
                             plaintext.size()))
  {
    EVP_CIPHER_CTX_free(ctx);
    throw std::runtime_error("Could not encrypt data");
  }
  ciphertext_len = len;

  /*
   * Finalise the encryption. Normally ciphertext bytes may be written at
   * this stage, but this does not occur in GCM mode
   */
  if (1 != EVP_EncryptFinal_ex(ctx,
                               ciphertext_buf + ciphertext_len,
                               &len))
  {
    EVP_CIPHER_CTX_free(ctx);
    throw std::runtime_error("Could not encrypt data");
  }
  // Since no extra bytes should be written, assert that
  if (0 != len)
    throw std::runtime_error("Bytes were written during finalization");

  /* Get the tag */
  if (1 != EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, aesgcm::TAG_LENGTH, tag_buf))
  {
    EVP_CIPHER_CTX_free(ctx);
    throw std::runtime_error("Could not encrypt data");
  }

  /* Clean up */
  EVP_CIPHER_CTX_free(ctx);
}

aesgcm::data aesgcm::decrypt(key secret, unsigned char *iv_buf, unsigned char *tag_buf, unsigned char *ciphertext_buf, size_t ciphertext_length)
{
  EVP_CIPHER_CTX *ctx;
  int len;

  /* Create and initialise the context */
  if (!(ctx = EVP_CIPHER_CTX_new()))
  {
    EVP_CIPHER_CTX_free(ctx);
    throw std::runtime_error("Could not create the decryption context");
  }

  /* Initialise the decryption operation. */
  if (!EVP_DecryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, NULL, NULL))
  {
    EVP_CIPHER_CTX_free(ctx);
    throw std::runtime_error("Could not initialize the decryption context");
  }

  /* Initialise key and IV */
  if (!EVP_DecryptInit_ex(ctx, NULL, NULL, secret.data(), iv_buf))
  {
    EVP_CIPHER_CTX_free(ctx);
    throw std::runtime_error("Could not initialize key and iv");
  }

  std::vector<unsigned char> plaintext(ciphertext_length, 0);
  /*
   * Provide the message to be decrypted, and obtain the plaintext output.
   * EVP_DecryptUpdate can be called multiple times if necessary
   */
  if (!EVP_DecryptUpdate(ctx, plaintext.data(), &len, ciphertext_buf, ciphertext_length))
  {
    EVP_CIPHER_CTX_free(ctx);
    throw std::runtime_error("Could not set ciphertext");
  }
  // At this point, it's probably a good idea to ensure that plaintext length matches

  // Set expected tag value.
  if (!EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_TAG, aesgcm::TAG_LENGTH, tag_buf))
  {
    EVP_CIPHER_CTX_free(ctx);
    throw std::runtime_error("Could not set expected tag");
  }

  /*
   * Finalise the decryption. A positive return value indicates success,
   * anything else is a failure - the plaintext is not trustworthy.
   */
  int success = EVP_DecryptFinal_ex(ctx, plaintext.data() + len, &len);

  /* Clean up */
  EVP_CIPHER_CTX_free(ctx);

  if (success <= 0)
    throw std::runtime_error("Could not decrypt and verify authenticity of message");

  return plaintext;
}
