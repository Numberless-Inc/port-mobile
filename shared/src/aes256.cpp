#include "aes256.hpp"

#include "encoders.hpp"
#include <fstream>
#include <openssl/evp.h>
#include <openssl/rand.h>

void aes256::generate_random_key(unsigned char *buffer)
{
  if (RAND_bytes(buffer, EVP_MAX_KEY_LENGTH) != 1)
  {
    throw std::runtime_error(
        "Could not generate a random key for aes256 encryption");
  }
}

void aes256::generate_random_iv(unsigned char *buffer)
{
  if (-1 == RAND_bytes(buffer, EVP_MAX_IV_LENGTH))
  {
    throw std::runtime_error("Could not generate an iv for aes256 encryption");
  }
}

std::string aes256::combine_key_and_iv(unsigned char *key, unsigned char *iv)
{
  auto iv_hex = encoders::binary_to_hex(iv, EVP_MAX_IV_LENGTH);
  auto key_hex = encoders::binary_to_hex(key, EVP_MAX_KEY_LENGTH);
  return iv_hex + key_hex;
}

void aes256::split_key_and_iv(std::string key_and_iv, std::string &key_buf,
                              std::string &iv_buf)
{
  std::vector<unsigned char> key_and_iv_bin = encoders::hex_to_binary(key_and_iv);
  iv_buf.resize(EVP_MAX_IV_LENGTH);
  memcpy(iv_buf.data(), key_and_iv_bin.data(), EVP_MAX_IV_LENGTH);
  key_buf.resize(EVP_MAX_KEY_LENGTH);
  memcpy(key_buf.data(), key_and_iv_bin.data() + EVP_MAX_IV_LENGTH, EVP_MAX_KEY_LENGTH);
}

std::string aes256::encrypt(std::string &plaintext, std::string &key_hex)
{
  // Convert hex keys to binary
  std::vector<unsigned char> key = encoders::hex_to_binary(key_hex);
  // Format of the output is | IV | ciphertext |
  std::vector<unsigned char> out_buf(16 + plaintext.size() + EVP_MAX_BLOCK_LENGTH, 0);
  auto iv = out_buf.data();
  auto ciphertext = out_buf.data() + 16;
  // Generate a random IV
  if (RAND_bytes(iv, 16) != 1)
  {
    // Handle the error
    throw std::runtime_error(
        "RAND_bytes failed to generate secure random bytes.");
  }
  EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
  if (!ctx)
  {
    throw std::runtime_error("Failed to create cipher context");
  }

  if (1 !=
      EVP_EncryptInit_ex(ctx, EVP_aes_256_cbc(), NULL,
                         reinterpret_cast<const unsigned char *>(key.data()),
                         iv))
  {
    EVP_CIPHER_CTX_free(ctx);
    throw std::runtime_error("Failed to initialize encryption");
  }

  int len;
  if (1 != EVP_EncryptUpdate(
               ctx, ciphertext, &len,
               reinterpret_cast<const unsigned char *>(plaintext.data()),
               plaintext.size()))
  {
    EVP_CIPHER_CTX_free(ctx);
  }
  int ciphertext_len = len;

  if (1 !=
      EVP_EncryptFinal_ex(
          ctx, ciphertext + len, &len))
  {
    EVP_CIPHER_CTX_free(ctx);
    throw std::runtime_error("Failed to finalize encryption");
  }
  ciphertext_len += len;
  out_buf.resize(16 + ciphertext_len);

  EVP_CIPHER_CTX_free(ctx);
  // base 64 encode the encrypted bytes
  std::string iv_ciphertext_b64 = encoders::base64_encode(out_buf);
  return iv_ciphertext_b64;
}

std::string aes256::decrypt(std::string &ciphertext_b64, std::string &key_hex)
{
  try
  {
    // Convert hex keys to binary
    std::vector<unsigned char> key = encoders::hex_to_binary(key_hex);
    // convert b64 to binary
    std::vector<unsigned char> iv_ciphertext = encoders::base64_decode(ciphertext_b64);
    if (iv_ciphertext.size() < 16)
    {
      throw std::runtime_error(
          "The received message is too short to contain an IV, let alone a ciphertext");
    }
    unsigned char *iv = iv_ciphertext.data();                  // IV is at the head
    unsigned char *ciphertext_buf = iv_ciphertext.data() + 16; // IV is  16 bytes, the rest is ciphertext

    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    if (!ctx)
    {
      throw std::runtime_error("Failed to create cipher context");
    }

    if (1 != EVP_DecryptInit_ex(
                 ctx, EVP_aes_256_cbc(), NULL,
                 key.data(),
                 iv))
    {
      EVP_CIPHER_CTX_free(ctx);
      throw std::runtime_error("Failed to initialize decryption");
    }

    std::string plaintext;
    plaintext.resize(iv_ciphertext.size() - 16);
    int len;
    if (1 != EVP_DecryptUpdate(
                 ctx, reinterpret_cast<unsigned char *>(&plaintext[0]), &len,
                 ciphertext_buf,
                 plaintext.size()))
    {
      EVP_CIPHER_CTX_free(ctx);
      throw std::runtime_error("Failed to decrypt");
    }
    int plaintext_len = len;

    if (1 != EVP_DecryptFinal_ex(
                 ctx, reinterpret_cast<unsigned char *>(&plaintext[0]) + len,
                 &len))
    {
      EVP_CIPHER_CTX_free(ctx);
      throw std::runtime_error("Failed to finalize decryption");
    }
    plaintext_len += len;
    plaintext.resize(plaintext_len);

    EVP_CIPHER_CTX_free(ctx);

    return plaintext;
  }
  catch (const std::exception &e)
  {
    return "error";
  }
}

