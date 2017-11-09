//
//  AppDelegate.m
//  Sounds of Clover
//
//  Created by Jeremy Hicks on 8/24/12.
//  Copyright (c) 2012 Jeremy Hicks. All rights reserved.
//

#import "AppDelegate.h"

@implementation AppDelegate
@synthesize webView;

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification
{
    // Insert code here to initialize your application
    [webView setFrameLoadDelegate:self];
}

-(void) awakeFromNib {
    
    NSLog(@"awake");
    
    //    NSString *urlText = @"http://192.168.1.92";
//    NSString *urlText = @"http://www.apple.com";
//    [[webView mainFrame] loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:urlText]]];
//        [webView setMainFrameURL:urlText];
    
    [[webView mainFrame] loadRequest: [NSURLRequest requestWithURL:[NSURL URLWithString:@"http://Designs-Mac-mini.local"]]];
    
    
    // draw a custom badge
    // https://developer.apple.com/library/mac/#documentation/Carbon/Conceptual/customizing_docktile/docktasks_cocoa/docktasks_cocoa.html
    // https://developer.apple.com/library/mac/#documentation/Cocoa/Reference/NSDockTile_Class/Reference/Reference.html
    //[[[NSApplication sharedApplication] dockTile] setBadgeLabel: @"120%"];
    
}

- (void)webView:(WebView *)sender didReceiveTitle:(NSString *)title forFrame:(WebFrame *)frame
{
    // Report feedback only for the main frame.
    if (frame == [webView mainFrame]){
        [[webView window] setTitle:title];
        NSLog(@"title: %@", title);
    }
}

- (void)webView:(WebView *)sender didStartProvisionalLoadForFrame:(WebFrame *)frame
{
    // Only report feedback for the main frame.
    if (frame == [sender mainFrame]){
        NSString *url = [[[[frame provisionalDataSource] request] URL] absoluteString];
        NSLog(@"url: %@", url);
    }
}

@end
