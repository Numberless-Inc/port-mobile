#import "NativeEncryptedStorage.h"

@interface NativeEncryptedStorage()
@property (strong, nonatomic) NSUserDefaults *localStorage;
@end

@implementation NativeEncryptedStorage

- (id) init {
  if (self = [super init]) {
    // Set up here
  }
  return self;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeEncryptedStorageSpecJSI>(params);
}

- (NSString *)getItem:(NSString *)key {
  NSDictionary* getQuery = @{
      (__bridge id)kSecClass : (__bridge id)kSecClassGenericPassword,
      (__bridge id)kSecAttrAccount : key,
      (__bridge id)kSecReturnData : (__bridge id)kCFBooleanTrue,
      (__bridge id)kSecMatchLimit : (__bridge id)kSecMatchLimitOne
  };
  
  CFTypeRef dataRef = NULL;
  OSStatus getStatus = SecItemCopyMatching((__bridge CFDictionaryRef)getQuery, &dataRef);
  
  if (getStatus == errSecSuccess) {
      return [[NSString alloc] initWithData: (__bridge NSData*)dataRef encoding: NSUTF8StringEncoding];
  }

  else if (getStatus == errSecItemNotFound) {
      return nil;
  }
  
  else {
      @throw [NSError errorWithDomain: [[NSBundle mainBundle] bundleIdentifier] code:getStatus userInfo:nil];
  }
}


- (void)clear {
  NSArray *secItemClasses = @[
      (__bridge id)kSecClassGenericPassword,
      (__bridge id)kSecClassInternetPassword,
      (__bridge id)kSecClassCertificate,
      (__bridge id)kSecClassKey,
      (__bridge id)kSecClassIdentity
  ];
  
  // Maps through all Keychain classes and deletes all items that match
  for (id secItemClass in secItemClasses) {
      NSDictionary *spec = @{(__bridge id)kSecClass: secItemClass};
      SecItemDelete((__bridge CFDictionaryRef)spec);
  }
}

- (void)setItem:(nonnull NSString *)key value:(nonnull NSString *)value { 
  NSData* dataFromValue = [value dataUsingEncoding:NSUTF8StringEncoding];
  
  if (dataFromValue == nil) {
      @throw [NSError errorWithDomain:[[NSBundle mainBundle] bundleIdentifier] code:0 userInfo: nil];
  }
  
  // Prepares the insert query structure
  NSDictionary* storeQuery = @{
      (__bridge id)kSecClass : (__bridge id)kSecClassGenericPassword,
      (__bridge id)kSecAttrAccount : key,
      (__bridge id)kSecValueData : dataFromValue
  };
  
  // Deletes the existing item prior to inserting the new one
  SecItemDelete((__bridge CFDictionaryRef)storeQuery);
  
  OSStatus insertStatus = SecItemAdd((__bridge CFDictionaryRef)storeQuery, nil);
  
  if (insertStatus != noErr) {
      @throw [NSError errorWithDomain:[[NSBundle mainBundle] bundleIdentifier] code:insertStatus userInfo: nil];
  }
}


+ (NSString *)moduleName
{
  return @"NativeLocalStorage";
}

@end
