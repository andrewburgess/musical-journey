(function ($, window, undefined) {
    var cleanupCacheLock = false;
    
    function LastFM() {
        this.key = "21edbb30193dc36e6fb21cc57b1d8e18";
    };

    LastFM.prototype.makeRequest = function (method, args, callback) {
        var self = this;
        
        if (!cleanupCacheLock)
            setTimeout(function() { self.cleanupCache(); }, 500);
        cleanupCacheLock = true;
        
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
                data.accessed = new Date().getTime();
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
    
    LastFM.prototype.cleanupCache = function (lastAccess, count) {
        if (count && count <= 0) {
            cleanupCacheLock = false;
            return;
        }
        var remaining = 1024 * 1024 * 5 - unescape(encodeURIComponent(JSON.stringify(localStorage))).length;
        console.log('Remaining space in cache: ' + Math.round((remaining / 1024.0), 2) + ' KB');
        if (remaining < 500000) {
            console.log('Cleaning cache');
            
            var toRemove = new Array();
            if (lastAccess === undefined) lastAccess = new Date().getTime() - 3600000;
            for (var i = 0; i < localStorage.length; i++) {
                var obj = JSON.parse(localStorage.getItem(localStorage.key(i)));
                if (obj.accessed < lastAccess) {
                    toRemove.push(localStorage.key(i));
                }
            }
            
            if (toRemove.length == 0) {
                if (count === undefined) count = 3;
                count = count - 1;
                return this.cleanupCache(lastAccess / 2, count--);
            }
            
            console.log('Removing ' + toRemove.length + ' items');
            for (var i = 0; i < toRemove.length; i++) {
                console.log("Removing " + toRemove[i]);
                localStorage.removeItem(toRemove[i]);
            }
        }
        
        cleanupCacheLock = false;
    }
    
    window.LastFM = LastFM;

} (jQuery, window));

