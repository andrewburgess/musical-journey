(function ($, window, undefined) {
    
    function LastFM() {
        this.key = "21edbb30193dc36e6fb21cc57b1d8e18";
    };

    LastFM.prototype.makeRequest = function (method, args, callback) {
        var self = this;
        
        args.api_key = self.key;
        args.format = "json";
        args.method = method;
        
        var key = JSON.stringify(args);
        
        if (localStorage.getItem(key) !== null) {
            callback(JSON.parse(localStorage.getItem(key)));
            return;
        }
        
        console.log("LASTFM: " + "http://ws.audioscrobbler.com/2.0/", args);
        $.ajax({
            dataType: "jsonp",
            cache: false,
            data: args,
            url: "http://ws.audioscrobbler.com/2.0/",
            success: function (data) {
                console.log("LASTFM: Received data", data);
                if (self.checkResponse(data)) {
                    localStorage.setItem(key, JSON.stringify(data));
                    callback(data);
                } else {
                    console.error("LASTFM: makeRequest bailed");
                }
            },
            error: function (jqxhr, textStatus, errorThrown) {
                console.error("LASTFM: Problem making request", jqxhr); 
                console.error(textStatus);
                console.error(errorThrown);
            }		
        });
    };

    LastFM.prototype.checkResponse = function (data) {
        if (data.error) {
            console.error("Error from Last.FM: (" + data.error + ") " + data.message);
            return false;
        } else {
            return true;
        }
    };
    
    window.LastFM = LastFM;

} (jQuery, window));

