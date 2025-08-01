#import <AppSpecs/AppSpecs.h>

NS_ASSUME_NONNULL_BEGIN

 @interface PortCallHelper : NativeCallHelperModuleSpecBase <NativeCallHelperModuleSpec>
- (instancetype)init;
 // Method to display the incoming call UI via CallKit
 - (void)displayIncomingCall:(NSString *)callerName callUUID:(NSString *)callUUID;
 @end

NS_ASSUME_NONNULL_END
