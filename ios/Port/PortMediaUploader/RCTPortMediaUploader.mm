//
//  RCTPortMediaUploader.mm
//  Port
//
//  Created by Ani on 06/08/25.
//

#import "RCTPortMediaUploader.h"

//The below imports should not be here. But everything else is failing.
//TODO find a better option for these
#import "PushKit/PKPushRegistry.h"
#import "PushKit/PushKit.h"
#import "React_RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h"
//

#import "Port-Swift.h"

@implementation NativePortMediaUploader {
  PortMediaUploader *uploader;
}

- (id) init {
  if (self = [super init]) {
    uploader = [PortMediaUploader new];
  }
  return self;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeMediaUploadModuleSpecJSI>(params);
}

- (void)initialize:(nonnull NSString *)presign begin:(nonnull NSString *)begin complete:(nonnull NSString *)complete abort:(nonnull NSString *)abort {
  return [uploader initialize:presign begin:begin complete:complete abort:abort];
}

- (void)uploadFile:(nonnull NSString *)path token:(nonnull NSString *)token partSize:(double)partSize resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
  return [uploader uploadFile:path token:token partSize:partSize resolver:resolve rejecter:reject];
}

- (void)cancelUpload:(nonnull NSString *)path resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
  NSLog(@"[PortMediaUploadModule] please implement this: %@", path);
  resolve(@(NO));
}

+ (NSString *)moduleName
{
  return @"NativeMediaUploadModule";
}

@end

