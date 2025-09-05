#include "NativeCryptoModule.h"

#include <future>
#include <openssl/evp.h>
#include <memory>
#include <fstream>

#include "commonhash.hpp"
#include "commonrand.hpp"
#include "ed25519.hpp"
#include "x25519.hpp"
#include "aes256.hpp"
#include "pbencrypt.hpp"
#include "yap.hpp"
#include "encoders.hpp"
namespace facebook::react
{

  NativeCryptoModule::NativeCryptoModule(std::shared_ptr<CallInvoker> jsInvoker)
      : NativeCryptoModuleCxxSpec(std::move(jsInvoker)) {}

  std::string NativeCryptoModule::reverseString(jsi::Runtime &rt, std::string input)
  {
    return std::string(input.rbegin(), input.rend());
  }

  std::string NativeCryptoModule::hashSHA256(jsi::Runtime &rt, std::string input)
  {
    return hash::hashSHA256(input);
  }

  std::string NativeCryptoModule::randHex(jsi::Runtime &rt, double size)
  {
    return commonrand::hex(static_cast<size_t>(size));
  }
  std::string NativeCryptoModule::generateEd25519Keypair(jsi::Runtime &rt)
  {
    return ed25519::generate_keys_json();
  }
  std::string NativeCryptoModule::ed25519SignMessage(jsi::Runtime &rt, std::string message, std::string private_key)
  {
    return ed25519::sign_message(message, private_key);
  }
  std::string NativeCryptoModule::generateX25519Keypair(jsi::Runtime &rt)
  {
    auto keypair = x25519::generate_keypair();
    return keypair->to_json();
  }
  std::string NativeCryptoModule::deriveX25519Secret(jsi::Runtime &rt, std::string private_key_hex, std::string public_key_hex)
  {
    // Convert the shared secret to a hex string

    auto private_key = encoders::hex_to_binary(private_key_hex);    
    auto public_key = encoders::hex_to_binary(public_key_hex);
    auto ss = x25519::derive_secret(private_key, public_key);
    return encoders::binary_to_hex(ss.data(), ss.size());
  }
  std::string NativeCryptoModule::aes256Encrypt(jsi::Runtime &rt, std::string plaintext, std::string secret)
  {
    return aes256::encrypt(plaintext, secret);
  }
  std::string NativeCryptoModule::aes256Decrypt(jsi::Runtime &rt, std::string ciphertext, std::string secret)
  {
    return aes256::decrypt(ciphertext, secret);
  }
  jsi::Object NativeCryptoModule::aes256FileEncrypt(jsi::Runtime &rt, std::string path_to_input, std::string path_to_output)
  {
    auto encryptor = [path_to_input, path_to_output, &rt]() -> jsi::Value
    {
      unsigned char key[EVP_MAX_KEY_LENGTH];
      unsigned char iv[EVP_MAX_IV_LENGTH];
      aes256::generate_random_key(key);
      aes256::generate_random_iv(iv);
      std::ifstream in_file(path_to_input, std::ios::binary);
      if (!in_file.is_open())
        throw std::runtime_error("Input file for encryption could not be opened.");

      std::ofstream out_file(path_to_output, std::ios::binary);
      if (!out_file.is_open())
      {
        in_file.close();
        throw std::runtime_error("Outputfile for encryption could not be opened.");
      }
      aes256::encrypt_file(in_file, out_file, key, iv);
      in_file.close();
      out_file.close();
      return jsi::String::createFromUtf8(rt, aes256::combine_key_and_iv(key, iv));
    };
    return NativeCryptoModule::make_promise(rt, encryptor);
  }

  jsi::Object NativeCryptoModule::aes256FileDecrypt(jsi::Runtime &rt, std::string path_to_input, std::string path_to_output, std::string key_and_iv)
  {
    auto encryptor = [path_to_input,
                      path_to_output,
                      key_and_iv]() -> jsi::Value
    {
      std::string key_bin;
      std::string iv_bin;
      std::ifstream in_stream(path_to_input, std::ios::binary);
      if (!in_stream.is_open())
        throw std::runtime_error("Could not open input file for decryption");

      std::ofstream out_stream(path_to_output, std::ios::binary);
      if (!out_stream.is_open())
      {
        in_stream.close();
        throw std::runtime_error("Could not open output file for decryption");
      }
      aes256::split_key_and_iv(key_and_iv, key_bin, iv_bin);
      aes256::decrypt_file(in_stream, out_stream, key_bin, iv_bin);
      out_stream.close();
      in_stream.close();
      return jsi::Value::undefined();
    };
    return NativeCryptoModule::make_promise(rt, encryptor);
  }

