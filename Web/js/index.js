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


	// Set up the list filtering and sorting
	// NOTE 1000 max sound effects - change here
	var options = {
		valueNames: [ 'soundName' ],
		page: 1000
	}

	var soundsList = new List('soundsList', options);
	var numVisible = soundsList.visibleItems.length;

	// Focus on the filter view for easy access
	$("#filterSounds").focus();
	
	// Select the first sound
	var selectedSound = $('#soundsList>ul>li').first();
	selectedSound.addClass('selected');
	
	
	// Add keydown handler for the body and filter/search view.
	$('body, #filterSounds').on('keydown', function(e) {
		
		var $focused = $(document.activeElement);
		
		if (e.metaKey && e.which == 70) {
			
			$("#filterSounds").focus();
			
			return false;
		}
		
		
		if ($focused.attr('id') == "speech" || $focused.attr('id') == "search" || $focused.attr('id') == "play") {
			
			return;
		}
		
		// console.log("keyHandler - " + e.which);
		
		first = $('#soundsList>ul>li').first();
		
		// console.log("  selectedSound.len = " + selectedSound.length);
		
		// On enter, play effect
		if (e.which == 13 && selectedSound.length == 1 ) {
			
			selectedSound.click();
			return false;
		
		// If right/left were pressed, move selection
		} else if (e.which == 37 && selectedSound.prev().length == 1) {
			updatedSelectedSound(selectedSound.prev());
			return false;
		
		} else if (e.which == 39 && selectedSound.next().length == 1) {
			updatedSelectedSound(selectedSound.next());
			return false;
		
		//If nothing is selected, choose the first and eat the key press
		} else {
			
			updatedSelectedSound(first);
			
			// If right/left were pressed, eat the keypress
			if (e.which == 37 || e.which == 39) {
				return false;
			}
		}
	});
	
	// When the (x) is clicked, redo the search (this isn't triggered by default
	//	in List.js)
	$("#filterSounds").on('search', function(e) {
		soundsList.search($("#filterSounds").val());
	});
	
	// Any time the visible sounds change, reset the highlight to the first element
	// (avoids having double highlight, which occurs when the handler above runs
	//	before the view has finished showing)
	soundsList.on('updated', function() {
		if (soundsList.visibleItems.length != numVisible) {
			$('#soundsList>ul>li.selected').removeClass('selected');
			selectedSound = $('#soundsList>ul>li').first();
			selectedSound.addClass('selected');
			numVisible = soundsList.visibleItems.length;
		}
	});
	
	// Updates the selectedSound variable.
	// newSound is expected to exist!
	function updatedSelectedSound(newSound) {
		selectedSound.removeClass('selected');
		selectedSound = newSound;
		selectedSound.addClass('selected');
	}
	
	
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