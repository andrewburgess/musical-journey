var sp = getSpotifyApi(1);
var views = sp.require('sp://import/scripts/api/views');
var models = sp.require('sp://import/scripts/api/models');
    
var player = models.player;
var playlist = new models.Playlist();

var lastFM = new LastFM();
var upcoming = new Array();

var completedLock = false;

var seed = '';

var letsDoIt = false;

$(function() {
    //Start up function
    player.observe(models.EVENT.CHANGE, handlePlayerChanged);
    
    if (player.playing && isCurrentContext()) {
        $('#nothing').hide();
        $('#start').hide();
        $('#navigator').show();
        updateCurrentInfo();
        updateUpcomingTracks();
    } else {
        $('#nothing').show();
        $('#start').show();
        $('#navigator').hide();
    }
    
    $('#start').click(function () {
        if (player.playing && isCurrentContext()) return;
    
        $('#nothing').hide();
        $('#start').hide();
        $('#navigator').show();
        
        letsDoIt = true;
        
        seed = player.track.data.artists[0].name;
        
        while (playlist.length > 0) {
            playlist.remove(0);
        }
        
        updateCurrentInfo();
        updateUpcomingTracks();
    });
});

function handlePlayerChanged(event) {
    if (event.data.curtrack) {
        if (player.playing && isCurrentContext()) {
            $('#nothing').hide();
            $('#start').hide();
            $('#navigator').show();
            
            updateCurrentInfo();
            updateUpcomingTracks();
        } else {
            if (letsDoIt) {
                playPlaylist();
                letsDoIt = false;
            } else {
                $('#nothing').show();
                $('#start').show();
                $('#navigator').hide();
            }
        }
    }
};

function updateCurrentInfo() {
    $('.bio').empty();
    $('#artist-images').empty();

    var img = new views.Image(player.track.data.album.cover);
    $('#current-image').html(img.node);
    
    getArtistNameLinkList($('#artist-name').empty(), player.track.data.artists);
    var trackTitle = trimText(player.track.data.name.decodeForText(), $('#track-title'), 625);
    
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

function pickOne(index) {
    if (index === undefined)
        index = Math.round(Math.random() * 2) + 1;
    else {
        if (playlist.length > 0) {
            playlist.remove(playlist.length - 1);
        }
    }
        
    $('.upcoming').find('.col').removeClass('selected');
        
    var uri = $('.upcoming').find('#col' + index).addClass('selected').data('uri');
    console.log('Playing ' + uri + ' next');
    
    playlist.add(uri);
}

function doWork(currentArtist) {
    var retry = true;
    if (currentArtist == undefined)
        currentArtist = player.track.data.artists[0].name;
    else
        retry = false;
    lastFM.makeRequest('artist.getSimilar', {artist: currentArtist, limit: 40, autocorrect: 1}, function (data) {
        setTimeout(function() {
            if (upcoming.length != 3) doWork();
            else pickOne();
        }, 100);
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
    }, function (errorCode) {
        if (errorCode == 6 && retry) {
            //Artist not found, try again with seed artist
            doWork(seed);
        }
    });
}

function processUpcoming(uri, index) {
    var el = $('.upcoming').find('#col' + index).empty();
    el.data('uri', uri);
    models.Track.fromURI(uri, function (track) {
        var img = new views.Image(track.data.album.cover);
        el.prepend($('<div />').addClass('artist-image').append($(img.node)));
        
        el.append($('<div />').addClass('artist-name'));
        getArtistNameLinkList($(el.find('.artist-name')), track.artists);
        el.append($('<div />').addClass('track-title').text(track.name.decodeForText()));
    });
}

function playPlaylist () {
    sp.trackPlayer.setContextCanSkipPrev(playlist.uri, false);
    sp.trackPlayer.setContextCanRepeat(playlist.uri, false);
    sp.trackPlayer.setContextCanShuffle(playlist.uri, false);
    
    player.play(playlist.get(0), self.playlist, 0);
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

function isCurrentContext () {
    return player.context === playlist.uri;
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