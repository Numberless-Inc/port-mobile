#include <gtest/gtest.h>
#include "vectorcmp.hpp"
#include "encoders.hpp"
#include "commonrand.hpp"
#include "x25519.hpp"
#include "yap.hpp"
#include "aesgcm.hpp"

/**
 * End-to-end tests for encryption using YAP.
 */

/**
 * Throughout this file I've claimed to have flipped the k'th bit.
 * I know I'm off by 7 bits. Fuck  off.
 */

// Verbosely test the successful case with a short, human readable plaintext
TEST(YAPTests, E2EHumanReadable)
{
  // Set up Alice and Bob
  auto alice_keypair = x25519::generate_keypair();
  auto bob_keypair = x25519::generate_keypair();
  // Assert that the public keys are the expected length
  EXPECT_EQ(32, alice_keypair->public_key.size());
  EXPECT_EQ(32, bob_keypair->public_key.size());
  EXPECT_EQ(32, alice_keypair->private_key.size());
  EXPECT_EQ(32, bob_keypair->private_key.size());

  // Check that the shared secrets are equal
  auto shared_secret = x25519::derive_secret(alice_keypair->private_key, bob_keypair->public_key);
  ASSERT_VEC_EQ(shared_secret, x25519::derive_secret(bob_keypair->private_key, alice_keypair->public_key));

  // Use a human readable string to make me feel comfortable with the decryption
  std::string human_readable_plaintext = "Abhi's magic human readable string to test YAP";
  std::vector<unsigned char> plaintext(
      (unsigned char *)human_readable_plaintext.data(),
      (unsigned char *)human_readable_plaintext.data() + human_readable_plaintext.size());

  // Finally YAP away
  auto ciphertext_from_alice = yap::v1::encrypt(shared_secret, bob_keypair->public_key, plaintext);
  auto plaintext_decrypted_by_bob = yap::v1::decrypt(shared_secret, bob_keypair->private_key, ciphertext_from_alice);

  std::string human_readable_plaintext_decrypted_by_bob = (char *)plaintext_decrypted_by_bob.data();

  ASSERT_STREQ(human_readable_plaintext_decrypted_by_bob.c_str(), human_readable_plaintext.c_str());
}

// Test the success case for a random plaintext that's an odd size and at least 1k
TEST(YAPTests, E2ERand)
{
  // Set up Alice and Bob
  auto alice_keypair = x25519::generate_keypair();
  auto bob_keypair = x25519::generate_keypair();

  // Check that the shared secrets are equal
  auto shared_secret = x25519::derive_secret(alice_keypair->private_key, bob_keypair->public_key);

  // Randomized plaintext that's big and an odd size
  auto plaintext = encoders::hex_to_binary(commonrand::hex(1050));

  // Finally YAP away
  auto ciphertext_from_alice = yap::v1::encrypt(shared_secret, bob_keypair->public_key, plaintext);
  auto plaintext_decrypted_by_bob = yap::v1::decrypt(shared_secret, bob_keypair->private_key, ciphertext_from_alice);

  // Assert that plaintexts match
  ASSERT_VEC_EQ(plaintext, plaintext_decrypted_by_bob);
}

/**
 * Test failure cases below this point. Attempt to corrupt different parts and ensure that
 * decryption fails and throws an exception.
 */

TEST(YAPTests, BadEphemeralPubkey)
{
  // Set up Alice and Bob
  auto alice_keypair = x25519::generate_keypair();
  auto bob_keypair = x25519::generate_keypair();

  // Check that the shared secrets are equal
  auto shared_secret = x25519::derive_secret(alice_keypair->private_key, bob_keypair->public_key);

  // Randomized plaintext that's big and an odd size
  auto plaintext = encoders::hex_to_binary(commonrand::hex(1050));

  // Finally YAP away
  auto ciphertext_from_alice = yap::v1::encrypt(shared_secret, bob_keypair->public_key, plaintext);
  // Flip the first bit of the ephemeral public key
  // Flip the first bit of the nonce
  int pos_to_flip = 0;
  ciphertext_from_alice[pos_to_flip] = 0x1 ^ ciphertext_from_alice[pos_to_flip];
  ASSERT_ANY_THROW(yap::v1::decrypt(shared_secret, bob_keypair->private_key, ciphertext_from_alice));
}