void aes256::encrypt_file(std::ifstream &in_stream, std::ofstream &out_stream,
                          unsigned char *key, unsigned char *iv)
{
  // Set up encryption context
  EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
  if (!ctx)
  {
    throw std::runtime_error("Could not create cipher context");
  }

  // Initialize encryption
  if (EVP_EncryptInit_ex(ctx, EVP_aes_256_cbc(), nullptr, key, iv) != 1)
  {
    EVP_CIPHER_CTX_free(ctx);
    throw std::runtime_error("Could not begin aes 256 encryption");
  }

  unsigned char in_buf[1024], out_buf[1024 + EVP_MAX_BLOCK_LENGTH];
  int bytes_read, encrypted_bytes;

  // Reading in 1024 bytes at a time, encrypt each block and write it to the out
  // buffer From the out buffer,  write it to the output file
  while ((bytes_read =
              in_stream.read(reinterpret_cast<char *>(in_buf), sizeof(in_buf))
                  .gcount()) > 0)
  {
    if (EVP_EncryptUpdate(ctx, out_buf, &encrypted_bytes, in_buf, bytes_read) !=
        1)
    {
      EVP_CIPHER_CTX_free(ctx);
      throw std::runtime_error("Could not encrypt a block");
    }
    out_stream.write(reinterpret_cast<char *>(out_buf), encrypted_bytes);
  }

  // Finalize the encryption, add any padding, terminators and whatnot
  if (EVP_EncryptFinal_ex(ctx, out_buf, &encrypted_bytes) != 1)
  {
    EVP_CIPHER_CTX_free(ctx);
    throw std::runtime_error("Could not finalize encryption");
  }
  out_stream.write(reinterpret_cast<char *>(out_buf), encrypted_bytes);

  EVP_CIPHER_CTX_free(ctx);
}

void aes256::decrypt_file(std::ifstream &in_stream, std::ofstream &out_stream,
                          const std::string key, const std::string iv)
{
  const unsigned char *key_buf =
      reinterpret_cast<const unsigned char *>(key.data());
  const unsigned char *iv_buf =
      reinterpret_cast<const unsigned char *>(iv.data());
  EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
  if (!ctx)
  {
    throw std::runtime_error("Can't create context for aes256 decryption");
  }

  // Set up the decryption context
  if (EVP_DecryptInit_ex(ctx, EVP_aes_256_cbc(), nullptr, key_buf, iv_buf) !=
      1)
  {
    EVP_CIPHER_CTX_free(ctx);
    throw std::runtime_error("Can't create context for aes256 decryption");
  }

  unsigned char inBuf[1024 + EVP_MAX_BLOCK_LENGTH], outBuf[1024];
  int bytesRead, decryptedBytes;

  // Process the input file in blocks and write the decrypted output
  while ((bytesRead =
              in_stream.read(reinterpret_cast<char *>(inBuf), sizeof(inBuf))
                  .gcount()) > 0)
  {
    if (EVP_DecryptUpdate(ctx, outBuf, &decryptedBytes, inBuf, bytesRead) !=
        1)
    {
      EVP_CIPHER_CTX_free(ctx);
      throw std::runtime_error("Error decrypting file");
    }
    out_stream.write(reinterpret_cast<char *>(outBuf), decryptedBytes);
  }

  // Finalize the decryption
  if (EVP_DecryptFinal_ex(ctx, outBuf, &decryptedBytes) != 1)
  {
    EVP_CIPHER_CTX_free(ctx);
    throw std::runtime_error("Error finalizing file decryption");
  }
  out_stream.write(reinterpret_cast<char *>(outBuf), decryptedBytes);

  EVP_CIPHER_CTX_free(ctx);
}
