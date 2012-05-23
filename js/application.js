var sp = getSpotifyApi(1);
var views = sp.require('sp://import/scripts/api/views');
var models = sp.require('sp://import/scripts/api/models');
    
var player = models.player;
var playlist = new models.Playlist();

$(function() {
    //Start up function
    player.observe(models.EVENT.CHANGE, handlePlayerChanged);
    
    var img = new views.Image(player.track.data.album.cover);
    $('#current-image').append(img.node);
});

function handlePlayerChanged(event) {
    console.log(event);
};
