<?php

//path to directory to scan
$directory = "/Users/jhicks/Projects/sounds/Effects/";
 
//get all sound files.
$sounds = glob($directory . "{*.aiff,*.mp3,*.wav}", GLOB_BRACE);
asort($sounds);

$files = array();

//print each file name
foreach ($sounds as $sound) {
  $sound = substr($sound, strlen($directory));
  $fileName = preg_replace('/\.[a-z3]+/', '', $sound);
  
  array_push($files, array("name" => $fileName, "filename" => $sound));
  
}

echo json_encode($files);
?>