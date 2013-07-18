<?php
	
	// this is interesting : http://applescript.tv/linktrigger/
	// also http://www.aaeb.net/demo/AAEB_demo.html
	// http://macscripter.net/viewtopic.php?id=33691
	// http://forums.macnn.com/t/19087/using-osascript-from-a-php-script
	
	// go towards the end : http://hintsforums.macworld.com/archive/index.php/t-75842.html
	
	$voice = (!empty($_REQUEST["voice"])) ? $_REQUEST["voice"] : "";
	
	if ($voice == "siri") {
			
			// play siri sound
			system('/usr/bin/afplay /Users/DesignAndDevelopment/Effects/siri-start.mp3');
			
			// set the voice to sam
			$voice = "samantha";
	}
	
	
	$result = system("/usr/local/bin/current " . $voice);
	
	echo "result: " . $result;
?>