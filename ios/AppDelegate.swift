//
//  AppDelegate.swift
//  Port
//
//  Created by Abhinav on 2025-07-28.
//


import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import RNBootSplash

let GROUP_IDENTIFIER = "group.tech.numberless.port"
let DATABASE_NAME = "numberless.db"
let SQLITE_TRANSIENT = unsafeBitCast(-1, to:sqlite3_destructor_type.self)

@main
class AppDelegate: UIResponder, UIApplicationDelegate, PKPushRegistryDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // MARKER: Not from the react-native template
    clearKeychainIfNecessary()
    // MARKER: From the react-native template
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "Port",
      in: window,
      launchOptions: launchOptions
    )
    
    // MARKER: not from the react-native-template
    FirebaseApp.configure()
    RNVoipPushNotificationManager.voipRegistration()

    // MARKER: from the react-native template
    return true
  }
  
  func applicationWillEnterForeground(_ application: UIApplication) {
      
      // App badge count shenanigans
    guard let suiteDefaults = UserDefaults(suiteName: GROUP_IDENTIFIER) else {
      return
    }
    suiteDefaults.set(1, forKey:"count")
      suiteDefaults.synchronize()
      UIApplication.shared.applicationIconBadgeNumber = 0
  }
  
  /**
   * Gets run when there's a new token  to update
   */
  func pushRegistry(
      _ registry: PKPushRegistry,
      didUpdate pushCredentials: PKPushCredentials,
      for type: PKPushType
  ) {
    // TODO: could probably bring this module in-house since it doesn't do much anymore
    // Pass the token on to the module to cache and pass on JS
    RNVoipPushNotificationManager.didUpdate(pushCredentials, forType: type.rawValue)
  }
  
  func pushRegistry(
      _ registry: PKPushRegistry,
      didReceiveIncomingPushWith payload: PKPushPayload,
      for type: PKPushType,
      completion: @escaping () -> Void
  ) {
//    let callHelper = PortCallHelper()
    RNVoipPushNotificationManager.didReceiveIncomingPush(with: payload, forType:type.rawValue)
    let aps = payload.dictionaryPayload["aps"] as? [String: Any]
    let callUUID = aps!["call_id"] as? String ?? UUID().uuidString
    guard let callFrom = aps!["call_from"] else {
//      callHelper.displayIncomingCall("Incoming call", callUUID: callUUID)
      return
    }
    // Get the caller name from the routing_id(callFrom)
    var callerName: String = "Incoming call"
    do{
      callerName = try getChatName(routingId: callFrom as! String)
      let jsonData = try JSONSerialization.data(withJSONObject: aps!, options: .prettyPrinted)
      let jsonString = String(data:jsonData, encoding: .utf8)
      
      try cacheTriggerMessage(message:jsonString!)
    } catch {}
    
//    callHelper.displayIncomingCall(callerName, callUUID: callUUID)
    // Call the completion handler and we're all done
    completion()
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }
  
  override func customize(_ rootView: RCTRootView) {
    super.customize(rootView)
    RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

// Methods to help query the database
enum DBError: Error {
  case CouldNotOpen
  case CouldNotPrepareStatement
  case CouldNotFindDatabasePath
  case CouldNotFinalize
}

var cachedDatabase: OpaquePointer?
func getDatabase() throws -> OpaquePointer {
  if nil != cachedDatabase {
    return cachedDatabase!
  }
  guard let containerPath: String = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier:GROUP_IDENTIFIER)?.path else {
      throw DBError.CouldNotFindDatabasePath
  }
  let dbPath = containerPath + "/" + DATABASE_NAME;
  
  // Open the database
  var db: OpaquePointer?
  if sqlite3_open(dbPath, &db) != SQLITE_OK {
      print("Error opening database")
      throw DBError.CouldNotOpen
  }
  cachedDatabase = db
  return db!
}

func closeDatabase() {
  if nil == cachedDatabase {
    return
  }
  sqlite3_close(cachedDatabase)
  cachedDatabase = nil
}

func getChatName(routingId: String) throws -> String {
  let db = try getDatabase()
  // Prepare the statement to run and bind it to statement
  let queryString = "SELECT COALESCE(contacts.name, groups.name) AS name FROM (connections LEFT JOIN lines on connections.routingId = lines.lineId) LEFT JOIN contacts on contacts.pairHash = connections.pairHash LEFT JOIN groups on groups.groupId = connections.routingId WHERE COALESCE(lines.lineId, groups.groupId) = ? "
  var statement: OpaquePointer?
  if sqlite3_prepare_v2(db, queryString, -1, &statement, nil) != SQLITE_OK {
      throw DBError.CouldNotPrepareStatement
  }
  sqlite3_bind_text(statement, 1, routingId, -1, SQLITE_TRANSIENT);
  while sqlite3_step(statement) == SQLITE_ROW {
    return String(cString:sqlite3_column_text(statement, 0))
  }
  return "New incoming caller"
}

func cacheTriggerMessage (message: String) throws {
    let db = try getDatabase()
    let queryString = "INSERT INTO unprocessedMessages (unprocessedMessage) VALUES (?) ;";
    var statement: OpaquePointer?

  if (sqlite3_prepare_v2(db, queryString, -1, &statement, nil) == SQLITE_OK) {
    // Bind the parameter (recordID as a string)
    sqlite3_bind_text(statement, 1, message, -1, SQLITE_TRANSIENT);
    
    // Execute query
    sqlite3_step(statement);
  } else {
    throw DBError.CouldNotPrepareStatement
  }
  
  // Finalize statement
  if (sqlite3_finalize(statement) != SQLITE_OK) {
    throw DBError.CouldNotFinalize
  }
}

func clearKeychainIfNecessary() {
    // Checks whether or not this is the first time the app is run
    if !UserDefaults.standard.bool(forKey: "HAS_RUN_BEFORE") {
        // Set the appropriate value so we don't clear next time the app is launched
        UserDefaults.standard.set(true, forKey: "HAS_RUN_BEFORE")
        
        let secItemClasses = [
            kSecClassGenericPassword,
            kSecClassInternetPassword,
            kSecClassCertificate,
            kSecClassKey,
            kSecClassIdentity
        ]
          
        // Maps through all Keychain classes and deletes all items that match
        for secItemClass in secItemClasses {
            let spec = [kSecClass: secItemClass]
            SecItemDelete(spec as CFDictionary)
        }
    }
}
