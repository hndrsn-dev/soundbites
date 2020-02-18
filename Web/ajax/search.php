<?php
	
	if (!empty($_POST['speech'])) {
		
		//path to directory to scan
		$directory = "/Users/jhicks/Projects/sounds/Effects/";
		
		//get all sound files.
		$sounds = glob($directory . "{*.aiff,*.mp3,*.wav}", GLOB_BRACE);
		asort($sounds);
		
		// remove the directory part from the filename
		$sounds = str_replace($directory, "", $sounds);
		
		$speech = $_POST['speech'];
		
		$response = (!empty($_POST["response"]) && $_POST["response"] == "random") ? $sounds[rand(0, count($sounds) - 1)] : $_POST["response"];
		$command = '/Users/jhicks/Projects/sounds/scripts/search "' . $speech . '" "' . $response . '"';
		
		system($command);
	}
?>