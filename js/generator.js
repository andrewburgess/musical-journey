var views = sp.require("sp://import/scripts/api/views");
var models = sp.require("sp://import/scripts/api/models");
var ui = sp.require("sp://import/scripts/ui");

var found = new Array();
var artists = new Array();
var tracks = new Array();

$(document).ready(function() {
	$("#go").click(function() {
		switch($("#type").val()) {
			case "tag":
				getTagList("tag.getTopArtists", {tag: $("#search").val(), limit: 100});
				break;
			case "similar-artist":
				getSimilarArtistPlaylist($("#search").val(), new models.Playlist("Similar Artists: " + $("#search").val()), 4);
				break;
		}
	});
});

function getTagList(method, options) {

	lastfm.makeRequest(method, options, function(data) {
		var playlist = new models.Playlist("Tag: " + options.tag);
	
		for (var i = 0; i < data.topartists.artist.length; i++) {
			getTopTracks(data.topartists.artist[i].name, playlist, 2);
		}
	});
}

function getSimilarArtistPlaylist(artist, playlist, count) {
	console.log(count);
	artists.push(artist);
	getTopTracks(artist, playlist);
	if (count > 0) {
		lastfm.makeRequest("artist.getSimilar", {limit: 5, artist: artist, autocorrect: 1}, function(data) {
			for (var i = 0; i < data.similarartists.artist.length; i++) {
				var exists = false;
				for (var x = 0; x < artists.length; x++) {
					if (artists[x] == data.similarartists.artist.length) {
						exists = true;
						break;
					}
				}
				
				if (!exists) {
					artists.push(data.similarartists.artist[i].name);
					getSimilarArtistPlaylist(data.similarartists.artist[i].name, playlist, count - 1);
				
					getTopTracks(data.similarartists.artist[i].name, playlist, 3);
				}
			}
		});
	}
}

function getTopTracks(artist, playlist, limit) {
	lastfm.makeRequest("artist.getTopTracks", {limit: limit, artist: artist, autocorrect: 1}, function(data) {
		for (var i = 0; i < data.toptracks.track.length; i++) {
			var query = "artist:\"" + artist + "\" track:\"" + data.toptracks.track[i].name + "\"";
			var searched = false;
			for (var y = 0; y < tracks.length; y++) {
				if (tracks[y] == query) {
					searched = true;
					break;
				}
			}
			
			if (!searched) {
				console.log("querying: " + query);
				sp.core.search(query, true, true, {
					onSuccess: function(result) {
						if (result.tracks.length > 0) {
							console.log(found.length);
							var exists = false;
							for (var x = 0; x < found.length; x++) {
								if (found[x] == result.tracks[0].uri) {
									exists = true;
									console.log("FOUND");
									break;
								}
							}
							
							if (!exists) {
								playlist.add(result.tracks[0].uri);
								found.push(result.tracks[0].uri);
							}
						}
					}
				});
			}
		}
	});
}