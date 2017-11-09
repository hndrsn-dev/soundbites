<?php

if (!empty($_REQUEST['sounds'])) {
	
	require_once dirname(__FILE__) . "/" . "../includes/db.php";
	
	$sound = $_REQUEST['sounds'];
	
	if ($sound == "earl-silence.mp3") {
		system('killall afplay');
	} else if ($sound == "silence.mp3") {
		system('killall afplay');
	}
	
	if ($sound == "allByMyself.mp3") {
		$sound .= " | afplay /Users/DesignAndDevelopment/Effects/hidden/pause-kyle-no.wav";
	}
	// one too many chrimbies
	// http://cdn.memegenerator.net/instances/250x250/31433129.jpg
	// $sound = "getTheBoy.mp3";
	
	system('/usr/bin/afplay /Users/DesignAndDevelopment/Effects/' . $sound);
	
	// log it
	$conn = DB::getConn();
	
	$stmt = $conn->prepare('INSERT INTO soundsPlayed (sound, dateTime) VALUES(:sound, NOW())');
	$stmt->bindParam(':sound', $sound);
	$stmt->execute();
	
	
	echo "sound of clover: " . $sound;
	
	// has some issues - would be good to use though since it ducks down the current music
	// shell_exec('/Users/DesignAndDevelopment/Projects/Sounds/scripts/fx ' . $sound);
}

?>