  jsi::Object NativeCryptoModule::pbEncrypt(jsi::Runtime &rt, std::string password, std::string metadata, std::string path_to_db, std::string path_to_destination)
  {
    auto encryptor = [password, metadata, path_to_db, path_to_destination]() -> jsi::Value
    {
      pbencrypt::encrypt(password, metadata, path_to_db, path_to_destination);
      return jsi::Value::undefined();
    };
    return NativeCryptoModule::make_promise(rt, encryptor);
  }

  jsi::Object NativeCryptoModule::pbDecrypt(jsi::Runtime &rt, std::string password, std::string path_to_backup, std::string path_to_db_destination)
  {
    auto decryptor = [password,
                      path_to_backup,
                      path_to_db_destination,
                      &rt]() -> jsi::Value
    {
      std::string plaintext_metadata = pbencrypt::decrypt(password, path_to_backup, path_to_db_destination);
      return jsi::String::createFromUtf8(rt, std::string(plaintext_metadata));
    };
    return NativeCryptoModule::make_promise(rt, decryptor);
  }

  std::string NativeCryptoModule::yapV1Encrypt(jsi::Runtime &rt, std::string shared_secret_hex, std::string peer_public_key_hex, std::string plaintext)
  {
    auto ss = encoders::hex_to_binary(shared_secret_hex);
    auto peer_public_key = encoders::hex_to_binary(peer_public_key_hex);
    auto plaintext_data = std::vector<unsigned char>(plaintext.begin(), plaintext.end());
    auto encapsulated_ct = yap::v1::encrypt(ss, peer_public_key, plaintext_data);

    auto ct = yap::v1::encrypt(ss, peer_public_key, plaintext_data);
    return encoders::base64_encode(ct);
  }
  std::string NativeCryptoModule::yapV1Decrypt(jsi::Runtime &rt, std::string shared_secret_hex, std::string private_key_hex, std::string plaintext)
  {
    return std::string();
  }
  jsi::Object NativeCryptoModule::make_promise(jsi::Runtime &rt, std::function<jsi::Value()> func)
  {
    auto jsThreadInvoker = this->jsInvoker_;
    // Get the constructor for a JS promise.
    auto promiseConstructor = rt.global().getPropertyAsFunction(rt, "Promise");
    // This executor is what is passed into the cunstructor in a promise.
    auto executor = jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forAscii(rt, "executor"),
        2, // resolve and reject
        [func, jsThreadInvoker](
            jsi::Runtime &rt,
            const jsi::Value &thisVal,
            const jsi::Value *args,
            size_t count) -> jsi::Value
        {
          // JSI functions don't have copy constructors, but the lambda needs to be copyable to be named before being passed
          // into the async launch
          std::shared_ptr<jsi::Function> resolve = std::make_shared<jsi::Function>(args[0].getObject(rt).getFunction(rt));
          std::shared_ptr<jsi::Function> reject = std::make_shared<jsi::Function>(args[1].getObject(rt).getFunction(rt));
          // This worker is meant to run asynchronously, not on the JS thread. Note that this doesn't have safe access to the runtime.
          auto worker = [=]()
          {
            try
            {
              // Resolve the promise with the result
              auto result = std::make_shared<jsi::Value>(func());
              // Resolve back on the JS thread that can access the runtime safely
              jsThreadInvoker->invokeAsync([=](jsi::Runtime &rt)
                                           { resolve->call(rt, std::move(*result.get())); });
            }
            catch (const std::runtime_error &e)
            {
              // Reject back on the JS thread that can access the runtime safely
              jsThreadInvoker->invokeAsync([=](jsi::Runtime &rt)
                                           {

              // Repare an error to reject with
              jsi::Object errorObj(rt);
              errorObj.setProperty(rt, "message", jsi::String::createFromUtf8(rt, e.what()));
              errorObj.setProperty(rt, "code", jsi::String::createFromUtf8(rt, "ERR_NATIVE_ERROR"));

              jsi::Function errorConstructor = rt.global().getPropertyAsFunction(rt, "Error");
              jsi::Value errorValue = errorConstructor.callAsConstructor(
                  rt,
                  jsi::String::createFromUtf8(rt, e.what()));

              reject->call(rt, errorValue); });
            }
          };

          // Asynchronously dispatch the call to do the work. Don't worry, we'll be back on this thread soon enough to resolve or reject.
          [[maybe_unused]] std::future fut = std::async(std::launch::async, worker);
          // The executor returns nothing in JS, but don't worry, promise chaining should still work with resolve or reject.
          return jsi::Value::undefined();
        });
    // Construct the promise with the executor and return it.
    return promiseConstructor.callAsConstructor(rt, executor).getObject(rt);
  }

} // namespace facebook::react