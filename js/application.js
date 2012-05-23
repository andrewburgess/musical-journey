var sp = getSpotifyApi(1);
var views = sp.require('sp://import/scripts/api/views');
var models = sp.require('sp://import/scripts/api/models');
    
var player = models.player;
var playlist = new models.Playlist();

$(function() {
    //Start up function
    player.observe(models.EVENT.CHANGE, handlePlayerChanged);
    
    updateCurrentInfo();
});

function handlePlayerChanged(event) {
    console.log(event);
    
    if (event.data.curtrack) {
        updateCurrentInfo();
    }
};

function updateCurrentInfo() {
    var img = new views.Image(player.track.data.album.cover);
    $('#current-image').html(img.node);
    
    $('#artist-name').empty().text(getArtistNameList(player.track.data.artists));
    $('#track-title').empty().text(player.track.data.name.decodeForText());
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