TEST(YAPTests, BadNonce)
{
  // Set up Alice and Bob
  auto alice_keypair = x25519::generate_keypair();
  auto bob_keypair = x25519::generate_keypair();

  // Check that the shared secrets are equal
  auto shared_secret = x25519::derive_secret(alice_keypair->private_key, bob_keypair->public_key);

  // Randomized plaintext that's big and an odd size
  auto plaintext = encoders::hex_to_binary(commonrand::hex(1050));

  // Finally YAP away
  auto ciphertext_from_alice = yap::v1::encrypt(shared_secret, bob_keypair->public_key, plaintext);
  // Flip the first bit of the nonce
  int pos_to_flip = x25519::PUBLIC_KEY_LENGTH;
  ciphertext_from_alice[pos_to_flip] = 0x1 ^ ciphertext_from_alice[pos_to_flip];
  ASSERT_ANY_THROW(yap::v1::decrypt(shared_secret, bob_keypair->private_key, ciphertext_from_alice));
}

TEST(YAPTests, BadTag)
{
  // Set up Alice and Bob
  auto alice_keypair = x25519::generate_keypair();
  auto bob_keypair = x25519::generate_keypair();

  // Check that the shared secrets are equal
  auto shared_secret = x25519::derive_secret(alice_keypair->private_key, bob_keypair->public_key);

  // Randomized plaintext that's big and an odd size
  auto plaintext = encoders::hex_to_binary(commonrand::hex(1050));

  // Finally YAP away
  auto ciphertext_from_alice = yap::v1::encrypt(shared_secret, bob_keypair->public_key, plaintext);
  // Flip the first bit of the tag
  int pos_to_flip = x25519::PUBLIC_KEY_LENGTH + aesgcm::TAG_LENGTH;
  ciphertext_from_alice[pos_to_flip] = 0x1 ^ ciphertext_from_alice[pos_to_flip];
  ASSERT_ANY_THROW(yap::v1::decrypt(shared_secret, bob_keypair->private_key, ciphertext_from_alice));
}

TEST(YAPTests, BadCiphertextHead)
{
  // Set up Alice and Bob
  auto alice_keypair = x25519::generate_keypair();
  auto bob_keypair = x25519::generate_keypair();

  // Check that the shared secrets are equal
  auto shared_secret = x25519::derive_secret(alice_keypair->private_key, bob_keypair->public_key);

  // Randomized plaintext that's big and an odd size
  auto plaintext = encoders::hex_to_binary(commonrand::hex(1050));

  // Finally YAP away
  auto ciphertext_from_alice = yap::v1::encrypt(shared_secret, bob_keypair->public_key, plaintext);
  // Flip the first byte of the ciphertext
  int pos_to_flip = x25519::PUBLIC_KEY_LENGTH + aesgcm::TAG_LENGTH + aesgcm::TAG_LENGTH;
  ciphertext_from_alice[pos_to_flip] = 0x1 ^ ciphertext_from_alice[pos_to_flip];
  ASSERT_ANY_THROW(yap::v1::decrypt(shared_secret, bob_keypair->private_key, ciphertext_from_alice));
}

TEST(YAPTests, BadCiphertextMid)
{
  // Set up Alice and Bob
  auto alice_keypair = x25519::generate_keypair();
  auto bob_keypair = x25519::generate_keypair();

  // Check that the shared secrets are equal
  auto shared_secret = x25519::derive_secret(alice_keypair->private_key, bob_keypair->public_key);

  // Randomized plaintext that's big and an odd size
  auto plaintext = encoders::hex_to_binary(commonrand::hex(1050));

  // Finally YAP away
  auto ciphertext_from_alice = yap::v1::encrypt(shared_secret, bob_keypair->public_key, plaintext);
  // Flip somewhere in the middle of the ciphertext
  int pos_to_flip = 700;
  ciphertext_from_alice[pos_to_flip] = 0x1 ^ ciphertext_from_alice[pos_to_flip];
  ASSERT_ANY_THROW(yap::v1::decrypt(shared_secret, bob_keypair->private_key, ciphertext_from_alice));
}
