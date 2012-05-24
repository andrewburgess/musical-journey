var sp = getSpotifyApi(1);
var views = sp.require('sp://import/scripts/api/views');
var models = sp.require('sp://import/scripts/api/models');
    
var player = models.player;
var playlist = new models.Playlist();

var lastFM = new LastFM();
var upcoming = new Array();

var resizeLock = false;
var completedLock = false;

$(function() {
    //Start up function
    player.observe(models.EVENT.CHANGE, handlePlayerChanged);
    
    updateCurrentInfo();
    updateUpcomingTracks();
    
    $(window).resize(function () {
        if (!resizeLock)
            setTimeout(resizeWindow, 500);
            
        resizeLock = true;
    });
});

function handlePlayerChanged(event) {    
    if (event.data.curtrack) {
        var runningLock = false;
        updateCurrentInfo();
        updateUpcomingTracks();
    }
};

function updateCurrentInfo() {
    $('.bio').empty();
    $('#artist-images').empty();

    var img = new views.Image(player.track.data.album.cover);
    $('#current-image').html(img.node);
    
    $('#artist-name').empty().text(getArtistNameList(player.track.data.artists));
    $('#track-title').empty().text(player.track.data.name.decodeForText());
    
    var artist = player.track.data.artists[0].name;
    
    lastFM.makeRequest('artist.getInfo', {artist: artist, autocorrect: 1}, function (data) {
        $('.bio').html(data.artist.bio.summary);
    });
    
    var imgCount = Math.floor(Math.min($('.bio').width() / 100.0, 25));
    getImages(artist, imgCount);
}

function updateUpcomingTracks() {
    var currentArtist = player.track.data.artists[0].name;
    upcoming = new Array();
    completedLock = false;
    lastFM.makeRequest('artist.getSimilar', {artist: currentArtist, limit: 15, autocorrect: 1}, function (data) {
        var artistIndexes = new Array();
        for (var i = 0; i < 15; i++) artistIndexes[i] = i;
        artistIndexes.shuffle();
        
        for (var i = 0; i < artistIndexes.length; i++) {
            var artist = data.similarartists.artist[artistIndexes[i]];
            var a = artist.name;
            
            if (upcoming.length == 3) {
                processUpcoming();
                return;
            }
            
            lastFM.makeRequest('artist.getTopTracks', {artist: a, autocorrect: 1, limit: 10}, function (toptracks) {
                if (upcoming.length == 3) {
                    processUpcoming();
                    return;
                }
                
                var found = false;
                var trackIndexes = new Array();
                for (var i = 0; i < 10; i++) trackIndexes[i] = i;
                trackIndexes.shuffle();
                
                for (var i = 0; i < trackIndexes.length; i++) {
                    var track = toptracks.toptracks.track[trackIndexes[i]];
                    if (upcoming.length == 3) {
                        processUpcoming();
                        return;
                    }
                    var query = 'artist:' + a + ' track:' + track.name;
                    var search = new models.Search(query);
                    search.localResults = models.LOCALSEARCHRESULTS.APPEND;
                    search.pageSize = 1;
                    search.searchAlbums = false;
                    search.searchArtists = false;
                    search.searchPlaylists = false;
                    search.observe(models.EVENT.CHANGE, function () {
                        if (upcoming.length == 3) {
                            processUpcoming();
                            return;
                        }
                        
                        if (found) return;
                        
                        if (search.tracks.length > 0) {
                            upcoming.push(search.tracks[0].data.uri);
                            found = true;
                            
                            if (upcoming.length == 3)
                                processUpcoming();
                        }
                    });
                    
                    search.appendNext();
                }
            });
        }
    });
}

function processUpcoming() {
    if (completedLock) return;
    completedLock = true;
    
    $.each(upcoming, function (index, entry) {
        var el = $('.upcoming').find('#col' + (index + 1)).empty();
        models.Track.fromURI(entry, function (track) {
            var img = new views.Image(track.data.album.cover);
            el.prepend($('<div />').addClass('artist-image').
                                    css('height', el.width()).
                                    css('width', el.width()).append(
                                        $(img.node).css('height', el.width()).css('width', el.width())
                                    ));
            
            el.append($('<h1 />').text(track.artists[0].name.decodeForText())).append($('<h2 />').text(track.name.decodeForText()));
        });
    });
}

function resizeWindow() {
    var imgCount = Math.floor(Math.min($('.bio').width() / 100.0, 25));
    if ($('#artist-images').find('img').length > imgCount) {
        $('#artist-images').find('img:gt(' + (imgCount - 1) + ')').remove();
    } else if ($('#artist-images').find('img').length == imgCount) {
        //Do nothing
    } else {
        $('#artist-images').empty();
        var artist = player.track.data.artists[0].name;
        getImages(artist, imgCount);
    }
    
    resizeLock = false;
}

function getImages(artist, limit) {
    lastFM.makeRequest('artist.getImages', {artist: artist, limit: limit, autocorrect: 1}, function (data) {
        img = data.images.image;
		$.each(img, function(index, image) {
			if (image.sizes.size[2]["#text"].indexOf(".gif") > -1) {
				console.log("Yuck, gif");
			} else {
				$('#artist-images').append(
                    $('<img />').
                        attr('src', image.sizes.size[2]["#text"]).
                        css('height', '100px').
                        css('width', '100px')).
                    fadeIn(1500);
			}
		});
    });
}

function getArtistNameList(artists) {
	var a = artists[0].name.decodeForHTML();
	for (var j = 1; j < artists.length; j++) {
		a += ", " + artists[j].name.decodeForText();
	}

	return a;
}

function getArtistNameLinkList(container, artists) {
	container.append($("<a></a>").attr("href", artists[0].uri).text(artists[0].name.decodeForText()));
	for (var i = 1; i < artists.length; i++) {
		container.append(", ");
		container.append("<a></a>").attr("href", artists[i].uri).text(artists[i].name.decodeForText());
	}
	return container;
}

Array.prototype.shuffle = function() {
    var self = this;
    
    for (var i = self.length - 1; i > 0; i--) {
        var j = Math.round(Math.random() * i);
        var temp = self[i];
        self[i] = self[j];
        self[j] = temp;
    }
}