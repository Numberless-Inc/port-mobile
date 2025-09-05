#include "pbencrypt.hpp"

#include <fstream>
#include <openssl/evp.h>
#include <vector>

#include "aes256.hpp"
#include "commonrand.hpp"
#include "encoders.hpp"

#define ITERATION_COUNT 2048
#define KEY_LENGTH EVP_MAX_KEY_LENGTH

typedef struct
{
  char magic[8];
  char salt[PKCS5_SALT_LEN];
  char iv_database[EVP_MAX_IV_LENGTH];
  u_int32_t encrypted_metadata_size;
} EncryptionMetadata;

std::vector<unsigned char> generate_key(std::string password, const char *salt)
{
  auto key = std::vector<unsigned char>(KEY_LENGTH);
  if (PKCS5_PBKDF2_HMAC(
          password.c_str(),
          password.length(),
          (unsigned char *)salt,
          PKCS5_SALT_LEN,
          ITERATION_COUNT,
          EVP_sha256(),
          KEY_LENGTH,
          key.data()) != 1)
  {
    throw std::runtime_error("PBKDF2 key derivation failed");
  }
  return key;
}

namespace pbencrypt
{
  void encrypt(std::string password, std::string metadata, std::string path_to_db, std::string path_to_dest)
  {
    EncryptionMetadata head_data;
    memcpy(head_data.magic, "PORTBAK", 8);
    std::ifstream database_stream(path_to_db, std::ios::binary);
    if (!database_stream.is_open())
      throw std::runtime_error("Could not open database file for pb encryption");

    std::ofstream dest_stream(path_to_dest, std::ios::binary);
    if (!dest_stream.is_open())
    {
      database_stream.close();
      throw std::runtime_error("Could not open destination file for pb encryption");
    }

    // Generate a salt and add it to the head data
    auto salt = commonrand::hex(PKCS5_SALT_LEN);
    std::vector<unsigned char> salt_bin = encoders::hex_to_binary(salt);
    memcpy(&head_data.salt, salt_bin.data(), PKCS5_SALT_LEN);
    // Generate a key using the password and salt
    std::vector<unsigned char> key_vec = generate_key(password, (const char *)(salt_bin.data()));
    std::string key = encoders::binary_to_hex(key_vec.data(), KEY_LENGTH);
    // Encrypt the metadata using the key
    std::string encrypted_metadata = aes256::encrypt(metadata, key);
    head_data.encrypted_metadata_size = encrypted_metadata.size();
    // Generate an IV for the database's encryption and add it to the metadata
    auto db_iv = std::vector<unsigned char>(EVP_MAX_IV_LENGTH);
    aes256::generate_random_iv(db_iv.data());
    memcpy(&head_data.iv_database, db_iv.data(), EVP_MAX_IV_LENGTH);
    // Write the head data
    dest_stream.write((const char *)(&head_data), sizeof(EncryptionMetadata));
    // Write the encrypted metadata
    dest_stream.write(encrypted_metadata.data(), encrypted_metadata.size());
    // Encrypt the file and append it to the same stream
    aes256::encrypt_file(database_stream, dest_stream, (unsigned char *)(key.data()), db_iv.data());
    // Clean up
    database_stream.close();
    dest_stream.close();
  }

  std::string decrypt(std::string password, std::string path_to_backup, std::string database_snapshot_destination)
  {
    EncryptionMetadata meta;
    std::ifstream backup_stream(path_to_backup, std::ios::binary);
    if (!backup_stream.is_open())
      throw std::runtime_error("Could not open backup file for pb decryption");
    std::ofstream backup_destination_stream(database_snapshot_destination, std::ios::binary);
    if (!backup_destination_stream.is_open())
    {
      backup_stream.close();
      throw std::runtime_error("Could not open database destination location");
    }

    // Work with the saved metadata
    backup_stream.read((char *)(&meta), sizeof(EncryptionMetadata));
    // Get the salt use it with the password to generate a key
    std::vector<unsigned char> key_vec = generate_key(password, meta.salt);
    std::string key = encoders::binary_to_hex(key_vec.data(), KEY_LENGTH);

    // Create an appropriately sized string buffer
    std::string encrypted_metadata;
    encrypted_metadata.resize(meta.encrypted_metadata_size);
    // Read in the encrypted metadata
    backup_stream.read(encrypted_metadata.data(), meta.encrypted_metadata_size);
    // Decrypt the data
    std::string plaintext_metadata = aes256::decrypt(encrypted_metadata, key);
    // The remainder of the file is the encrypted database, so decrypt it
    aes256::decrypt_file(backup_stream, backup_destination_stream, key, meta.iv_database);

    // Clean up
    backup_stream.close();
    backup_destination_stream.close();

    // The decrypted database is in the appropriate location, and we can return the plaintext metadata
    return plaintext_metadata;
  }
}
