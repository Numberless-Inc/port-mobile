#pragma once

#include <string>

namespace pbencrypt {
  void encrypt(std::string password, std::string metadata, std::string path_to_db, std::string path_to_dest);
  std::string decrypt(std::string password, std::string path_to_backup, std::string database_snapshot_destination);
}