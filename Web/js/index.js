$(document).ready(function() {
	
	window.top.scrollTo(0, 1);
	
	$('#sayForm').on('submit', sayIt);
	$('#sayIt').on('click', sayIt);
	
	$('#searchForm').on('submit', searchIt);
	$('#searchIt').on('click', searchIt);
	
	$('#playForm').on('submit', loadVideo);
	$('#loadVideo').on('click', loadVideo);
	$('#playPauseVideo').on('click', playPauseVideo);
	$('#stopVideo').on('click', stopVideo);
	
	
	$("#playpause").on('click', playPause);
	
	$('li').on('click', function() {
		
		var $this = $(this);
		
		if ($this.attr('id') == 'current') {
			
			var voice = $("#sayForm select option:selected").val() || "";
			
			$.ajax({
				type:"POST",
				url : "/ajax/current.php",
				data: "&voice=" + voice,
				dataType : 'json'});
			
		} else {
			
			var soundToPlay = $(this).attr('data-name');
			
			$.ajax({
				type:"POST",
				url : "/ajax/sound.php",
				data: "sounds=" + soundToPlay,
				dataType : 'json'})
				.done(function(data) {});
		}
	});
	
	
	
	function sayIt() {
		
		var whatToSay = $('#speech').val();
		var voice = $("#sayForm select option:selected").val();
		
		$.ajax({
			type:"POST",
			url : "/ajax/say.php",
			data: "speech=" + whatToSay + "&voice=" + voice,
			dataType : 'json'});
		
		// $("#speech").setSelectionRange(0, 9999);
		
		return false;
	};
	
	
	
	function searchIt() {
		
		var whatToSay = $('#search').val();
		var response = $('#searchForm option:selected').val();
		
		$.ajax({
			type:"POST",
			url : "/ajax/search.php",
			data: "speech=" + whatToSay + "&response=" + response,
			dataType : 'json'});
		
		// $("#speech").setSelectionRange(0, 9999);
		
		return false;
	};
	
	
	
	function loadVideo() {
		
		var whatToPlay = $('#play').val();
		
		$.ajax({
			type:"POST",
			url : "/ajax/project.php",
			data: "video=" + whatToPlay,
			dataType : 'json'});
		
		return false;
	};

	function playPauseVideo() {		
		$.ajax({
			type:"POST",
			url : "/ajax/project.php",
			data: "command=pause",
			dataType : 'json'});
		
		return false;
	};

	function stopVideo() {
		$.ajax({
			type:"POST",
			url : "/ajax/project.php",
			data: "command=stop",
			dataType : 'json'});
		
		return false;
	};
	
	
	function playPause() {
		
		$.ajax({
				type:"POST",
				url : "/ajax/playpause.php",
				data: "playpause=true",
				dataType : 'json'})
				.done(function(data) {});
		}
});