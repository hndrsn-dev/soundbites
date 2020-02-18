<?php
	/*
	 *  Play a random sound of clover
	 */

	//path to directory to scan
	$directory = "/Users/jhicks/Projects/sounds/Effects/";
	
	//get all sound files.
	$sounds = glob($directory . "{*.aiff,*.mp3,*.wav}", GLOB_BRACE);
	
	// remove the directory part from the filename
	$sounds = str_replace($directory, "", $sounds);
	
	asort($sounds);
	
	system('/usr/bin/afplay /Users/jhicks/Projects/sounds/Effects/' . $sounds[rand(0, count($sounds) - 1)]);
?>