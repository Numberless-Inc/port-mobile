#pragma once
/**
 * YAP - Yet Another Protocol
 *
 * This protocol builds off the Port protocol to provide secure encryption
 * and decryption of messages.
 *
 * Terminology:
 * 1. Shared secret: The result of key agreement using x25519
 * 2. Public key: an x25519 public key
 * 3. Private key: an x25519 private key
 * 4. authenticated key/secret: previously authenticated value, typically using
 *    the Port protocol
 *
 *
 * To send encrypted messages to a peer you need the following:
 * 1. A peer public key that you have authenticated
 * 2. A shared secret with the peer
 *
 * To decrypt messages from a peer you need the following:
 * 1. A shared secret with the peer
 * 2. A public key that the peer has authenticated as yours
 */

#include <vector>

namespace yap
{
  namespace v1
  {

    std::vector<unsigned char> encrypt(std::vector<unsigned char> shared_secret,
                                       std::vector<unsigned char> peer_public_key,
                                       std::vector<unsigned char> plaintext);
    std::vector<unsigned char> decrypt(std::vector<unsigned char> shared_secret,
                                       std::vector<unsigned char> private_key,
                                       std::vector<unsigned char> ciphertext);
  };
};