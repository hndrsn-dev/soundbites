<?php
	
	// my cousin jaffar started a shared working space for java developers called Java the Hut, free coffee and za and why fie for your internets, oh and skillers numb one hum hum of course
	if (!empty($_REQUEST['speech'])) {
		
		require_once dirname(__FILE__) . "/" . "../includes/db.php";
		
		$voice = (!empty($_REQUEST["voice"])) ? $_REQUEST["voice"] : "albert";
		$speech = mysql_escape_string(trim($_REQUEST['speech']));
		
		if ($speech == "#donuts#") {
			// If this string is submitted, play a special sound...
			system('/usr/bin/afplay /Users/DesignAndDevelopment/Effects/hidden/donuts.mp3');
	
			// and log it
			$conn = DB::getConn();
			
			$stmt = $conn->prepare('INSERT INTO soundsPlayed (sound, dateTime) VALUES(:sound, NOW())');
			$stmt->bindParam(':sound', $sound);
			$stmt->execute();
		} else {
			// The normal case
			if ($voice == "siri") {
			
				// play siri sound
				system('/usr/bin/afplay /Users/DesignAndDevelopment/Effects/siri-start.mp3');
				
				// set the voice to sam
				$voice = "samantha";
			}
			
			$command = '/usr/bin/say -v ' . $voice . ' ' . $speech;
			
			system($command, $result);
		
			// log it
			$conn = DB::getConn();
			$stmt = $conn->prepare('INSERT INTO speeches (speech, voice, dateTime) VALUES(:speech, :voice, NOW())');
			$stmt->bindParam(':speech', $speech);
			$stmt->bindParam(':voice', $voice);
			$stmt->execute();
		}
	}
?>