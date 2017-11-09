//
//  AppDelegate.h
//  Sounds of Clover
//
//  Created by Jeremy Hicks on 8/24/12.
//  Copyright (c) 2012 Jeremy Hicks. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface AppDelegate : NSObject <NSApplicationDelegate> {
    
    IBOutlet WebView *webView;
}

@property (assign) IBOutlet NSWindow *window;
@property (retain) IBOutlet WebView *webView;

@end
