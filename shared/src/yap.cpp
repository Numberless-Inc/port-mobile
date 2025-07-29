#include "yap.hpp"
#include "x25519.hpp"
#include "aesgcm.hpp"
#include "key_complications.hpp"

/**
 * TODO: consider putting public key, IV and tag into a struct.
 * It can be private to this file.
 */

std::vector<unsigned char> yap::v1::encrypt(
    std::vector<unsigned char> shared_secret,
    std::vector<unsigned char> peer_public_key,
    std::vector<unsigned char> plaintext)
{
  // Generate the ephemeral x25519 keypair
  std::shared_ptr<x25519::KeyPair> keypair_e = x25519::generate_keypair();
  auto secret_e = x25519::derive_secret(keypair_e->private_key, peer_public_key);
  // Combine the ephemeral secret with the shared secret to create an ephemeral key
  auto key_e = key_complications::exclusive_or(shared_secret, secret_e);
  // Encrypt the file using aes-gcm
  std::vector<unsigned char> encapsulated_ciphertext(
      x25519::PUBLIC_KEY_LENGTH +
          aesgcm::IV_LENGTH +
          aesgcm::TAG_LENGTH +
          plaintext.size(),
      0);
  // encapsulate the public key
  memcpy(encapsulated_ciphertext.data(), keypair_e->public_key.data(), x25519::PUBLIC_KEY_LENGTH);
  // Set up all the buffers
  unsigned char *iv_buf = encapsulated_ciphertext.data() + x25519::PUBLIC_KEY_LENGTH;
  unsigned char *tag_buf = iv_buf + aesgcm::IV_LENGTH;
  unsigned char *ciphertext_buf = tag_buf + aesgcm::TAG_LENGTH;
  aesgcm::encrypt(key_e, plaintext, iv_buf, tag_buf, ciphertext_buf);

  // Format of returned value is ephermeral_public_key(32) | nonce(12) | tag(16) | ciphertext(k)
  return encapsulated_ciphertext;
}

std::vector<unsigned char> yap::v1::decrypt(
    std::vector<u_int8_t> shared_secret,
    std::vector<u_int8_t> private_key,
    std::vector<u_int8_t> ciphertext)
{
  unsigned char *public_key_e = ciphertext.data();
  unsigned char *nonce = public_key_e + x25519::PUBLIC_KEY_LENGTH;
  unsigned char *tag = nonce + aesgcm::IV_LENGTH;
  unsigned char *ciphertext_buffer = tag + aesgcm::TAG_LENGTH;
  unsigned int ciphertext_length = ciphertext.size() -
                                   x25519::PUBLIC_KEY_LENGTH -
                                   aesgcm::IV_LENGTH -
                                   aesgcm::TAG_LENGTH;
  // Compute the decryption key
  x25519::key peer_public_key_e(public_key_e, public_key_e + x25519::PUBLIC_KEY_LENGTH);
  aesgcm::key ss_e = x25519::derive_secret(private_key, peer_public_key_e);
  aesgcm::key key_e = key_complications::exclusive_or(shared_secret, ss_e);

  // Attempt AEAD decryption
  aesgcm::data plaintext = aesgcm::decrypt(key_e, nonce, tag, ciphertext_buffer, ciphertext_length);

  // clear out ephemeral shared secret and key
  std::fill(ss_e.begin(), ss_e.end(), 0);
  std::fill(key_e.begin(), key_e.end(), 0);

  return plaintext;
}
