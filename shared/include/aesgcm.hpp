#pragma once
/**
 * This file provides a wrapper to encrypt data using AES-GCM,
 * providing the basis for AEAD in Port.
 */

#include <vector>

namespace aesgcm
{
  typedef std::vector<unsigned char> key;
  const unsigned int IV_LENGTH = 12;
  const unsigned int TAG_LENGTH = 16;
  typedef std::vector<unsigned char> data;
  void encrypt(key secret,
               data plaintext,
               unsigned char *iv_buf,
               unsigned char *tag_buf,
               unsigned char *ciphertext_buf);
  data decrypt(key secret,
               unsigned char *iv_buf,
               unsigned char *tag_buf,
               unsigned char *ciphertext_buf,
               size_t ciphertext_length);
}