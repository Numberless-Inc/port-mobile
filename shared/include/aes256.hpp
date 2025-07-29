#pragma once

#include <string>
#include <openssl/evp.h>

namespace aes256
{
  void generate_random_key(unsigned char *buffer);
  void generate_random_iv(unsigned char *buffer);
  std::string combine_key_and_iv(unsigned char *key, unsigned char *iv);
  // TODO: change this to return a pair instead of requiring buffers.
  void split_key_and_iv(std::string key_and_iv, std::string &key_buf, std::string &iv_buf);
  std::string encrypt(std::string &plaintext, std::string &key);
  std::string decrypt(std::string &ciphertext, std::string &key);
  void encrypt_file(std::ifstream &in_stream, std::ofstream &out_stream, unsigned char *key, unsigned char *iv);
  void decrypt_file(std::ifstream &in_file, std::ofstream &out_file, const std::string key, const std::string iv);
}