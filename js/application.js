var sp = getSpotifyApi(1);
var views = sp.require('sp://import/scripts/api/views');
var models = sp.require('sp://import/scripts/api/models');
    
var player = models.player;
var playlist = new models.Playlist();

var lastFM = new LastFM();
var upcoming = new Array();

var completedLock = false;

$(function() {
    //Start up function
    player.observe(models.EVENT.CHANGE, handlePlayerChanged);
    
    updateCurrentInfo();
    updateUpcomingTracks();
});

function handlePlayerChanged(event) {    
    if (event.data.curtrack) {
        updateCurrentInfo();
        updateUpcomingTracks();
    }
};

function updateCurrentInfo() {
    $('.bio').empty();
    $('#artist-images').empty();

    var img = new views.Image(player.track.data.album.cover);
    $('#current-image').html(img.node);
    
    var artistName = trimText(getArtistNameList(player.track.data.artists), $('#artist-name'), 625);
    var trackTitle = trimText(player.track.data.name.decodeForText(), $('#track-title'), 625);
    
    $('#artist-name').empty().text(artistName);
    $('#track-title').empty().text(trackTitle);
    
    var artist = player.track.data.artists[0].name;
    
    lastFM.makeRequest('artist.getInfo', {artist: artist, autocorrect: 1}, function (data) {
        $('.bio').html(data.artist.bio.summary);
    });
    
    getImages(artist);
}

function trimText(txt, el, width) {
    var test = $('#test').empty();
    test.text(txt).css('font-size', el.css('font-size')).css('font-weight', el.css('font-weight'));
    if (test.width() > width) {
        while (test.width() > width) {
            txt = txt.substring(0, txt.length - 1);
            console.log(txt);
            test.text(txt + '...!');
        }
        
        txt = txt + '...';
    }
    
    return txt;
}

function updateUpcomingTracks() {
    for (var i = 1; i <= 3; i++) {
        $('.upcoming').find('#col' + i).empty().append($('<div />').addClass('throbber').append($('<div />')));
    }

    upcoming = new Array();
    completedLock = false;
    doWork();
}

function doWork() {
    var currentArtist = player.track.data.artists[0].name;
    setTimeout(function() {
        if (upcoming.length != 3) doWork();
    }, 100);
    lastFM.makeRequest('artist.getSimilar', {artist: currentArtist, limit: 40, autocorrect: 1}, function (data) {
        var len = data.similarartists.artist.length - 1;
        var artist = data.similarartists.artist[Math.round(Math.random() * len)];
        
        var a = artist.name;
        console.log(a);
        
        if (upcoming.length == 3) {
            return;
        }
            
        lastFM.makeRequest('artist.getTopTracks', {artist: a, autocorrect: 1, limit: 10}, function (toptracks) {
            if (upcoming.length == 3) {
                return;
            }
            
            var found = false;
            var tlen = toptracks.toptracks.track.length - 1;
            var track = toptracks.toptracks.track[Math.round(Math.random() * tlen)];
            
                if (upcoming.length == 3) {
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
                    if (upcoming.length == 3 || found) {
                        return;
                    }
                    
                    if (search.tracks.length > 0) {
                        upcoming.push(search.tracks[0].data.uri);
                        processUpcoming(search.tracks[0].data.uri, upcoming.length);
                        found = true;
                    }
                });
                
                search.appendNext();
        });
    });
}

function processUpcoming(uri, index) {
    var el = $('.upcoming').find('#col' + index).empty();
    models.Track.fromURI(uri, function (track) {
        var img = new views.Image(track.data.album.cover);
        el.prepend($('<div />').addClass('artist-image').append($(img.node)).addClass('selected'));
        
        el.append($('<div />').addClass('artist-name').text(track.artists[0].name.decodeForText())).
           append($('<div />').addClass('track-title').text(track.name.decodeForText()));
    });
}

function getImages(artist) {
    lastFM.makeRequest('artist.getImages', {artist: artist, limit: 10, autocorrect: 1}, function (data) {
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