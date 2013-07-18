<?php

//path to directory to scan
$directory = "/Users/DesignAndDevelopment/Effects/";
 
//get all sound files.
$sounds = glob($directory . "{*.aiff,*.mp3,*.wav}", GLOB_BRACE);
asort($sounds);

$files = array();
$options = array();
$options[] = "<option selected='selected' value='random'>random</option>";

//print each file name
foreach ($sounds as $sound) {
	
	$sound = substr($sound, strlen($directory));
	$fileName = preg_replace('/\.[a-z3]+/', '', $sound);
	
	// hide secret babyBaby replacement
	if ($fileName == "bbBB") continue;
	
	$files[] = "<li data-name='$sound'>			
		$fileName
	</li>";
	
	$soundValue = str_replace($directory, "", $sound);
	$options[] = "<option value='$soundValue'>$fileName</option>";
}
?>
<html>
<head>
	
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
	
	<link rel="apple-touch-icon" href="/images/touch-icon-iphone.png">
	<link rel="apple-touch-icon" sizes="72x72" href="/images/touch-icon-ipad.png">
	<link rel="apple-touch-icon" sizes="114x114" href="/images/touch-icon-iphone4.png">
	
	<title>Sounds of Clover</title>
	
	<link href='http://fonts.googleapis.com/css?family=Raleway' rel='stylesheet' type='text/css'>
	<link href="/css/style.css" rel="stylesheet" type='text/css'>
	
	<script type="text/javascript" src="/js/jquery-1.7.2.min.js"></script>
	<script type="text/javascript" src="/js/index.js"></script>
	
</head>

<body>
	
	
	<form id="sayForm">
		<input type="search" id="speech" name="speech" placeholder="type and hit enter">
		<select>
			<option selected="selected" value="fred">Fred</option>
			<option value="alex">Alex</option>
			<option value="bells">Bells</option>
			<option value="cellos">Cello</option>
			<option value="daniel">Daniel</option>
			<option value="fiona">Fiona</option>
			<option value="good">Good</option>
			<option value="bad">Bad</option>
			<option value="junior">Junior</option>
			<option value="lekha">Lekha</option>
			<option value="mikko">Mikko</option>
			<option value="moira">Moira</option>
			<option value="princess">Princess</option>
			<option value="ralph">Ralph</option>
			<option value="siri">Siri</option>
			<option value="sangeeta">Sangeeta</option>
			<option value="steffi">Steffi</option>
			<option value="victoria">Victoria</option>
			<option value="whisper">Whisper</option>
		</select>
		<span id="sayIt">say it</span>
	</form>
	
	<form id="searchForm">
		<input type="search" id="search" name="search" placeholder="enter search phrase and hit enter (choose optional reply)">
		<select>
			<?
				$comma_separated = implode(" ", $options);
				echo $comma_separated;
			?>
		</select>
		<span id="searchIt">search it</span>
	</form>
	
	<form id="playForm">
		<input type="search" id="play" name="play" placeholder="paste video url">
		<span id="loadVideo">load it</span>
		<span id="playPauseVideo">play/pause it</span>
		<span id="stopVideo">stop it</span>
	</form>
	
	<ul>
		
		<!-- <li id="playpause">play / pause</li> -->
		
		<?
			$comma_separated = implode(" ", $files);
			echo $comma_separated;
		?>
		
		
		<!-- one list item outside of the loop -->
		
		<li id="current">currently playing</li>
		
	</ul>
</body>

</html>