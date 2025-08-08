#pragma once

#include <AppSpecsJSI.h>

#include <memory>
#include <string>

namespace facebook::react
{

  class NativeCryptoModule : public NativeCryptoModuleCxxSpec<NativeCryptoModule>
  {
  public:
    NativeCryptoModule(std::shared_ptr<CallInvoker> jsInvoker);

    std::string reverseString(jsi::Runtime &rt, std::string input);
    /// @brief hash a string with sha256
    /// @param rt
    /// @param input the string to hash
    /// @return hash of input
    std::string hashSHA256(jsi::Runtime &rt, std::string input);
    std::string randHex(jsi::Runtime &rt, double size);
    std::string generateEd25519Keypair(jsi::Runtime &rt);
    std::string ed25519SignMessage(jsi::Runtime &rt, std::string message, std::string private_key);
    std::string generateX25519Keypair(jsi::Runtime &rt);
    std::string deriveX25519Secret(jsi::Runtime &rt, std::string private_key, std::string public_key);
    std::string aes256Encrypt(jsi::Runtime &rt, std::string plaintext, std::string secret);
    std::string aes256Decrypt(jsi::Runtime &rt, std::string ciphertext, std::string secret);
    jsi::Object aes256FileEncrypt(jsi::Runtime &rt, std::string path_to_input, std::string path_to_output);
    jsi::Object aes256FileDecrypt(jsi::Runtime &rt, std::string path_to_input, std::string path_to_output, std::string key_and_iv);
    jsi::Object pbEncrypt(jsi::Runtime &rt, std::string password, std::string metadata, std::string path_to_db, std::string path_to_destination);
    jsi::Object pbDecrypt(jsi::Runtime &rt, std::string password, std::string path_to_backup, std::string path_to_db_destination);
    std::string yapV1Encrypt(jsi::Runtime &rt, std::string shared_secret_hex, std::string peer_public_key_hex, std::string plaintext);
    std::string yapV1Decrypt(jsi::Runtime &rt, std::string shared_secret_hex, std::string private_key_hex, std::string plaintext);

  private:
    jsi::Object make_promise(jsi::Runtime &rt, std::function<jsi::Value()> func);
  };

} // namespace facebook::react
