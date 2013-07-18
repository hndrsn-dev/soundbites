<?php

if (!empty($_REQUEST['sounds'])) {
	
	require_once dirname(__FILE__) . "/" . "../includes/db.php";
	
	$soundToPlay = $_REQUEST['sounds'];
	$soundToPlay = explode(",", $soundToPlay);
	
	foreach ($soundToPlay as $sound) {
		
		system('/usr/bin/afplay /Users/DesignAndDevelopment/Effects/' . $sound);
		
		// log it
		$stmt = $conn->prepare('INSERT INTO soundsPlayed (sound, dateTime) VALUES(:sound, NOW())');
		$stmt->bindParam(':sound', $sound);
		$stmt->execute();
		
		
		echo "sound of clover: " . $sound;
		
		// has some issues - would be good to use though since it ducks down the current music
		// shell_exec('/usr/local/bin/fx ' . $sound);
	}
}

?>