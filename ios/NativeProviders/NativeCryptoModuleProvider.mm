//
//  NativeCryptoModuleProvider.m
//  Port
//
//  Created by Abhinav on 2025-07-29.
//

#import "NativeCryptoModuleProvider.h"
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/TurboModule.h>
#import "NativeCryptoModule.h"


@implementation NativeCryptoModuleProvider

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeCryptoModule>(params.jsInvoker);
}

@end
